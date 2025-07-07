/**
 * Verify what's in the Supabase database
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Mock fetch if not available
if (typeof fetch === 'undefined') {
  global.fetch = (await import('node-fetch')).default
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl)
  console.log('VITE_SUPABASE_ANON_KEY:', !!supabaseKey)
  process.exit(1)
}

console.log('=== Supabase Database Verification ===\n')

const supabase = createClient(supabaseUrl, supabaseKey)

try {
  console.log('1. Fetching all bookings...')
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  console.log(`   Found ${bookings.length} bookings`)
  
  console.log('\n2. Analyzing booking codes...')
  
  const bookingCodes = bookings.map(b => ({
    id: b.id,
    booking_number: b.booking_number,
    yacht_name: b.yacht_name,
    yacht_id: b.yacht_id,
    customer_name: `${b.customer_first_name} ${b.customer_surname}`,
    start_date: b.start_date,
    created_at: b.created_at
  }))
  
  // Show all booking codes
  console.log('   All booking codes:')
  bookingCodes.forEach((booking, index) => {
    console.log(`   ${index + 1}. ${booking.booking_number} - ${booking.yacht_name} - ${booking.customer_name} (${booking.start_date})`)
  })
  
  console.log('\n3. Checking for YYWWBCNN format codes...')
  
  const yywwbcnnPattern = /^\d{2}\d{2}[A-Z]{2}\d{2}$/
  const newFormatCodes = bookingCodes.filter(b => yywwbcnnPattern.test(b.booking_number))
  
  console.log(`   Found ${newFormatCodes.length} codes in YYWWBCNN format:`)
  
  newFormatCodes.forEach((booking, index) => {
    const code = booking.booking_number
    const yy = code.slice(0, 2)
    const ww = code.slice(2, 4)
    const bc = code.slice(4, 6)
    const nn = code.slice(6, 8)
    
    console.log(`   ${index + 1}. ${code}:`)
    console.log(`      - Year: 20${yy}`)
    console.log(`      - Week: ${ww}`)
    console.log(`      - Yacht: ${bc} (${booking.yacht_name})`)
    console.log(`      - Sequence: ${nn}`)
    console.log(`      - Customer: ${booking.customer_name}`)
    console.log(`      - Start Date: ${booking.start_date}`)
    console.log(`      - Created: ${booking.created_at}`)
    console.log('')
  })
  
  console.log('4. Checking for old BK format codes...')
  
  const bkPattern = /^BK\d{9}$/
  const oldFormatCodes = bookingCodes.filter(b => bkPattern.test(b.booking_number))
  
  console.log(`   Found ${oldFormatCodes.length} codes in old BK format:`)
  oldFormatCodes.forEach((booking, index) => {
    console.log(`   ${index + 1}. ${booking.booking_number} - ${booking.yacht_name} - ${booking.customer_name}`)
  })
  
  console.log('\n5. Checking Zavaria bookings specifically...')
  
  const zavariaBookings = bookingCodes.filter(b => 
    b.yacht_name?.toLowerCase().includes('zavaria') || 
    b.yacht_id?.toLowerCase().includes('zavaria')
  )
  
  console.log(`   Found ${zavariaBookings.length} Zavaria bookings:`)
  zavariaBookings.forEach((booking, index) => {
    console.log(`   ${index + 1}. ${booking.booking_number} - ${booking.customer_name} (${booking.start_date})`)
  })
  
  // Check for test bookings created today
  const today = new Date().toISOString().split('T')[0]
  const todayBookings = bookingCodes.filter(b => b.created_at.startsWith(today))
  
  console.log(`\n6. Bookings created today (${today}):`)
  console.log(`   Found ${todayBookings.length} bookings created today:`)
  todayBookings.forEach((booking, index) => {
    console.log(`   ${index + 1}. ${booking.booking_number} - ${booking.yacht_name} - ${booking.customer_name}`)
  })
  
  console.log('\n=== Summary ===')
  console.log(`✓ Total bookings: ${bookings.length}`)
  console.log(`✓ YYWWBCNN format: ${newFormatCodes.length}`)
  console.log(`✓ Old BK format: ${oldFormatCodes.length}`)  
  console.log(`✓ Zavaria bookings: ${zavariaBookings.length}`)
  console.log(`✓ Created today: ${todayBookings.length}`)
  
  if (newFormatCodes.length > 0) {
    console.log('\n🎉 SUCCESS: New YYWWBCNN booking codes found in database!')
    console.log('The booking code generation is working correctly.')
  } else {
    console.log('\n⚠️ No YYWWBCNN format codes found. Check if new bookings were created.')
  }
  
} catch (error) {
  console.error('Database verification failed:', error.message)
}