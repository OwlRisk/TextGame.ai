import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('📖 Reading schema file...');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split SQL into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    console.log('🚀 Executing schema...\n');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;

      try {
        // Use RPC to execute raw SQL (if available) or use REST API
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If RPC doesn't exist, try direct query (may not work for all statements)
          console.log(`   Statement ${i + 1}/${statements.length}...`);
          // Note: Supabase client doesn't support raw SQL execution directly
          // We'll need to use a different approach
        }
      } catch (err: any) {
        console.log(`   ⚠️  Statement ${i + 1} may need manual execution`);
      }
    }

    console.log('\n✅ Schema execution attempted');
    console.log('⚠️  Note: Some statements may need to be executed manually in Supabase SQL Editor');
    console.log('\n📋 Next steps:');
    console.log('1. Go to https://app.supabase.com/project/hazjbhhreltgjexxaazn/sql');
    console.log('2. Copy the contents of database/schema.sql');
    console.log('3. Paste and execute in the SQL Editor');

  } catch (error: any) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
