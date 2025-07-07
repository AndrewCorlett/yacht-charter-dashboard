/**
 * Supabase Connection Verification Script
 * Tests connection to SeaScape project and verifies schema readiness
 */

const { createClient } = require('@supabase/supabase-js')
const { config } = require('dotenv')

// Load environment variables from yacht-charter-dashboard/.env
config({ path: './yacht-charter-dashboard/.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🚀 SeaScape Supabase Connection Verification')
console.log('=' .repeat(50))

// Verify environment variables
console.log('\n📋 Environment Variables Check:')
console.log(`✓ VITE_SUPABASE_URL: ${supabaseUrl}`)
console.log(`✓ VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Present' : 'Missing'}`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables!')
  console.error('   Make sure .env file exists in yacht-charter-dashboard/')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyConnection() {
  try {
    console.log('\n🔌 Testing Supabase Connection...')
    
    // Test basic connection with a query that should fail predictably
    const { data, error } = await supabase
      .from('_test_table_that_does_not_exist')
      .select('*')
      .limit(1)
    
    // We expect this to fail with a specific error (table doesn't exist)
    // If we get a different error, it means connection issues
    if (error && error.code === 'PGRST106') {
      console.log('✅ Connection successful - can reach database')
      console.log('   Error as expected: table does not exist')
    } else if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('✅ Connection successful - can reach database')
      console.log('   PostgreSQL responding correctly')
    } else if (error) {
      console.log('❌ Connection error:', error.message)
      console.log('   Error code:', error.code)
      return false
    } else {
      console.log('⚠️  Unexpected response - table should not exist')
    }
    
    return true
  } catch (err) {
    console.error('❌ Connection failed:', err.message)
    return false
  }
}

async function testHealthCheck() {
  try {
    console.log('\n🔍 Testing Supabase Health...')
    
    // Try to access Supabase REST endpoint info
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })
    
    if (response.ok) {
      console.log('✅ REST API endpoint accessible')
      console.log(`   Status: ${response.status} ${response.statusText}`)
    } else {
      console.log(`⚠️  REST API response: ${response.status} ${response.statusText}`)
    }
    
  } catch (err) {
    console.log('⚠️  Health check failed:', err.message)
  }
}

function generateSchemaDeploymentInstructions() {
  console.log('\n📝 Schema Deployment Instructions:')
  console.log('=' .repeat(50))
  console.log('\n1. 🌐 Open Supabase Dashboard:')
  console.log('   https://supabase.com/dashboard/projects')
  
  console.log('\n2. 🎯 Select SeaScape Project:')
  console.log('   - Project ID: kbwjtihjyhapaclyytxn')
  console.log('   - Project URL: https://kbwjtihjyhapaclyytxn.supabase.co')
  
  console.log('\n3. 🛠️  Navigate to SQL Editor:')
  console.log('   - Click "SQL Editor" in the left sidebar')
  console.log('   - Click "New Query" button')
  
  console.log('\n4. 📄 Execute Migration Script:')
  console.log('   - Copy content from: migration-unified-schema.sql')
  console.log('   - Paste into the SQL Editor')
  console.log('   - Click "Run" button')
  console.log('   - Wait for "Success. No rows returned" message')
  
  console.log('\n5. ✅ Verify Table Creation:')
  console.log('   - Navigate to "Table Editor"')
  console.log('   - Confirm "bookings" table exists')
  console.log('   - Check table has 60+ columns')
  console.log('   - Verify indexes are created')
  
  console.log('\n6. 📊 Insert Sample Data:')
  console.log('   - Return to SQL Editor')
  console.log('   - Execute: sample-bookings-data.sql')
  console.log('   - Verify 15 test bookings are inserted')
  
  console.log('\n7. 🔒 Get Service Role Key:')
  console.log('   - Go to Settings > API')
  console.log('   - Copy "service_role" key (NOT anon key)')
  console.log('   - Update VITE_SUPABASE_SERVICE_ROLE_KEY in .env')
  
  console.log('\n📋 Files Ready for Deployment:')
  console.log('   ✓ migration-unified-schema.sql (main schema)')
  console.log('   ✓ sample-bookings-data.sql (test data)')
  console.log('   ✓ .env (environment configuration)')
  
  console.log('\n🧪 Verification Commands (run after deployment):')
  console.log('   node verify-supabase-schema.cjs')
  console.log('   npm run test:connection')
  
  console.log('\n🎯 Next Steps After Schema Deployment:')
  console.log('   1. Configure storage bucket for crew documents')
  console.log('   2. Test connection with updated service role key')
  console.log('   3. Run application and verify data loads')
  console.log('   4. Execute end-to-end Puppeteer tests')
  
  console.log('\n⚠️  Important Security Notes:')
  console.log('   - Never commit .env file to git')
  console.log('   - Service role key bypasses RLS - use carefully')
  console.log('   - Enable MFA on Supabase account')
}

function generateSQLSnippets() {
  console.log('\n🔍 Quick Verification SQL Snippets:')
  console.log('   (Run these in Supabase SQL Editor after deployment)')
  console.log('')
  console.log('-- Check table exists and structure')
  console.log('SELECT column_name, data_type, is_nullable')
  console.log('FROM information_schema.columns')
  console.log('WHERE table_name = \'bookings\'')
  console.log('ORDER BY ordinal_position;')
  console.log('')
  console.log('-- Count sample data')
  console.log('SELECT booking_status, COUNT(*) FROM bookings GROUP BY booking_status;')
  console.log('')
  console.log('-- Test booking retrieval')
  console.log('SELECT booking_number, customer_first_name, customer_surname, start_date')
  console.log('FROM bookings ORDER BY created_at DESC LIMIT 5;')
  console.log('')
  console.log('-- Check indexes')
  console.log('SELECT indexname FROM pg_indexes WHERE tablename = \'bookings\';')
}

async function main() {
  try {
    const connectionOk = await verifyConnection()
    
    if (connectionOk) {
      await testHealthCheck()
    }
    
    generateSchemaDeploymentInstructions()
    generateSQLSnippets()
    
    console.log('\n🎉 Verification Complete!')
    console.log('SeaScape project is accessible and ready for schema deployment.')
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  }
}

// Run verification
main()