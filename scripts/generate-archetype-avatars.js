/**
 * Generate Genshin-style avatars for all archetypes x genders.
 *
 * Run:  node scripts/generate-archetype-avatars.js
 * Options:
 *   --dry-run         Print prompts without generating
 *   --archetype=id    Generate only a specific archetype
 *   --start=N         Start from index N (1-based, for resuming)
 *   --concurrency=N   Parallel generation limit (default 2)
 *   --gm              Also generate the RPG GM avatar
 *
 * Requires: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 */
const OpenAI = require('openai');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const OUTPUT_SIZE = 256;
const BUCKET = 'avatars';

const GENSHIN_STYLE =
  'High-quality anime character portrait in the style of Genshin Impact and Honkai Star Rail. ' +
  'Polished cel-shading with soft gradients, luminous skin rendering, highly detailed hair strands with color highlights, ' +
  'elaborate fantasy costume with intricate accessories. ' +
  'Vivid expressive eyes with detailed iris reflections. Dynamic pose with slight wind effect on hair and clothing. ' +
  'Solo character portrait. EXACTLY ONE person only — no second face, no reflections, no mirrors, no split images. ' +
  'Upper body visible from head to chest. Single individual, centered in frame. ' +
  'Face visible, front-facing or slight three-quarter angle. Both eyes clearly shown. One face only. ' +
  'Cinematic lighting with rim light and soft bloom. Fantasy atmosphere background with subtle particle effects. ' +
  'Clean illustrated portrait. Pure visual artwork. No text, no labels, no watermarks.';

const GM_STYLE =
  'High-quality anime character portrait in the style of Genshin Impact. ' +
  'A wise and enigmatic Game Master figure. Flowing dark robes with constellation patterns, ' +
  'a floating open tome in one hand, ethereal glowing eyes, silver-white hair with starlight highlights. ' +
  'Mystical and authoritative presence. Age ambiguous — could be ancient or timeless. ' +
  'Solo character portrait. EXACTLY ONE person only. Upper body visible from head to chest. ' +
  'Face visible, front-facing. Both eyes clearly shown. ' +
  'Deep cosmic background with swirling nebulae and floating runes. ' +
  'Clean illustrated portrait. Pure visual artwork. No text, no labels, no watermarks.';

const ARCHETYPES = [
  { id: "knight", visualTags: "heavy plate armor, longsword, cape, short cropped hair, battle scars", genders: ["male", "female"] },
  { id: "mage", visualTags: "flowing robes, glowing staff, arcane runes, long hair, mystical eyes", genders: ["male", "female"] },
  { id: "rogue", visualTags: "leather armor, hood, twin daggers, belt pouches, shadowed face", genders: ["male", "female"] },
  { id: "cleric", visualTags: "white and gold vestments, holy symbol pendant, healing staff, gentle expression, prayer beads", genders: ["male", "female"] },
  { id: "ranger", visualTags: "green cloak, longbow, quiver, animal companion nearby, nature-worn leather", genders: ["male", "female"] },
  { id: "merchant", visualTags: "fine travel clothes, coin purse, shrewd eyes, jeweled rings", genders: ["male", "female"] },
  { id: "blacksmith", visualTags: "leather apron, muscular arms, forge hammer, soot-covered, burn scars on hands", genders: ["male", "female"] },
  { id: "bard", visualTags: "colorful traveling clothes, lute, feathered hat, expressive face", genders: ["male", "female"] },
  { id: "necromancer", visualTags: "dark robes with bone ornaments, skull staff, pale skin, glowing eyes, ethereal aura", genders: ["male", "female"] },
  { id: "swordmaster", visualTags: "flowing hanfu robes, jian sword, topknot hairstyle, calm expression, jade pendant", genders: ["male", "female"] },
  { id: "poisoner", visualTags: "dark changshan with hidden pockets, bamboo container, mask, sharp calculating eyes", genders: ["male", "female"] },
  { id: "monk", visualTags: "orange kasaya robes, shaved head, prayer beads, powerful fists, serene expression", genders: ["male"] },
  { id: "sect-disciple", visualTags: "sect uniform hanfu, sect emblem badge, training weapon, eager expression", genders: ["male", "female"] },
  { id: "wandering-doctor", visualTags: "plain traveling robes, medicine box on back, herbs and bottles, kind weathered face, bamboo hat", genders: ["male", "female"] },
  { id: "assassin", visualTags: "black tight-fitting clothes, hidden blades, mask covering lower face, cold eyes", genders: ["male", "female"] },
  { id: "innkeeper", visualTags: "practical work clothes, cooking ladle, warm smile, rosy cheeks, apron", genders: ["male", "female"] },
  { id: "scholar", visualTags: "flowing scholar robes, bamboo scroll case, ink-stained fingers, spectacles", genders: ["male", "female"] },
  { id: "beast-tamer", visualTags: "fur-trimmed leather outfit, whip or staff, wild hair, claw-mark scars", genders: ["male", "female"] },
  { id: "prince", visualTags: "faded noble attire, royal signet ring, elegant posture, haunted eyes, concealed dagger", genders: ["male", "female"] },
  { id: "fortune-teller", visualTags: "mystic veils and jewelry, crystal ball, third-eye marking, flowing garments, incense smoke", genders: ["male", "female"] },
];

