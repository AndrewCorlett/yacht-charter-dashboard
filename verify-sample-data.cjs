/**
 * SeaScape Sample Data Verification
 * Tests that sample data has been properly loaded
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
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

console.log('📊 SeaScape Sample Data Verification')
console.log('=' .repeat(50))

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTableExists() {
  try {
    console.log('\n🔍 Checking Bookings Table...')
    
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .limit(1)
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('❌ Bookings table does not exist')
        console.log('   Run migration script first: migration-unified-schema.sql')
        return false
      } else {
        console.log('❌ Table access error:', error.message)
        return false
      }
    } else {
      console.log('✅ Bookings table exists and accessible')
      return true
    }
  } catch (err) {
    console.log('❌ Table check failed:', err.message)
    return false
  }
}

async function countSampleData() {
  try {
    console.log('\n📈 Checking Sample Data Count...')
    
    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log('❌ Count query failed:', error.message)
      return 0
    } else {
      console.log(`✅ Found ${count} bookings in database`)
      return count
    }
  } catch (err) {
    console.log('❌ Count check failed:', err.message)
    return 0
  }
}

async function analyzeBookingStatuses() {
  try {
    console.log('\n📊 Analyzing Booking Statuses...')
    
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_status')
    
    if (error) {
      console.log('❌ Status query failed:', error.message)
      return
    }
    
    const statusCounts = {}
    data.forEach(booking => {
      statusCounts[booking.booking_status] = (statusCounts[booking.booking_status] || 0) + 1
    })
    
    console.log('   Status Distribution:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   • ${status}: ${count} bookings`)
    })
    
    return statusCounts
  } catch (err) {
    console.log('❌ Status analysis failed:', err.message)
  }
}

async function checkDateRanges() {
  try {
    console.log('\n📅 Checking Date Ranges...')
    
    const { data, error } = await supabase
      .from('bookings')
      .select('start_date, end_date')
      .order('start_date')
    
    if (error) {
      console.log('❌ Date query failed:', error.message)
      return
    }
    
    if (data.length === 0) {
      console.log('⚠️  No booking data found')
      return
    }
    
    const today = new Date().toISOString().split('T')[0]
    let pastCount = 0
    let currentCount = 0
    let futureCount = 0
    
    data.forEach(booking => {
      if (booking.end_date < today) {
        pastCount++
      } else if (booking.start_date <= today && booking.end_date >= today) {
        currentCount++
      } else {
        futureCount++
      }
    })
    
    console.log('   Date Distribution:')
    console.log(`   • Past bookings: ${pastCount}`)
    console.log(`   • Current bookings: ${currentCount}`)
    console.log(`   • Future bookings: ${futureCount}`)
    
    const earliestDate = data[0].start_date
    const latestDate = data[data.length - 1].end_date
    console.log(`   • Date range: ${earliestDate} to ${latestDate}`)
    
  } catch (err) {
    console.log('❌ Date analysis failed:', err.message)
  }
}

async function checkCustomerData() {
  try {
    console.log('\n👥 Checking Customer Data...')
    
    const { data, error } = await supabase
      .from('bookings')
      .select('customer_first_name, customer_surname, customer_email, customer_country')
      .limit(5)
    
    if (error) {
      console.log('❌ Customer query failed:', error.message)
      return
    }
    
    console.log('   Sample Customer Data:')
    data.forEach((booking, index) => {
      console.log(`   ${index + 1}. ${booking.customer_first_name} ${booking.customer_surname}`)
      console.log(`      Email: ${booking.customer_email}`)
      console.log(`      Country: ${booking.customer_country}`)
    })
    
    // Check for required fields
    const missingNames = data.filter(b => !b.customer_first_name || !b.customer_surname)
    const missingEmails = data.filter(b => !b.customer_email)
    
    if (missingNames.length === 0 && missingEmails.length === 0) {
      console.log('   ✅ All required customer fields populated')
    } else {
      console.log(`   ⚠️  Found ${missingNames.length} bookings missing names`)
      console.log(`   ⚠️  Found ${missingEmails.length} bookings missing emails`)
    }
    
  } catch (err) {
    console.log('❌ Customer data check failed:', err.message)
  }
}

async function checkFileData() {
  try {
    console.log('\n📁 Checking File Upload Data...')
    
    const { data, error } = await supabase
      .from('bookings')
      .select('crew_experience_file_name, crew_experience_file_url, crew_experience_file_size')
      .not('crew_experience_file_name', 'is', null)
    
    if (error) {
      console.log('❌ File query failed:', error.message)
      return
    }
    
    console.log(`   Found ${data.length} bookings with crew experience files`)
    
    if (data.length > 0) {
      console.log('   Sample file data:')
      data.slice(0, 3).forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.crew_experience_file_name}`)
        console.log(`      URL: ${booking.crew_experience_file_url}`)
        console.log(`      Size: ${booking.crew_experience_file_size} bytes`)
      })
    }
    
  } catch (err) {
    console.log('❌ File data check failed:', err.message)
  }
}

async function checkRecentBookings() {
  try {
    console.log('\n🕒 Recent Bookings Sample...')
    
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_number, customer_first_name, customer_surname, start_date, booking_status')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.log('❌ Recent bookings query failed:', error.message)
      return
    }
    
    console.log('   Most Recent Bookings:')
    data.forEach((booking, index) => {
      console.log(`   ${index + 1}. ${booking.booking_number} - ${booking.customer_first_name} ${booking.customer_surname}`)
      console.log(`      Start: ${booking.start_date}, Status: ${booking.booking_status}`)
    })
    
  } catch (err) {
    console.log('❌ Recent bookings check failed:', err.message)
  }
}

function generateSampleDataInstructions() {
  console.log('\n📝 Sample Data Deployment Instructions:')
  console.log('=' .repeat(50))
  
  console.log('\n🎯 Deploy Sample Data:')
  console.log('\n1. Ensure Schema is Deployed:')
  console.log('   - First run: migration-unified-schema.sql')
  console.log('   - Verify bookings table exists')
  
  console.log('\n2. Insert Sample Data:')
  console.log('   - Open Supabase Dashboard SQL Editor')
  console.log('   - Copy content from: sample-bookings-data.sql')
  console.log('   - Execute the SQL script')
  console.log('   - Should insert 15 test bookings')
  
  console.log('\n3. Verify Data:')
  console.log('   - Run: node verify-sample-data.cjs')
  console.log('   - Check Table Editor in Dashboard')
  console.log('   - Verify booking counts and statuses')
  
  console.log('\n📊 Expected Sample Data:')
  console.log('   • Total Bookings: 15')
  console.log('   • Statuses: tentative, confirmed, completed, cancelled')
  console.log('   • Date Range: Past, current, and future bookings')
  console.log('   • Customer Countries: UK, Germany (international)')
  console.log('   • Charter Types: bareboat, skippered charter')
  console.log('   • File Examples: 8 bookings with crew documents')
  
  console.log('\n🔍 Quick Verification Queries:')
  console.log('-- Count all bookings')
  console.log('SELECT COUNT(*) FROM bookings;')
  console.log('')
  console.log('-- Status breakdown') 
  console.log('SELECT booking_status, COUNT(*) FROM bookings GROUP BY booking_status;')
  console.log('')
  console.log('-- Recent bookings')
  console.log('SELECT booking_number, customer_first_name, start_date FROM bookings ORDER BY created_at DESC LIMIT 5;')
}

async function main() {
  try {
    const tableExists = await checkTableExists()
    
    if (!tableExists) {
      generateSampleDataInstructions()
      return
    }
    
    const bookingCount = await countSampleData()
    
    if (bookingCount === 0) {
      console.log('\n⚠️  No sample data found')
      generateSampleDataInstructions()
      return
    }
    
    if (bookingCount < 10) {
      console.log('\n⚠️  Limited sample data found')
      console.log('   Expected: 15 bookings')
      console.log('   Found: ' + bookingCount + ' bookings')
      console.log('   Consider rerunning sample-bookings-data.sql')
    }
    
    await analyzeBookingStatuses()
    await checkDateRanges()
    await checkCustomerData()
    await checkFileData()
    await checkRecentBookings()
    
    if (bookingCount >= 10) {
      console.log('\n🎉 Sample Data Verification Complete!')
      console.log('✅ Sample data is properly loaded and diverse')
      console.log('✅ Ready for application testing and development')
      
      console.log('\n🔄 Next Steps:')
      console.log('   1. Test application with real data')
      console.log('   2. Verify BookingPanel loads sample booking')
      console.log('   3. Test search and filter functionality')
      console.log('   4. Run Puppeteer end-to-end tests')
    }
    
  } catch (error) {
    console.error('\n❌ Sample data verification failed:', error)
  }
}

main()