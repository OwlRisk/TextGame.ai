/**
 * Generate sidebar icons for each game template using DALL-E 3.
 * Run: node scripts/generate-sidebar-icons.js
 *
 * Each icon is 1024x1024 from DALL-E 3, then resized to 128x128 webp.
 * Progress saved to /tmp/sidebar-icon-progress.json — safe to resume.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const https = require('https');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const envFile = path.join(__dirname, '../.env');
if (!fs.existsSync(envFile)) throw new Error('.env not found');
const env = Object.fromEntries(
  fs.readFileSync(envFile, 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => {
      const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()];
    })
);
const OPENAI_KEY = env.OPENAI_API_KEY;
if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not found in .env');

const OUT_DIR = path.join(__dirname, '../public/games');
const SIZE = 128;
const PROGRESS_FILE = '/tmp/sidebar-icon-progress.json';

const TEMPLATES = [
  {
    id: 'werewolf',
    prompt: 'A fierce wolf silhouette howling at a blood-red moon, dark purple night sky with mist. Dramatic and mysterious. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'mafia',
    prompt: 'A fedora hat and a rose on a dark background, noir style, shadows and red accents. Mysterious gangster theme. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'undercover',
    prompt: 'A single eye peering through a keyhole, spy/detective vibe, dark blue and gold tones. Secretive and intriguing. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'tarot',
    prompt: 'A mystical tarot card with a glowing celestial eye, surrounded by stars and cosmic swirls. Purple and gold tones. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'codenames',
    prompt: 'Two overlapping speech bubbles with a hidden crosshair symbol inside, espionage theme. Red and blue contrast. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'avalon',
    prompt: 'A legendary sword embedded in stone with a faint golden glow, medieval fantasy. Blue and gold tones. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'spyfall',
    prompt: 'A world globe with a magnifying glass and a question mark, spy adventure theme. Teal and orange tones. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'detective',
    prompt: 'A magnifying glass over fingerprints with a spotlight beam, crime investigation theme. Amber and dark tones. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'escape-room',
    prompt: 'An ornate antique key with glowing runes, floating in front of a mysterious locked door. Green and gold tones. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'trivia',
    prompt: 'A glowing lightbulb with question marks and stars orbiting around it, knowledge and quiz theme. Yellow and purple tones. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'debate',
    prompt: 'Two microphones crossed like swords with lightning between them, competitive debate theme. Red and blue contrast. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'storyteller',
    prompt: 'An open magical book with glowing pages and tiny floating stars and characters emerging from it. Warm amber and purple tones. Square app icon, dark background, minimal, no text.',
  },
  {
    id: '20-questions',
    prompt: 'A large stylized question mark made of colorful geometric shapes, playful and curious. Vibrant multi-color on dark. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'two-truths',
    prompt: 'Three cards fanned out — two showing checkmarks and one showing an X, playful deception game. Green and red on dark. Square app icon, dark background, minimal, no text.',
  },
  {
    id: 'custom',
    prompt: 'A glowing purple diamond/gem with sparkles radiating outward, creative and customizable theme. Violet and white on dark. Square app icon, dark background, minimal, no text.',
  },
];

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch { return {}; }
}
function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

function callDallE(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      response_format: 'b64_json',
      n: 1,
      quality: 'standard',
    });
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          const b64 = json.data?.[0]?.b64_json;
          if (!b64) return reject(new Error('No image data'));
          resolve(Buffer.from(b64, 'base64'));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const progress = loadProgress();
  let done = 0, skipped = 0, failed = 0;

  for (const { id, prompt } of TEMPLATES) {
    const outFile = `sidebar-icon-${id}.webp`;
    const outPath = path.join(OUT_DIR, outFile);

    if (progress[id] === 'done') {
      console.log(`  SKIP  ${outFile} (already generated)`);
      skipped++;
      continue;
    }

    console.log(`  GEN   ${outFile} ...`);
    try {
      const rawBuffer = await callDallE(prompt);

      await sharp(rawBuffer)
        .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
        .webp({ quality: 90 })
        .toFile(outPath);

      const stats = fs.statSync(outPath);
      console.log(`  OK    ${outFile} (${(stats.size / 1024).toFixed(1)} KB)`);

      progress[id] = 'done';
      saveProgress(progress);
      done++;
    } catch (e) {
      console.error(`  FAIL  ${outFile}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${done} generated, ${skipped} skipped, ${failed} failed.`);
}

main().catch(console.error);
