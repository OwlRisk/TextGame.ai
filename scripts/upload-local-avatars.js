/**
 * Upload pool-avatars-new images to Supabase and assign to system characters.
 * Matches by gender, assigns randomly. Characters without a local image will
 * be left for generate-avatars.js to fill.
 *
 * Run: node scripts/upload-local-avatars.js
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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
const BUCKET = 'avatars';
const STYLE = 'semi-realistic';
const LOCAL_DIR = path.join(__dirname, '../pool-avatars-new');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function safeFilename(voiceId) {
  return voiceId
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function main() {
  const maleFiles = fs.readdirSync(path.join(LOCAL_DIR, 'male'))
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(LOCAL_DIR, 'male', f));
  const femaleFiles = fs.readdirSync(path.join(LOCAL_DIR, 'female'))
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(LOCAL_DIR, 'female', f));

  console.log(`Local images: ${maleFiles.length} male, ${femaleFiles.length} female`);

  const { data: chars, error } = await supabase
    .from('ai_characters')
    .select('id, name, gender, voice_id, avatar_styles')
    .eq('is_system', true)
    .order('created_at', { ascending: true });

  if (error) { console.error('DB error:', error); process.exit(1); }
  console.log(`System characters: ${chars.length}`);

  const maleChars = shuffle(chars.filter(c => c.gender === 'male'));
  const femaleChars = shuffle(chars.filter(c => c.gender === 'female'));
  const otherChars = chars.filter(c => c.gender !== 'male' && c.gender !== 'female');

  shuffle(maleFiles);
  shuffle(femaleFiles);

  const assignments = [];

  for (let i = 0; i < maleChars.length && i < maleFiles.length; i++) {
    assignments.push({ char: maleChars[i], file: maleFiles[i] });
  }
  for (let i = 0; i < femaleChars.length && i < femaleFiles.length; i++) {
    assignments.push({ char: femaleChars[i], file: femaleFiles[i] });
  }
  for (let i = 0; i < otherChars.length; i++) {
    const pool = i % 2 === 0 ? maleFiles : femaleFiles;
    const idx = assignments.length;
    if (idx < pool.length) {
      assignments.push({ char: otherChars[i], file: pool[idx] });
    }
  }

  console.log(`Assignments: ${assignments.length} (remaining ${chars.length - assignments.length} will need generation)\n`);

  let uploaded = 0;
  for (const { char, file } of assignments) {
    const voiceId = char.voice_id || char.id;
    const storagePath = `pool/${STYLE}/${safeFilename(voiceId)}.jpg`;

    const rawBytes = fs.readFileSync(file);
    const imgBytes = await sharp(rawBytes)
      .resize(512, 512, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, imgBytes, { contentType: 'image/jpeg', upsert: true });

    if (uploadErr) {
      console.error(`  UPLOAD FAILED ${char.name}: ${uploadErr.message}`);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const styles = { ...(char.avatar_styles || {}), [STYLE]: publicUrl };
    await supabase
      .from('ai_characters')
      .update({ avatar_styles: styles, avatar_url: publicUrl })
      .eq('id', char.id);

    process.stdout.write(`[${++uploaded}/${assignments.length}] ${char.name} ✓\n`);
  }

  const assignedIds = new Set(assignments.map(a => a.char.id));
  const remaining = chars.filter(c => !assignedIds.has(c.id));
  console.log(`\n✅ Uploaded: ${uploaded}`);
  console.log(`Remaining characters needing generation: ${remaining.length}`);
  if (remaining.length > 0) {
    console.log('Run: node scripts/generate-avatars.js semi-realistic');
    console.log('(Already-uploaded characters will be skipped automatically)');
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
