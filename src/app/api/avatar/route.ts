import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import OpenAI from 'openai';
import Replicate from 'replicate';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { deductTokens, TOKEN_COSTS } from '@/lib/tokens';
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';
import { logger } from '@/lib/logger';

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
const AVATAR_OUTPUT_SIZE = 64;

/** DALL-E 2 minimum is 256x256; we resize to 64 to save bandwidth and storage */
async function resizeAvatarTo64(dataUrl: string): Promise<string> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const resized = await sharp(buffer)
    .resize(AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE)
    .png()
    .toBuffer();
  return `data:image/png;base64,${resized.toString('base64')}`;
}

/** Resize to buffer for Supabase Storage upload */
async function resizeAvatarToBuffer(dataUrl: string): Promise<Buffer> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  return sharp(buffer)
    .resize(AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE)
    .png()
    .toBuffer();
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
const AVATAR_STORAGE_VERSION = 'v5';

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

/** Solo character: exactly one person in frame, head-and-shoulders portrait */
const SOLO_PORTRAIT =
  'Solo character portrait. One person only. Head and shoulders framing. Single individual, centered in frame.';

/** Clean visual output: image contains only the illustrated portrait */
const CLEAN_PORTRAIT = 'Clean illustrated portrait. Pure visual artwork.';

/** Front-facing face: both eyes fully visible and centered */
const BOTH_EYES_REQUIRED =
  'Full face visible, front-facing or very slight three-quarter angle. ' +
  'Both eyes, nose, and mouth clearly shown. Centered in frame, complete face within image boundaries.';

/** Friendly, wholesome look — keeps avatars suitable for a casual game regardless of role name */
const FRIENDLY_SAFE =
  'Cheerful, friendly, wholesome appearance. Cute, charming anime style. Suitable for all ages. Game avatar.';

/** Single shared style for Host and Player — identical so all avatars look the same (anime, not realistic). */
const SHARED_CORE_STYLE =
  'Anime illustration style. Vibrant colors, expressive large eyes, clean line art, soft shading. ' +
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

