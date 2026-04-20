import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import OpenAI from 'openai';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { deductTokens, hasTokens, imageGenCostToCoins } from '@/lib/tokens';
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';
import { logger } from '@/lib/logger';
import { createRateLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { resolvePlayerGender, poolGenderBinary } from '@/lib/player-gender';

const limiter = createRateLimiter('avatar', { limit: 10, windowSeconds: 60 });

export const maxDuration = 60;

/** GET /api/avatar - quick config health-check (no auth required) */
export async function GET() {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  return NextResponse.json({
    ok: hasOpenAI,
    model: 'dalle-3',
    OPENAI_API_KEY: hasOpenAI ? 'set' : 'MISSING ❌',
    NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl ? 'set' : 'MISSING ❌',
    SUPABASE_SERVICE_ROLE_KEY: hasServiceRole ? 'set' : 'MISSING ❌',
    DATABASE_URL: hasDatabaseUrl ? 'set' : 'not set',
  }, { status: hasOpenAI ? 200 : 503 });
}

const AVATAR_BUCKET = 'avatars';
const AVATAR_OUTPUT_SIZE = 128;
const POOL_OUTPUT_SIZE = 256;

import { isValidStyle, DEFAULT_STYLE, type AvatarStyle } from '@/lib/avatar-style-constants';
import { getArchetype } from '@/lib/rpg/archetypes';

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
  const resolved = resolvePlayerGender(name, gender, {});
  const g = poolGenderBinary(resolved, name);
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

/**
 * Upload a generated avatar to the pool with a UUID filename to avoid concurrent
 * upload races (previous version used `list().length + 1` + upsert:true, which
 * could collide and overwrite under concurrency).
 *
 * Files live under `pool/{gender}/gen/{uuid}.png` so they don't conflict with
 * the deterministic numbered seed pool (`pool/{gender}/001.png` … `030.png`).
 */
async function uploadToPool(buffer: Buffer, gender: 'male' | 'female'): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const id = crypto.randomUUID();
  const storagePath = `pool/${gender}/gen/${id}.png`;

  const { error } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: false });
  if (error) {
    logger.warn('[Avatar] Pool upload failed:', error.message);
    return null;
  }

  const { data: urlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);
  logger.log(`[Avatar] New avatar added to pool: ${storagePath}`);
  return urlData.publicUrl;
}

