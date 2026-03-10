/**
 * /api/avatar-preview
 * Unauthenticated endpoint for landing page preview avatars.
 * - No auth required (landing page is shown to unauthenticated visitors)
 * - No token deduction (system cost for landing page characters)
 * - Only serves a whitelist of predefined landing page character names
 * - Reuses the same Supabase Storage cache as /api/avatar (same deterministic path)
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import OpenAI from 'openai';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

// Whitelist: only these names are served by this endpoint (prevents abuse)
const LANDING_PAGE_NAMES = new Set([
  // INSIDE_GAME_STEPS characters
  'You', 'Game Master', 'Warden Lunaris', 'Dr. Chen', 'Captain Rex', 'Engineer Nova', 'Gideon',
  // GAME_SCENARIOS - Werewolf
  'Alex', 'Casey',
  // GAME_SCENARIOS - Mafia
  'Lucia', 'Marco', 'Don Ferrante',
  // GAME_SCENARIOS - Spy
  'Jordan', 'Riley',
  // GAME_SCENARIOS - Mystery
  'Morgan', 'Taylor', 'Detective Kate',
  // Typing indicator
  'Drew',
]);

// Simple in-memory rate limit: max 30 avatar-preview requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

const AVATAR_BUCKET = 'avatars';
const AVATAR_OUTPUT_SIZE = 64;
const AVATAR_STORAGE_VERSION = 'v7';

function avatarCacheKey(name: string): string {
  return `${name}|player`;
}

function avatarStoragePath(name: string): string {
  const key = avatarCacheKey(name);
  const hash = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  return `player/${AVATAR_STORAGE_VERSION}/${hash}.png`;
}

async function resizeAvatarToBuffer(dataUrl: string): Promise<Buffer> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  return sharp(buffer).resize(AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE).png().toBuffer();
}

async function resizeAvatarTo64(dataUrl: string): Promise<string> {
  const buffer = await resizeAvatarToBuffer(dataUrl);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const SOLO_PORTRAIT =
  'Solo character portrait. EXACTLY ONE person only — no second face, no reflections, no mirrors, no split images. ' +
  'Upper body visible from head to chest. Single individual, centered in frame. Dark moody atmospheric background with subtle bokeh lights.';
const BOTH_EYES_REQUIRED =
  'Face visible, front-facing or slight three-quarter angle. Both eyes clearly shown. One face only.';
const FRIENDLY_SAFE =
  'Approachable, expressive appearance. Semi-realistic western RPG style. Suitable for all ages. Game character portrait.';
const CLEAN_PORTRAIT = 'Clean illustrated portrait. Pure visual artwork. No text, no labels, no watermarks.';
const SHARED_CORE_STYLE =
  'Semi-realistic digital painting style, similar to Arcane or western RPG character art. ' +
  'Painterly brushstrokes, dramatic side lighting, rich color depth. Realistic skin texture with slightly stylized proportions. ' +
  SOLO_PORTRAIT + ' ' + BOTH_EYES_REQUIRED + ' ' + FRIENDLY_SAFE + ' ' + CLEAN_PORTRAIT;

function genderPhrase(gender?: string): string {
  if (!gender) return '';
  const g = gender.trim().toLowerCase();
  if (g === 'female') return 'Female character. ';
  if (g === 'male') return 'Male character. ';
  if (g === 'other') return 'Androgynous or gender-neutral character. ';
  return '';
}

function sanitize(text: string): string {
  return text
    .replace(/\b(werewolf|wolf|mafia|killer?|blood|horror|cursed?|villain|death|dead|fangs?|claws?|scary|creepy|sinister)\b/gi, '')
    .replace(/\s{2,}/g, ' ').trim();
}

function buildPrompt(gender?: string, background?: string): string {
  const gp = genderPhrase(gender);
  const bg = background ? sanitize(background.trim()) : '';
  const base = `Semi-realistic character portrait. ${gp}${SHARED_CORE_STYLE} Solo individual, centered composition.`;
  if (!bg || bg.length < 2) return base.slice(0, 1000);
  const prefix = `Semi-realistic character portrait. ${gp}Description: `;
  const suffix = `. ${SHARED_CORE_STYLE} Solo individual, centered composition.`;
  const available = 1000 - prefix.length - suffix.length;
  const truncBg = bg.length > available ? bg.slice(0, available - 3) + '...' : bg;
  return (prefix + truncBg + suffix).slice(0, 1000);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateWithDalle(prompt: string): Promise<string> {
  const resp = await openai.images.generate({
    model: 'dall-e-2',
    prompt: prompt.slice(0, 1000),
    size: '256x256',
    response_format: 'b64_json',
    n: 1,
  });
  const b64 = resp.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data from DALL-E');
  return `data:image/png;base64,${b64}`;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, role, background, personality, gender } = body as {
    name?: string; role?: string; background?: string; personality?: string; gender?: string;
  };

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  // Whitelist check
  if (!LANDING_PAGE_NAMES.has(name)) {
    return NextResponse.json({ error: 'Name not allowed for preview' }, { status: 403 });
  }

  const path = avatarStoragePath(name);
  logger.log('[AvatarPreview] request:', name, 'path:', path);

  // Check Supabase Storage cache first (shared with /api/avatar)
  if (supabaseAdmin) {
    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .download(path);
    if (!downloadError && blob && blob.size > 0) {
      logger.log('[AvatarPreview] cache hit:', path);
      const { data: urlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      return NextResponse.json({ image: urlData.publicUrl });
    }
  }

  // Generate
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Avatar service unavailable' }, { status: 503 });
  }

  try {
    const bg = typeof background === 'string' ? background
      : role ? `Avatar portrait. Role: ${role}. ${personality ?? ''}` : undefined;
    const prompt = buildPrompt(typeof gender === 'string' ? gender : undefined, bg);
    logger.log('[AvatarPreview] generating for:', name);

    const imageDataUrl = await generateWithDalle(prompt);
    const image64 = await resizeAvatarTo64(imageDataUrl);

    // Save to Supabase Storage (shared cache)
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
      } catch (e) {
        logger.warn('[AvatarPreview] Supabase upload failed:', e);
      }
    }

    return NextResponse.json({ image: image64 });
  } catch (e) {
    logger.error('[AvatarPreview] generation error:', e);
    return NextResponse.json({ error: 'Failed to generate avatar' }, { status: 503 });
  }
}
