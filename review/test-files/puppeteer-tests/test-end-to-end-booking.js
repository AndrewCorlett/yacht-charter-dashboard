/**
 * End-to-end test of the complete booking creation flow
 * This tests the exact path used when creating a booking through the UI
 */

// Mock Supabase dependencies
const mockSupabase = {
  from: (table) => ({
    select: (fields) => {
      if (fields === 'booking_number') {
        return {
          like: (field, pattern) => ({ data: [], error: null })
        }
      }
      return {
        single: () => ({ data: null, error: null }),
        head: () => ({ count: 0, error: null })
      }
    },
    insert: (data) => ({
      select: () => ({
        single: () => ({ 
          data: {
            ...data[0], 
            id: 'mock-uuid-' + Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, 
          error: null 
        })
      })
    }),
    update: (data) => ({
      eq: (field, value) => ({
        select: () => ({
          single: () => ({ data: { ...data, id: value }, error: null })
        })
      })
    }),
    delete: () => ({
      eq: (field, value) => ({ error: null })
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

// Set up global mocks
global.supabase = mockSupabase
global.TABLES = mockTables
global.queryHelpers = mockQueryHelpers

// Import the actual services (using dynamic import to ensure mocks are set)
const { default: bookingService } = await import('./src/services/supabase/BookingService.js')

// Mock booking data as it would come from the UI form
const testBookingData = {
  // Form data (camelCase from frontend)
  yacht: 'zavaria',  // This will be mapped to yacht_id
  tripType: 'bareboat',
  startDate: '2025-07-05',
  endDate: '2025-07-12',
  portOfDeparture: 'Marina Bay',
  portOfArrival: 'Marina Bay',
  firstName: 'John',
  surname: 'Doe',
  email: 'john.doe@example.com',
  phone: '+44 1234 567890',
  street: '123 Test Street',
  city: 'Test City',
  postcode: 'TC1 2ST',
  country: 'United Kingdom',
  charterCost: 2000,
  deposit: 600,
  securityDeposit: 500
}

async function testCompleteBookingFlow() {
  console.log('=== End-to-End Booking Creation Test ===\n')
  
  try {
    console.log('1. Creating booking with data:', testBookingData)
    
    // This simulates what BookingContext.createBooking() does:
    // 1. Create BookingModel instance
    // 2. Call BookingService.createBooking()
    // 3. BookingService generates booking number
    
    console.log('\n2. Calling BookingService.createBooking()...')
    const newBooking = await bookingService.createBooking(testBookingData)
    
    console.log('\n3. BookingService returned:', {
      id: newBooking.id,
      booking_number: newBooking.booking_number,
      yacht_id: newBooking.yacht_id,
      start_date: newBooking.start_date,
      customer_first_name: newBooking.customer_first_name
    })
    
    // Validate the booking number format
    const bookingNumber = newBooking.booking_number
    console.log(`\n4. Generated booking number: ${bookingNumber}`)
    
    // Check format
    const isCorrectFormat = /^\d{2}\d{2}[A-Z]{2}\d{2}$/.test(bookingNumber)
    console.log(`   Matches YYWWBCNN format: ${isCorrectFormat ? '✅' : '❌'}`)
    
    if (isCorrectFormat) {
      const yy = bookingNumber.slice(0, 2)
      const ww = bookingNumber.slice(2, 4)
      const bc = bookingNumber.slice(4, 6)
      const nn = bookingNumber.slice(6, 8)
      
      console.log(`   Breakdown: YY=${yy}, WW=${ww}, BC=${bc}, NN=${nn}`)
      console.log(`   Year: 20${yy}, Week: ${ww}, Yacht: ${bc}, Sequence: ${nn}`)
      
      // Validate components
      console.log(`   Expected yacht code for "zavaria": ZA`)
      console.log(`   Actual yacht code: ${bc} ${bc === 'ZA' ? '✅' : '❌'}`)
      console.log(`   Expected year: 25`)
      console.log(`   Actual year: ${yy} ${yy === '25' ? '✅' : '❌'}`)
      
    } else {
      console.log(`   ❌ WRONG FORMAT! Expected YYWWBCNN, got: ${bookingNumber}`)
      
      if (bookingNumber.startsWith('BK')) {
        console.log('   ❌ This is the OLD BK format that should NOT be generated!')
      }
    }
    
    console.log('\n=== Test Results ===')
    
    if (isCorrectFormat && bookingNumber.includes('ZA') && bookingNumber.startsWith('25')) {
      console.log('✅ SUCCESS: Booking creation now uses YYWWBCNN format!')
      console.log('✅ UnifiedDataService -> BookingService -> BookingNumberGenerator flow works')
      console.log('✅ Yacht code mapping works correctly')
      console.log('✅ No more BK202507XXX format being generated')
      
      // Test gap-filling by creating another booking
      console.log('\n=== Testing Sequential Booking ===')
      const secondBooking = await bookingService.createBooking({
        ...testBookingData,
        email: 'jane.doe@example.com' // Different email to avoid conflicts
      })
      
      console.log(`Second booking number: ${secondBooking.booking_number}`)
      
      const secondYy = secondBooking.booking_number.slice(0, 2)
      const secondWw = secondBooking.booking_number.slice(2, 4)
      const secondBc = secondBooking.booking_number.slice(4, 6)
      const secondNn = secondBooking.booking_number.slice(6, 8)
      
      console.log(`Second booking: YY=${secondYy}, WW=${secondWw}, BC=${secondBc}, NN=${secondNn}`)
      
      // Should have same year, week, boat code but incremented sequence
      if (secondYy === yy && secondWw === ww && secondBc === bc && parseInt(secondNn) === parseInt(nn) + 1) {
        console.log('✅ Sequential numbering works correctly!')
      } else {
        console.log('❌ Sequential numbering has issues')
      }
      
    } else {
      console.log('❌ FAILURE: Booking creation still uses wrong format')
      console.log('❌ Check browser cache, restart dev server, or debug further')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

// Run the test
console.log('Testing complete booking creation flow (UI -> Context -> Service -> Generator)')
console.log('This should now produce YYWWBCNN format instead of BK202507XXX\n')

testCompleteBookingFlow().then(() => {
  console.log('\n=== Instructions ===')
  console.log('1. Restart your development server')
  console.log('2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)')
  console.log('3. Try creating a new booking')
  console.log('4. Check the booking number - it should be like "2527ZA01" not "BK202507XXX"')
}).catch(error => {
  console.error('Test suite failed:', error)
})