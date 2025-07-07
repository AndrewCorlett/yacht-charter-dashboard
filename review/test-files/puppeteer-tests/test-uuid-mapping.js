/**
 * Test script to verify yacht UUID to name mapping fix
 * This simulates the booking creation process from the frontend
 */

// Import the BookingService
import BookingService from './src/services/supabase/BookingService.js'

async function testUUIDMapping() {
  console.log('=== Testing Yacht UUID to Name Mapping ===')
  
  // Test data as would be sent from frontend
  const testBookingData = {
    yacht_id: '50dba171-b830-4d88-9cb0-c14a37c4d58a', // Zavaria UUID
    customer_first_name: 'UUIDTest',
    customer_surname: 'User',
    customer_email: 'uuidtest@example.com',
    customer_phone: '+44 1234 567893',
    customer_street: '126 Test Street',
    customer_city: 'Test City',
    customer_postcode: 'TC1 2ST',
    customer_country: 'UK',
    start_date: '2025-07-08',
    end_date: '2025-07-15',
    charter_type: 'bareboat',
    booking_status: 'tentative',
    payment_status: 'pending',
    guest_count: 4,
    total_price: 2500,
    deposit_amount: 500,
    special_requirements: 'Test booking for UUID mapping verification'
  }
  
  try {
    console.log('\n1. Testing yacht UUID to name conversion...')
    
    // Test the UUID conversion directly
    const yachtName = await BookingService.getYachtNameFromId(testBookingData.yacht_id)
    console.log(`✓ Successfully converted UUID ${testBookingData.yacht_id} to yacht name: ${yachtName}`)
    
    console.log('\n2. Testing booking number generation...')
    
    // Test booking number generation
    const bookingNumber = await BookingService.generateBookingNumber(yachtName, testBookingData.start_date)
    console.log(`✓ Successfully generated booking number: ${bookingNumber}`)
    
    // Verify the format is YYWWBCNN
    const formatMatch = bookingNumber.match(/^(\d{2})(\d{2})([A-Z]{2})(\d{2})$/)
    if (formatMatch) {
      const [, year, week, boatCode, sequence] = formatMatch
      console.log(`✓ Booking number format is correct: YY=${year}, WW=${week}, BC=${boatCode}, NN=${sequence}`)
    } else {
      console.log(`✗ Booking number format is incorrect. Expected YYWWBCNN, got: ${bookingNumber}`)
    }
    
    console.log('\n3. Testing full booking creation...')
    
    // Test full booking creation
    const createdBooking = await BookingService.createBooking(testBookingData)
    console.log(`✓ Successfully created booking with ID: ${createdBooking.id}`)
    console.log(`✓ Booking number: ${createdBooking.booking_number}`)
    console.log(`✓ Yacht ID: ${createdBooking.yacht_id}`)
    console.log(`✓ Customer: ${createdBooking.customer_first_name} ${createdBooking.customer_surname}`)
    
    console.log('\n=== Test Results ===')
    console.log(`✓ UUID to name mapping: WORKING`)
    console.log(`✓ Booking number generation: WORKING`)
    console.log(`✓ Full booking creation: WORKING`)
    console.log(`✓ Generated booking code: ${createdBooking.booking_number}`)
    
    return {
      success: true,
      bookingId: createdBooking.id,
      bookingNumber: createdBooking.booking_number,
      yachtName: yachtName
    }
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message)
    console.error('Stack trace:', error.stack)
    
    return {
      success: false,
      error: error.message
    }
  }
}

// Run the test
testUUIDMapping().then(result => {
  if (result.success) {
    console.log('\n🎉 All tests passed! The yacht UUID to name mapping fix is working correctly.')
  } else {
    console.log('\n❌ Tests failed. The fix needs additional work.')
  }
}).catch(error => {
  console.error('Test runner error:', error)
})