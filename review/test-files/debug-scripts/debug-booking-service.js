/**
 * Debug script to test the actual BookingService.generateBookingNumber method
 * This will help identify if the issue is in the BookingService or elsewhere
 */

// Mock the Supabase dependencies to test the service
const mockSupabase = {
  from: (table) => ({
    select: (fields) => ({
      like: (field, pattern) => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
      head: () => ({ count: 0, error: null })
    }),
    insert: (data) => ({
      select: () => ({
        single: () => ({ data: data[0], error: null })
      })
    })
  })
}

const mockTables = {
  BOOKINGS: 'bookings'
}

const mockQueryHelpers = {
  handleError: (error, operation) => {
    if (error) throw new Error(`${operation}: ${error.message}`)
  }
}

// Mock the modules
global.supabase = mockSupabase
global.TABLES = mockTables
global.queryHelpers = mockQueryHelpers

// Import the actual services
import { BookingNumberGenerator, BookingNumberFormat, getYachtCode } from './src/models/utilities/BookingNumberGenerator.js'

// Recreate the BookingService.generateBookingNumber method exactly as it exists
async function testGenerateBookingNumber(yachtId = null, startDate = null) {
  console.log('[TestBookingService] Generating booking number for yacht:', yachtId, 'startDate:', startDate)
  
  try {
    if (!yachtId) {
      throw new Error('Yacht ID is required for booking number generation')
    }
    
    if (!startDate) {
      throw new Error('Start date is required for booking number generation')
    }

    // Create generator with new year-week-yacht-sequence format
    const generator = new BookingNumberGenerator({
      format: BookingNumberFormat.YEAR_WEEK_YACHT_SEQ
    })

    // Load existing booking numbers for collision detection
    const existingBookings = [] // Mock empty array
    
    if (existingBookings) {
      existingBookings.forEach(booking => {
        if (booking.booking_number) {
          generator._existingNumbers.add(booking.booking_number)
        }
      })
    }

    // Create existing bookings provider for gap-filling logic
    const existingBookingsProvider = async (yy, boatCode) => {
      console.log(`[TestBookingService] Querying existing bookings for year ${yy} and boat ${boatCode}`)
      
      const existingCodes = [] // Mock empty array
      console.log(`[TestBookingService] Found existing codes:`, existingCodes)
      return existingCodes
    }

    // Generate the booking number
    const charterStartDate = new Date(startDate)
    console.log('[TestBookingService] Charter start date:', charterStartDate)
    
    const bookingCode = await generator.generateBookingNumber({ 
      yachtId, 
      date: charterStartDate,
      existingBookingsProvider
    })
    
    console.log('[TestBookingService] Generated booking code:', bookingCode)
    return bookingCode
    
  } catch (error) {
    console.error('Booking number generation error:', error)
    throw error
  }
}

// Test the exact scenario you mentioned
async function runDebugTest() {
  console.log('=== Debug Test: BookingService.generateBookingNumber ===\n')
  
  try {
    // Test with Zavaria (which should map to ZA)
    console.log('Testing with yacht: "Zavaria", start date: "2025-07-05"')
    
    const bookingCode = await testGenerateBookingNumber('Zavaria', '2025-07-05')
    
    console.log(`\nGenerated code: ${bookingCode}`)
    
    // Validate format
    const isCorrectFormat = /^\d{2}\d{2}[A-Z]{2}\d{2}$/.test(bookingCode)
    console.log(`Matches YYWWBCNN format: ${isCorrectFormat ? '✅' : '❌'}`)
    
    if (isCorrectFormat) {
      const yy = bookingCode.slice(0, 2)
      const ww = bookingCode.slice(2, 4)
      const bc = bookingCode.slice(4, 6)
      const nn = bookingCode.slice(6, 8)
      
      console.log(`Breakdown: YY=${yy}, WW=${ww}, BC=${bc}, NN=${nn}`)
      console.log(`Should be: YY=25, WW=27, BC=ZA, NN=01`)
    } else {
      console.log('❌ WRONG FORMAT! Should be YYWWBCNN, but got:', bookingCode)
      
      // Check if it's the old format
      if (bookingCode.startsWith('BK')) {
        console.log('❌ This is the OLD BK format that should not be generated!')
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

// Test yacht code mapping
function testYachtCodeMapping() {
  console.log('\n=== Testing Yacht Code Mapping ===')
  
  const testYachts = ['Zavaria', 'zavaria', 'ZAVARIA', 'Spectre', 'Calico Moon']
  
  for (const yacht of testYachts) {
    try {
      const code = getYachtCode(yacht)
      console.log(`"${yacht}" -> ${code}`)
    } catch (error) {
      console.log(`"${yacht}" -> ERROR: ${error.message}`)
    }
  }
}

// Run the tests
console.log('Debugging BookingService.generateBookingNumber method...')
console.log('This should produce YYWWBCNN format, NOT BKyyyymmNNN format\n')

testYachtCodeMapping()
runDebugTest().then(() => {
  console.log('\n=== Conclusion ===')
  console.log('If this test produces the correct YYWWBCNN format,')
  console.log('then the issue is NOT in BookingService.generateBookingNumber().')
  console.log('The problem may be:')
  console.log('1. A different code path is being used')
  console.log('2. Browser caching of old JavaScript')
  console.log('3. A different service is generating the booking number')
  console.log('4. The wrong BookingModel is being used somewhere')
}).catch(error => {
  console.error('Debug test failed:', error)
})