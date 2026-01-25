/**
 * Generate a fixed anime-style Game Master avatar using OpenAI DALL-E 3.
 *
 * Usage: npx tsx scripts/generate-gm-avatar.ts
 *
 * Requires OPENAI_API_KEY in .env. Writes result to src/lib/game-master-avatar.ts.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import OpenAI from 'openai';

config({ path: resolve(process.cwd(), '.env') });

const ANIME_GM_PROMPT = `Anime/manga style character portrait. Game master host: confident, friendly game show presenter vibe.
Japanese anime art style: large expressive eyes, styled hair in warm amber/orange tones, clean lines, soft shading.
Head and shoulders only, front-facing, neutral background. Single character, one face only. No text, no logos.
Circular crop suitable. Vibrant colors, professional anime illustration quality.`;

async function generateAnimeGMAvatar() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not set in .env');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  try {
    console.log('🎨 Generating anime-style Game Master avatar with DALL-E 3...');
    console.log('📝 Prompt:', ANIME_GM_PROMPT.slice(0, 80) + '...');

    const resp = await openai.images.generate({
      model: 'dall-e-3',
      prompt: ANIME_GM_PROMPT,
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

    const imageDataUrl = `data:image/png;base64,${b64}`;

    const avatarPath = resolve(process.cwd(), 'src/lib/game-master-avatar.ts');
    const content = `/**
 * Fixed anime-style Game Master avatar
 * Used for all Game Masters. Anime/manga aesthetic.
 * Generated: ${new Date().toISOString()}
 */

export const GAME_MASTER_AVATAR = '${imageDataUrl}';
`;

    writeFileSync(avatarPath, content, 'utf-8');

    console.log('✅ Anime GM avatar generated and saved to src/lib/game-master-avatar.ts');
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}

generateAnimeGMAvatar();
