/**
 * Test booking number update via API
 * This will test that the tripType schema fix works
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzOTYxMzgsImV4cCI6MjAzNDk3MjEzOH0.ZGOLPBFa3TA8L6PqUe_KFKt-tJLrSItBjXX6GRYfVNg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBookingUpdate() {
  try {
    console.log('🧪 Testing booking number update...')
    
    // First, get existing booking
    const bookingId = 'e7be5475-bffd-46d7-9a35-3e3d3983cee0' // The one with 2527CM04
    
    console.log('📖 Step 1: Get existing booking')
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
    
    if (fetchError) {
      throw new Error(`Failed to fetch booking: ${fetchError.message}`)
    }
    
    console.log('✅ Current booking number:', existingBooking.booking_number)
    console.log('📝 Booking details:', {
      id: existingBooking.id,
      customer_first_name: existingBooking.customer_first_name,
      charter_type: existingBooking.charter_type
    })
    
    console.log('📖 Step 2: Update booking number from 2527CM04 to 2527CM05')
    
    // Try to update the booking number
    const newBookingNumber = '2527CM05'
    const updateData = {
      booking_number: newBookingNumber,
      updated_at: new Date().toISOString()
    }
    
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Update failed:', updateError)
      throw new Error(`Update failed: ${updateError.message}`)
    }
    
    console.log('✅ Successfully updated booking number to:', updatedBooking.booking_number)
    
    console.log('📖 Step 3: Verify update persisted')
    
    // Fetch again to verify
    const { data: verifyBooking, error: verifyError } = await supabase
      .from('bookings')
      .select('booking_number')
      .eq('id', bookingId)
      .single()
    
    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`)
    }
    
    if (verifyBooking.booking_number === newBookingNumber) {
      console.log('✅ Update verified successfully!')
    } else {
      console.log('❌ Update verification failed')
      console.log('Expected:', newBookingNumber)
      console.log('Actual:', verifyBooking.booking_number)
    }
    
    console.log('📖 Step 4: Test booking number sequencing')
    
    // Get all booking numbers for CM (Calico Moon) in 2025
    const { data: allBookings, error: getAllError } = await supabase
      .from('bookings')
      .select('booking_number')
      .like('booking_number', '25__CM__')
    
    if (getAllError) {
      throw new Error(`Failed to get all bookings: ${getAllError.message}`)
    }
    
    const bookingNumbers = allBookings.map(b => b.booking_number).sort()
    console.log('📝 All CM bookings for 2025:', bookingNumbers)
    
    // Extract NN numbers
    const nnNumbers = bookingNumbers.map(num => {
      const match = num.match(/\\d{2}\\d{2}CM(\\d{2})/)
      return match ? parseInt(match[1]) : 0
    }).filter(n => n > 0).sort((a, b) => a - b)
    
    console.log('📝 NN sequence numbers:', nnNumbers)
    const highestNN = Math.max(...nnNumbers)
    console.log('📝 Highest NN number:', highestNN)
    console.log('📝 Next NN should be:', highestNN + 1)
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
    throw error
  }
}

// Run the test
testBookingUpdate()
  .then(() => {
    console.log('🎉 API test completed successfully!')
  })
  .catch(error => {
    console.error('💥 API test failed:', error.message)
    process.exit(1)
  })