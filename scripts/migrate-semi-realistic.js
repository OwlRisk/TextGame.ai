/**
 * Copy semi-realistic images to semi-realistic-v2 path to bust CDN cache.
 * No re-generation needed — just copies existing files to new URLs.
 */
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '../.env'), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'avatars';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const { data: chars } = await supabase
    .from('ai_characters')
    .select('id, voice_id, avatar_styles')
    .eq('is_system', true)
    .order('created_at', { ascending: true });

  console.log(`Found ${chars.length} characters`);
  let done = 0, failed = 0;

  for (const char of chars) {
    const voiceId = char.voice_id;
    const oldPath = `pool/semi-realistic/${voiceId}.jpg`;
    const newPath = `pool/semi-realistic-v2/${voiceId}.jpg`;
    const hdOldPath = `pool/hd/semi-realistic/${voiceId}.jpg`;
    const hdNewPath = `pool/hd/semi-realistic-v2/${voiceId}.jpg`;

    try {
      // Copy compressed version
      const { data: fileData, error: dlErr } = await supabase.storage.from(BUCKET).download(oldPath);
      if (dlErr) throw new Error('Download: ' + dlErr.message);
      const buf = Buffer.from(await fileData.arrayBuffer());

      const { error: upErr } = await supabase.storage.from(BUCKET)
        .upload(newPath, buf, { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw new Error('Upload: ' + upErr.message);

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(newPath);
      const newUrl = urlData.publicUrl;

      // Try to copy HD version too
      let hdNewUrl = null;
      try {
        const { data: hdData } = await supabase.storage.from(BUCKET).download(hdOldPath);
        if (hdData) {
          const hdBuf = Buffer.from(await hdData.arrayBuffer());
          await supabase.storage.from(BUCKET).upload(hdNewPath, hdBuf, { contentType: 'image/jpeg', upsert: true });
          const { data: hdUrlData } = supabase.storage.from(BUCKET).getPublicUrl(hdNewPath);
          hdNewUrl = hdUrlData.publicUrl;
        }
      } catch {}

      // Update DB
      const existingStyles = char.avatar_styles || {};
      const updatedStyles = {
        ...existingStyles,
        'semi-realistic': newUrl,
        ...(hdNewUrl ? { 'semi-realistic_hd': hdNewUrl } : {}),
      };
      await supabase.from('ai_characters')
        .update({ avatar_styles: updatedStyles, avatar_url: newUrl })
        .eq('id', char.id);

      done++;
      process.stdout.write(`\r✓ ${done}/${chars.length} — ${voiceId}`);
    } catch (e) {
      failed++;
      console.error(`\n✗ ${voiceId}: ${e.message}`);
    }

    await sleep(200); // gentle rate limit
  }

  console.log(`\n\nDone! Copied: ${done}, Failed: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
