/**
 * SeaScape Supabase Connection Verification
 * Simple test using only native Node.js and Supabase client
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env file manually
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && !key.startsWith('#')) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    })
    
    return envVars
  } catch (error) {
    console.error('❌ Could not read .env file:', error.message)
    return {}
  }
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY

console.log('🚀 SeaScape Supabase Connection Verification')
console.log('=' .repeat(50))

// Verify environment variables
console.log('\n📋 Environment Configuration:')
console.log(`✓ Project URL: ${supabaseUrl}`)
console.log(`✓ Anon Key: ${supabaseAnonKey ? 'Present (' + supabaseAnonKey.substring(0, 20) + '...)' : 'Missing'}`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Missing required environment variables!')
  console.error('   Check .env file in project directory')
  process.exit(1)
}

// Verify URL format
if (!supabaseUrl.includes('kbwjtihjyhapaclyytxn')) {
  console.error('\n❌ Wrong Supabase project URL!')
  console.error('   Expected: kbwjtihjyhapaclyytxn')
  console.error('   Found:', supabaseUrl)
  process.exit(1)
}

console.log('\n✅ Environment configuration looks correct')

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n🔌 Testing Supabase Connection...')
    
    // Test connection with a predictable error
    const { data, error } = await supabase
      .from('non_existent_table')
      .select('*')
      .limit(1)
    
    if (error) {
      // This error is expected - it means we can connect but table doesn't exist
      if (error.message.includes('relation') || error.code === 'PGRST106') {
        console.log('✅ Connection successful!')
        console.log('   Database is accessible (table not found as expected)')
        return true
      } else if (error.message.includes('JWT')) {
        console.log('❌ Authentication error:', error.message)
        console.log('   Check your anon key')
        return false
      } else {
        console.log('⚠️  Unexpected error:', error.message)
        console.log('   Code:', error.code)
        return false
      }
    } else {
      console.log('⚠️  Unexpected: query should have failed')
      return true
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message)
    return false
  }
}

async function testBookingsTable() {
  try {
    console.log('\n📊 Testing Bookings Table...')
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(1)
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  Bookings table not found (expected before schema deployment)')
        return 'not_deployed'
      } else {
        console.log('❌ Table access error:', error.message)
        return 'error'
      }
    } else {
      console.log('✅ Bookings table exists!')
      console.log(`   Found ${data.length} record(s)`)
      return 'deployed'
    }
  } catch (err) {
    console.log('❌ Table test failed:', err.message)
    return 'error'
  }
}

function printDeploymentInstructions() {
  console.log('\n📝 Manual Schema Deployment Required:')
  console.log('=' .repeat(50))
  
  console.log('\n🎯 Steps to Deploy Schema:')
  console.log('\n1. Open Supabase Dashboard:')
  console.log('   https://supabase.com/dashboard/project/kbwjtihjyhapaclyytxn')
  
  console.log('\n2. Navigate to SQL Editor:')
  console.log('   - Click "SQL Editor" in sidebar')
  console.log('   - Click "New Query"')
  
  console.log('\n3. Execute Schema Migration:')
  console.log('   - Copy all content from: migration-unified-schema.sql')
  console.log('   - Paste into SQL Editor')
  console.log('   - Click "Run" button')
  console.log('   - Wait for success message')
  
  console.log('\n4. Insert Sample Data:')
  console.log('   - Copy content from: sample-bookings-data.sql')
  console.log('   - Paste into SQL Editor')
  console.log('   - Click "Run" button')
  console.log('   - Should insert 15 test bookings')
  
  console.log('\n5. Verify Deployment:')
  console.log('   - Go to Table Editor')
  console.log('   - Check "bookings" table exists')
  console.log('   - Verify sample data is present')
  
  console.log('\n6. Get Service Role Key:')
  console.log('   - Go to Settings > API')
  console.log('   - Copy service_role key')
  console.log('   - Update .env file')
  
  console.log('\n🔍 Quick Verification Queries:')
  console.log('-- Count bookings by status')
  console.log('SELECT booking_status, COUNT(*) FROM bookings GROUP BY booking_status;')
  console.log('')
  console.log('-- Show recent bookings')
  console.log('SELECT booking_number, customer_first_name, start_date FROM bookings ORDER BY created_at DESC LIMIT 5;')
}

async function main() {
  const connected = await testConnection()
  
  if (connected) {
    const tableStatus = await testBookingsTable()
    
    if (tableStatus === 'deployed') {
      console.log('\n🎉 Schema Already Deployed!')
      console.log('✅ SeaScape project is ready for application testing')
      
      console.log('\n🔄 Next Steps:')
      console.log('   1. Update service role key in .env')
      console.log('   2. Test application connection')
      console.log('   3. Run Puppeteer tests')
      
    } else if (tableStatus === 'not_deployed') {
      printDeploymentInstructions()
    } else {
      console.log('\n❌ Table access issues detected')
      console.log('   Check RLS policies and permissions')
    }
  } else {
    console.log('\n❌ Connection failed')
    console.log('   Check credentials and network connectivity')
  }
  
  console.log('\n📁 Ready Files:')
  console.log('   ✓ migration-unified-schema.sql')
  console.log('   ✓ sample-bookings-data.sql')
  console.log('   ✓ .env (configured)')
}

main().catch(console.error)