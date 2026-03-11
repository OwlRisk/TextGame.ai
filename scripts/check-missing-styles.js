/**
 * Check which ai_characters are missing style variants.
 * Run: node scripts/check-missing-styles.js
 * Outputs a summary + list of characters missing each style.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env (try local first, then the hardcoded path used by generate-avatars.js)
function loadEnv() {
  const candidates = [
    path.join(__dirname, '../.env'),
    '/Users/brookma/Documents/GitHub/GameMaster/.env',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return Object.fromEntries(
        fs.readFileSync(p, 'utf8').split('\n')
          .filter(l => l.includes('=') && !l.startsWith('#'))
          .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
      );
    }
  }
  throw new Error('No .env file found. Tried:\n' + candidates.join('\n'));
}

const STYLES = ['semi-realistic', 'anime', 'painted', 'pixel', 'cyberpunk'];

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from('ai_characters')
    .select('name, gender, voice_id, avatar_styles, avatar_url')
    .eq('is_system', true)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) { console.error('DB error:', error.message); process.exit(1); }

  console.log(`\nTotal system characters: ${data.length}`);

  const complete = [];
  const missing = {};

  for (const char of data) {
    const styles = (char.avatar_styles || {});
    const missingStyles = STYLES.filter(s => !styles[s]);
    if (missingStyles.length === 0) {
      complete.push(char.name);
    } else {
      missing[char.name] = { gender: char.gender, voice_id: char.voice_id, missing: missingStyles };
    }
  }

  console.log(`✅ All 5 styles complete: ${complete.length}`);
  console.log(`❌ Missing at least one style: ${Object.keys(missing).length}`);

  // Group by style
  const byStyle = {};
  for (const s of STYLES) byStyle[s] = [];
  for (const [name, info] of Object.entries(missing)) {
    for (const s of info.missing) {
      byStyle[s].push(`${name}(${info.gender ?? '?'})`);
    }
  }

  console.log('\n── Missing count per style ──');
  for (const [s, names] of Object.entries(byStyle)) {
    const bar = '█'.repeat(names.length) || '(none)';
    console.log(`  ${s.padEnd(16)} ${String(names.length).padStart(3)}  ${bar}`);
  }

  if (Object.keys(missing).length > 0) {
    console.log('\n── Characters needing generation ──');
    for (const [name, info] of Object.entries(missing)) {
      console.log(`  ${name} (${info.gender ?? '?'}, voice: ${info.voice_id ?? 'none'})`);
      console.log(`    missing: ${info.missing.join(', ')}`);
    }

    // Output ready-to-run commands
    console.log('\n── To regenerate missing styles ──');
    const stylesNeeded = Object.entries(byStyle)
      .filter(([, names]) => names.length > 0)
      .map(([s]) => s);
    for (const s of stylesNeeded) {
      console.log(`  node scripts/generate-avatars.js ${s}`);
    }
    console.log('  (already-done entries are skipped automatically)');
  } else {
    console.log('\n🎉 All characters have all 5 style variants! Nothing to generate.');
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
