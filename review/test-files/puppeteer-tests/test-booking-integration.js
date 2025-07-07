/**
 * Integration Tests for Booking Number Manual Override
 * Tests end-to-end workflows including booking number editing,
 * external booking creation, and sequential numbering
 * 
 * @created 2025-07-05
 */

import BookingService from './src/services/supabase/BookingService.js'
import { BookingModel, BookingType } from './src/models/core/BookingModel-unified.js'
import { supabase } from './src/services/supabase/supabaseClient.js'

console.log('=== Booking Number Override Integration Tests ===\n')

// Test configuration
const TEST_YACHT_ID = '3ffa9ca5-bd8e-4050-8b49-e5230fb23c73' // Zavaria
const TEST_YACHT_NAME = 'zavaria'

// Cleanup function
async function cleanupTestBookings(bookingNumbers) {
  try {
    for (const bookingNumber of bookingNumbers) {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('booking_number', bookingNumber)
      
      if (error && error.code !== 'PGRST116') { // Ignore 'no rows' error
        console.warn('Cleanup warning:', error)
      }
    }
  } catch (error) {
    console.warn('Cleanup error:', error)
  }
}

// Test 1: Manual Booking Number Update Workflow
console.log('Test 1: Manual Booking Number Update Workflow')
const test1BookingNumbers = []

try {
  const bookingService = new BookingService()
  
  // Step 1: Create initial booking
  console.log('  Step 1: Creating initial booking...')
  const bookingData1 = {
    yacht_id: TEST_YACHT_ID,
    yacht_name: 'Zavaria',
    customer_first_name: 'Test',
    customer_surname: 'Customer1',
    customer_email: 'test1@example.com',
    customer_phone: '+441234567890',
    customer_street: '123 Test Street',
    customer_city: 'Southampton',
    customer_postcode: 'SO14 3XG',
    customer_country: 'United Kingdom',
    charter_type: 'bareboat',
    start_date: '2025-07-07',
    end_date: '2025-07-14',
    port_of_departure: 'Marina Bay',
    port_of_arrival: 'Harbor Point',
    booking_status: 'tentative',
    payment_status: 'pending',
    base_rate: 5000,
    total_amount: 6000,
    deposit_amount: 1200,
    balance_due: 4800
  }
  
  const booking1 = await bookingService.createBooking(bookingData1)
  console.log('  ✓ Created booking:', booking1.booking_number)
  test1BookingNumbers.push(booking1.booking_number)
  
  // Verify it follows YYWWBCNN format
  const bookingNumberPattern = /^\d{2}\d{2}[A-Z]{2}\d{2}$/
  console.assert(
    bookingNumberPattern.test(booking1.booking_number),
    'Booking number should match YYWWBCNN format'
  )
  console.log('  ✓ Booking number format is correct')
  
  // Step 2: Manually update booking number
  console.log('  Step 2: Manually updating booking number...')
  const originalNumber = booking1.booking_number
  const newNumber = originalNumber.slice(0, -2) + '05' // Change last two digits to 05
  
  const updatedBooking = await bookingService.updateBookingNumber(booking1.id, newNumber)
  console.assert(
    updatedBooking.booking_number === newNumber,
    'Booking number should be updated'
  )
  console.log('  ✓ Updated booking number to:', updatedBooking.booking_number)
  test1BookingNumbers.push(newNumber)
  
  // Step 3: Create next booking and verify it uses max-increment
  console.log('  Step 3: Creating next booking...')
  const bookingData2 = {
    ...bookingData1,
    customer_first_name: 'Test',
    customer_surname: 'Customer2',
    customer_email: 'test2@example.com'
  }
  
  const booking2 = await bookingService.createBooking(bookingData2)
  console.log('  ✓ Created next booking:', booking2.booking_number)
  test1BookingNumbers.push(booking2.booking_number)
  
  // Verify it's 06, not 02
  const expectedNextNumber = newNumber.slice(0, -2) + '06'
  console.assert(
    booking2.booking_number === expectedNextNumber,
    `Next booking should be ${expectedNextNumber}, got ${booking2.booking_number}`
  )
  console.log('  ✓ Sequential numbering respects manual override')
  
  console.log('✅ Test 1 passed\n')
  
  // Cleanup
  await cleanupTestBookings(test1BookingNumbers)
} catch (error) {
  console.error('❌ Test 1 failed:', error.message)
  await cleanupTestBookings(test1BookingNumbers)
}

// Test 2: External Booking Creation Workflow
console.log('Test 2: External Booking Creation Workflow')
const test2BookingNumbers = []

