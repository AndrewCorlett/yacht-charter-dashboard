/**
 * Complete test for booking code generation following exact specification
 * Tests the YYWWBCNN format: year + ISO week + boat code + sequence number
 */

import { BookingNumberGenerator, BookingNumberFormat, getISOWeek, getYachtCode } from './src/models/utilities/BookingNumberGenerator.js'

// Mock function to simulate Supabase query for existing booking numbers
const mockExistingBookingsProvider = async (yy, boatCode) => {
  console.log(`[MockDB] Querying bookings WHERE code LIKE '${yy}%${boatCode}__'`)
  
  // Simulate some existing booking codes
  const mockDatabase = {
    '25ZA': ['2518ZA01', '2520ZA02'],  // Existing ZA bookings in 2025
    '25SP': ['2515SP01'],               // Existing SP booking in 2025
    '25CM': [],                         // No existing CM bookings
    '26ZA': []                          // No 2026 bookings yet
  }
  
  const key = `${yy}${boatCode}`
  const existing = mockDatabase[key] || []
  console.log(`[MockDB] Found existing codes:`, existing)
  return existing
}

async function testBookingCodeGeneration() {
  console.log('=== Testing Complete Booking Code Generation ===\n')
  
  const generator = new BookingNumberGenerator({
    format: BookingNumberFormat.YEAR_WEEK_YACHT_SEQ
  })

  // Test scenarios exactly as specified
  const testCases = [
    {
      name: 'First booking of year for Zavaria',
      startDate: '2025-04-28',  // Should be week 18
      yachtId: 'Zavaria',
      expectedFormat: '2518ZA01'
    },
    {
      name: 'Sequential booking for Zavaria', 
      startDate: '2025-05-12',  // Should be week 20
      yachtId: 'Zavaria',
      expectedFormat: '2520ZA03'  // Should be 03 (after 01, 02)
    },
    {
      name: 'Gap reuse test',
      startDate: '2025-06-16',  // Week varies by exact ISO calculation
      yachtId: 'Zavaria', 
      description: 'Should reuse missing sequence number'
    },
    {
      name: 'Different yacht test',
      startDate: '2025-05-12',  // Week 20
      yachtId: 'Spectre',
      expectedFormat: '2520SP02'  // Should be 02 (after existing 01)
    },
    {
      name: 'New year reset',
      startDate: '2026-04-27',  // Week 18 in 2026
      yachtId: 'Zavaria',
      expectedFormat: '2618ZA01'  // Reset to 01 for new year
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n--- ${testCase.name} ---`)
    
    try {
      const startDate = new Date(testCase.startDate)
      console.log(`Charter start date: ${testCase.startDate}`)
      console.log(`Yacht: ${testCase.yachtId}`)
      
      // Calculate expected components
      const year = startDate.getFullYear()
      const yy = year.toString().slice(-2)
      const week = getISOWeek(startDate)
      const ww = week.toString().padStart(2, '0')
      const boatCode = getYachtCode(testCase.yachtId)
      
      console.log(`Expected components: YY=${yy}, WW=${ww}, BC=${boatCode}`)
      
      // Generate booking code
      const bookingCode = await generator.generateBookingNumber({
        yachtId: testCase.yachtId,
        date: startDate,
        existingBookingsProvider: mockExistingBookingsProvider
      })
      
      console.log(`Generated booking code: ${bookingCode}`)
      
      // Validate format
      const isCorrectFormat = /^\d{2}\d{2}[A-Z]{2}\d{2}$/.test(bookingCode)
      console.log(`Correct 8-character format (YYWWBCNN): ${isCorrectFormat ? '✅' : '❌'}`)
      
      // Validate components
      const actualYY = bookingCode.slice(0, 2)
      const actualWW = bookingCode.slice(2, 4) 
      const actualBC = bookingCode.slice(4, 6)
      const actualNN = bookingCode.slice(6, 8)
      
      console.log(`Year component: ${actualYY} (expected: ${yy}) ${actualYY === yy ? '✅' : '❌'}`)
      console.log(`Week component: ${actualWW} (expected: ${ww}) ${actualWW === ww ? '✅' : '❌'}`)
      console.log(`Boat code: ${actualBC} (expected: ${boatCode}) ${actualBC === boatCode ? '✅' : '❌'}`)
      console.log(`Sequence: ${actualNN}`)
      
      if (testCase.expectedFormat) {
        const matches = bookingCode === testCase.expectedFormat
        console.log(`Expected: ${testCase.expectedFormat} ${matches ? '✅' : '❌'}`)
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`)
    }
  }
  
  console.log('\n=== Summary ===')
  console.log('The booking code should follow format: YYWWBCNN')
  console.log('- YY: Last 2 digits of charter start year')
  console.log('- WW: ISO week number (01-53), zero-padded')
  console.log('- BC: Boat code (CM, SP, AL, DD, ZA)')
  console.log('- NN: Sequential number for yacht within year (01-99), gap-filling')
  console.log('')
  console.log('Examples:')
  console.log('- 2518ZA01: 2025, week 18, Zavaria, 1st booking')
  console.log('- 2520SP03: 2025, week 20, Spectre, 3rd booking')
  console.log('- 2618ZA01: 2026, week 18, Zavaria, 1st booking (new year reset)')
}

// Run the test
testBookingCodeGeneration().then(() => {
  console.log('\n=== Test completed ===')
}).catch(error => {
  console.error('Test failed:', error)
})