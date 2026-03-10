/**
 * Batch generate 130×4=520 avatar images across 4 style packs.
 * Run: node scripts/generate-avatars.js [style]
 * Styles: semi-realistic | anime | painted | pixel | all (default: all)
 *
 * Progress is saved to /tmp/avatar-gen-progress.json — safe to resume.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const sharp = require('sharp');

// ── Config ──────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  fs.readFileSync('/Users/brookma/Documents/GitHub/GameMaster/.env', 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => {
      const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()];
    })
);
const OPENAI_KEY = env.OPENAI_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = 'avatars';
const PROGRESS_FILE = '/tmp/avatar-gen-progress.json';

// ── Style prompts ────────────────────────────────────────────────────────────
const STYLE_PROMPTS = {
  'semi-realistic': (name, gender, personality, background) => {
    const gStr = gender === 'female' ? 'Woman' : gender === 'male' ? 'Man' : 'Person';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 150);
    return `Semi-realistic digital painting, game concept art style inspired by Arcane and western RPG art. Portrait of ${gStr}: ${traits}. Upper body visible, centered composition, both eyes clearly shown, one person only. Painterly brushstrokes, dramatic warm side lighting, rich color depth, atmospheric tavern or study background with soft bokeh. No text, no watermark, no borders. Suitable for all ages.`;
  },
  'anime': (name, gender, personality, background) => {
    const gStr = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'androgynous';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 120);
    return `Japanese anime illustration style, clean cel-shaded character portrait. ${gStr} character: ${traits}. Upper body, centered, both eyes visible, one character only. Clean outlines, vibrant colors, expressive face, Ghibli-inspired quality, cozy tavern or indoor background. No text, no watermark.`;
  },
  'painted': (name, gender, personality, background) => {
    const gStr = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 120);
    return `Dark Renaissance oil painting portrait style. A ${gStr}: ${traits}. Classical European portrait composition, upper body, dramatic chiaroscuro lighting with single candle, rich warm amber tones, museum-quality realism, Rembrandt-inspired brushwork, dark moody background. One subject only. No text, no watermark.`;
  },
  'pixel': (name, gender, personality, background) => {
    const gStr = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'androgynous';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 100);
    return `16-bit pixel art RPG character portrait. ${gStr} character: ${traits}. Detailed pixel art face and upper body, centered, warm candlelit tavern background, limited warm color palette, retro JRPG style similar to Stardew Valley or Fire Emblem GBA. One character only. No text, no watermark.`;
  },
};

const ALL_STYLES = Object.keys(STYLE_PROMPTS);

// ── Helpers ──────────────────────────────────────────────────────────────────
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

function openaiRequest(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error(body.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); }
  catch { return {}; }
}
function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function generateOne(char, style) {
  const { id, name, gender, personality, background, voice_id } = char;
  const prompt = STYLE_PROMPTS[style](name, gender, personality, background);
  const storagePath = `pool/${style}/${voice_id}.jpg`;

  // Generate image
  const resp = await openaiRequest({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'medium',
    output_format: 'png',
  });

  if (resp.error) throw new Error(resp.error.message || JSON.stringify(resp.error));

  // Get image bytes (b64 or url)
  let rawBytes;
  const item = resp.data?.[0];
  if (item?.b64_json) {
    rawBytes = Buffer.from(item.b64_json, 'base64');
  } else if (item?.url) {
    rawBytes = await httpsGet(item.url);
  } else {
    throw new Error('No image data in response: ' + JSON.stringify(resp).slice(0, 200));
  }

  // Resize + compress to JPEG to stay under 512KB Supabase limit
  const imgBytes = await sharp(rawBytes)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  // Upload to Supabase Storage (as JPEG)
  const jpegPath = storagePath.replace('.png', '.jpg');
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(jpegPath, imgBytes, { contentType: 'image/jpeg', upsert: true });
  if (uploadErr) throw new Error('Upload: ' + uploadErr.message);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(jpegPath);
  const publicUrl = urlData.publicUrl;

  // Merge new style URL into avatar_styles JSONB
  const { data: existing } = await supabase
    .from('ai_characters').select('avatar_styles, avatar_url').eq('id', id).single();
  const styles = { ...(existing?.avatar_styles || {}), [style]: publicUrl };
  // avatar_url = semi-realistic by default, fallback to first available
  const avatarUrl = styles['semi-realistic'] || publicUrl;
  await supabase.from('ai_characters')
    .update({ avatar_styles: styles, avatar_url: avatarUrl })
    .eq('id', id);

  return publicUrl;
}

async function main() {
  const targetStyles = process.argv[2] && process.argv[2] !== 'all'
    ? [process.argv[2]] : ALL_STYLES;

  console.log(`\n🎨 Generating avatars for styles: ${targetStyles.join(', ')}`);

  // Fetch all 130 system characters
  const { data: chars, error } = await supabase
    .from('ai_characters')
    .select('id, name, gender, personality, background, voice_id')
    .eq('is_system', true)
    .order('created_at', { ascending: true });

  if (error) { console.error('DB error:', error); process.exit(1); }
  console.log(`Found ${chars.length} characters\n`);

  const progress = loadProgress();
  let generated = 0, skipped = 0, failed = 0;

  for (const style of targetStyles) {
    console.log(`\n━━━ Style: ${style.toUpperCase()} ━━━`);
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const key = `${style}:${char.id}`;

      if (progress[key] === 'done') {
        process.stdout.write('·');
        skipped++;
        continue;
      }

      process.stdout.write(`\n[${style}][${i+1}/${chars.length}] ${char.name} (${char.gender})... `);

      let attempts = 0;
      while (attempts < 3) {
        try {
          const url = await generateOne(char, style);
          progress[key] = 'done';
          saveProgress(progress);
          process.stdout.write(`✓`);
          generated++;
          break;
        } catch (e) {
          attempts++;
          const msg = e.message || String(e);
          if (msg.includes('rate_limit') || msg.includes('429')) {
            process.stdout.write(` [rate limit, wait 30s]`);
            await sleep(30000);
          } else if (attempts < 3) {
            process.stdout.write(` [err: ${msg.slice(0,40)}, retry ${attempts}]`);
            await sleep(5000);
          } else {
            process.stdout.write(` ✗ FAILED: ${msg.slice(0,60)}`);
            failed++;
          }
        }
      }

      // Throttle: ~4 req/min to stay well within limits
      await sleep(15000);
    }
  }

  console.log(`\n\n✅ Done! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log(`Progress saved to ${PROGRESS_FILE}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
