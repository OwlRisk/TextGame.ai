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
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const sharp = require('sharp');

// ── Config ──────────────────────────────────────────────────────────────────
const ENV_CANDIDATES = [
  path.join(__dirname, '../.env'),
  '/Users/brookma/Documents/GitHub/GameMaster/.env',
];
const envFile = ENV_CANDIDATES.find(p => fs.existsSync(p));
if (!envFile) throw new Error('No .env found. Tried:\n' + ENV_CANDIDATES.join('\n'));
const env = Object.fromEntries(
  fs.readFileSync(envFile, 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => {
      const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()];
    })
);
const OPENAI_KEY = env.OPENAI_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = 'avatars';
const PROGRESS_FILE = '/tmp/avatar-gen-progress.json';

// ── langCode → nationality label ─────────────────────────────────────────────
const LANG_TO_NATIONALITY = {
  EN_US: 'American', EN_GB: 'British', EN_AU: 'Australian', EN_CA: 'Canadian',
  ZH_CN: 'Chinese', ZH_TW: 'Taiwanese', JA_JP: 'Japanese', KO_KR: 'Korean',
  FR_FR: 'French', DE_DE: 'German', IT_IT: 'Italian', ES_ES: 'Spanish',
  PT_BR: 'Brazilian', PT_PT: 'Portuguese', RU_RU: 'Russian', PL_PL: 'Polish',
  NL_NL: 'Dutch', HI_IN: 'Indian', AR_SA: 'Arab', HE_IL: 'Israeli',
  TR_TR: 'Turkish', SV_SE: 'Swedish', NO_NO: 'Norwegian', DA_DK: 'Danish',
  FI_FI: 'Finnish', CS_CZ: 'Czech', HU_HU: 'Hungarian', RO_RO: 'Romanian',
};

const AGE_GROUP_LABEL = {
  young: 'young (20s)',
  middle_aged: 'middle-aged (35–50)',
  elderly: 'elderly (60s+)',
};