/** Save a generated character to the ai_characters table for future community use. */
async function saveCharacterToDb(opts: {
  name: string; gender?: string; personality?: string; background?: string;
  avatarUrl?: string; gameId?: string;
}): Promise<void> {
  if (!supabaseAdmin) return;
  try {
    const { error } = await supabaseAdmin.from('ai_characters').insert({
      user_id: 'system',
      name: opts.name,
      gender: opts.gender || 'other',
      personality: opts.personality || null,
      background: opts.background || null,
      avatar_url: opts.avatarUrl || null,
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

type AvatarType = 'host' | 'player';
type AvatarModel = 'dalle-3';

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

/** Avatar model is fixed to dalle-3 (Replicate removed). */
function getModel(): AvatarModel {
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

/** Anime style — Genshin Impact / Honkai Star Rail inspired aesthetic. */
const ANIME_CORE_STYLE =
  'High-quality anime character portrait in the style of Genshin Impact and Honkai Star Rail. ' +
  'Polished cel-shading with soft gradients, luminous skin rendering, highly detailed hair strands with color highlights, elaborate fantasy costume with intricate accessories. ' +
  'Vivid expressive eyes with detailed iris reflections. Dynamic pose with slight wind effect on hair and clothing. ' +
  SOLO_PORTRAIT + ' ' +
  BOTH_EYES_REQUIRED + ' ' +
  'Cinematic lighting with rim light and soft bloom. Fantasy atmosphere background with subtle particle effects. ' +
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
  opts: { background?: string; personality?: string; gender?: string; style?: string; archetypeVisualTags?: string }
): string {
  const { background, personality, gender, style, archetypeVisualTags } = opts;
  const genderPrefix = genderPhrase(gender);
  const isAnime = style === 'anime';

  const MAX_PROMPT_LENGTH = 1000;

  const coreStyle = isAnime ? ANIME_CORE_STYLE : SHARED_CORE_STYLE;
  const singleStart = isAnime ? 'Anime character portrait. ' : 'Semi-realistic character portrait. ';
  const singleEnd = ' Solo individual, centered composition.';

  const basePrompt = singleStart + genderPrefix + coreStyle + singleEnd;

  const parts: string[] = [];
  if (archetypeVisualTags?.trim()) parts.push(archetypeVisualTags.trim());
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
  const suffix = '. ' + coreStyle + singleEnd;

  const availableLength = MAX_PROMPT_LENGTH - prefix.length - suffix.length;
  if (availableLength <= 0) {
    return `${genderPrefix}${coreStyle}`;
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
  } catch (error: unknown) {
    const e = error as { status?: number; code?: number; message?: string } | null;
    const status = e?.status ?? e?.code;
    const is5xx = typeof status === 'number' && status >= 500 && status < 600;
    if (is5xx && !retried) {
      logger.warn('[DALL-E 3] Server error (5xx), retrying once after 2s...', status, e?.message);
      await new Promise((r) => setTimeout(r, 2000));
      return generateWithDalle3(prompt, true);
    }
    logger.error('[DALL-E 3] API Error:', e?.message || error);
    const err = new Error(e?.message ? `DALL-E 3 API error: ${e.message}` : 'DALL-E 3 API error') as Error & { status?: number };
    err.status = 503;
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const model = getModel();
  logger.log('[Avatar API] POST received. OPENAI_API_KEY:', hasOpenAI ? 'set' : 'MISSING', '| model:', model);

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
      role: _role,
      background,
      personality,
      gender,
      style,
      forceRegenerate,
      generateAndPool,
      avatarOffset,
      archetypeId,
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
      archetypeId?: string;
    };

    if (!name || typeof name !== 'string') {
      logger.warn('[Avatar API] 400: name missing or not string');
      return NextResponse.json(
        { error: 'name (string) is required' },
        { status: 400 }
      );
    }

    const avatarType: AvatarType = type === 'host' ? 'host' : 'player';
    const resolvedStyle: AvatarStyle = (typeof style === 'string' && isValidStyle(style)) ? style : DEFAULT_STYLE;
    const personalityStr = typeof personality === 'string' ? personality : undefined;
    const backgroundStr = typeof background === 'string' ? background : undefined;
    const genderResolved = resolvePlayerGender(name, typeof gender === 'string' ? gender : undefined, {
      personality: personalityStr,
      background: backgroundStr,
    });
    const customPath = avatarStoragePath(name, avatarType);
    const archetypeData = archetypeId ? getArchetype(archetypeId) : undefined;
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
          { error: 'Avatar generation failed' },
          { status: 503 }
        );
      }

      // Pre-check balance (fail fast before burning a generation), but actual
      // deduction happens AFTER the image is successfully produced — so failures
      // never charge the user.
      const cost = imageGenCostToCoins('dall-e-3');
      if (isDatabaseConfigured()) {
        try {
          const hasEnough = await hasTokens(user.id, cost);
          if (!hasEnough) {
            return NextResponse.json(
              {
                error: 'Insufficient tokens',
                message: 'You need more tokens to generate custom avatars. Please purchase more credits.',
                code: 'INSUFFICIENT_TOKENS',
              },
              { status: 402 }
            );
          }
        } catch (tokenErr) {
          logger.error('[Avatar API] Balance check failed:', tokenErr);
          return NextResponse.json(
            { error: 'Service temporarily unavailable, please try again' },
            { status: 503 }
          );
        }
      }

      const prompt = buildPrompt(name, avatarType, {
        background: backgroundStr,
        personality: personalityStr,
        gender: genderResolved,
        style: resolvedStyle,
        archetypeVisualTags: archetypeData?.visualTags.join(', '),
      });

      logger.log(`[Avatar] Force-regenerating with DALL-E 3 for: ${name}, style: ${resolvedStyle}, prompt length: ${prompt.length}`);

      const imageDataUrl = await generateWithDalle3(prompt);
      const image64 = await resizeAvatarTo64(imageDataUrl);

      // Charge only after the model returned a usable image.
      if (isDatabaseConfigured()) {
        try {
          const ok = await deductTokens(
            user.id,
            cost,
            'image_generation',
            `Custom avatar for ${name} (${avatarType}) [dall-e-3]`
          );
          if (!ok) {
            return NextResponse.json(
              {
                error: 'Insufficient tokens',
                message: 'Balance changed during generation. Please try again.',
                code: 'INSUFFICIENT_TOKENS',
              },
              { status: 402 }
            );
          }
        } catch (tokenErr) {
          logger.error('[Avatar API] Post-generation token deduction failed:', tokenErr);
          return NextResponse.json(
            { error: 'Billing temporarily unavailable, please try again' },
            { status: 503 }
          );
        }
      }

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
          { error: 'Avatar generation failed' },
          { status: 503 }
        );
      }

      const cost = imageGenCostToCoins('dall-e-3');
      if (isDatabaseConfigured()) {
        try {
          const hasEnough = await hasTokens(user.id, cost);
          if (!hasEnough) {
            return NextResponse.json(
              {
                error: 'Insufficient tokens',
                message: 'You need more tokens to generate avatars. Please purchase more credits.',
                code: 'INSUFFICIENT_TOKENS',
              },
              { status: 402 }
            );
          }
        } catch (tokenErr) {
          logger.error('[Avatar API] Balance check failed:', tokenErr);
          return NextResponse.json(
            { error: 'Service temporarily unavailable, please try again' },
            { status: 503 }
          );
        }
      }

      const prompt = buildPrompt(name, avatarType, {
        background: backgroundStr,
        personality: personalityStr,
        gender: genderResolved,
        style: resolvedStyle,
        archetypeVisualTags: archetypeData?.visualTags.join(', '),
      });

      logger.log(`[Avatar] generateAndPool for: ${name}, style: ${resolvedStyle}, gender: ${genderResolved}, prompt length: ${prompt.length}`);

      const imageDataUrl = await generateWithDalle3(prompt);

      if (isDatabaseConfigured()) {
        try {
          const ok = await deductTokens(
            user.id,
            cost,
            'image_generation',
            `Pool avatar for ${name} (${avatarType}) [dall-e-3]`
          );
          if (!ok) {
            return NextResponse.json(
              {
                error: 'Insufficient tokens',
                message: 'Balance changed during generation. Please try again.',
                code: 'INSUFFICIENT_TOKENS',
              },
              { status: 402 }
            );
          }
        } catch (tokenErr) {
          logger.error('[Avatar API] Post-generation token deduction failed:', tokenErr);
          return NextResponse.json(
            { error: 'Billing temporarily unavailable, please try again' },
            { status: 503 }
          );
        }
      }

      const g = poolGenderBinary(genderResolved, name);

      const poolBuffer = await resizeForPool(imageDataUrl);
      const newPoolUrl = await uploadToPool(poolBuffer, g);

      await saveCharacterToDb({
        name,
        gender: genderResolved,
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

    // --- 4. Default: look up exact character by name, then fall back to hash-based pick ---
    if (supabaseAdmin) {
      const requestedStyle: AvatarStyle = (typeof style === 'string' && isValidStyle(style))
        ? style
        : DEFAULT_STYLE;

      // Try exact name match first (covers characters selected from the browser).
      // IMPORTANT: when avatarOffset > 0, this call is a collision-retry from
      // fetchAvatarsForRoom and must bypass exact match so offset can take effect.
      const shouldUseExactNameMatch = !(typeof avatarOffset === 'number' && avatarOffset > 0);
      if (shouldUseExactNameMatch) {
        const { data: exactMatch } = await supabaseAdmin
          .from('ai_characters')
          .select('avatar_url, avatar_styles')
          .eq('is_system', true)
          .eq('name', name)
          .not('avatar_url', 'is', null)
          .limit(1)
          .maybeSingle();

        if (exactMatch) {
          const styles = (exactMatch.avatar_styles ?? {}) as Record<string, string>;
          const url = styles[requestedStyle] ?? styles['semi-realistic'] ?? exactMatch.avatar_url;
          if (url) {
            logger.log('[Avatar API] exact name match for:', name, url);
            return NextResponse.json({ image: url, pool: true });
          }
        }
      }

      // Fallback: hash-based pick from same-gender pool (binary: DB rows are male/female)
      const g = poolGenderBinary(genderResolved, name);
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
        const withStyle = chars.filter((c) => {
          const s = (c.avatar_styles ?? {}) as Record<string, string>;
          return !!s[requestedStyle];
        });
        const pool = withStyle.length > 0 ? withStyle : chars;

        // Deduplicate by resolved URL so offset-based collision retries can
        // actually move to a different avatar when DB rows share same image.
        const uniquePool: Array<{ avatar_url: string | null; avatar_styles: Record<string, string> | null }> = [];
        const seenUrls = new Set<string>();
        for (const c of pool) {
          const styles = (c.avatar_styles ?? {}) as Record<string, string>;
          const resolvedUrl = styles[requestedStyle] ?? styles['semi-realistic'] ?? c.avatar_url;
          if (!resolvedUrl) continue;
          if (seenUrls.has(resolvedUrl)) continue;
          seenUrls.add(resolvedUrl);
          uniquePool.push(c);
        }

        const pickPool = uniquePool.length > 0 ? uniquePool : pool;
        const baseIdx = parseInt(hash.slice(0, 8), 16) % pickPool.length;
        const idx = ((baseIdx + (avatarOffset || 0)) % pickPool.length);
        const char = pickPool[idx];
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
      background: backgroundStr,
      personality: personalityStr,
      gender: genderResolved,
      style: resolvedStyle,
      archetypeVisualTags: archetypeData?.visualTags.join(', '),
    });

    let imageDataUrl: string;
    try {
      imageDataUrl = await generateWithDalle3(fallbackPrompt);
    } catch (error: unknown) {
      logger.error(`Error generating with ${model}:`, error);
      throw error;
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
    const statusCode = err.status ?? 500;
    logger.error('[Avatar API] responding', statusCode, err.message || err.error?.message || e);
    return NextResponse.json(
      { error: 'Avatar generation failed' },
      { status: statusCode }
    );
  }
}