/** 去掉易触发“多人/双脸”的措辞，避免模型画出两个人 */
function sanitizeSinglePersonDescription(text: string): string {
  if (!text || !text.trim()) return text;
  let s = text.trim();
  const replace: [RegExp | string, string][] = [
    [/\b(players?|teammates?|group|team|pair|duo|two|both|together with|with others?|and friends?)\b/gi, ''],
    [/\b(multiple|several|many|two|three)\s+(people|persons|faces|characters)\b/gi, 'one character'],
    [/\b(group|team)\s*(photo|shot|portrait)?/gi, 'portrait'],
    [/,?\s*and\s+another\s+(person|character|face)/gi, ''],
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
  opts: { background?: string; gender?: string }
): string {
  const { background, gender } = opts;
  const genderPrefix = genderPhrase(gender);

  // DALL-E 2 has a 1000 character limit for prompts
  const MAX_PROMPT_LENGTH = 1000;

  // Close-up single-person framing using only positive descriptors (negative words trigger safety filters)
  const singleStart = 'Close-up anime portrait. ';
  const singleEnd = ' Solo individual, centered composition.';

  // 统一画风：Host 与 Player 使用完全相同的 prompt 结构，仅 background 不同，保证头像风格一致（不额外加 Host 角色词）
  const basePrompt = singleStart + genderPrefix + SHARED_CORE_STYLE + singleEnd;

  if (!background || !background.trim()) {
    return basePrompt.length > MAX_PROMPT_LENGTH
      ? basePrompt.substring(0, MAX_PROMPT_LENGTH)
      : basePrompt;
  }

  const trimmedBackground = sanitizeScaryDescription(
    sanitizeSinglePersonDescription(background.trim())
  );
  if (!trimmedBackground || trimmedBackground.length < 2) {
    return basePrompt.length > MAX_PROMPT_LENGTH ? basePrompt.substring(0, MAX_PROMPT_LENGTH) : basePrompt;
  }

  const prefix = singleStart + genderPrefix + 'Description: ';
  const suffix = '. ' + SHARED_CORE_STYLE + singleEnd;

  const availableLength = MAX_PROMPT_LENGTH - prefix.length - suffix.length;
  if (availableLength <= 0) {
    return `${genderPrefix}${SHARED_CORE_STYLE}`;
  }

  const truncatedBackground = trimmedBackground.length > availableLength
    ? trimmedBackground.substring(0, availableLength - 3) + '...'
    : trimmedBackground;

  const result = prefix + truncatedBackground + suffix;
  return result.length > MAX_PROMPT_LENGTH
    ? result.substring(0, MAX_PROMPT_LENGTH)
    : result;
}

/** Retry once on 5xx (transient server error); delay in ms */
async function generateWithDalle3(prompt: string, retried = false): Promise<string> {
  // Use DALL-E 2 with 256x256 for lowest cost and fastest generation
  // Prompt already includes strong single-person emphasis from buildPrompt

  const finalPrompt = prompt.length > 1000 ? prompt.substring(0, 1000) : prompt;

  try {
    const resp = await openai.images.generate({
      model: 'dall-e-2',
      prompt: finalPrompt,
      size: '256x256',
      response_format: 'b64_json',
      n: 1,
    });

    const b64 = resp.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error('No image data returned from DALL-E');
    }

    return `data:image/png;base64,${b64}`;
  } catch (error: any) {
    const status = error?.status ?? error?.code;
    const is5xx = typeof status === 'number' && status >= 500 && status < 600;
    if (is5xx && !retried) {
      logger.warn('[DALL-E] Server error (5xx), retrying once after 2s...', status, error?.message);
      await new Promise((r) => setTimeout(r, 2000));
      return generateWithDalle3(prompt, true);
    }
    logger.error('[DALL-E] API Error:', error?.message || error);
    const err = new Error(error?.message ? `DALL-E API error: ${error.message}` : 'DALL-E API error') as Error & { status?: number };
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

  // Negative prompt: 禁止文字 + 禁止多人/双脸
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
    } = body as {
      name?: string;
      type?: AvatarType;
      gameId?: string;
      role?: string;
      background?: string;
      personality?: string;
      gender?: string;
    };

    if (!name || typeof name !== 'string') {
      logger.warn('[Avatar API] 400: name missing or not string');
      return NextResponse.json(
        { error: 'name (string) is required' },
        { status: 400 }
      );
    }

    const avatarType: AvatarType = type === 'host' ? 'host' : 'player';
    const path = avatarStoragePath(name, avatarType);
    logger.log('[Avatar API] key:', `${name}|${avatarType}`, 'path:', path);

    // 用服务端 Supabase API 检查是否已存在，避免公网 HEAD 失败导致重复生成
    // If cached, no tokens needed
    if (supabaseAdmin) {
      const { data: blob, error: downloadError } = await supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .download(path);
      if (!downloadError && blob && blob.size > 0) {
        logger.log('[Avatar API] cache hit Supabase:', path);
        const { data: urlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
        return NextResponse.json({ image: urlData.publicUrl });
      }
    }
    // Check and deduct tokens only when the database is configured.
    // If DATABASE_URL is not set, or if the token tables haven't been migrated yet,
    // skip token tracking and allow generation so the app works regardless.
    if (isDatabaseConfigured()) {
      try {
        const hasTokens = await deductTokens(
          user.id,
          TOKEN_COSTS.GENERATE_AVATAR,
          'image_generation',
          `Generate avatar for ${name} (${avatarType})`
        );

        if (!hasTokens) {
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
        // Token table may not exist yet (migrations not run) — log and proceed.
        logger.warn('[Avatar API] Token deduction failed (DB schema not ready?), generating anyway:', tokenErr);
      }
    } else {
      logger.warn('[Avatar API] DATABASE_URL not configured — skipping token check, generating anyway.');
    }

    
    const prompt = buildPrompt(name, avatarType, {
      background: typeof background === 'string' ? background : undefined,
      gender: typeof gender === 'string' ? gender : undefined,
    });

    logger.log(`[Avatar] Generating for: ${name}, type: ${type}, gameId: ${gameId || 'none'}, prompt length: ${prompt.length}`);

    let imageDataUrl: string;

    // Validate prompt length before generation
    if (prompt.length > 1000) {
      logger.error(`Prompt too long: ${prompt.length} characters`);
      return NextResponse.json(
        { error: `Prompt exceeds 1000 character limit: ${prompt.length} characters` },
        { status: 400 }
      );
    }

    try {
      logger.log('[Avatar API] generating with', model);
      if (model === 'dalle-3') {
        if (!hasOpenAI) {
          logger.error('[Avatar API] OPENAI_API_KEY not set but model is dalle-3');
          return NextResponse.json(
            { error: 'Avatar service unavailable', details: 'OPENAI_API_KEY is not configured' },
            { status: 503 }
          );
        }
        imageDataUrl = await generateWithDalle3(prompt);
      } else if (model === 'flux' || model === 'stable-diffusion') {
        imageDataUrl = await generateWithReplicate(prompt, model);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    } catch (error: unknown) {
      logger.error(`Error generating with ${model}:`, error);
      // Fallback to DALL-E 3 if other models fail
      if (model !== 'dalle-3') {
        logger.log('Falling back to DALL-E 3...');
        try {
          imageDataUrl = await generateWithDalle3(prompt);
        } catch (fallbackError: unknown) {
          const msg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          throw new Error(`Primary model (${model}) and fallback (dalle-3) both failed: ${msg}`);
        }
      } else {
        throw error;
      }
    }

    const image64 = await resizeAvatarTo64(imageDataUrl);

    // 只存 Supabase Storage，不再用表
    if (supabaseAdmin) {
      try {
        const buffer = await resizeAvatarToBuffer(imageDataUrl);
        const { error: uploadError } = await supabaseAdmin.storage
          .from(AVATAR_BUCKET)
          .upload(path, buffer, { contentType: 'image/png', upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
          return NextResponse.json({ image: urlData.publicUrl });
        }
        logger.warn('[Avatar] Supabase Storage upload failed:', uploadError.message);
      } catch (supabaseErr) {
        logger.warn('[Avatar] Supabase Storage save failed:', supabaseErr);
      }
    }

    logger.log('[Avatar API] success, returning base64 image');
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
