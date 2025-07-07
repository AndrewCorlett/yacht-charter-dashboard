#!/usr/bin/env node
/**
 * Test script to debug the frontend-to-backend booking number update flow
 * This will help identify where the 406/400 errors are occurring
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Simulate the frontend modules
import bookingService from './src/services/supabase/BookingService.js'
import unifiedDataService from './src/services/UnifiedDataService.js'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Testing Frontend-to-Backend Booking Number Update Flow...')

const BOOKING_ID = 'ab4e9fd0-3297-48f1-96e5-1f69ca5646cc'
const NEW_BOOKING_NUMBER = '2528AL99'

async function testFrontendBackendFlow() {
  try {
    console.log('\n📋 Step 1: Test BookingService.updateBookingNumber directly')
    
    // Test the BookingService directly (this should work based on our previous investigation)
    try {
      const directResult = await bookingService.updateBookingNumber(BOOKING_ID, NEW_BOOKING_NUMBER)
      console.log('✅ BookingService.updateBookingNumber succeeded:', directResult?.booking_number)
    } catch (error) {
      console.error('❌ BookingService.updateBookingNumber failed:', error.message)
      return
    }

    console.log('\n📋 Step 2: Test UnifiedDataService.updateBookingNumber')
    
    // Test through UnifiedDataService (this is what the context uses)
    try {
      const unifiedResult = await unifiedDataService.updateBookingNumber(BOOKING_ID, NEW_BOOKING_NUMBER)
      console.log('✅ UnifiedDataService.updateBookingNumber succeeded:', unifiedResult?.booking_number)
    } catch (error) {
      console.error('❌ UnifiedDataService.updateBookingNumber failed:', error.message)
      console.error('Full error:', error)
    }

    console.log('\n📋 Step 3: Test BookingService.updateBooking with booking_number field')
    
    // Test the general updateBooking method with booking_number field
    try {
      const updateResult = await bookingService.updateBooking(BOOKING_ID, { 
        booking_number: '2528AL88'
      })
      console.log('✅ BookingService.updateBooking with booking_number succeeded:', updateResult?.booking_number)
    } catch (error) {
      console.error('❌ BookingService.updateBooking with booking_number failed:', error.message)
      console.error('Full error:', error)
    }

    console.log('\n📋 Step 4: Test UnifiedDataService.updateBooking with booking_number field')
    
    // Test through UnifiedDataService general updateBooking
    try {
      const unifiedUpdateResult = await unifiedDataService.updateBooking(BOOKING_ID, { 
        booking_number: '2528AL77'
      })
      console.log('✅ UnifiedDataService.updateBooking with booking_number succeeded:', unifiedUpdateResult?.booking_number)
    } catch (error) {
      console.error('❌ UnifiedDataService.updateBooking with booking_number failed:', error.message)
      console.error('Full error:', error)
    }

    console.log('\n📋 Step 5: Monitor HTTP requests and responses')
    
    // Test with different HTTP methods to see if there's a method/header issue
    const testUpdate = {
      booking_number: '2528AL66',
      updated_at: new Date().toISOString()
    }
    
    console.log('Testing PATCH request with specific headers...')
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/bookings?id=eq.${BOOKING_ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Prefer': 'return=representation',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testUpdate)
      })

      console.log('HTTP Response Status:', response.status)
      console.log('HTTP Response Status Text:', response.statusText)
      console.log('HTTP Response Headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Direct HTTP PATCH succeeded:', data)
      } else {
        const errorText = await response.text()
        console.log('❌ Direct HTTP PATCH failed')
        console.log('Error response body:', errorText)
        
        if (response.status === 406) {
          console.log('🔍 HTTP 406 Analysis:')
          console.log('- 406 Not Acceptable typically indicates content negotiation issues')
          console.log('- Check Accept headers and Content-Type')
          console.log('- Verify API expects JSON and returns JSON')
        }
        
        if (response.status === 400) {
          console.log('🔍 HTTP 400 Analysis:')
          console.log('- 400 Bad Request typically indicates validation errors')
          console.log('- Check request body format and required fields')
          console.log('- Verify field names match database schema')
        }
      }
    } catch (fetchError) {
      console.error('❌ Direct HTTP request failed:', fetchError)
    }

    console.log('\n📋 Step 6: Test with minimal update payload')
    
    // Test with the most minimal possible update
    try {
      const minimalUpdate = { booking_number: '2528AL55' }
      const response = await fetch(`${supabaseUrl}/rest/v1/bookings?id=eq.${BOOKING_ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify(minimalUpdate)
      })

      console.log('Minimal update status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.log('Minimal update error:', errorText)
      } else {
        console.log('✅ Minimal update succeeded')
      }
    } catch (error) {
      console.error('❌ Minimal update failed:', error)
    }

    console.log('\n📋 Step 7: Check current booking state')
    
    // Check the final state of the booking
    try {
      const finalBooking = await bookingService.getBooking(BOOKING_ID)
      console.log('Final booking state:')
      console.log('- Booking Number:', finalBooking?.booking_number)
      console.log('- Updated At:', finalBooking?.updated_at)
      console.log('- ID:', finalBooking?.id)
    } catch (error) {
      console.error('❌ Failed to get final booking state:', error)
    }

  } catch (error) {
    console.error('❌ Test flow failed:', error)
  }
}

// Run the test
testFrontendBackendFlow().then(() => {
  console.log('\n🔧 Frontend-to-Backend flow test complete!')
}).catch(error => {
  console.error('❌ Test flow error:', error)
  process.exit(1)
})