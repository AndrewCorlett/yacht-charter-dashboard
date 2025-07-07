/**
 * Migration Runner for Booking Type Column
 * Applies the database migration to add booking_type support
 * 
 * @created 2025-07-05
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('=== Booking Type Migration Runner ===\n')

async function runMigration() {
  try {
    // Read migration file
    const migrationPath = join(__dirname, 'migrations', 'add-booking-type-column.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded successfully')
    console.log('🔄 Applying migration to Supabase...\n')
    
    // Note: Supabase JS client doesn't support raw SQL execution
    // You'll need to run this migration directly in the Supabase SQL editor
    
    console.log('⚠️  IMPORTANT: The Supabase JavaScript client does not support raw SQL migrations.')
    console.log('\n📋 Please follow these steps:\n')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to the SQL Editor')
    console.log('3. Copy and paste the following SQL:')
    console.log('\n' + '='.repeat(60))
    console.log(migrationSQL)
    console.log('='.repeat(60) + '\n')
    console.log('4. Click "Run" to execute the migration')
    console.log('\n✅ The migration is safe to run multiple times (idempotent)')
    
    // Test if we can query the bookings table
    console.log('\n🔍 Testing database connection...')
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection test failed:', error.message)
    } else {
      console.log('✅ Database connection successful')
      console.log(`📊 Bookings table accessible (found ${data.length} test record)`)
    }
    
    // Check if booking_type column exists (this will fail if it doesn't)
    console.log('\n🔍 Checking if booking_type column exists...')
    const { data: testData, error: testError } = await supabase
      .from('bookings')
      .select('id, booking_type')
      .limit(1)
    
    if (testError && testError.message.includes('booking_type')) {
      console.log('❌ booking_type column does not exist yet')
      console.log('⚠️  Please run the migration SQL above to add it')
    } else if (testData) {
      console.log('✅ booking_type column already exists!')
      console.log('   No migration needed')
    }
    
  } catch (error) {
    console.error('❌ Migration runner error:', error)
  }
}

// Run the migration check
runMigration()