/**
 * One-time script: generate a pool of 60 high-quality DALL-E 3 anime avatars
 * (30 male + 30 female) and upload to Supabase Storage.
 *
 * Run:  node scripts/generate-avatar-pool.js
 * Cost: ~60 x $0.04 = $2.40 (DALL-E 3 standard 1024x1024)
 *
 * Requires: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 *
 * Options:
 *   --dry-run         Print prompts without generating
 *   --gender=male     Generate only male avatars
 *   --gender=female   Generate only female avatars
 *   --start=N         Start from index N (1-based, for resuming after failures)
 *   --concurrency=N   Parallel generation limit (default 3)
 */
const OpenAI = require('openai');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const POOL_SIZE = 30;
const OUTPUT_SIZE = 256;
const BUCKET = 'avatars';

const SHARED_STYLE =
  'Anime illustration style. Vibrant colors, expressive large eyes, clean line art, soft shading. ' +
  'Solo character portrait. One person only. Upper body visible from head to chest. ' +
  'Face visible, front-facing or slight three-quarter angle. Both eyes clearly shown. ' +
  'Cheerful, friendly, wholesome appearance. Cute, charming anime style. Suitable for all ages. Game avatar. ' +
  'Clean illustrated portrait. Pure visual artwork.';

const MALE_VARIANTS = [
  { hair: 'short black hair', extra: 'confident smile, wearing a casual jacket' },
  { hair: 'spiky brown hair', extra: 'energetic expression, red scarf' },
  { hair: 'neat blonde hair', extra: 'calm and collected, glasses' },
  { hair: 'messy silver hair', extra: 'mysterious aura, dark coat' },
  { hair: 'short red hair with freckles', extra: 'cheerful grin, green eyes' },
  { hair: 'long dark blue hair in ponytail', extra: 'serious gaze, martial arts outfit' },
  { hair: 'curly auburn hair', extra: 'warm smile, turtleneck sweater' },
  { hair: 'undercut purple hair', extra: 'cool expression, headphones around neck' },
  { hair: 'slicked back green hair', extra: 'sly smirk, formal vest' },
  { hair: 'fluffy white hair', extra: 'gentle expression, blue eyes, winter scarf' },
  { hair: 'short teal hair', extra: 'playful wink, sporty outfit' },
  { hair: 'wavy golden hair', extra: 'princely demeanor, ornate collar' },
  { hair: 'buzz cut dark hair', extra: 'determined look, military-style jacket' },
  { hair: 'medium-length pink hair', extra: 'soft smile, artistic beret' },
  { hair: 'straight black hair with bangs', extra: 'contemplative look, hoodie' },
  { hair: 'wild orange hair', extra: 'mischievous grin, bandana' },
  { hair: 'short lavender hair', extra: 'elegant posture, cravat tie' },
  { hair: 'mohawk-style crimson hair', extra: 'bold expression, leather jacket' },
  { hair: 'long braided brown hair', extra: 'wise eyes, travel cloak' },
  { hair: 'neat navy hair parted to side', extra: 'studious look, round glasses' },
  { hair: 'shaggy mint green hair', extra: 'lazy smile, oversized cardigan' },
  { hair: 'short copper hair', extra: 'freckled cheeks, adventurous spirit, goggles on forehead' },
  { hair: 'slick dark hair', extra: 'sharp eyes, business suit, confident' },
  { hair: 'fluffy peach-colored hair', extra: 'shy expression, cat-ear headband' },
  { hair: 'medium grey hair', extra: 'stoic face, cyberpunk visor' },
  { hair: 'curly dark green hair', extra: 'happy expression, chef hat' },
  { hair: 'short sandy blonde hair', extra: 'surfer vibe, tan skin, open shirt' },
  { hair: 'twin-toned black and white hair', extra: 'mysterious, heterochromia eyes' },
  { hair: 'thick dark brown hair', extra: 'friendly face, plaid flannel shirt' },
  { hair: 'spiky ice-blue hair', extra: 'focused look, futuristic earpiece' },
];

const FEMALE_VARIANTS = [
  { hair: 'long flowing black hair', extra: 'gentle smile, traditional hairpin' },
  { hair: 'short pink bob', extra: 'energetic smile, star-shaped earrings' },
  { hair: 'wavy blonde hair', extra: 'elegant posture, pearl necklace' },
  { hair: 'twin tails purple hair', extra: 'playful expression, ribbon bows' },
  { hair: 'shoulder-length red hair', extra: 'determined eyes, denim jacket' },
  { hair: 'long silver hair', extra: 'serene expression, moon-themed accessories' },
  { hair: 'short teal pixie cut', extra: 'confident wink, choker necklace' },
  { hair: 'curly brown hair', extra: 'warm laugh, flower crown' },
  { hair: 'straight dark blue hair with bangs', extra: 'serious look, military cap' },
  { hair: 'messy orange hair', extra: 'adventurous grin, goggles' },
  { hair: 'long braided green hair', extra: 'nature-loving, leaf earrings' },
  { hair: 'sleek white hair in high ponytail', extra: 'cool demeanor, futuristic outfit' },
  { hair: 'fluffy lavender hair', extra: 'dreamy expression, butterfly hairclip' },
  { hair: 'short golden blonde hair', extra: 'sporty, headband, confident smile' },
  { hair: 'long wine-red hair', extra: 'mysterious aura, dark lipstick, gothic choker' },
  { hair: 'twin buns pastel pink hair', extra: 'cute smile, cat-themed accessories' },
  { hair: 'asymmetric cyan hair', extra: 'edgy look, one-side undercut, piercing' },
  { hair: 'wavy dark brown hair', extra: 'intellectual vibe, round glasses, cozy sweater' },
  { hair: 'long straight pink hair', extra: 'idol-style, microphone, sparkly outfit' },
  { hair: 'short auburn hair', extra: 'tomboyish charm, baseball cap backwards' },
  { hair: 'thick curly magenta hair', extra: 'bold personality, hoop earrings' },
  { hair: 'long cream-colored hair', extra: 'ethereal beauty, feather accessories' },
  { hair: 'short mint green hair', extra: 'nerdy cute, oversized glasses, lab coat' },
  { hair: 'wavy coral-colored hair', extra: 'beach vibe, seashell necklace, tan skin' },
  { hair: 'straight jet-black hair', extra: 'elegant traditional look, jade hairpin' },
  { hair: 'medium copper hair', extra: 'freckled face, warm smile, scarf' },
  { hair: 'long gradient blue-to-purple hair', extra: 'magical girl vibe, star wand' },
  { hair: 'short lilac hair', extra: 'quiet bookworm, reading glasses, gentle eyes' },
  { hair: 'double braids honey-blonde hair', extra: 'country charm, straw hat' },
  { hair: 'wild rose-gold hair', extra: 'fierce expression, sword hilt visible, warrior' },
];

