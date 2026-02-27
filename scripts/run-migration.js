/**
 * Run a single migration file or all pending migrations.
 * Usage:
 *   npm run db:migrate                         # runs all *.sql in database/migrations/
 *   npm run db:migrate -- 001_add_user_prefs   # run a specific migration by filename prefix
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Missing DATABASE_URL or DIRECT_URL in .env file');
  process.exit(1);
}

const filter = process.argv[2]; // optional partial filename filter

async function runMigrations() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected.\n');

    const migrationsDir = path.join(__dirname, '../database/migrations');
    let files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (filter) {
      files = files.filter((f) => f.includes(filter));
      if (files.length === 0) {
        console.error(`❌ No migration files matching "${filter}"`);
        process.exit(1);
      }
    }

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`📖 Running migration: ${file}`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      console.log(`✅ ${file} done.\n`);
    }

    console.log('🎉 Migration(s) complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
