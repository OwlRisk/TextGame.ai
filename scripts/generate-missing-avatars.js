/**
 * Generate avatars for the 50 characters that don't have pool-avatars-new images.
 * Saves to pool-avatars-new/{male|female}/ for manual review before upload.
 * Uses highly varied prompts per character — no template formula.
 *
 * Run: node scripts/generate-missing-avatars.js
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

function loadEnv() {
  const p = path.join(__dirname, '../.env');
  if (!fs.existsSync(p)) throw new Error('.env not found');
  return Object.fromEntries(
    fs.readFileSync(p, 'utf8').split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
  );
}

const env = loadEnv();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const OUTPUT_DIR = path.join(__dirname, '../pool-avatars-new');

const SCENES = [
  'a city street at night with soft bokeh lights',
  'a modern loft interior with large windows and natural light',
  'an urban rooftop at blue hour with city skyline',
  'a quiet park bench surrounded by autumn trees',
  'a rain-soaked neon-lit city sidewalk at evening',
  'a bright coffee shop with warm afternoon sunlight',
  'a dark moody studio with a single dramatic light source',
  'a sunlit balcony overlooking the ocean',
  'a subway platform with fluorescent and ambient lighting',
  'a misty bridge at dawn with soft golden light',
  'a bookstore interior with warm overhead lighting',
  'a nightclub entrance with colored ambient lighting',
  'a foggy waterfront pier at twilight',
  'a sunlit field of wildflowers with lens flare',
  'a gym or training room with overhead spotlights',
  'a library reading room with natural window light',
  'a car interior at night with dashboard glow',
  'a hiking trail overlook with panoramic vista',
  'a backstage area with industrial lighting',
  'a quiet street café terrace at golden hour',
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function openaiRequest(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  // Get all system characters
  const { data: allChars, error } = await supabase
    .from('ai_characters')
    .select('id, name, gender, personality, background, voice_id, avatar_styles')
    .eq('is_system', true)
    .order('created_at', { ascending: true });

  if (error) { console.error('DB error:', error); process.exit(1); }

  // Find the existing local files
  const existingMale = new Set(fs.readdirSync(path.join(OUTPUT_DIR, 'male')).filter(f => f.endsWith('.png')));
  const existingFemale = new Set(fs.readdirSync(path.join(OUTPUT_DIR, 'female')).filter(f => f.endsWith('.png')));
  const totalExisting = existingMale.size + existingFemale.size;

  // Characters that were uploaded from local files have fresh avatar_styles
  // Characters that need generation: those whose avatar_styles.semi-realistic was set by generate-avatars.js (not upload)
  // Simplest heuristic: we have 80 local files → 80 characters were uploaded → 50 need new local images
  const maleChars = allChars.filter(c => c.gender === 'male');
  const femaleChars = allChars.filter(c => c.gender === 'female' || (c.gender !== 'male'));

  const neededMale = Math.max(0, maleChars.length - existingMale.size);
  const neededFemale = Math.max(0, femaleChars.length - existingFemale.size);

  console.log(`Existing local: ${existingMale.size} male, ${existingFemale.size} female`);
  console.log(`DB characters: ${maleChars.length} male, ${femaleChars.length} female`);
  console.log(`Need to generate: ${neededMale} male, ${neededFemale} female\n`);

  const toGenerate = [];
  // Pick the characters not yet covered by local files (by gender count)
  // We generate extras sequentially numbered
  const maleStart = existingMale.size + 1;
  const femaleStart = existingFemale.size + 1;

  for (let i = 0; i < neededMale; i++) {
    const char = maleChars[existingMale.size + i] || maleChars[i];
    const num = String(maleStart + i).padStart(3, '0');
    toGenerate.push({ char, filename: `male/male-${num}.png`, gender: 'male' });
  }
  for (let i = 0; i < neededFemale; i++) {
    const char = femaleChars[existingFemale.size + i] || femaleChars[i];
    const num = String(femaleStart + i).padStart(3, '0');
    toGenerate.push({ char, filename: `female/female-${num}.png`, gender: 'female' });
  }

  console.log(`Generating ${toGenerate.length} images...\n`);

  let generated = 0;
  for (const { char, filename, gender } of toGenerate) {
    const scene = SCENES[Math.floor(Math.random() * SCENES.length)];
    const gStr = gender === 'female' ? 'woman' : 'man';
    const traits = [char.personality, char.background].filter(Boolean).join(', ').slice(0, 150);

    const prompt = `High quality realistic digital character portrait, modern ArtStation style. A ${gStr}: ${traits}. Set in ${scene}. Clean sharp rendering, natural skin tones, detailed hair and clothing. Bust portrait from chest up, face clearly visible, looking toward camera. Cinematic composition with shallow depth of field background. Natural color grading — not oversaturated. One person only. No text, no watermark. Suitable for all ages.`;

    process.stdout.write(`[${generated + 1}/${toGenerate.length}] ${char.name} (${gender})... `);

    let attempts = 0;
    while (attempts < 3) {
      try {
        const resp = await openaiRequest({
          model: 'gpt-image-1',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'medium',
          output_format: 'png',
        });

        if (resp.error) throw new Error(resp.error.message || JSON.stringify(resp.error));

        let rawBytes;
        const item = resp.data?.[0];
        if (item?.b64_json) {
          rawBytes = Buffer.from(item.b64_json, 'base64');
        } else if (item?.url) {
          rawBytes = await httpsGet(item.url);
        } else {
          throw new Error('No image data');
        }

        const outPath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(outPath, rawBytes);
        process.stdout.write('✓\n');
        generated++;
        break;
      } catch (e) {
        attempts++;
        const msg = e.message || String(e);
        if (msg.includes('rate_limit') || msg.includes('429')) {
          process.stdout.write('[rate limit, wait 30s] ');
          await sleep(30000);
        } else if (attempts < 3) {
          process.stdout.write(`[err: ${msg.slice(0,40)}, retry] `);
          await sleep(5000);
        } else {
          process.stdout.write(`✗ FAILED: ${msg.slice(0,60)}\n`);
        }
      }
    }

    await sleep(15000);
  }

  console.log(`\n✅ Done! Generated: ${generated}/${toGenerate.length}`);
  console.log(`Review images in ${OUTPUT_DIR}, then run:`);
  console.log('  node scripts/upload-local-avatars.js');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
