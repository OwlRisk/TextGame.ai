import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Replicate from 'replicate';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const replicate = process.env.REPLICATE_API_TOKEN
  ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  : null;

type AvatarType = 'host' | 'player';
type AvatarModel = 'dalle-3' | 'flux' | 'stable-diffusion';

/** Get the model to use from env, default to dalle-3 */
function getModel(): AvatarModel {
  const envModel = process.env.AVATAR_GENERATION_MODEL?.toLowerCase();
  if (envModel === 'flux' || envModel === 'stable-diffusion') {
    return envModel;
  }
  return 'dalle-3';
}

/** Strict rule: single person only, no multiple faces */
const SINGLE_PERSON =
  'CRITICAL: One person only. Single face. No group photo. No multiple people or faces. ' +
  'One head and shoulders portrait only.';

/** Universal anime/manga style for all avatars */
const ANIME_STYLE =
  'Anime/manga art style. Japanese animation aesthetic. ' +
  'Colorful hair, expressive large eyes, clean line art. ' +
  'Vibrant colors, soft shading, anime illustration quality. ' +
  'Head and shoulders portrait, circular crop suitable. ' +
  'Single character only, no background details. ' +
  SINGLE_PERSON;

/** Style for Game Master / Host - anime style */
const HOST_STYLE =
  'Anime/manga style game master host. ' +
  'Confident, professional presenter vibe. ' +
  'Colorful hair, expressive eyes, game show host aesthetic. ' +
  ANIME_STYLE;

/** Style for players - anime style */
const PLAYER_STYLE =
  'Anime/manga style character portrait. ' +
  'Japanese animation art style. ' +
  'Colorful hair, expressive large eyes, unique design. ' +
  'Diverse anime character appearance. ' +
  ANIME_STYLE;

function buildPrompt(
  _name: string,
  type: AvatarType,
  opts: { background?: string }
): string {
  const { background } = opts;

  if (!background || !background.trim()) {
    return type === 'host'
      ? `Anime/manga style game master host character. ${HOST_STYLE}`
      : `Anime/manga style game player character. ${PLAYER_STYLE}`;
  }

  if (type === 'host') {
    return `Anime/manga style game master host character. Background: ${background.trim()}. ${HOST_STYLE}`;
  }

  return `Anime/manga style game player character. Background: ${background.trim()}. ${PLAYER_STYLE}`;
}

async function generateWithDalle3(prompt: string): Promise<string> {
  const resp = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
    response_format: 'b64_json',
    n: 1,
  });

  const b64 = resp.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('No image data returned from DALL-E 3');
  }

  return `data:image/png;base64,${b64}`;
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

  if (model === 'flux') {
    // FLUX.1 [dev] - high quality, realistic
    modelId = 'black-forest-labs/flux-dev' as const;
    input = {
      prompt,
      aspect_ratio: '1:1',
      output_format: 'png',
      output_quality: 90,
    };
  } else {
    // Stable Diffusion XL - good for portraits
    modelId = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b' as const;
    input = {
      prompt,
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
  try {
    const body = await request.json();
    const {
      name,
      type = 'player',
      role,
      background,
      personality,
    } = body as {
      name?: string;
      type?: AvatarType;
      role?: string;
      background?: string;
      personality?: string;
    };

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name (string) is required' },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(name, type ?? 'player', {
      background: typeof background === 'string' ? background : undefined,
    });

    const model = getModel();
    let imageDataUrl: string;

    try {
      if (model === 'dalle-3') {
        imageDataUrl = await generateWithDalle3(prompt);
      } else if (model === 'flux' || model === 'stable-diffusion') {
        imageDataUrl = await generateWithReplicate(prompt, model);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    } catch (error: any) {
      console.error(`Error generating with ${model}:`, error);
      // Fallback to DALL-E 3 if other models fail
      if (model !== 'dalle-3') {
        console.log('Falling back to DALL-E 3...');
        try {
          imageDataUrl = await generateWithDalle3(prompt);
        } catch (fallbackError: any) {
          throw new Error(
            `Primary model (${model}) and fallback (dalle-3) both failed: ${fallbackError.message}`
          );
        }
      } else {
        throw error;
      }
    }

    return NextResponse.json({ image: imageDataUrl });
  } catch (e: unknown) {
    console.error('Avatar generation error:', e);
    const err = e as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message ?? 'Failed to generate avatar' },
      { status: err.status ?? 500 }
    );
  }
}