function buildPrompt(gender, variant) {
  return `Anime character portrait. ${gender === 'male' ? 'Male' : 'Female'} character. ${variant.hair}, ${variant.extra}. ${SHARED_STYLE}`;
}

function poolPath(gender, index) {
  const padded = String(index).padStart(3, '0');
  return `pool/${gender}/${padded}.png`;
}

async function generateOne(openai, prompt) {
  const resp = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    response_format: 'b64_json',
    n: 1,
    quality: 'standard',
  });
  const b64 = resp.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data returned');
  const buffer = Buffer.from(b64, 'base64');
  return sharp(buffer).resize(OUTPUT_SIZE, OUTPUT_SIZE).png({ compressionLevel: 9, palette: true }).toBuffer();
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const genderArg = args.find(a => a.startsWith('--gender='))?.split('=')[1];
  const startArg = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1] || '1', 10);
  const concurrency = parseInt(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '3', 10);

  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let supabase = null;
  if (supabaseUrl && serviceKey) {
    supabase = createClient(supabaseUrl, serviceKey);
  } else {
    console.warn('Supabase not configured — will skip upload');
  }

  const genders = genderArg ? [genderArg] : ['male', 'female'];
  const variants = { male: MALE_VARIANTS, female: FEMALE_VARIANTS };
  const manifest = { generated: new Date().toISOString(), pool: {} };

  for (const gender of genders) {
    const items = variants[gender];
    if (!items) { console.error(`Unknown gender: ${gender}`); continue; }

    console.log(`\n=== Generating ${gender} avatars (${items.length}) ===\n`);
    manifest.pool[gender] = [];

    const queue = items
      .map((v, i) => ({ variant: v, index: i + 1 }))
      .filter(({ index }) => index >= startArg);

    // Process in batches for controlled concurrency
    for (let i = 0; i < queue.length; i += concurrency) {
      const batch = queue.slice(i, i + concurrency);
      await Promise.all(batch.map(async ({ variant, index }) => {
        const prompt = buildPrompt(gender, variant);
        const storagePath = poolPath(gender, index);

        if (dryRun) {
          console.log(`[${gender} ${index}/${items.length}] ${storagePath}`);
          console.log(`  Prompt: ${prompt.slice(0, 120)}...`);
          manifest.pool[gender].push({ index, path: storagePath, prompt });
          return;
        }

        // Check if already exists
        if (supabase) {
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
          try {
            const head = await fetch(urlData.publicUrl, { method: 'HEAD' });
            if (head.ok) {
              console.log(`[${gender} ${index}/${items.length}] Already exists, skipping: ${storagePath}`);
              manifest.pool[gender].push({ index, path: storagePath, prompt, skipped: true });
              return;
            }
          } catch (_) { /* continue to generate */ }
        }

        console.log(`[${gender} ${index}/${items.length}] Generating...`);
        try {
          const buffer = await generateOne(openai, prompt);
          console.log(`[${gender} ${index}/${items.length}] Generated (${buffer.length} bytes), uploading...`);

          if (supabase) {
            const { error } = await supabase.storage
              .from(BUCKET)
              .upload(storagePath, buffer, { contentType: 'image/png', upsert: true });
            if (error) {
              console.error(`[${gender} ${index}] Upload failed: ${error.message}`);
            } else {
              console.log(`[${gender} ${index}/${items.length}] Uploaded: ${storagePath}`);
            }
          }
          manifest.pool[gender].push({ index, path: storagePath, prompt });
        } catch (err) {
          console.error(`[${gender} ${index}] Generation failed: ${err.message}`);
          manifest.pool[gender].push({ index, path: storagePath, prompt, error: err.message });
        }
      }));
    }
  }

  // Upload manifest
  if (supabase && !dryRun) {
    const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2));
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload('pool/manifest.json', manifestBuffer, { contentType: 'application/json', upsert: true });
    if (error) {
      console.error('Manifest upload failed:', error.message);
    } else {
      console.log('\nManifest uploaded to pool/manifest.json');
    }
  }

  console.log(`\nDone. Generated ${Object.values(manifest.pool).flat().length} avatars.`);
  if (dryRun) console.log('(dry-run — no images were generated)');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
