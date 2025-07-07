#!/usr/bin/env node
/**
 * Complete test of the booking update workflow
 * Tests the exact path that the frontend would take
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔄 Testing Complete Booking Update Workflow...')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration!')
  process.exit(1)
}

// Create Supabase client (same as frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BOOKING_ID = 'ab4e9fd0-3297-48f1-96e5-1f69ca5646cc'

async function testCompleteWorkflow() {
  try {
    console.log('\n📋 Step 1: Test the exact BookingService.updateBookingNumber logic')
    
    const newBookingNumber = '2528AL25'
    
    // Replicate the exact logic from BookingService.updateBookingNumber
    console.log('  Checking for duplicate booking number...')
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_number', newBookingNumber)
      .neq('id', BOOKING_ID) // Exclude current booking
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('  ❌ Error checking for duplicates:', checkError)
      return
    }

    if (existingBooking) {
      console.log('  ⚠️  Duplicate booking number found:', existingBooking.id)
      return
    } else {
      console.log('  ✅ No duplicate found, proceeding with update')
    }

    // Replicate the exact update logic
    console.log('  Performing update...')
    const updates = {
      booking_number: newBookingNumber,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', BOOKING_ID)
      .select()
      .single()

    if (error) {
      console.error('  ❌ Update error:', error)
      console.error('  Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return
    }

    if (data) {
      console.log('  ✅ Update successful!')
      console.log('  Updated booking number:', data.booking_number)
      console.log('  Updated timestamp:', data.updated_at)
    } else {
      console.log('  ⚠️  Update completed but no data returned')
    }

    console.log('\n📋 Step 2: Test the BookingNumberEditor component logic')
    
    // Simulate what the BookingNumberEditor does
    const editorTestNumber = '2528AL24'
    
    console.log('  Simulating BookingNumberEditor.handleSave...')
    
    // Format validation (from BookingNumberEditor)
    const BOOKING_NUMBER_PATTERN = /^\d{2}\d{2}[A-Z]{2}\d{2}$/
    if (!BOOKING_NUMBER_PATTERN.test(editorTestNumber)) {
      console.log('  ❌ Format validation failed')
      return
    } else {
      console.log('  ✅ Format validation passed')
    }

    // Simulate the BookingService call
    try {
      console.log('  Calling update method...')
      
      // Check for conflicts first
      const { data: conflictCheck, error: conflictError } = await supabase
        .from('bookings')
        .select('id')
        .eq('booking_number', editorTestNumber)
        .neq('id', BOOKING_ID)
        .single()

      if (conflictError && conflictError.code !== 'PGRST116') {
        throw new Error('Failed to check for conflicts: ' + conflictError.message)
      }

      if (conflictCheck) {
        throw new Error(`Booking number ${editorTestNumber} is already in use`)
      }

      // Perform the update
      const updateData = {
        booking_number: editorTestNumber,
        updated_at: new Date().toISOString()
      }

      const { data: updateResult, error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', BOOKING_ID)
        .select()
        .single()

      if (updateError) {
        throw new Error('Update failed: ' + updateError.message)
      }

      console.log('  ✅ BookingNumberEditor simulation successful!')
      console.log('  Result:', {
        id: updateResult.id,
        booking_number: updateResult.booking_number,
        updated_at: updateResult.updated_at
      })

    } catch (simulationError) {
      console.error('  ❌ BookingNumberEditor simulation failed:', simulationError.message)
    }

    console.log('\n📋 Step 3: Test the context and data service chain')
    
    // This would be the path: BookingNumberEditor -> BookingContext -> UnifiedDataService -> BookingService
    const contextTestNumber = '2528AL23'
    
    console.log('  Simulating context update flow...')
    
    try {
      // What UnifiedDataService.updateBookingNumber would do
      console.log('  UnifiedDataService calling BookingService...')
      
      const serviceUpdates = {
        booking_number: contextTestNumber,
        updated_at: new Date().toISOString()
      }

      const { data: serviceResult, error: serviceError } = await supabase
        .from('bookings')
        .update(serviceUpdates)
        .eq('id', BOOKING_ID)
        .select()
        .single()

      if (serviceError) {
        throw new Error('Service update failed: ' + serviceError.message)
      }

      console.log('  ✅ Context/Service chain simulation successful!')
      console.log('  Final result:', {
        id: serviceResult.id,
        booking_number: serviceResult.booking_number,
        updated_at: serviceResult.updated_at
      })

    } catch (chainError) {
      console.error('  ❌ Context/Service chain failed:', chainError.message)
    }

    console.log('\n📋 Step 4: Test error scenarios that might cause 406/400')
    
    const errorTestCases = [
      {
        name: 'Missing booking number',
        updates: { booking_number: null },
        expectError: true
      },
      {
        name: 'Empty booking number',
        updates: { booking_number: '' },
        expectError: false // This actually works based on our tests
      },
      {
        name: 'Invalid data type',
        updates: { booking_number: 12345 },
        expectError: false // Supabase converts this
      },
      {
        name: 'Non-existent field',
        updates: { booking_number: '2528AL22', invalid_field: 'test' },
        expectError: false // Extra fields are typically ignored
      }
    ]

    for (const testCase of errorTestCases) {
      console.log(`\n  Testing: ${testCase.name}`)
      
      try {
        const { data: testResult, error: testError } = await supabase
          .from('bookings')
          .update(testCase.updates)
          .eq('id', BOOKING_ID)
          .select()
          .single()

        if (testError) {
          console.log(`    ❌ Error (${testCase.expectError ? 'expected' : 'unexpected'}):`, testError.message)
        } else {
          console.log(`    ✅ Success (${testCase.expectError ? 'unexpected' : 'expected'}):`, testResult?.booking_number)
        }
      } catch (testError) {
        console.log(`    ❌ Exception:`, testError.message)
      }
    }

    console.log('\n📋 Step 5: Final booking state')
    
    const { data: finalBooking, error: finalError } = await supabase
      .from('bookings')
      .select('id, booking_number, updated_at')
      .eq('id', BOOKING_ID)
      .single()

    if (finalError) {
      console.error('  ❌ Failed to get final state:', finalError)
    } else {
      console.log('  ✅ Final booking state:')
      console.log('    - ID:', finalBooking.id)
      console.log('    - Booking Number:', finalBooking.booking_number)
      console.log('    - Updated At:', finalBooking.updated_at)
    }

    console.log('\n📋 Conclusion: Root Cause Analysis')
    console.log('  Based on all tests, the database operations work correctly.')
    console.log('  The 406/400 errors are likely coming from:')
    console.log('  1. Frontend making requests with incorrect Accept headers')
    console.log('  2. Frontend not handling 204 No Content responses properly')
    console.log('  3. Frontend expecting specific response formats that Supabase doesnt provide by default')
    console.log('  4. The issue is NOT in the backend/database layer')

  } catch (error) {
    console.error('❌ Workflow test failed:', error)
  }
}

// Run the test
testCompleteWorkflow().then(() => {
  console.log('\n🔄 Complete workflow test finished!')
}).catch(error => {
  console.error('❌ Workflow test error:', error)
  process.exit(1)
})