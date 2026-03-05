import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import OpenAI from 'openai';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { deductTokens, imageGenCostToCoins } from '@/lib/tokens';
import { isDatabaseConfigured } from '@/lib/db-ready';

const GAME_ICON_BUCKET = 'avatars';
const GAME_ICON_SIZE = 128;

/**
 * Storage path: by gameId if provided, else a unique path per request.
 * When no gameId (creation flow), a timestamp nonce ensures each new game
 * gets a distinct icon even if name/template/rules are identical.
 */
function gameIconPath(gameId: string | undefined, gameName: string, gameTemplate?: string, rules?: string): string {
  if (gameId) return `game-icons/${gameId}.png`;
  const payload = JSON.stringify({
    n: String(gameName).slice(0, 200),
    t: gameTemplate || '',
    r: (rules || '').trim().slice(0, 300),
    _nonce: Date.now(),
  });
  const hash = crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
  return `game-icons/${hash}.png`;
}

/** Data URL -> buffer (resized) for Storage upload */
async function dataUrlToIconBuffer(dataUrl: string): Promise<Buffer> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  return sharp(buffer)
    .resize(GAME_ICON_SIZE, GAME_ICON_SIZE)
    .png()
    .toBuffer();
}

// Lazy initialization
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured.' },
        { status: 500 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { gameName, gameTemplate, rules, gameId } = body as {
      gameName?: string;
      gameTemplate?: string;
      rules?: string;
      gameId?: string;
    };

    if (!gameName) {
      return NextResponse.json(
        { error: 'gameName is required' },
        { status: 400 }
      );
    }

    const path = gameIconPath(gameId, gameName, gameTemplate, rules);

    // Check Storage first: return public URL if already exists
    if (supabaseAdmin) {
      const { data: urlData } = supabaseAdmin.storage.from(GAME_ICON_BUCKET).getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      try {
        const head = await fetch(publicUrl, { method: 'HEAD' });
        if (head.ok) {
          return NextResponse.json({ icon: publicUrl });
        }
      } catch (_) {
        // Ignore, continue generating
      }
    }

    const openai = getOpenAI();

    function isDallESafetyRejection(err: any): boolean {
      const msg = (err?.message || err?.error?.message || '').toString().toLowerCase();
      return (
        (err?.status === 400 || err?.status === 415) &&
        (msg.includes('safety') || msg.includes('rejected') || msg.includes('not allowed') || msg.includes('content policy'))
      );
    }

    async function generateWithPrompt(iconPrompt: string): Promise<string> {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: iconPrompt,
        size: '1024x1024',
        response_format: 'b64_json',
        n: 1,
        quality: 'standard',
      });
      const b64 = response.data?.[0]?.b64_json;
      if (!b64) throw new Error('No image data returned from DALL-E 3');
      return `data:image/png;base64,${b64}`;
    }

    const safeSuffix =
      'Flat design, minimal, no text no letters. Single clear motif. Square icon, suitable for app icon.';

    const abstractFallbackPrompt =
      'Abstract geometric app icon, flat design, single vibrant color on dark background, no text, no people, game theme. ' + safeSuffix;

    let iconPrompt: string;
    let imageUrl: string;

    // Deduct tokens before generation (only when we reach this point — cache miss)
    if (isDatabaseConfigured()) {
      try {
        const hasTokens = await deductTokens(
          user.id,
          imageGenCostToCoins('dall-e-3'),
          'image_generation',
          `Generate game icon for "${String(gameName).slice(0, 60)}"`
        );
        if (!hasTokens) {
          return NextResponse.json(
            {
              error: 'Insufficient tokens',
              message: 'You need more tokens to generate icons. Please purchase tokens or upgrade to Pro.',
              code: 'INSUFFICIENT_TOKENS',
            },
            { status: 402 }
          );
        }
      } catch (_tokenErr) {
        // Token table may not exist yet — proceed anyway
      }
    }

    // Step 1: Try to generate a creative concept with GPT (best-effort; if GPT fails for any
    // reason we fall through to a simple name-based prompt so DALL-E can still run).
    let aiConcept = '';
    try {
      const rulesSnippet = (rules || '').trim().slice(0, 400);
      const systemPrompt = `You are an expert at designing app icon concepts for games. Given a game name and optional rules summary, output exactly one short image prompt (1-2 sentences, in English) for DALL-E to draw. Decide yourself: subject (character, object, scene, symbol), style, mood, and colors. Be creative and specific. Do not mention game controller, joystick, or gamepad. Output only the image description, no other text. Keep content safe and family-friendly.`;
      const userPrompt = `Game name: "${String(gameName).slice(0, 100)}".${gameTemplate ? ` Template: ${gameTemplate}.` : ''}${rulesSnippet ? ` Rules summary: ${rulesSnippet}` : ''}\n\nWrite one short DALL-E image prompt that captures this game.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_CHAT_MODEL || 'gpt-5.2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 150,
        temperature: 0.8,
      });
      aiConcept = completion.choices?.[0]?.message?.content?.trim() || '';
    } catch (_conceptErr) {
      // GPT concept generation failed — continue without it
    }

    const basePrompt = aiConcept
      ? `${aiConcept} `
      : `A minimalist app icon representing the game "${String(gameName).slice(0, 60)}". `;
    iconPrompt = basePrompt + safeSuffix;

    // Step 2: Try DALL-E with the generated prompt; fall back to abstract design on safety rejection.
    try {
      imageUrl = await generateWithPrompt(iconPrompt);
    } catch (firstErr: any) {
      if (!isDallESafetyRejection(firstErr)) throw firstErr;
      iconPrompt = abstractFallbackPrompt;
      imageUrl = await generateWithPrompt(abstractFallbackPrompt);
    }

    // Save to Supabase Storage, return public URL
    if (supabaseAdmin) {
      try {
        const buffer = await dataUrlToIconBuffer(imageUrl);
        const { error: uploadError } = await supabaseAdmin.storage
          .from(GAME_ICON_BUCKET)
          .upload(path, buffer, { contentType: 'image/png', upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage.from(GAME_ICON_BUCKET).getPublicUrl(path);
          return NextResponse.json({ icon: urlData.publicUrl, prompt: iconPrompt });
        }
        console.warn('[GameIcon] Storage upload failed:', uploadError.message);
      } catch (e) {
        console.warn('[GameIcon] Storage save failed:', e);
      }
    }

    return NextResponse.json({
      icon: imageUrl,
      prompt: iconPrompt,
    });
  } catch (error: any) {
    console.error('Error generating game icon:', error);

    if (error.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    if (error.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    if (error.status === 400) {
      return NextResponse.json(
        { error: 'Image request was rejected. Try again or use a different game name.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate game icon' },
      { status: 500 }
    );
  }
}
