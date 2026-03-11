/**
 * Batch pre-generate TTS voice greeting samples for all system AI characters.
 * Stores MP3 files in Supabase Storage and writes the public URL to
 * ai_characters.voice_sample_url.
 *
 * Run: node scripts/generate-voice-samples.js
 *
 * Progress is saved to /tmp/voice-sample-progress.json — safe to resume.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const https = require('https');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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
const INWORLD_BASIC = env.INWORLD_BASIC_BASE64;

if (!OPENAI_KEY) throw new Error('Missing OPENAI_API_KEY in .env');
if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env');
if (!SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
if (!INWORLD_BASIC) throw new Error('Missing INWORLD_BASIC_BASE64 in .env');

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = 'avatars';
const PROGRESS_FILE = '/tmp/voice-sample-progress.json';
const INWORLD_TTS_URL = 'https://api.inworld.ai/tts/v1/voice';
const TTS_MODEL = 'inworld-tts-1.5-max';

// ── Voice metadata (EN_US subset for pickVoiceForSpeaker) ────────────────────
const INWORLD_VOICE_META = [
  { voiceId: 'Loretta',   gender: 'female', keywords: ['inviting', 'folksy', 'charming', 'southern'] },
  { voiceId: 'Darlene',   gender: 'female', keywords: ['soothing', 'comforting', 'gentle', 'southern'] },
  { voiceId: 'Marlene',   gender: 'female', keywords: ['friendly', 'relaxed', 'down-to-earth', 'southern'] },
  { voiceId: 'Hank',      gender: 'male',   keywords: ['warm', 'laid-back', 'authentic', 'southern'] },
  { voiceId: 'Evelyn',    gender: 'female', keywords: ['gentle', 'serene', 'comforting'] },
  { voiceId: 'Celeste',   gender: 'female', keywords: ['soft', 'whispery', 'tranquil'] },
  { voiceId: 'Luna',      gender: 'female', keywords: ['calm', 'relaxing'] },
  { voiceId: 'Gareth',    gender: 'male',   keywords: ['soothing', 'gentle', 'steady'] },
  { voiceId: 'Oliver',    gender: 'male',   keywords: ['soothing', 'precise', 'reassuring'] },
  { voiceId: 'Simon',     gender: 'male',   keywords: ['articulate', 'insightful', 'steady'] },
  { voiceId: 'Shaun',     gender: 'male',   keywords: ['calm', 'casual'] },
  { voiceId: 'Blake',     gender: 'male',   keywords: ['intimate', 'romantic'] },
  { voiceId: 'Pippa',     gender: 'female', keywords: ['soothing', 'trustworthy', 'gentle', 'australian'] },
  { voiceId: 'Tessa',     gender: 'female', keywords: ['upbeat', 'conversational', 'lighthearted', 'australian'] },
  { voiceId: 'Liam',      gender: 'male',   keywords: ['upbeat', 'motivating', 'informal', 'australian'] },
  { voiceId: 'Callum',    gender: 'male',   keywords: ['laid-back', 'amiable', 'inviting', 'australian'] },
  { voiceId: 'Hamish',    gender: 'male',   keywords: ['calm', 'trustworthy', 'comforting', 'australian'] },
  { voiceId: 'Abby',      gender: 'female', keywords: ['bright', 'eager', 'youthful'] },
  { voiceId: 'Kayla',     gender: 'female', keywords: ['enthusiastic', 'youthful', 'energetic'] },
  { voiceId: 'Chloe',     gender: 'female', keywords: ['thoughtful', 'introspective', 'youthful'] },
  { voiceId: 'Hana',      gender: 'female', keywords: ['bright', 'playful'] },
  { voiceId: 'Julia',     gender: 'female', keywords: ['childish', 'quirky'] },
  { voiceId: 'Pixie',     gender: 'female', keywords: ['cartoonish', 'high-pitched'] },
  { voiceId: 'Graham',    gender: 'male',   keywords: ['profound', 'authoritative', 'sophisticated', 'british'] },
  { voiceId: 'Rupert',    gender: 'male',   keywords: ['resonant', 'commanding', 'motivational', 'british'] },
  { voiceId: 'Craig',     gender: 'male',   keywords: ['posh', 'raspy', 'british'] },
  { voiceId: 'Ronald',    gender: 'male',   keywords: ['confident', 'expressive', 'british'] },
  { voiceId: 'Clive',     gender: 'male',   keywords: ['calm', 'friendly', 'british'] },
  { voiceId: 'Olivia',    gender: 'female', keywords: ['cute', 'upbeat', 'british'] },
  { voiceId: 'Wendy',     gender: 'female', keywords: ['pleasant', 'casual', 'british'] },
  { voiceId: 'Mortimer',  gender: 'male',   keywords: ['gravelly', 'menacing', 'whimsical'] },
  { voiceId: 'Snik',      gender: 'male',   keywords: ['hoarse', 'cunning', 'avaricious'] },
  { voiceId: 'Hades',     gender: 'male',   keywords: ['commanding', 'gruff'] },
  { voiceId: 'Edward',    gender: 'male',   keywords: ['emphatic', 'shouty'] },
  { voiceId: 'Veronica',  gender: 'female', keywords: ['intimidating', 'commanding', 'icy'] },
  { voiceId: 'Victoria',  gender: 'female', keywords: ['silky', 'cunning', 'elegant'] },
  { voiceId: 'Miranda',   gender: 'female', keywords: ['menacing', 'serene', 'dominant'] },
  { voiceId: 'Sebastian', gender: 'male',   keywords: ['intimidating', 'steely', 'calculating'] },
  { voiceId: 'Victor',    gender: 'male',   keywords: ['ominous', 'sinister', 'controlled'] },
  { voiceId: 'Malcolm',   gender: 'male',   keywords: ['authoritative', 'manipulative', 'persuasive'] },
  { voiceId: 'Anjali',    gender: 'female', keywords: ['soothing', 'assured', 'polished', 'indian'] },
  { voiceId: 'Saanvi',    gender: 'female', keywords: ['crisp', 'articulate', 'dynamic', 'indian'] },
  { voiceId: 'Arjun',     gender: 'male',   keywords: ['smooth', 'enthusiastic', 'informative', 'indian'] },
  { voiceId: 'Claire',    gender: 'female', keywords: ['warm', 'gentle', 'soothing'] },
  { voiceId: 'Serena',    gender: 'female', keywords: ['soft', 'nurturing', 'gentle'] },
  { voiceId: 'Jessica',   gender: 'female', keywords: ['encouraging', 'articulate', 'warm'] },
  { voiceId: 'Lauren',    gender: 'female', keywords: ['confident', 'friendly', 'engaging'] },
  { voiceId: 'Amina',     gender: 'female', keywords: ['warm', 'inviting', 'articulate', 'west african'] },
  { voiceId: 'Priya',     gender: 'female', keywords: ['friendly', 'gentle'] },
  { voiceId: 'Sarah',     gender: 'female', keywords: ['upbeat', 'excited'] },
  { voiceId: 'Deborah',   gender: 'female', keywords: ['gentle', 'elegant'] },
  { voiceId: 'Elizabeth', gender: 'female', keywords: ['informative', 'calm'] },
  { voiceId: 'Elliot',    gender: 'male',   keywords: ['deep', 'commanding', 'resonant'] },
  { voiceId: 'James',     gender: 'male',   keywords: ['vibrant', 'expressive', 'captivating'] },
  { voiceId: 'Ethan',     gender: 'male',   keywords: ['assured', 'precise', 'captivating'] },
  { voiceId: 'Tyler',     gender: 'male',   keywords: ['authoritative', 'insightful', 'dynamic'] },
  { voiceId: 'Jason',     gender: 'male',   keywords: ['lucid', 'engrossing', 'supportive'] },
  { voiceId: 'Mark',      gender: 'male',   keywords: ['articulate', 'engaging'] },
  { voiceId: 'Theodore',  gender: 'male',   keywords: ['elderly', 'wise'] },
  { voiceId: 'Timothy',   gender: 'male',   keywords: ['hyped', 'upbeat'] },
  { voiceId: 'Carter',    gender: 'male',   keywords: ['intense', 'motivational'] },
  { voiceId: 'Dominus',   gender: 'male',   keywords: ['robotic', 'monotone'] },
  { voiceId: 'Vinny',     gender: 'male',   keywords: ['gritty', 'assertive', 'authentic', 'new york'] },
  { voiceId: 'Nate',      gender: 'male',   keywords: ['laid-back', 'engaging', 'sociable'] },
  { voiceId: 'Jake',      gender: 'male',   keywords: ['amiable', 'introspective', 'charming'] },
  { voiceId: 'Brian',     gender: 'male',   keywords: ['friendly', 'encouraging', 'clear'] },
  { voiceId: 'Kelsey',    gender: 'female', keywords: ['warm', 'empathetic', 'reassuring'] },
  { voiceId: 'Derek',     gender: 'male',   keywords: ['steady', 'professional', 'composed'] },
  { voiceId: 'Grant',     gender: 'male',   keywords: ['calm', 'attentive', 'helpful'] },
  { voiceId: 'Evan',      gender: 'male',   keywords: ['friendly', 'approachable', 'easygoing'] },
  { voiceId: 'Alex',      gender: 'male',   keywords: ['friendly', 'expressive', 'energetic', 'quick', 'witty'] },
  { voiceId: 'Ashley',    gender: 'female', keywords: ['warm', 'mellow', 'natural', 'encouraging', 'playful'] },
  { voiceId: 'Dennis',    gender: 'male',   keywords: ['outgoing', 'upbeat', 'smooth', 'calm', 'enigmatic'] },
];

// ── Voice selection (mirrors pickVoiceForSpeaker from inworld-voices.ts) ─────
function tokenize(text) {
  const out = new Set();
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  for (const w of lower.split(/\s+/)) {
    if (w.length >= 2) out.add(w);
  }
  return out;
}

function scoreVoice(voice, tokens) {
  let score = 0;
  for (const kw of voice.keywords) {
    if (tokens.has(kw)) score += 2;
  }
  return score;
}

function pickVoiceForSpeaker(gender, personalityText, speakerName) {
  const g = gender === 'male' ? 'male' : gender === 'female' ? 'female' : null;
  const tokens = personalityText ? tokenize(personalityText) : new Set();

  if (g) {
    const candidates = INWORLD_VOICE_META.filter(v => v.gender === g);
    const pool = candidates.length > 0 ? candidates : INWORLD_VOICE_META;
    let best = pool[0], bestScore = -1;
    for (const v of pool) {
      const s = scoreVoice(v, tokens);
      if (s > bestScore) { bestScore = s; best = v; }
    }
    return best.voiceId;
  }

  const males = INWORLD_VOICE_META.filter(v => v.gender === 'male');
  const females = INWORLD_VOICE_META.filter(v => v.gender === 'female');
  let bestMale = males[0], bestMaleScore = -1;
  for (const v of males) { const s = scoreVoice(v, tokens); if (s > bestMaleScore) { bestMaleScore = s; bestMale = v; } }
  let bestFemale = females[0], bestFemaleScore = -1;
  for (const v of females) { const s = scoreVoice(v, tokens); if (s > bestFemaleScore) { bestFemaleScore = s; bestFemale = v; } }

  if (bestMaleScore === bestFemaleScore && speakerName) {
    let h = 0;
    for (let i = 0; i < speakerName.length; i++) h = ((h << 5) - h + speakerName.charCodeAt(i)) | 0;
    return Math.abs(h) % 2 === 0 ? bestMale.voiceId : bestFemale.voiceId;
  }
  return bestMaleScore >= bestFemaleScore ? bestMale.voiceId : bestFemale.voiceId;
}

// ── Personality → TTS params mapping ────────────────────────────────────────
function getTtsParams(personality) {
  const p = (personality || '').toLowerCase();
  if (/calm|gentle|soothing|serene|soft|quiet|reserved|nurturing|comforting/.test(p))
    return { temperature: 0.8, speed: 0.95 };
  if (/energetic|dominant|bold|fierce|aggressive|commanding|intense|fiery|assertive/.test(p))
    return { temperature: 1.3, speed: 1.1 };
  if (/mysterious|dark|brooding|sinister|enigmatic|shadowy|cryptic|eerie/.test(p))
    return { temperature: 1.0, speed: 0.9 };
  if (/playful|cheerful|witty|lighthearted|bubbly|jovial|humorous|mischievous/.test(p))
    return { temperature: 1.2, speed: 1.1 };
  return { temperature: 1.0, speed: 1.0 };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); }
  catch { return {}; }
}
function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── Generate greeting text via OpenAI ────────────────────────────────────────
async function generateGreeting(char) {
  const { name, personality, background } = char;
  const prompt = `You are "${name}", a game character. Personality: ${personality || 'friendly'}. Background: ${background || 'adventurer'}.
Say a single short greeting (1 sentence, under 15 words) introducing yourself in the lobby. Stay in character. English only.`;

  const res = await httpsPost('https://api.openai.com/v1/chat/completions', {
    'Authorization': `Bearer ${OPENAI_KEY}`,
  }, {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Output ONLY the greeting line. No quotes, no stage directions, no asterisks.' },
      { role: 'user', content: prompt },
    ],
    temperature: 1.0,
    max_tokens: 60,
  });

  if (res.status !== 200) {
    throw new Error(`OpenAI error ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
  }

  const greeting = (res.body.choices?.[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '');
  if (!greeting) throw new Error('Empty greeting from OpenAI');
  return greeting;
}

// ── Synthesize speech via Inworld TTS ────────────────────────────────────────
async function synthesizeSpeech(text, voiceId, temperature, speed) {
  const res = await httpsPost(INWORLD_TTS_URL, {
    'Authorization': `Basic ${INWORLD_BASIC}`,
  }, {
    text,
    voiceId,
    modelId: TTS_MODEL,
    audioConfig: {
      audioEncoding: 'MP3',
      sampleRateHertz: 22050,
    },
    applyTextNormalization: 'ON',
  });

  if (res.status !== 200) {
    throw new Error(`Inworld TTS error ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
  }

  const audioBase64 = res.body?.audioContent;
  if (!audioBase64 || typeof audioBase64 !== 'string') {
    throw new Error('No audioContent in Inworld response');
  }

  return Buffer.from(audioBase64, 'base64');
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function generateOne(char) {
  const { id, name, gender, personality, background, voice_id } = char;

  // 1. Generate in-character greeting
  const greeting = await generateGreeting(char);

  // 2. Pick voice: use existing voice_id if available, otherwise score-match
  const voiceHint = [personality, background].filter(Boolean).join('. ');
  const voiceId = voice_id || pickVoiceForSpeaker(gender, voiceHint, name);

  // 3. Get personality-matched TTS params
  const { temperature, speed } = getTtsParams(personality);

  // 4. Synthesize
  const audioBytes = await synthesizeSpeech(greeting, voiceId, temperature, speed);

  // 5. Upload to Supabase Storage
  const storagePath = `voice-samples/${id}.mp3`;
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, audioBytes, { contentType: 'audio/mpeg', upsert: true });
  if (uploadErr) throw new Error('Upload error: ' + uploadErr.message);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // 6. Update DB
  await supabase.from('ai_characters')
    .update({ voice_sample_url: publicUrl })
    .eq('id', id);

  return { greeting, voiceId, temperature, speed, url: publicUrl };
}

async function main() {
  console.log('\n🎤 Generating voice samples for AI characters\n');

  // Fetch all system characters
  const { data: chars, error } = await supabase
    .from('ai_characters')
    .select('id, name, gender, personality, background, voice_id, voice_sample_url')
    .eq('is_system', true)
    .order('created_at', { ascending: true });

  if (error) { console.error('DB error:', error); process.exit(1); }
  console.log(`Found ${chars.length} characters`);

  // Build progress from DB
  const progress = loadProgress();
  for (const c of chars) {
    if (c.voice_sample_url) progress[c.id] = 'done';
  }
  saveProgress(progress);

  const remaining = chars.filter(c => progress[c.id] !== 'done');
  console.log(`Already done: ${chars.length - remaining.length}, remaining: ${remaining.length}\n`);

  if (remaining.length === 0) {
    console.log('All characters already have voice samples!');
    return;
  }

  let generated = 0, failed = 0;

  for (let i = 0; i < remaining.length; i++) {
    const char = remaining[i];
    process.stdout.write(`[${i + 1}/${remaining.length}] ${char.name} (${char.gender})... `);

    let attempts = 0;
    while (attempts < 3) {
      try {
        const result = await generateOne(char);
        progress[char.id] = 'done';
        saveProgress(progress);
        console.log(`✓ voice=${result.voiceId} temp=${result.temperature} speed=${result.speed}`);
        console.log(`   "${result.greeting}"`);
        generated++;
        break;
      } catch (e) {
        attempts++;
        const msg = e.message || String(e);
        if (msg.includes('rate_limit') || msg.includes('429')) {
          process.stdout.write(`[rate limit, wait 30s] `);
          await sleep(30000);
        } else if (attempts < 3) {
          process.stdout.write(`[err: ${msg.slice(0, 50)}, retry ${attempts}] `);
          await sleep(3000);
        } else {
          console.log(`✗ FAILED: ${msg.slice(0, 80)}`);
          failed++;
        }
      }
    }

    // Throttle to ~20 req/min (OpenAI + Inworld combined)
    await sleep(2000);
  }

  console.log(`\n✅ Done! Generated: ${generated}, Failed: ${failed}`);
  console.log(`Progress saved to ${PROGRESS_FILE}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
