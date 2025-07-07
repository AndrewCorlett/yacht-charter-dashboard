#!/usr/bin/env node
/**
 * Debug script for booking update 406/400 errors
 * Tests various update scenarios to identify the root cause
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🐛 Debugging Booking Update 406/400 Errors...')
console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : 'missing'
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration!')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BOOKING_ID = 'ab4e9fd0-3297-48f1-96e5-1f69ca5646cc'

async function debugBookingUpdateErrors() {
  try {
    console.log('\n📋 Step 1: Get current booking state')
    
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', BOOKING_ID)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching booking:', fetchError)
      return
    }

    console.log('✅ Current booking:')
    console.log('  - ID:', booking.id)
    console.log('  - Booking Number:', booking.booking_number)
    console.log('  - Updated:', booking.updated_at)

    console.log('\n📋 Step 2: Test different update patterns that might cause 406/400')

    const testCases = [
      {
        name: 'Standard booking number update',
        payload: { booking_number: '2528AL44' },
        expectedStatus: 200
      },
      {
        name: 'Update with explicit content-type',
        payload: { booking_number: '2528AL43' },
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        expectedStatus: 200
      },
      {
        name: 'Update with Accept header',
        payload: { booking_number: '2528AL42' },
        headers: { 'Accept': 'application/json' },
        expectedStatus: 200
      },
      {
        name: 'Update with both Content-Type and Accept',
        payload: { booking_number: '2528AL41' },
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json'
        },
        expectedStatus: 200
      },
      {
        name: 'Update with Return preference',
        payload: { booking_number: '2528AL40' },
        headers: { 'Prefer': 'return=representation' },
        expectedStatus: 200
      },
      {
        name: 'Update with minimal preference',
        payload: { booking_number: '2528AL39' },
        headers: { 'Prefer': 'return=minimal' },
        expectedStatus: 204
      },
      {
        name: 'Update without any special headers',
        payload: { booking_number: '2528AL38' },
        headers: {},
        expectedStatus: 204
      },
      {
        name: 'Update with complex object (potential issue)',
        payload: { 
          booking_number: '2528AL37',
          updated_at: new Date().toISOString(),
          notes: 'Test update'
        },
        expectedStatus: 200
      },
      {
        name: 'Update with wrong Accept header (should cause 406)',
        payload: { booking_number: '2528AL36' },
        headers: { 'Accept': 'application/xml' },
        expectedStatus: 406
      },
      {
        name: 'Update with malformed JSON (should cause 400)',
        payload: '{"booking_number": "2528AL35", invalid}',
        isRawPayload: true,
        expectedStatus: 400
      },
      {
        name: 'Update with invalid field type (should cause 400)',
        payload: { booking_number: 12345 }, // number instead of string
        expectedStatus: 400
      },
      {
        name: 'Update with null booking_number (should cause constraint violation)',
        payload: { booking_number: null },
        expectedStatus: 400
      }
    ]

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`)
      
      try {
        const defaultHeaders = {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        }

        const headers = { ...defaultHeaders, ...testCase.headers }
        
        // Add Content-Type if not explicitly set and we have a JSON payload
        if (!testCase.isRawPayload && !headers['Content-Type']) {
          headers['Content-Type'] = 'application/json'
        }

        const body = testCase.isRawPayload ? testCase.payload : JSON.stringify(testCase.payload)

        const response = await fetch(`${supabaseUrl}/rest/v1/bookings?id=eq.${BOOKING_ID}`, {
          method: 'PATCH',
          headers,
          body
        })

        console.log(`  Status: ${response.status} ${response.statusText}`)
        
        if (response.status === testCase.expectedStatus) {
          console.log('  ✅ Expected status received')
          
          if (response.status === 200) {
            try {
              const data = await response.json()
              console.log(`  Updated booking number: ${data[0]?.booking_number}`)
            } catch (jsonError) {
              console.log('  Response was not JSON:', await response.text())
            }
          }
        } else {
          console.log(`  ⚠️  Unexpected status (expected ${testCase.expectedStatus})`)
          
          if (response.status === 406) {
            console.log('  🔍 406 Not Acceptable - Content negotiation failed')
            console.log('  Check Accept headers and server response format compatibility')
          } else if (response.status === 400) {
            console.log('  🔍 400 Bad Request - Request validation failed')
            const errorText = await response.text()
            console.log('  Error details:', errorText)
          } else {
            const errorText = await response.text()
            console.log('  Error response:', errorText)
          }
        }

        console.log('  Response headers:', Object.fromEntries(response.headers.entries()))

      } catch (error) {
        console.error(`  ❌ Request failed: ${error.message}`)
      }
    }

    console.log('\n📋 Step 3: Test frontend-like request patterns')

    // Simulate what the frontend actually sends
    const frontendLikeRequests = [
      {
        name: 'Supabase JS client simulation',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Prefer': 'return=representation'
        },
        payload: { booking_number: '2528AL33' }
      },
      {
        name: 'Browser fetch simulation',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        payload: { booking_number: '2528AL32' }
      }
    ]

    for (const request of frontendLikeRequests) {
      console.log(`\n🖥️  Testing: ${request.name}`)
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/bookings?id=eq.${BOOKING_ID}`, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(request.payload)
        })

        console.log(`  Status: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          console.log('  ✅ Request succeeded')
          try {
            const data = await response.json()
            console.log(`  Updated booking number: ${data[0]?.booking_number}`)
          } catch (jsonError) {
            console.log('  Non-JSON response:', await response.text())
          }
        } else {
          console.log('  ❌ Request failed')
          const errorText = await response.text()
          console.log('  Error:', errorText)
        }
      } catch (error) {
        console.error(`  ❌ Request error: ${error.message}`)
      }
    }

    console.log('\n📋 Step 4: Check final booking state')
    
    const { data: finalBooking } = await supabase
      .from('bookings')
      .select('booking_number, updated_at')
      .eq('id', BOOKING_ID)
      .single()

    console.log('Final booking state:')
    console.log('  - Booking Number:', finalBooking?.booking_number)
    console.log('  - Updated At:', finalBooking?.updated_at)

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run the debug
debugBookingUpdateErrors().then(() => {
  console.log('\n🐛 Booking update error debugging complete!')
}).catch(error => {
  console.error('❌ Debug error:', error)
  process.exit(1)
})