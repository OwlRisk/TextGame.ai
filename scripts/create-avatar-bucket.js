/**
 * One-time script: create Supabase Storage bucket "avatars" (public) for AI player/host avatars.
 * Run: node scripts/create-avatar-bucket.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const bucket = 'avatars';
  const { data, error } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 1024 * 100, // 100KB
  });
  if (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log(`Bucket "${bucket}" already exists.`);
      return;
    }
    console.error('Create bucket failed:', error.message);
    process.exit(1);
  }
  console.log(`Bucket "${bucket}" created (public).`);
}

main();