// ── Style prompts ────────────────────────────────────────────────────────────
const STYLE_PROMPTS = {
  'semi-realistic': (name, gender, personality, background) => {
    const gStr = gender === 'female' ? 'Woman' : gender === 'male' ? 'Man' : 'Person';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 150);
    const bgs = [
      'atmospheric tavern interior with warm candlelight',
      'dimly lit stone corridor with flickering torches',
      'moonlit forest clearing with mist',
      'busy market street at golden hour',
      'grand library with towering bookshelves',
      'rain-soaked city rooftop at dusk',
      'cozy firelit cabin interior',
      'ancient temple ruins overgrown with vines',
      'snowy mountain pass at dawn',
      'harbor docks at sunset with ships',
      'underground workshop with glowing forges',
      'starlit desert camp with lanterns',
      'royal court hall with stained glass',
      'dark alleyway with neon-like magical signs',
      'floating island garden above clouds',
    ];
    const lightings = [
      'dramatic warm side lighting',
      'cool blue rim lighting with amber fill',
      'overhead golden hour glow',
      'moody chiaroscuro with single light source',
      'soft diffused twilight',
      'backlit with warm halo edge light',
      'campfire-style bottom-up warm glow',
    ];
    const bg = bgs[Math.floor(Math.random() * bgs.length)];
    const light = lightings[Math.floor(Math.random() * lightings.length)];
    return `Semi-realistic digital painting, game concept art style inspired by Arcane and western RPG art. Portrait of ${gStr}: ${traits}. Close-up bust portrait, face and shoulders filling the upper two-thirds of the frame, both eyes clearly shown, one person only. Painterly brushstrokes, ${light}, rich color depth, ${bg} with soft bokeh. No text, no watermark, no borders. Suitable for all ages.`;
  },
  'anime': (name, gender, personality, background) => {
    const gStr = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'androgynous';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 120);
    return `High-quality Japanese mobile game character portrait illustration. ${gStr} character: ${traits}. Style inspired by Fate/Grand Order and Blue Archive — polished cel-shading, fine linework, detailed hair and costume, vivid expressive eyes. Close-up bust portrait, face and shoulders filling the upper two-thirds of the frame. Soft gradient background. Both eyes clearly visible, one character only. No text, no watermark.`;
  },
  'painted': (name, gender, personality, background) => {
    const gStr = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 120);
    return `Dark Renaissance oil painting portrait style. A ${gStr}: ${traits}. Close-up bust portrait, face and shoulders filling the upper two-thirds of the frame. Dramatic chiaroscuro lighting with single candle, rich warm amber tones, museum-quality realism, Rembrandt-inspired brushwork, dark moody background. One subject only. No text, no watermark.`;
  },
  'pixel': (name, gender, personality, background) => {
    const gStr = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'androgynous';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 100);
    return `16-bit pixel art RPG character portrait. ${gStr} character: ${traits}. Close-up face and shoulders filling most of the frame, detailed pixel art, warm candlelit tavern background, limited warm color palette, retro JRPG style similar to Stardew Valley or Fire Emblem GBA. One character only. No text, no watermark.`;
  },
  'cyberpunk': (name, gender, personality, background) => {
    const gStr = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'androgynous';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 120);
    return `Japanese cyberpunk anime character portrait, inspired by Danganronpa and Promare / Trigger animation studio. ${gStr} character: ${traits}. Bold ultra-thick black outlines with flat cel-shading. Close-up bust portrait, face and shoulders filling the upper two-thirds of the frame. Background: deep black with a bright yellow circular halo glowing behind the head; scattered neon graphic elements including hearts, diamonds, triangles, mechanical circuit parts, and abstract symbols in electric pink, cyan, orange, and lime green — arranged dynamically around the character. Dark heavy vignette border framing the whole image. High contrast, vivid neon accents on dark base. One character only. Suitable for all ages. No text, no watermarks.`;
  },
  'toon3d': (name, gender, personality, background, inworldData) => {
    const gStr = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 200);
    const nationality = inworldData?.langCode ? (LANG_TO_NATIONALITY[inworldData.langCode] || null) : null;
    const ageLabel = inworldData?.ageGroup ? (AGE_GROUP_LABEL[inworldData.ageGroup] || null) : null;
    const nationalityStr = nationality ? `Nationality: ${nationality}.` : `Use the name "${name}" to infer likely ethnicity.`;
    const ageStr = ageLabel ? `Age: ${ageLabel}.` : '';
    return `3D animated feature film character portrait, vibrant CGI render. A ${gStr}. ${nationalityStr} ${ageStr} ${traits}. Large expressive eyes with bright subtle catchlights, perfectly smooth luminous skin with natural healthy warmth, genuine expression that matches the character's personality and occupation. Tight head-and-shoulders portrait, face centered and filling approximately 60% of the frame height, subject looking toward camera. Soft warm cinematic lighting with gentle bokeh background. High-quality 3D animation studio render — bright, vibrant, full of personality. One character only. No text, no watermark. Suitable for all ages.`;
  },
  'valorant': (name, gender, personality, background, inworldData) => {
    const gStr = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
    const traits = [personality, background].filter(Boolean).join(' ').slice(0, 180);
    const nationality = inworldData?.langCode ? (LANG_TO_NATIONALITY[inworldData.langCode] || null) : null;
    const ageLabel = inworldData?.ageGroup ? (AGE_GROUP_LABEL[inworldData.ageGroup] || null) : null;
    const nationalityStr = nationality ? `Nationality: ${nationality}.` : `Use the name "${name}" to infer likely ethnicity.`;
    const ageStr = ageLabel ? `Age: ${ageLabel}.` : '';
    return `Clean semi-realistic digital illustration, Valorant / Riot Games concept art style. Portrait of a ${gStr}. ${nationalityStr} ${ageStr} ${traits}. Sharp confident linework with subtle cel-shading, bold silhouette, strong facial features. Saturated but grounded color palette — not neon. Matte skin rendering with minimal specular highlights, clearly defined eyes and hair with crisp edges. Close-up bust portrait, face and shoulders filling approximately 60% of the frame, subject looking toward camera with a composed expression. Solid desaturated color or soft radial gradient background. Clean composition, strong graphic design sensibility. One character only. No text, no watermark, no borders. Suitable for all ages.`;
  },
};

const ALL_STYLES = Object.keys(STYLE_PROMPTS);

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Normalize voice_id to ASCII-safe filename (strip accents, replace special chars). */
function safeFilename(voiceId) {
  return voiceId
    .normalize('NFD')                  // decompose accented chars: é → e + ́
    .replace(/[\u0300-\u036f]/g, '')   // strip combining diacritics
    .replace(/[^a-zA-Z0-9_-]/g, '_'); // replace any remaining non-ASCII with _
}

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

