const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase Connection...');
  
  try {
    // Load environment variables manually
    const supabaseUrl = 'https://ijsvrotcvrvrmnzazxya.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqc3Zyb3RjdnJ2cm1uemF6eHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTMyNDYsImV4cCI6MjA2NTY2OTI0Nn0.fRotMgFLv1HNtWI5j1jpq1fcb4-menw9zdHb_DI5Vi0';
    
    console.log('📡 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('🧪 Testing basic connection...');
    // Test auth endpoint first
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('📊 Connection details:');
    console.log(`  URL: ${supabaseUrl}`);
    console.log(`  Status: Connected`);
    
    // Test listing available tables
    console.log('\n🗃️ Testing table access...');
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(10);
      
      if (tablesError) {
        console.log('⚠️ Could not list tables (this is normal for restricted access)');
        console.log('   Error:', tablesError.message);
      } else {
        console.log('📋 Available tables:');
        tables.forEach(table => {
          console.log(`  - ${table.table_name}`);
        });
      }
    } catch (tableError) {
      console.log('⚠️ Table listing not available (this is normal)');
    }
    
    // Test potential yacht charter database tables
    console.log('\n🚤 Testing yacht charter specific tables...');
    const testTables = ['bookings', 'yachts', 'customers', 'charters'];
    
    for (const tableName of testTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Table accessible (${data.length} records tested)`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Supabase setup verification complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to test Supabase connection:', error);
    return false;
  }
}

testSupabaseConnection().then(success => {
  if (success) {
    console.log('\n✅ Supabase is ready for use in yacht-charter-dashboard!');
  } else {
    console.log('\n❌ Supabase setup needs attention.');
  }
  process.exit(success ? 0 : 1);
});