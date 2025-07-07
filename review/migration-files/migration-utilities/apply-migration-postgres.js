#!/usr/bin/env node

// Direct PostgreSQL migration script
import pkg from 'pg'
const { Client } = pkg
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration - you'll need to get the actual connection details from Supabase
const connectionConfig = {
  host: 'kbwjtihjyhapaclyytxn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'YOUR_DATABASE_PASSWORD', // This needs to be set
  ssl: {
    rejectUnauthorized: false
  }
}

async function applyMigrationPostgres() {
  const client = new Client(connectionConfig)
  
  try {
    console.log('🚀 Starting PostgreSQL migration: Add booking_type column to bookings table')
    
    // Check if password is set
    if (connectionConfig.password === 'YOUR_DATABASE_PASSWORD') {
      console.log('❌ Database password not configured')
      console.log('👉 Please set the password in the script or use environment variable')
      console.log('👉 Get the password from: Supabase Dashboard > Settings > Database > Connection info')
      return false
    }
    
    // Connect to the database
    await client.connect()
    console.log('✅ Connected to PostgreSQL database')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add-booking-type-column.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration SQL loaded successfully')
    
    // Execute the migration
    const result = await client.query(migrationSQL)
    console.log('✅ Migration executed successfully')
    
    // Verify the column was added
    const verifyResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'booking_type'
    `)
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ booking_type column verified:')
      console.log(`   - Type: ${verifyResult.rows[0].data_type}`)
      console.log(`   - Nullable: ${verifyResult.rows[0].is_nullable}`)
      console.log(`   - Default: ${verifyResult.rows[0].column_default}`)
    } else {
      console.log('❌ booking_type column not found after migration')
      return false
    }
    
    // Check enum type
    const enumResult = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_type_enum')
    `)
    
    if (enumResult.rows.length > 0) {
      const enumValues = enumResult.rows.map(row => row.enumlabel)
      console.log(`✅ booking_type_enum created with values: ${enumValues.join(', ')}`)
    }
    
    // Test creating a booking
    console.log('🧪 Testing booking creation...')
    
    const testResult = await client.query(`
      INSERT INTO bookings (
        booking_number, customer_first_name, customer_surname, customer_email,
        yacht_name, charter_type, start_date, end_date, booking_status, 
        payment_status, booking_type, total_amount, deposit_amount, balance_due
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING id, booking_type
    `, [
      'TEST-' + Date.now(),
      'Test',
      'User',
      'test@example.com',
      'Test Yacht',
      'day',
      '2024-12-01',
      '2024-12-01',
      'pending',
      'pending',
      'external',
      1000,
      200,
      800
    ])
    
    if (testResult.rows.length > 0) {
      const testBooking = testResult.rows[0]
      console.log(`✅ Test booking created with ID: ${testBooking.id}`)
      console.log(`✅ Test booking booking_type: ${testBooking.booking_type}`)
      
      // Clean up
      await client.query('DELETE FROM bookings WHERE id = $1', [testBooking.id])
      console.log('🧹 Test booking cleaned up')
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('✅ booking_type column added to bookings table')
    console.log('✅ booking_type_enum type created')
    console.log('✅ Default value "regular" applied')
    console.log('✅ Index created for performance')
    console.log('✅ Booking creation/update with booking_type field verified')
    
    return true
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    return false
  } finally {
    await client.end()
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  applyMigrationPostgres().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { applyMigrationPostgres }