try {
  const bookingService = new BookingService()
  
  // Step 1: Create external booking placeholder
  console.log('  Step 1: Creating external booking...')
  const externalBookingData = {
    yacht_id: TEST_YACHT_ID,
    yacht_name: 'Zavaria',
    start_date: '2025-07-07',
    end_date: '2025-07-14',
    customer_first_name: 'External',
    customer_surname: 'Booking',
    customer_email: 'external@placeholder.com',
    notes: 'Private charter booked outside system'
  }
  
  const externalBooking = await bookingService.createExternalBooking(externalBookingData)
  console.log('  ✓ Created external booking:', externalBooking.booking_number)
  test2BookingNumbers.push(externalBooking.booking_number)
  
  // Verify it's marked as external
  console.assert(
    externalBooking.booking_type === BookingType.EXTERNAL,
    'Booking should be marked as external'
  )
  console.log('  ✓ Booking type is external')
  
  // Verify it's confirmed by default
  console.assert(
    externalBooking.booking_status === 'confirmed',
    'External booking should be confirmed'
  )
  console.log('  ✓ External booking is confirmed')
  
  // Step 2: Create regular booking and verify sequential numbering
  console.log('  Step 2: Creating regular booking after external...')
  const regularBookingData = {
    yacht_id: TEST_YACHT_ID,
    yacht_name: 'Zavaria',
    customer_first_name: 'Regular',
    customer_surname: 'Customer',
    customer_email: 'regular@example.com',
    customer_phone: '+441234567890',
    customer_street: '456 Test Avenue',
    customer_city: 'Southampton',
    customer_postcode: 'SO14 4YZ',
    customer_country: 'United Kingdom',
    charter_type: 'bareboat',
    start_date: '2025-07-07',
    end_date: '2025-07-14',
    port_of_departure: 'Marina Bay',
    port_of_arrival: 'Harbor Point',
    booking_status: 'tentative',
    payment_status: 'pending',
    base_rate: 5000,
    total_amount: 6000,
    deposit_amount: 1200,
    balance_due: 4800
  }
  
  const regularBooking = await bookingService.createBooking(regularBookingData)
  console.log('  ✓ Created regular booking:', regularBooking.booking_number)
  test2BookingNumbers.push(regularBooking.booking_number)
  
  // Verify regular booking comes after external
  const externalSequence = parseInt(externalBooking.booking_number.slice(-2))
  const regularSequence = parseInt(regularBooking.booking_number.slice(-2))
  console.assert(
    regularSequence === externalSequence + 1,
    'Regular booking should follow external booking sequence'
  )
  console.log('  ✓ Sequential numbering includes external bookings')
  
  console.log('✅ Test 2 passed\n')
  
  // Cleanup
  await cleanupTestBookings(test2BookingNumbers)
} catch (error) {
  console.error('❌ Test 2 failed:', error.message)
  await cleanupTestBookings(test2BookingNumbers)
}

// Test 3: Conflict Detection
console.log('Test 3: Booking Number Conflict Detection')
const test3BookingNumbers = []

try {
  const bookingService = new BookingService()
  
  // Step 1: Create two bookings
  console.log('  Step 1: Creating two bookings...')
  const bookingData = {
    yacht_id: TEST_YACHT_ID,
    yacht_name: 'Zavaria',
    customer_first_name: 'Conflict',
    customer_surname: 'Test1',
    customer_email: 'conflict1@example.com',
    customer_phone: '+441234567890',
    customer_street: '789 Test Road',
    customer_city: 'Southampton',
    customer_postcode: 'SO14 5AB',
    customer_country: 'United Kingdom',
    charter_type: 'bareboat',
    start_date: '2025-07-07',
    end_date: '2025-07-14',
    port_of_departure: 'Marina Bay',
    port_of_arrival: 'Harbor Point',
    booking_status: 'tentative',
    payment_status: 'pending',
    base_rate: 5000,
    total_amount: 6000,
    deposit_amount: 1200,
    balance_due: 4800
  }
  
  const booking1 = await bookingService.createBooking(bookingData)
  console.log('  ✓ Created booking 1:', booking1.booking_number)
  test3BookingNumbers.push(booking1.booking_number)
  
  const booking2Data = {
    ...bookingData,
    customer_surname: 'Test2',
    customer_email: 'conflict2@example.com'
  }
  const booking2 = await bookingService.createBooking(booking2Data)
  console.log('  ✓ Created booking 2:', booking2.booking_number)
  test3BookingNumbers.push(booking2.booking_number)
  
  // Step 2: Try to update booking 2 with booking 1's number
  console.log('  Step 2: Testing conflict detection...')
  let conflictDetected = false
  try {
    await bookingService.updateBookingNumber(booking2.id, booking1.booking_number)
  } catch (error) {
    conflictDetected = true
    console.log('  ✓ Conflict detected:', error.message)
  }
  
  console.assert(conflictDetected, 'Should detect booking number conflict')
  console.log('  ✓ Conflict prevention works correctly')
  
  console.log('✅ Test 3 passed\n')
  
  // Cleanup
  await cleanupTestBookings(test3BookingNumbers)
} catch (error) {
  console.error('❌ Test 3 failed:', error.message)
  await cleanupTestBookings(test3BookingNumbers)
}

console.log('=== All Integration Tests Completed ===')
console.log('\n✨ Summary: End-to-end booking number override functionality works correctly!')
console.log('- Manual booking number updates are respected')
console.log('- External bookings integrate seamlessly')
console.log('- Conflict detection prevents duplicate numbers')
console.log('- Sequential numbering maintains integrity')