function buildJobs(filterArchetype) {
  const jobs = [];
  for (const arch of ARCHETYPES) {
    if (filterArchetype && arch.id !== filterArchetype) continue;
    for (const gender of arch.genders) {
      const genderWord = gender === 'male' ? 'Male' : 'Female';
      const prompt = `${genderWord} character. ${arch.visualTags}. ${GENSHIN_STYLE}`;
      jobs.push({
        archetype: arch.id,
        gender,
        prompt,
        storagePath: `pool/archetype/${arch.id}_${gender}.webp`,
      });
    }
  }
  return jobs;
}

async function generateAndUpload(openai, supabase, job, dryRun) {
  const label = `${job.archetype} (${job.gender})`;
  if (dryRun) {
    console.log(`[DRY RUN] ${label}`);
    console.log(`  Prompt: ${job.prompt.slice(0, 120)}...`);
    console.log(`  Path:   ${job.storagePath}`);
    return;
  }

  console.log(`Generating ${label}...`);
  try {
    const result = await openai.images.generate({
      model: 'dall-e-3',
      prompt: job.prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json',
    });

    const b64 = result.data[0]?.b64_json;
    if (!b64) throw new Error('No image data returned');

    const buf = Buffer.from(b64, 'base64');
    const webp = await sharp(buf)
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover', position: 'top' })
      .webp({ quality: 85 })
      .toBuffer();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(job.storagePath, webp, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(job.storagePath);
    console.log(`  ✅ ${label} → ${urlData.publicUrl}`);
  } catch (err) {
    console.error(`  ❌ ${label}: ${err.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const includeGM = args.includes('--gm');
  const concurrency = parseInt(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '2', 10);
  const startIdx = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1] || '1', 10) - 1;
  const filterArchetype = args.find(a => a.startsWith('--archetype='))?.split('=')[1] || null;

  if (!dryRun) {
    if (!process.env.OPENAI_API_KEY) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL'); process.exit(1); }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  }

  const openai = dryRun ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = dryRun ? null : createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  let jobs = buildJobs(filterArchetype);

  if (includeGM) {
    jobs.push({
      archetype: 'gm',
      gender: 'other',
      prompt: GM_STYLE,
      storagePath: 'pool/archetype/gm_chronicle.webp',
    });
  }

  const total = jobs.length;
  jobs = jobs.slice(startIdx);
  console.log(`\n=== Archetype Avatar Generator ===`);
  console.log(`Total jobs: ${total}, starting from: ${startIdx + 1}, concurrency: ${concurrency}`);
  console.log(`Estimated cost: ~$${(jobs.length * 0.04).toFixed(2)} (DALL-E 3 standard)\n`);

  if (dryRun) {
    for (const job of jobs) {
      await generateAndUpload(null, null, job, true);
    }
    console.log(`\n${jobs.length} avatars would be generated.`);
    return;
  }

  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    await Promise.all(batch.map(job => generateAndUpload(openai, supabase, job, false)));
    if (i + concurrency < jobs.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\nDone! Generated ${jobs.length} archetype avatars.`);
}

main().catch(err => { console.error(err); process.exit(1); });
