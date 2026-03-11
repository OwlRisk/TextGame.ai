import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import OpenAI from 'openai';
import Replicate from 'replicate';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { deductTokens, imageGenCostToCoins } from '@/lib/tokens';
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';
import { logger } from '@/lib/logger';
import { createRateLimiter, rateLimitResponse } from '@/lib/rate-limit';

const limiter = createRateLimiter('avatar', { limit: 10, windowSeconds: 60 });

export const maxDuration = 60;

/** GET /api/avatar - quick config health-check (no auth required) */
export async function GET() {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasReplicate = Boolean(process.env.REPLICATE_API_TOKEN);
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const model = (process.env.AVATAR_GENERATION_MODEL?.toLowerCase() === 'flux' ||
    process.env.AVATAR_GENERATION_MODEL?.toLowerCase() === 'stable-diffusion')
    ? process.env.AVATAR_GENERATION_MODEL
    : 'dalle-3';

  const ok = model === 'dalle-3' ? hasOpenAI : hasReplicate;
  return NextResponse.json({
    ok,
    model,
    OPENAI_API_KEY: hasOpenAI ? 'set' : 'MISSING ❌',
    REPLICATE_API_TOKEN: hasReplicate ? 'set' : 'not set',
    NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl ? 'set' : 'MISSING ❌',
    SUPABASE_SERVICE_ROLE_KEY: hasServiceRole ? 'set' : 'MISSING ❌',
    DATABASE_URL: hasDatabaseUrl ? 'set' : 'not set',
  }, { status: ok ? 200 : 503 });
}

const AVATAR_BUCKET = 'avatars';
const AVATAR_OUTPUT_SIZE = 128;
const POOL_OUTPUT_SIZE = 256;

import { VALID_STYLES, isValidStyle, DEFAULT_STYLE, type AvatarStyle } from '@/lib/avatar-style-constants';

/** Minimum pool size (initial seed); kept for test compatibility. */
const MIN_POOL_SIZE = 30;

/** Exported for tests — value kept for backward compatibility. */
export const POOL_SIZE = MIN_POOL_SIZE;

/**
 * Deterministic pool avatar URL (legacy numbered pool).
 * Kept for test compatibility — production now uses ai_characters table.
 */
