#!/usr/bin/env node
/**
 * Investigation script for booking number update issue
 * Specifically investigating HTTP 406/400 errors when updating booking numbers
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Investigating booking number update issue...')
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
const NEW_BOOKING_NUMBER = '2528AL10'

async function investigateBookingUpdate() {
  try {
    console.log('\n📋 Step 1: Check current booking state')
    
    // Get current booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', BOOKING_ID)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching booking:', fetchError)
      return
    }

    if (!booking) {
      console.error('❌ Booking not found!')
      return
    }

    console.log('✅ Current booking state:')
    console.log('  - ID:', booking.id)
    console.log('  - Current booking number:', booking.booking_number)
    console.log('  - Yacht ID:', booking.yacht_id)
    console.log('  - Customer:', booking.customer_first_name, booking.customer_surname)
    console.log('  - Status:', booking.booking_status)
    console.log('  - Created:', booking.created_at)
    console.log('  - Updated:', booking.updated_at)

    console.log('\n📋 Step 2: Check for duplicate booking number')
    
    // Check if new booking number already exists
    const { data: existingBooking, error: duplicateError } = await supabase
      .from('bookings')
      .select('id, booking_number')
      .eq('booking_number', NEW_BOOKING_NUMBER)
      .neq('id', BOOKING_ID)
      .single()

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error('❌ Error checking for duplicates:', duplicateError)
      return
    }

    if (existingBooking) {
      console.log('⚠️  Duplicate booking number found:')
      console.log('  - Conflicting booking ID:', existingBooking.id)
      console.log('  - Conflicting booking number:', existingBooking.booking_number)
    } else {
      console.log('✅ No duplicate booking number found')
    }

    console.log('\n📋 Step 3: Check table schema and constraints')
    
    // Check table schema
    const { data: schema, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'bookings' })
      .single()

    if (schemaError) {
      console.log('⚠️  Could not fetch schema via RPC, trying direct query...')
      
      // Alternative: Check if booking_number column exists and its constraints
      const { data: columnInfo, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, is_nullable, column_default, data_type')
        .eq('table_name', 'bookings')
        .eq('column_name', 'booking_number')
        .single()

      if (columnError) {
        console.log('⚠️  Could not fetch column info:', columnError)
      } else {
        console.log('✅ Booking number column info:', columnInfo)
      }
    } else {
      console.log('✅ Table schema:', schema)
    }

    console.log('\n📋 Step 4: Check for unique constraints')
    
    // Check for unique constraints on booking_number
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'bookings')
      .eq('constraint_type', 'UNIQUE')

    if (constraintError) {
      console.log('⚠️  Could not fetch constraints:', constraintError)
    } else {
      console.log('✅ Unique constraints on bookings table:', constraints)
    }

    console.log('\n📋 Step 5: Check RLS policies')
    
    // Check RLS policies
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual, with_check')
      .eq('tablename', 'bookings')

    if (policyError) {
      console.log('⚠️  Could not fetch RLS policies:', policyError)
    } else {
      console.log('✅ RLS policies on bookings table:', policies)
    }

    console.log('\n📋 Step 6: Test manual update')
    
    // Try to update the booking number
    console.log(`Attempting to update booking number from "${booking.booking_number}" to "${NEW_BOOKING_NUMBER}"...`)
    
    const updateData = {
      booking_number: NEW_BOOKING_NUMBER,
      updated_at: new Date().toISOString()
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', BOOKING_ID)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Update failed:', updateError)
      console.error('Error details:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      })
    } else {
      console.log('✅ Update successful!')
      console.log('Updated booking:', updatedBooking)
    }

    console.log('\n📋 Step 7: Test validation scenarios')
    
    // Test various validation scenarios
    const testCases = [
      { booking_number: null, description: 'null booking number' },
      { booking_number: '', description: 'empty booking number' },
      { booking_number: 'a'.repeat(256), description: 'very long booking number' },
      { booking_number: 'TEST123!@#', description: 'special characters' }
    ]

    for (const testCase of testCases) {
      console.log(`\nTesting ${testCase.description}...`)
      
      const { error: testError } = await supabase
        .from('bookings')
        .update({ booking_number: testCase.booking_number })
        .eq('id', BOOKING_ID)
        .select()
        .single()

      if (testError) {
        console.log(`❌ ${testCase.description} failed:`, testError.message)
      } else {
        console.log(`✅ ${testCase.description} succeeded`)
        
        // Revert back to original
        await supabase
          .from('bookings')
          .update({ booking_number: booking.booking_number })
          .eq('id', BOOKING_ID)
      }
    }

    console.log('\n📋 Step 8: Check HTTP request details')
    
    // Make a direct HTTP request to see raw response
    console.log('Making direct HTTP request to check response details...')
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/bookings?id=eq.${BOOKING_ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          booking_number: NEW_BOOKING_NUMBER,
          updated_at: new Date().toISOString()
        })
      })

      console.log('HTTP Response Status:', response.status)
      console.log('HTTP Response Headers:', Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log('HTTP Response Body:', responseText)
      
      if (!response.ok) {
        console.error('❌ HTTP request failed')
        
        // Check if it's a 406 or 400 error
        if (response.status === 406) {
          console.error('🔍 HTTP 406 (Not Acceptable) - This suggests content negotiation issues')
        } else if (response.status === 400) {
          console.error('🔍 HTTP 400 (Bad Request) - This suggests validation or constraint violations')
        }
      } else {
        console.log('✅ HTTP request succeeded')
      }
    } catch (fetchError) {
      console.error('❌ HTTP request error:', fetchError)
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error)
  }
}

// Run the investigation
investigateBookingUpdate().then(() => {
  console.log('\n🔍 Investigation complete!')
}).catch(error => {
  console.error('❌ Investigation error:', error)
  process.exit(1)
})