// Use style-specific progress files so parallel runs don't conflict
function progressFile(style) {
  return style ? `/tmp/avatar-gen-progress-${style}.json` : PROGRESS_FILE;
}
function loadProgress(style) {
  try { return JSON.parse(fs.readFileSync(progressFile(style), 'utf8')); }
  catch { return {}; }
}
function saveProgress(p, style) {
  fs.writeFileSync(progressFile(style), JSON.stringify(p, null, 2));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function generateOne(char, style, inworldMap) {
  const { id, name, gender, personality, background, voice_id } = char;
  const inworldData = inworldMap?.[voice_id] || null;
  const prompt = STYLE_PROMPTS[style](name, gender, personality, background, inworldData);
  const storagePath = `pool/${style}/${safeFilename(voice_id)}.jpg`;

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

  // ── Compressed version: 512×512 JPEG (for in-game use, stays under 512KB) ──
  // Use position 'top' so face (upper portion of portrait) is always preserved.
  const imgBytes = await sharp(rawBytes)
    .resize(512, 512, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  // ── HD version: 1024×1024 JPEG quality 92 (for future character library) ──
  const hdBytes = await sharp(rawBytes)
    .resize(1024, 1024, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 92 })
    .toBuffer();

  // Upload compressed version
  const jpegPath = storagePath.replace('.png', '.jpg');
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(jpegPath, imgBytes, { contentType: 'image/jpeg', upsert: true });
  if (uploadErr) throw new Error('Upload (compressed): ' + uploadErr.message);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(jpegPath);
  const publicUrl = urlData.publicUrl;

  // Upload HD version to pool/hd/{style}/{voice_id}.jpg
  const hdPath = `pool/hd/${style}/${safeFilename(voice_id)}.jpg`;
  const { error: hdUploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(hdPath, hdBytes, { contentType: 'image/jpeg', upsert: true });
  if (hdUploadErr) {
    console.warn(`  [HD upload warn] ${hdUploadErr.message}`);
  }
  const { data: hdUrlData } = supabase.storage.from(BUCKET).getPublicUrl(hdPath);
  const hdPublicUrl = hdUrlData.publicUrl;

  // Merge new style URL (and HD URL) into avatar_styles JSONB
  const { data: existing } = await supabase
    .from('ai_characters').select('avatar_styles, avatar_url').eq('id', id).single();
  const styles = {
    ...(existing?.avatar_styles || {}),
    [style]: publicUrl,
    [`${style}_hd`]: hdPublicUrl,  // high-res backup for future use
  };
  // avatar_url = semi-realistic by default, fallback to first available
  const avatarUrl = styles['semi-realistic'] || publicUrl;
  await supabase.from('ai_characters')
    .update({ avatar_styles: styles, avatar_url: avatarUrl })
    .eq('id', id);

  return publicUrl;
}

async function fetchInworldMap() {
  const basic = env.INWORLD_BASIC_BASE64;
  if (!basic) { console.warn('  [warn] INWORLD_BASIC_BASE64 not set — nationality/age data unavailable'); return {}; }
  try {
    const res = await fetch('https://api.inworld.ai/voices/v1/voices', {
      headers: { Authorization: `Basic ${basic}` },
    });
    if (!res.ok) { console.warn('  [warn] Inworld API error', res.status); return {}; }
    const data = await res.json();
    const map = {};
    for (const v of (data.voices || [])) {
      map[v.voiceId] = { langCode: v.langCode, ageGroup: v.ageGroup, tags: v.tags, description: v.description };
    }
    console.log(`  Loaded ${Object.keys(map).length} Inworld voice profiles`);
    return map;
  } catch (e) {
    console.warn('  [warn] Failed to fetch Inworld data:', e.message);
    return {};
  }
}

async function main() {
  const args = process.argv.slice(2);
  const forceRegen = args.includes('--force');
  const styleArg = args.find(a => !a.startsWith('--'));
  const targetStyles = styleArg && styleArg !== 'all'
    ? [styleArg] : ALL_STYLES;

  console.log(`\n🎨 Generating avatars for styles: ${targetStyles.join(', ')}`);

  // Fetch Inworld voice profiles for nationality/age enrichment
  const inworldMap = await fetchInworldMap();

  // Fetch all 130 system characters
  const { data: chars, error } = await supabase
    .from('ai_characters')
    .select('id, name, gender, personality, background, voice_id')
    .eq('is_system', true)
    .order('created_at', { ascending: true });

  if (error) { console.error('DB error:', error); process.exit(1); }
  console.log(`Found ${chars.length} characters\n`);

  // Build progress from DB: mark characters that already have each style
  console.log('Checking DB for existing styles...');
  const { data: existingChars } = await supabase
    .from('ai_characters')
    .select('id, avatar_styles')
    .eq('is_system', true)
    .limit(500);
  // Each style gets its own progress file (safe for parallel runs)
  let generated = 0, skipped = 0, failed = 0;

  for (const style of targetStyles) {
    const progress = forceRegen ? {} : loadProgress(style);
    // Seed progress from DB (skip already-done) — unless --force
    if (!forceRegen) {
      for (const c of (existingChars || [])) {
        if (c.avatar_styles?.[style]) progress[`${style}:${c.id}`] = 'done';
      }
    }
    const totalDone = Object.values(progress).filter(v => v === 'done').length;
    console.log(`\n━━━ Style: ${style.toUpperCase()} ━━━  (${totalDone}/${chars.length} already done)`);

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
          const url = await generateOne(char, style, inworldMap);
          progress[key] = 'done';
          saveProgress(progress, style);
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
  console.log(`Progress files: /tmp/avatar-gen-progress-{style}.json`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
