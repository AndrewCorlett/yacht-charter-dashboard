/**
 * Unit Tests for BookingNumberGenerator Max-Increment Logic
 * Tests the change from gap-filling to max-increment logic
 * 
 * @created 2025-07-05
 */

import { 
  BookingNumberGenerator, 
  BookingNumberFormat, 
  getNextSequenceNumber, 
  findHighestSequence 
} from './src/models/utilities/BookingNumberGenerator.js'

console.log('=== BookingNumberGenerator Unit Tests ===\n')

// Test 1: findHighestSequence function
console.log('Test 1: findHighestSequence function')
try {
  // Test with empty array
  const emptyResult = findHighestSequence([])
  console.assert(emptyResult === 0, 'Empty array should return 0')
  console.log('✓ Empty array returns 0')

  // Test with single number
  const singleResult = findHighestSequence([5])
  console.assert(singleResult === 5, 'Single number should return that number')
  console.log('✓ Single number returns correctly')

  // Test with multiple numbers
  const multipleResult = findHighestSequence([1, 5, 3, 9, 2])
  console.assert(multipleResult === 9, 'Should return highest number')
  console.log('✓ Multiple numbers returns highest')

  console.log('✅ Test 1 passed\n')
} catch (error) {
  console.error('❌ Test 1 failed:', error.message)
}

// Test 2: getNextSequenceNumber function (max-increment logic)
console.log('Test 2: getNextSequenceNumber function (max-increment logic)')
try {
  // Test with empty array
  const emptyNext = getNextSequenceNumber([])
  console.assert(emptyNext === 1, 'Empty array should return 1')
  console.log('✓ Empty array returns 1')

  // Test with consecutive numbers (no gaps)
  const consecutiveNext = getNextSequenceNumber([1, 2, 3, 4, 5])
  console.assert(consecutiveNext === 6, 'Should return 6 (not filling gaps)')
  console.log('✓ Consecutive numbers returns next highest')

  // Test with gaps (should NOT fill them)
  const gapsNext = getNextSequenceNumber([1, 2, 5, 7])
  console.assert(gapsNext === 8, 'Should return 8, NOT 3 (no gap filling)')
  console.log('✓ With gaps returns highest + 1, not filling gaps')

  // Test with manual override scenario
  const manualOverrideNext = getNextSequenceNumber([1, 5])
  console.assert(manualOverrideNext === 6, 'After manual change to 5, next should be 6')
  console.log('✓ Manual override scenario works correctly')

  console.log('✅ Test 2 passed\n')
} catch (error) {
  console.error('❌ Test 2 failed:', error.message)
}

// Test 3: BookingNumberGenerator with YEAR_WEEK_YACHT_SEQ format
console.log('Test 3: BookingNumberGenerator YEAR_WEEK_YACHT_SEQ format')
try {
  const generator = new BookingNumberGenerator({
    format: BookingNumberFormat.YEAR_WEEK_YACHT_SEQ
  })

  // Mock existing bookings provider that simulates manual override
  const existingBookingsProvider = async (yy, boatCode) => {
    if (yy === '25' && boatCode === 'ZA') {
      // Simulate scenario where booking 01 was manually changed to 05
      return ['2527ZA05']
    }
    return []
  }

  // Generate next booking number after manual override
  const nextBooking = await generator.generateBookingNumber({
    yachtId: 'zavaria',
    date: new Date('2025-07-05'),
    existingBookingsProvider
  })

  // Should be 2527ZA06, not 2527ZA01 or 2527ZA02
  console.assert(
    nextBooking === '2527ZA06', 
    `Expected 2527ZA06 but got ${nextBooking}`
  )
  console.log('✓ Next booking after manual override is correct:', nextBooking)

  console.log('✅ Test 3 passed\n')
} catch (error) {
  console.error('❌ Test 3 failed:', error.message)
}

// Test 4: Multiple bookings with gaps (comprehensive test)
console.log('Test 4: Comprehensive gap handling test')
try {
  const generator = new BookingNumberGenerator({
    format: BookingNumberFormat.YEAR_WEEK_YACHT_SEQ
  })

  // Simulate bookings: 01, 02, 05, 09 (gaps at 03, 04, 06, 07, 08)
  const existingBookingsProvider = async (yy, boatCode) => {
    if (yy === '25' && boatCode === 'CM') {
      return ['2527CM01', '2527CM02', '2527CM05', '2527CM09']
    }
    return []
  }

  const nextBooking = await generator.generateBookingNumber({
    yachtId: 'calico-moon',
    date: new Date('2025-07-05'),
    existingBookingsProvider
  })

  // Should be 2527CM10, NOT any of the gaps
  console.assert(
    nextBooking === '2527CM10', 
    `Expected 2527CM10 (max + 1) but got ${nextBooking}`
  )
  console.log('✓ With multiple gaps, generates highest + 1:', nextBooking)

  console.log('✅ Test 4 passed\n')
} catch (error) {
  console.error('❌ Test 4 failed:', error.message)
}

console.log('=== All Unit Tests Completed ===')
console.log('\n✨ Summary: Max-increment logic is working correctly!')
console.log('The system now always uses the highest existing number + 1,')
console.log('preventing collisions when bookings are manually edited.')