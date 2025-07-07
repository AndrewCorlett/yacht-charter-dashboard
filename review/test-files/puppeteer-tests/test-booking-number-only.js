/**
 * Test the BookingNumberGenerator directly to verify YYWWBCNN format
 */

import { BookingNumberGenerator, BookingNumberFormat, getYachtCode } from './src/models/utilities/BookingNumberGenerator.js'

async function testBookingNumberGeneration() {
  console.log('=== Testing BookingNumberGenerator directly ===\n')
  
  try {
    // Test yacht code mapping first
    console.log('1. Testing yacht code mapping:')
    const testCases = [
      'zavaria',
      'Zavaria', 
      'ZAVARIA',
      'calico-moon',
      'Calico Moon',
      'spectre'
    ]
    
    for (const yacht of testCases) {
      try {
        const code = getYachtCode(yacht)
        console.log(`   "${yacht}" -> ${code}`)
      } catch (error) {
        console.log(`   "${yacht}" -> ERROR: ${error.message}`)
      }
    }
    
    // Test booking number generation
    console.log('\n2. Testing booking number generation:')
    
    const generator = new BookingNumberGenerator({
      format: BookingNumberFormat.YEAR_WEEK_YACHT_SEQ
    })
    
    // Mock existing bookings provider (empty for first test)
    const existingBookingsProvider = async (yy, boatCode) => {
      console.log(`   Querying for existing bookings: year=${yy}, boat=${boatCode}`)
      return [] // Empty array for first booking
    }
    
    // Generate booking number for Zavaria on 2025-07-05
    const testDate = new Date('2025-07-05')
    console.log(`   Generating for yacht "zavaria" on ${testDate.toISOString()}`)
    
    const bookingNumber = await generator.generateBookingNumber({
      yachtId: 'zavaria',
      date: testDate,
      existingBookingsProvider
    })
    
    console.log(`   Generated: ${bookingNumber}`)
    
    // Validate format
    const formatRegex = /^\d{2}\d{2}[A-Z]{2}\d{2}$/
    const isValidFormat = formatRegex.test(bookingNumber)
    
    console.log(`   Format validation: ${isValidFormat ? '✅ PASS' : '❌ FAIL'}`)
    
    if (isValidFormat) {
      const yy = bookingNumber.slice(0, 2)
      const ww = bookingNumber.slice(2, 4)
      const bc = bookingNumber.slice(4, 6)
      const nn = bookingNumber.slice(6, 8)
      
      console.log(`   Breakdown: YY=${yy}, WW=${ww}, BC=${bc}, NN=${nn}`)
      
      // Expected values for July 5, 2025
      const expectedYear = '25'
      const expectedWeek = '27' // ISO week 27 for July 5, 2025
      const expectedBoat = 'ZA'
      const expectedSeq = '01'
      
      console.log(`   Expected: YY=${expectedYear}, WW=${expectedWeek}, BC=${expectedBoat}, NN=${expectedSeq}`)
      
      const yearMatch = yy === expectedYear
      const weekMatch = ww === expectedWeek  
      const boatMatch = bc === expectedBoat
      const seqMatch = nn === expectedSeq
      
      console.log(`   Year check: ${yearMatch ? '✅' : '❌'} (${yy} ${yearMatch ? '==' : '!='} ${expectedYear})`)
      console.log(`   Week check: ${weekMatch ? '✅' : '❌'} (${ww} ${weekMatch ? '==' : '!='} ${expectedWeek})`)
      console.log(`   Boat check: ${boatMatch ? '✅' : '❌'} (${bc} ${boatMatch ? '==' : '!='} ${expectedBoat})`)
      console.log(`   Seq check: ${seqMatch ? '✅' : '❌'} (${nn} ${seqMatch ? '==' : '!='} ${expectedSeq})`)
      
      if (yearMatch && weekMatch && boatMatch && seqMatch) {
        console.log('\n✅ SUCCESS: BookingNumberGenerator produces correct YYWWBCNN format!')
        
        // Test gap-filling by simulating existing booking
        console.log('\n3. Testing gap-filling logic:')
        const existingBookingsProviderWithGap = async (yy, boatCode) => {
          console.log(`   Querying for existing bookings: year=${yy}, boat=${boatCode}`)
          return ['2527ZA01', '2527ZA03'] // Missing 02, so next should be 02
        }
        
        const secondNumber = await generator.generateBookingNumber({
          yachtId: 'zavaria',
          date: testDate,
          existingBookingsProvider: existingBookingsProviderWithGap
        })
        
        console.log(`   Second booking (with gap): ${secondNumber}`)
        const expectedSecond = '2527ZA02'
        
        if (secondNumber === expectedSecond) {
          console.log(`   ✅ Gap-filling works correctly!`)
        } else {
          console.log(`   ❌ Gap-filling failed. Expected ${expectedSecond}, got ${secondNumber}`)
        }
        
      } else {
        console.log('\n❌ FAILURE: Generated format components are incorrect')
      }
    } else {
      console.log('\n❌ FAILURE: Generated booking number does not match YYWWBCNN format')
      console.log(`   Generated: ${bookingNumber}`)
      console.log(`   Expected pattern: YYWWBCNN (e.g., 2527ZA01)`)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testBookingNumberGeneration().then(() => {
  console.log('\n=== Test Complete ===')
}).catch(error => {
  console.error('Test suite error:', error)
})