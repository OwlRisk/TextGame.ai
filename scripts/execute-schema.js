const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Temporarily disable SSL certificate verification for Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Missing DATABASE_URL or DIRECT_URL in .env file');
  process.exit(1);
}

async function executeSchema() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // 1) 主 schema
    console.log('📖 Executing database/schema.sql...');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await client.query(schema);
    console.log('✅ schema.sql done.\n');

    // 2) 按顺序执行 migrations（含 user_profiles、token_transactions、Stripe 相关）
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      console.log('📖 Executing migration:', file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      console.log('✅', file, 'done.\n');
    }

    // Reload PostgREST schema cache so the API sees the new tables immediately
    try {
      await client.query("NOTIFY pgrst, 'reload schema';");
      console.log('🔄 PostgREST schema cache reload requested.');
    } catch (notifyErr) {
      console.warn('⚠️  Could not notify pgrst (non-fatal):', notifyErr.message);
    }

    console.log('✅ All schema + migrations executed successfully!');
    console.log('\n📊 Includes: game_sessions, games, game_room_state, game_drafts,');
    console.log('   user_profiles, token_transactions, token_packages (Stripe/coins).');
    console.log('\n🎉 Database setup complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === '42P07') {
      console.log('⚠️  Some tables may already exist. This is okay.');
    } else {
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

executeSchema();
