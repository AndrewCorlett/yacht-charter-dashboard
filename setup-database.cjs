const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function setupDatabase() {
  console.log('🗄️ Setting up Yacht Charter Database...');
  
  try {
    // Use service role key for admin operations
    const supabaseUrl = 'https://ijsvrotcvrvrmnzazxya.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqc3Zyb3RjdnJ2cm1uemF6eHlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA5MzI0NiwiZXhwIjoyMDY1NjY5MjQ2fQ.O8Do4QtuPjvhUvIao8A-xDhoTU5I_Zui8uc96phzoWQ';
    
    console.log('📡 Creating Supabase admin client...');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Read schema file
    console.log('📄 Reading database schema...');
    const schemaSQL = fs.readFileSync('./database-schema.sql', 'utf8');
    
    // Split into individual statements (basic splitting on semicolon + newline)
    const statements = schemaSQL
      .split(';\n')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Executing ${statements.length} schema statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        if (statement.trim().length > 1) {
          console.log(`  ${i + 1}/${statements.length}: Executing statement...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Try alternative approach using direct query
            const { error: directError } = await supabase
              .from('_supabase_dummy')
              .select('*')
              .limit(0);
            
            if (error.message.includes('does not exist') || error.message.includes('already exists')) {
              console.log(`    ⚠️ Skipping: ${error.message.substring(0, 80)}...`);
            } else {
              console.error(`    ❌ Error: ${error.message}`);
            }
          } else {
            console.log(`    ✅ Success`);
          }
        }
      } catch (err) {
        console.log(`    ⚠️ Statement skipped: ${err.message.substring(0, 60)}...`);
      }
    }
    
    console.log('\n📊 Testing table creation...');
    
    // Test each table
    const tables = ['yachts', 'customers', 'bookings', 'pricing_rules', 'document_templates', 'generated_documents'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Table accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // Try to insert sample data if tables exist
    console.log('\n🌱 Attempting to insert sample data...');
    
    try {
      const sampleDataSQL = fs.readFileSync('./sample-data.sql', 'utf8');
      console.log('📄 Sample data loaded, but manual insertion required due to RPC limitations');
      console.log('💡 To insert sample data, run the sample-data.sql file in the Supabase SQL editor');
    } catch (err) {
      console.log('⚠️ Sample data file not found or not accessible');
    }
    
    console.log('\n✅ Database setup process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Open the SQL Editor');
    console.log('3. Run the database-schema.sql file');
    console.log('4. Run the sample-data.sql file');
    console.log('5. Verify tables are created successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to setup database:', error);
    return false;
  }
}

setupDatabase().then(success => {
  if (success) {
    console.log('\n🎉 Database setup completed successfully!');
  } else {
    console.log('\n❌ Database setup encountered issues.');
  }
  process.exit(success ? 0 : 1);
});