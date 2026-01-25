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
    ssl: false  // Disable SSL for now, or use proper certificate
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('📖 Reading schema file...');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🚀 Executing schema...\n');

    // Execute the entire schema
    await client.query(schema);

    console.log('✅ Schema executed successfully!');
    console.log('\n📊 Created:');
    console.log('   - game_sessions table');
    console.log('   - games table');
    console.log('   - Indexes');
    console.log('   - Triggers');
    console.log('   - Row Level Security policies');
    console.log('\n🎉 Database setup complete!');

  } catch (error) {
    console.error('\n❌ Error executing schema:', error.message);
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
