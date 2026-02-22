/**
 * One-off: fetch Inworld voices and save to app_cache. Run after db:setup.
 * Usage: node scripts/refresh-inworld-voices.js
 */
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CACHE_KEY = 'inworld_voices';

async function main() {
  const basic = process.env.INWORLD_BASIC_BASE64;
  if (!basic) {
    console.error('❌ INWORLD_BASIC_BASE64 not set in .env');
    process.exit(1);
  }

  console.log('📡 Fetching voices from Inworld...');
  const res = await fetch('https://api.inworld.ai/voices/v1/voices', {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) {
    console.error('❌ Inworld API error', res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const voices = data.voices || [];
  console.log('✅ Got', voices.length, 'voices');

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== '0' },
  });

  try {
    await client.connect();
    await client.query(
      `INSERT INTO app_cache (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [CACHE_KEY, JSON.stringify({ voices })]
    );
    console.log('✅ Saved to app_cache.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