export function getPoolAvatarUrl(name: string, type: AvatarType, gender?: string, offset = 0): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const key = `${name}|${type}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const g = (gender?.trim().toLowerCase() === 'female') ? 'female' : 'male';
  const baseIndex = parseInt(hash.slice(0, 8), 16) % MIN_POOL_SIZE;
  const index = ((baseIndex + offset) % MIN_POOL_SIZE) + 1;
  const padded = String(index).padStart(3, '0');
  return `${supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/pool/${g}/${padded}.png`;
}

/** Resize a base64 data-URL image to AVATAR_OUTPUT_SIZE and return as data-URL */
async function resizeAvatarTo64(dataUrl: string): Promise<string> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const resized = await sharp(buffer)
    .resize(AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE)
    .png()
    .toBuffer();
  return `data:image/png;base64,${resized.toString('base64')}`;
}

/** Resize a base64 data-URL image to buffer for Supabase Storage upload */
async function resizeAvatarToBuffer(dataUrl: string): Promise<Buffer> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  return sharp(buffer)
    .resize(AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE)
    .png()
    .toBuffer();
}

/** Resize for pool storage (higher res than individual avatars). */
async function resizeForPool(dataUrl: string): Promise<Buffer> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  return sharp(buffer)
    .resize(POOL_OUTPUT_SIZE, POOL_OUTPUT_SIZE)
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

/** Get next available pool index for a gender, then upload the avatar there. */
async function uploadToPool(buffer: Buffer, gender: 'male' | 'female'): Promise<string | null> {
  if (!supabaseAdmin) return null;
  // Count existing pool files to find the next index
  const { data } = await supabaseAdmin.storage.from(AVATAR_BUCKET).list(`pool/${gender}`, { limit: 1000 });
  const currentSize = Math.max(data?.filter(f => f.name.endsWith('.png')).length ?? MIN_POOL_SIZE, MIN_POOL_SIZE);
  const newIndex = currentSize + 1;
  const padded = String(newIndex).padStart(3, '0');
  const storagePath = `pool/${gender}/${padded}.png`;

  const { error } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: true });
  if (error) {
    logger.warn('[Avatar] Pool upload failed:', error.message);
    return null;
  }

  const { data: urlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);
  logger.log(`[Avatar] New avatar added to pool: ${storagePath} (pool size now ~${newIndex})`);
  return urlData.publicUrl;
}

/** Save a generated character to the ai_characters table for future community use. */
async function saveCharacterToDb(opts: {
  name: string; gender?: string; personality?: string; background?: string;
  avatarUrl?: string; gameId?: string; voiceId?: string;
}): Promise<void> {
  if (!supabaseAdmin) return;
  try {
    // Compute a voice if not provided
    let voiceId = opts.voiceId;
    if (!voiceId) {
      const { pickVoiceForSpeaker } = await import('@/lib/inworld-voices');
      voiceId = pickVoiceForSpeaker(opts.gender, opts.personality);
    }
    const { error } = await supabaseAdmin.from('ai_characters').insert({
      user_id: 'system',
      name: opts.name,
      gender: opts.gender || 'other',
      personality: opts.personality || null,
      background: opts.background || null,
      avatar_url: opts.avatarUrl || null,
      voice_id: voiceId || null,
      is_system: true,
      source_game_id: opts.gameId || null,
    });
    if (error) logger.warn('[Avatar] Failed to save character to DB:', error.message);
    else logger.log(`[Avatar] Character saved to ai_characters: ${opts.name}`);
  } catch (err) {
    logger.warn('[Avatar] DB save error:', err);
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const replicate = process.env.REPLICATE_API_TOKEN
  ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  : null;

type AvatarType = 'host' | 'player';
type AvatarModel = 'dalle-3' | 'flux' | 'stable-diffusion';

/** Same identity key as client (name|type) for cache lookup */
function avatarCacheKey(name: string, type: AvatarType): string {
  return `${name}|${type}`;
}

/** Version prefix: bump to force regeneration when style/prompt changes (e.g. host and player same prompt) */
const AVATAR_STORAGE_VERSION = 'v7';

/** Deterministic storage path for upsert */
function avatarStoragePath(name: string, type: AvatarType): string {
  const key = avatarCacheKey(name, type);
  const hash = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  return `${type}/${AVATAR_STORAGE_VERSION}/${hash}.png`;
}

/** Get the model to use from env, default to dalle-3 */
function getModel(): AvatarModel {
  const envModel = process.env.AVATAR_GENERATION_MODEL?.toLowerCase();
  if (envModel === 'flux' || envModel === 'stable-diffusion') {
    return envModel;
  }
  return 'dalle-3';
}

/** Solo character: exactly one person in frame, upper-body portrait */
const SOLO_PORTRAIT =
  'Solo character portrait. EXACTLY ONE person only — no second face, no reflections, no mirrors, no split images. ' +
  'Upper body visible from head to chest. Single individual, centered in frame. Dark moody atmospheric background with subtle bokeh lights.';

/** Clean visual output: image contains only the illustrated portrait */
const CLEAN_PORTRAIT = 'Clean illustrated portrait. Pure visual artwork. No text, no labels, no watermarks.';

/** Front-facing face: both eyes clearly visible */
const BOTH_EYES_REQUIRED =
  'Face visible, front-facing or slight three-quarter angle. Both eyes clearly shown. One face only.';

/** Friendly, approachable look — keeps avatars suitable for a casual game regardless of role name */
const FRIENDLY_SAFE =
  'Approachable, expressive appearance. Semi-realistic western RPG style. Suitable for all ages. Game character portrait.';

/** Single shared style for Host and Player — semi-realistic Arcane/western RPG aesthetic. */
const SHARED_CORE_STYLE =
  'Semi-realistic digital painting style, similar to Arcane or western RPG character art. ' +
  'Painterly brushstrokes, dramatic side lighting, rich color depth. Realistic skin texture with slightly stylized proportions. ' +
  SOLO_PORTRAIT + ' ' +
  BOTH_EYES_REQUIRED + ' ' +
  FRIENDLY_SAFE + ' ' +
  CLEAN_PORTRAIT;

/** Gender phrase for prompt: avatar appearance must match name gender */
function genderPhrase(gender?: string): string {
  if (!gender || !gender.trim()) return '';
  const g = gender.trim().toLowerCase();
  if (g === 'female') return 'Female character. ';
  if (g === 'male') return 'Male character. ';
  if (g === 'other') return 'Androgynous or gender-neutral character. ';
  return '';
}

/** Strip wording that may trigger "multiple people / dual faces" in image generation */
function sanitizeSinglePersonDescription(text: string): string {
  if (!text || !text.trim()) return text;
  let s = text.trim();
  const replace: [RegExp | string, string][] = [
    [/\b(players?|teammates?|group|team|pair|duo|two|both|together with|with others?|and friends?)\b/gi, ''],
    [/\b(multiple|several|many|two|three)\s+(people|persons|faces|characters)\b/gi, 'one character'],
    [/\b(group|team)\s*(photo|shot|portrait)?/gi, 'portrait'],
    [/,?\s*and\s+another\s+(person|character|face)/gi, ''],
    [/\b(mirror|reflection|shadow|clone|twin|double|split|dual)\b/gi, ''],
    [/\b(side\s*by\s*side|face\s*to\s*face|back\s*to\s*back)\b/gi, ''],
    [/\b(couple|partners?|companions?)\b/gi, ''],
  ];
  for (const [from, to] of replace) {
    s = typeof from === 'string' ? s.replace(new RegExp(from, 'gi'), to) : s.replace(from, to);
  }
  return s.replace(/\s{2,}/g, ' ').trim();
}

/** Strip or soften words that cause scary/creepy avatar output (e.g. werewolf, mafia, kill, blood). Keep the rest for personality. */
function sanitizeScaryDescription(text: string): string {
  if (!text || !text.trim()) return text;
  let s = text.trim();
  const scaryPatterns: [RegExp | string, string][] = [
    [/\bwerewolf\b/gi, 'mysterious'],
    [/\bwolf\b/gi, ''],
    [/\bmafia\b/gi, 'clever'],
    [/\bkill(er|ing|ed)?\b/gi, ''],
    [/\bblood\b/gi, ''],
    [/\bhorror\b/gi, ''],
    [/\bcurse(d)?\b/gi, ''],
    [/\bnight\s*stalker\b/gi, ''],
    [/\bvillain\b/gi, 'clever'],
    [/\bdeath\b/gi, ''],
    [/\bdead\b/gi, ''],
    [/\bfangs?\b/gi, ''],
    [/\bclaws?\b/gi, ''],
    [/\bscary\b/gi, ''],
    [/\bcreepy\b/gi, ''],
    [/\bsinister\b/gi, ''],
    [/\bdark\s*(and|&)\s*brooding\b/gi, 'thoughtful'],
  ];
  for (const [from, to] of scaryPatterns) {
    s = typeof from === 'string' ? s.replace(new RegExp(from, 'gi'), to) : s.replace(from, to);
  }
  return s.replace(/\s{2,}/g, ' ').trim();
}

function buildPrompt(
  _name: string,
  type: AvatarType,
  opts: { background?: string; personality?: string; gender?: string }
): string {
  const { background, personality, gender } = opts;
  const genderPrefix = genderPhrase(gender);

  const MAX_PROMPT_LENGTH = 1000;

  const singleStart = 'Semi-realistic character portrait. ';
  const singleEnd = ' Solo individual, centered composition.';

  const basePrompt = singleStart + genderPrefix + SHARED_CORE_STYLE + singleEnd;

  // Merge personality and background into a single description so the avatar
  // reflects both the character's traits and their story context.
  const parts: string[] = [];
  if (personality?.trim()) parts.push(personality.trim());
  if (background?.trim()) parts.push(background.trim());
  const combined = parts.join('. ');

  if (!combined || combined.length < 2) {
    return basePrompt.length > MAX_PROMPT_LENGTH
      ? basePrompt.substring(0, MAX_PROMPT_LENGTH)
      : basePrompt;
  }

  const trimmedDesc = sanitizeScaryDescription(
    sanitizeSinglePersonDescription(combined)
  );
  if (!trimmedDesc || trimmedDesc.length < 2) {
    return basePrompt.length > MAX_PROMPT_LENGTH ? basePrompt.substring(0, MAX_PROMPT_LENGTH) : basePrompt;
  }

  const prefix = singleStart + genderPrefix + 'Description: ';
  const suffix = '. ' + SHARED_CORE_STYLE + singleEnd;

  const availableLength = MAX_PROMPT_LENGTH - prefix.length - suffix.length;
  if (availableLength <= 0) {
    return `${genderPrefix}${SHARED_CORE_STYLE}`;
  }

  const truncatedDesc = trimmedDesc.length > availableLength
    ? trimmedDesc.substring(0, availableLength - 3) + '...'
    : trimmedDesc;

  const result = prefix + truncatedDesc + suffix;
  return result.length > MAX_PROMPT_LENGTH
    ? result.substring(0, MAX_PROMPT_LENGTH)
    : result;
}

/** Generate avatar with actual DALL-E 3 (1024x1024, high quality). Retry once on 5xx. */
async function generateWithDalle3(prompt: string, retried = false): Promise<string> {
  const finalPrompt = prompt.length > 4000 ? prompt.substring(0, 4000) : prompt;

  try {
    const resp = await openai.images.generate({
      model: 'dall-e-3',
      prompt: finalPrompt,
      size: '1024x1024',
      response_format: 'b64_json',
      n: 1,
      quality: 'standard',
    });

    const b64 = resp.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error('No image data returned from DALL-E 3');
    }

    return `data:image/png;base64,${b64}`;
  } catch (error: any) {
    const status = error?.status ?? error?.code;
    const is5xx = typeof status === 'number' && status >= 500 && status < 600;
    if (is5xx && !retried) {
      logger.warn('[DALL-E 3] Server error (5xx), retrying once after 2s...', status, error?.message);
      await new Promise((r) => setTimeout(r, 2000));
      return generateWithDalle3(prompt, true);
    }
    logger.error('[DALL-E 3] API Error:', error?.message || error);
    const err = new Error(error?.message ? `DALL-E 3 API error: ${error.message}` : 'DALL-E 3 API error') as Error & { status?: number };
    err.status = 503;
    throw err;
  }
}

async function generateWithReplicate(
  prompt: string,
  model: 'flux' | 'stable-diffusion'
): Promise<string> {
  if (!replicate) {
    throw new Error('Replicate API token not configured');
  }

  let modelId: `${string}/${string}` | `${string}/${string}:${string}`;
  let input: Record<string, any>;

  // Negative prompt: no text + no multiple people / dual faces
  const negativePrompt =
    'text, letters, words, characters, writing, symbols, labels, name tags, captions, subtitles, speech bubbles, signs, banners, written content, ' +
    'two people, two faces, multiple people, multiple faces, group photo, crowd, duo, pair of people, second face, another person, reflection with face, mirror with face, double face, ' +
    'photorealistic, realistic, photograph, real person, hyperrealistic, photo, cinematic';
  
  if (model === 'flux') {
    // FLUX.1 [dev] - high quality, realistic
    modelId = 'black-forest-labs/flux-dev' as const;
    input = {
      prompt: prompt + ' No text, no letters, no words.',
      negative_prompt: negativePrompt,
      aspect_ratio: '1:1',
      output_format: 'png',
      output_quality: 90,
    };
  } else {
    // Stable Diffusion XL - good for portraits
    modelId = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b' as const;
    input = {
      prompt: prompt + ' No text, no letters, no words.',
      negative_prompt: negativePrompt,
      width: 1024,
      height: 1024,
      num_outputs: 1,
      output_format: 'png',
    };
  }

  const output = (await replicate.run(modelId, { input })) as string | string[];
  const imageUrl = Array.isArray(output) ? output[0] : output;

  if (!imageUrl) {
    throw new Error('No image URL returned from Replicate');
  }

  // Fetch the image and convert to base64
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString('base64');
  return `data:image/png;base64,${base64}`;
}

export async function POST(request: NextRequest) {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasReplicate = Boolean(process.env.REPLICATE_API_TOKEN);
  const model = getModel();
  logger.log('[Avatar API] POST received. OPENAI_API_KEY:', hasOpenAI ? 'set' : 'MISSING', '| REPLICATE_API_TOKEN:', hasReplicate ? 'set' : 'missing', '| model:', model);

  try {
    // Authenticate user
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = limiter.check(user.id);
    if (!rl.success) return rateLimitResponse(rl);

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const {
      name,
      type = 'player',
      gameId,
      role,
      background,
      personality,
      gender,
      style,
      forceRegenerate,
      generateAndPool,
      avatarOffset,
    } = body as {
      name?: string;
      type?: AvatarType;
      gameId?: string;
      role?: string;
      background?: string;
      personality?: string;
      gender?: string;
      style?: string;
      forceRegenerate?: boolean;
      generateAndPool?: boolean;
      avatarOffset?: number;
    };

    if (!name || typeof name !== 'string') {
      logger.warn('[Avatar API] 400: name missing or not string');
      return NextResponse.json(
        { error: 'name (string) is required' },
        { status: 400 }
      );
    }

    const avatarType: AvatarType = type === 'host' ? 'host' : 'player';
    const customPath = avatarStoragePath(name, avatarType);
    logger.log('[Avatar API] key:', `${name}|${avatarType}`, 'path:', customPath, 'forceRegenerate:', !!forceRegenerate);

    // --- 1. Check for existing custom avatar (skip when force-regenerating or generateAndPool) ---
    if (!forceRegenerate && !generateAndPool && supabaseAdmin) {
      const { data: blob, error: downloadError } = await supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .download(customPath);
      if (!downloadError && blob && blob.size > 0) {
        logger.log('[Avatar API] cache hit (custom):', customPath);
        const { data: urlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(customPath);
        return NextResponse.json({ image: urlData.publicUrl });
      }
    }

    // --- 2. Force regenerate: generate with DALL-E 3, deduct tokens ---
    if (forceRegenerate) {
      if (!hasOpenAI) {
        return NextResponse.json(
          { error: 'Avatar service unavailable', details: 'OPENAI_API_KEY is not configured' },
          { status: 503 }
        );
      }

      if (isDatabaseConfigured()) {
        try {
          const hasBalance = await deductTokens(
            user.id,
            imageGenCostToCoins('dall-e-3'),
            'image_generation',
            `Custom avatar for ${name} (${avatarType}) [dall-e-3]`
          );
          if (!hasBalance) {
            return NextResponse.json(
              {
                error: 'Insufficient tokens',
                message: 'You need more tokens to generate custom avatars. Please purchase tokens or upgrade to Pro.',
                code: 'INSUFFICIENT_TOKENS',
              },
              { status: 402 }
            );
          }
        } catch (tokenErr) {
          logger.warn('[Avatar API] Token deduction failed, generating anyway:', tokenErr);
        }
      }

      const prompt = buildPrompt(name, avatarType, {
        background: typeof background === 'string' ? background : undefined,
        personality: typeof personality === 'string' ? personality : undefined,
        gender: typeof gender === 'string' ? gender : undefined,
      });

      logger.log(`[Avatar] Force-regenerating with DALL-E 3 for: ${name}, prompt length: ${prompt.length}`);

      const imageDataUrl = await generateWithDalle3(prompt);
      const image64 = await resizeAvatarTo64(imageDataUrl);

      if (supabaseAdmin) {
        try {
          const buffer = await resizeAvatarToBuffer(imageDataUrl);
          const { error: uploadError } = await supabaseAdmin.storage
            .from(AVATAR_BUCKET)
            .upload(customPath, buffer, { contentType: 'image/png', upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(customPath);
            return NextResponse.json({ image: urlData.publicUrl });
          }
          logger.warn('[Avatar] Storage upload failed:', uploadError.message);
        } catch (supabaseErr) {
          logger.warn('[Avatar] Storage save failed:', supabaseErr);
        }
      }

      return NextResponse.json({ image: image64 });
    }

    // --- 3. Generate and add to pool: DALL-E 3 + save to pool + persist to ai_characters ---
    if (generateAndPool) {
      if (!hasOpenAI) {
        return NextResponse.json(
          { error: 'Avatar service unavailable', details: 'OPENAI_API_KEY is not configured' },
          { status: 503 }
        );
      }

      if (isDatabaseConfigured()) {
        try {
          const hasBalance = await deductTokens(
            user.id,
            imageGenCostToCoins('dall-e-3'),
            'image_generation',
            `Pool avatar for ${name} (${avatarType}) [dall-e-3]`
          );
          if (!hasBalance) {
            return NextResponse.json(
              {
                error: 'Insufficient tokens',
                message: 'You need more tokens to generate avatars. Please purchase tokens or upgrade to Pro.',
                code: 'INSUFFICIENT_TOKENS',
              },
              { status: 402 }
            );
          }
        } catch (tokenErr) {
          logger.warn('[Avatar API] Token deduction failed, generating anyway:', tokenErr);
        }
      }

      const genderStr = typeof gender === 'string' ? gender : undefined;
      const prompt = buildPrompt(name, avatarType, {
        background: typeof background === 'string' ? background : undefined,
        personality: typeof personality === 'string' ? personality : undefined,
        gender: genderStr,
      });

      logger.log(`[Avatar] generateAndPool for: ${name}, gender: ${genderStr}, prompt length: ${prompt.length}`);

      const imageDataUrl = await generateWithDalle3(prompt);
      const g: 'male' | 'female' = (genderStr?.trim().toLowerCase() === 'female') ? 'female' : 'male';

      const poolBuffer = await resizeForPool(imageDataUrl);
      const newPoolUrl = await uploadToPool(poolBuffer, g);

      await saveCharacterToDb({
        name,
        gender: genderStr,
        personality: typeof personality === 'string' ? personality : undefined,
        background: typeof background === 'string' ? background : undefined,
        avatarUrl: newPoolUrl || undefined,
        gameId: typeof gameId === 'string' ? gameId : undefined,
      });

      if (newPoolUrl) {
        return NextResponse.json({ image: newPoolUrl, pool: true, generated: true });
      }

      const image64 = await resizeAvatarTo64(imageDataUrl);
      return NextResponse.json({ image: image64, generated: true });
    }

    // --- 4. Default: pick from ai_characters table (deterministic by name hash) ---
    if (supabaseAdmin) {
      const g = (typeof gender === 'string' && gender.trim().toLowerCase() === 'female') ? 'female' : 'male';
      const requestedStyle: AvatarStyle = (typeof style === 'string' && isValidStyle(style))
        ? style
        : DEFAULT_STYLE;

      const { data: chars } = await supabaseAdmin
        .from('ai_characters')
        .select('avatar_url, avatar_styles')
        .eq('is_system', true)
        .eq('gender', g)
        .not('avatar_url', 'is', null)
        .limit(500);

      if (chars?.length) {
        const key = `${name}|${avatarType}`;
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        // Prefer characters that have the requested style to avoid cross-style mixing.
        const withStyle = chars.filter((c) => {
          const s = (c.avatar_styles ?? {}) as Record<string, string>;
          return !!s[requestedStyle];
        });
        const pool = withStyle.length > 0 ? withStyle : chars;
        const baseIdx = parseInt(hash.slice(0, 8), 16) % pool.length;
        const idx = ((baseIdx + (avatarOffset || 0)) % pool.length);
        const char = pool[idx];
        const styles = (char.avatar_styles ?? {}) as Record<string, string>;
        const url = styles[requestedStyle] ?? styles['semi-realistic'] ?? char.avatar_url;
        if (url) {
          logger.log('[Avatar API] returning ai_characters avatar:', url);
          return NextResponse.json({ image: url, pool: true });
        }
      }
    }

    // --- 5. Fallback: pool URL unavailable (no Supabase URL), generate with Replicate/DALL-E 3 ---
    logger.warn('[Avatar API] No pool URL available, falling back to generation');
    if (isDatabaseConfigured()) {
      try {
        const hasBalance = await deductTokens(
          user.id,
          imageGenCostToCoins(model),
          'image_generation',
          `Generate avatar for ${name} (${avatarType}) [${model}]`
        );
        if (!hasBalance) {
          return NextResponse.json(
            {
              error: 'Insufficient tokens',
              message: 'You need more tokens to generate avatars. Please purchase tokens or upgrade to Pro.',
              code: 'INSUFFICIENT_TOKENS',
            },
            { status: 402 }
          );
        }
      } catch (tokenErr) {
        logger.warn('[Avatar API] Token deduction failed, generating anyway:', tokenErr);
      }
    }

    const fallbackPrompt = buildPrompt(name, avatarType, {
      background: typeof background === 'string' ? background : undefined,
      personality: typeof personality === 'string' ? personality : undefined,
      gender: typeof gender === 'string' ? gender : undefined,
    });

    let imageDataUrl: string;
    try {
      if (model === 'flux' || model === 'stable-diffusion') {
        imageDataUrl = await generateWithReplicate(fallbackPrompt, model);
      } else {
        imageDataUrl = await generateWithDalle3(fallbackPrompt);
      }
    } catch (error: unknown) {
      logger.error(`Error generating with ${model}:`, error);
      if (model !== 'dalle-3') {
        try {
          imageDataUrl = await generateWithDalle3(fallbackPrompt);
        } catch (fallbackError: unknown) {
          const msg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          throw new Error(`Primary model (${model}) and fallback (dalle-3) both failed: ${msg}`);
        }
      } else {
        throw error;
      }
    }

    const image64 = await resizeAvatarTo64(imageDataUrl);

    if (supabaseAdmin) {
      try {
        const buffer = await resizeAvatarToBuffer(imageDataUrl);
        const { error: uploadError } = await supabaseAdmin.storage
          .from(AVATAR_BUCKET)
          .upload(customPath, buffer, { contentType: 'image/png', upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(customPath);
          return NextResponse.json({ image: urlData.publicUrl });
        }
        logger.warn('[Avatar] Storage upload failed:', uploadError.message);
      } catch (supabaseErr) {
        logger.warn('[Avatar] Storage save failed:', supabaseErr);
      }
    }

    return NextResponse.json({ image: image64 });
  } catch (e: unknown) {
    logger.error('[Avatar API] error:', e);
    if (isDatabaseError(e)) {
      return NextResponse.json(
        { error: 'Database unavailable. Check DATABASE_URL and that migrations have been run.' },
        { status: 503 }
      );
    }
    const err = e as { status?: number; message?: string; error?: { message?: string } };
    
    // Extract detailed error message
    let errorMessage = 'Failed to generate avatar';
    if (err.message) {
      errorMessage = err.message;
    } else if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (typeof e === 'object' && e !== null) {
      const errorObj = e as { message?: string; error?: { message?: string } };
      errorMessage = errorObj.message || errorObj.error?.message || errorMessage;
    }
    
    const statusCode = err.status ?? 500;
    const details = statusCode === 400
      ? 'Bad request - check prompt length and format'
      : (statusCode === 503 ? 'Service unavailable - check OPENAI_API_KEY or Replicate token' : undefined);
    logger.error('[Avatar API] responding', statusCode, errorMessage, details ?? '');
    return NextResponse.json(
      { error: errorMessage, details },
      { status: statusCode }
    );
  }
}
