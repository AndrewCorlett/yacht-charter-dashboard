/**
 * Test script for booking code generation with gap-filling logic
 * Tests the new YYWWBCNN format
 */

import { BookingNumberGenerator, BookingNumberFormat, YachtCodes, getISOWeek, firstMissingInteger } from './src/models/utilities/BookingNumberGenerator.js'

// Test 1: ISO Week Calculation
console.log('=== Test 1: ISO Week Calculation ===')
const testDates = [
  new Date('2025-04-28'), // Week 18
  new Date('2025-05-12'), // Week 20  
  new Date('2025-06-16'), // Week 24
  new Date('2026-04-27')  // Week 18 of 2026
]

testDates.forEach(date => {
  const week = getISOWeek(date)
  console.log(`Date: ${date.toISOString().slice(0, 10)} -> ISO Week: ${week}`)
})

// Test 2: Gap-filling Logic
console.log('\n=== Test 2: Gap-filling Logic ===')
const existingNumbers = [1, 2, 3, 5, 7]  // Missing 4 and 6
const firstMissing = firstMissingInteger(existingNumbers, 1, 99)
console.log(`Existing numbers: [${existingNumbers.join(', ')}]`)
console.log(`First missing number: ${firstMissing}`) // Should be 4

// Test 3: Booking Code Generation
console.log('\n=== Test 3: Booking Code Generation ===')

// Mock existing bookings provider
const mockExistingBookingsProvider = async (yy, boatCode) => {
  console.log(`Querying existing bookings for year ${yy} and boat ${boatCode}`)
  
  // Simulate existing booking codes
  const mockCodes = {
    '25ZA': ['2518ZA01', '2520ZA02', '2522ZA03'], // Missing 04 for gap test
    '25SP': ['2515SP01', '2520SP02'],
    '26ZA': []  // No existing codes for 2026
  }
  
  const key = `${yy}${boatCode}`
  return mockCodes[key] || []
}

async function testBookingCodeGeneration() {
  const generator = new BookingNumberGenerator({
    format: BookingNumberFormat.YEAR_WEEK_YACHT_SEQ
  })

  const testScenarios = [
    {
      name: 'First booking of year for ZA',
      date: new Date('2025-04-28'), // Week 18
      yachtId: 'zavaria',
      expectedPattern: /^2518ZA01$/
    },
    {
      name: 'Gap reuse test for ZA',
      date: new Date('2025-06-16'), // Week 24
      yachtId: 'zavaria', 
      expectedPattern: /^2524ZA04$/ // Should reuse missing 04
    },
    {
      name: 'New year reset for ZA',
      date: new Date('2026-04-27'), // Week 18 of 2026
      yachtId: 'zavaria',
      expectedPattern: /^2618ZA01$/ // Reset to 01 for new year
    },
    {
      name: 'Different yacht test',
      date: new Date('2025-05-12'), // Week 20
      yachtId: 'spectre',
      expectedPattern: /^2520SP03$/ // Should be 03
    }
  ]

  for (const scenario of testScenarios) {
    try {
      console.log(`\nTesting: ${scenario.name}`)
      console.log(`Date: ${scenario.date.toISOString().slice(0, 10)}, Yacht: ${scenario.yachtId}`)
      
      const bookingCode = await generator.generateBookingNumber({
        date: scenario.date,
        yachtId: scenario.yachtId,
        existingBookingsProvider: mockExistingBookingsProvider
      })
      
      console.log(`Generated code: ${bookingCode}`)
      console.log(`Expected pattern: ${scenario.expectedPattern}`)
      console.log(`Matches pattern: ${scenario.expectedPattern.test(bookingCode)}`)
      
      // Validate the format
      const yy = scenario.date.getFullYear().toString().slice(-2)
      const ww = getISOWeek(scenario.date).toString().padStart(2, '0')
      const bc = YachtCodes[scenario.yachtId]
      
      console.log(`Expected YY: ${yy}, WW: ${ww}, BC: ${bc}`)
      console.log(`Actual format: ${bookingCode.slice(0, 2)}-${bookingCode.slice(2, 4)}-${bookingCode.slice(4, 6)}-${bookingCode.slice(6, 8)}`)
      
    } catch (error) {
      console.error(`Error in scenario "${scenario.name}":`, error.message)
    }
  }
}

// Test 4: Yacht Code Validation
console.log('\n=== Test 4: Yacht Code Validation ===')
console.log('Available yacht codes:', YachtCodes)

Object.entries(YachtCodes).forEach(([yachtId, code]) => {
  console.log(`${yachtId} -> ${code}`)
})

// Run the tests
testBookingCodeGeneration().then(() => {
  console.log('\n=== All tests completed ===')
}).catch(error => {
  console.error('Test failed:', error)
})