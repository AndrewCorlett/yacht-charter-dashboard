# Manual Migration Instructions: Add booking_type Column

## Overview
This migration adds a `booking_type` column to the `bookings` table to support distinguishing between regular bookings (created in the system) and external bookings (placeholders for bookings made outside the system).

## Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `kbwjtihjyhapaclyytxn`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Execute Migration SQL

Copy and paste the following SQL into the Supabase SQL Editor and click **Run**:

```sql
-- Migration: Add booking_type column to bookings table
-- Purpose: Support external bookings that are made outside the system
-- Created: 2025-07-05

-- Create enum type for booking types if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_type_enum') THEN
        CREATE TYPE booking_type_enum AS ENUM ('regular', 'external');
    END IF;
END $$;

-- Add booking_type column to bookings table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'booking_type'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN booking_type booking_type_enum DEFAULT 'regular' NOT NULL;
        
        -- Add comment for documentation
        COMMENT ON COLUMN bookings.booking_type IS 'Type of booking: regular (created in system) or external (placeholder for bookings made outside the system)';
        
        -- Create index for performance when filtering by booking type
        CREATE INDEX idx_bookings_booking_type ON bookings(booking_type);
        
        -- Update any existing NULL values (shouldn't be any with NOT NULL constraint)
        UPDATE bookings 
        SET booking_type = 'regular' 
        WHERE booking_type IS NULL;
    END IF;
END $$;

-- Verify the column was added successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'booking_type'
    ) THEN
        RAISE NOTICE 'booking_type column successfully added to bookings table';
    ELSE
        RAISE EXCEPTION 'Failed to add booking_type column to bookings table';
    END IF;
END $$;
```

## Step 3: Verify Migration Success

After running the migration, you should see:
- ✅ Green checkmark indicating successful execution
- ✅ Notice message: "booking_type column successfully added to bookings table"
- ✅ No error messages

## Step 4: Run Verification Script

After manually applying the migration, run the verification script to confirm everything works:

```bash
node verify-booking-type.js
```

Expected output:
```
🔍 Verifying booking_type column status...

1. Testing column existence...
✅ booking_type column exists

2. Testing existing records...
✅ Found X existing bookings
📊 Booking types found: regular

3. Testing booking creation with booking_type...
✅ Test booking created successfully
📋 Test booking booking_type: external

4. Testing booking_type update...
✅ booking_type updated successfully
📋 Updated booking_type: regular

5. Testing enum validation...
✅ Enum validation working correctly (rejected invalid value)

6. Cleaning up test booking...
✅ Test booking cleaned up successfully

🎉 All verification tests passed!
✅ booking_type column is fully functional
✅ Column accepts "regular" and "external" enum values
✅ Column rejects invalid enum values
✅ Booking creation/update with booking_type field verified
```

## What This Migration Does

1. **Creates Enum Type**: Adds `booking_type_enum` with values 'regular' and 'external'
2. **Adds Column**: Adds `booking_type` column to `bookings` table with default value 'regular'
3. **Sets Constraints**: Column is NOT NULL with default value
4. **Adds Index**: Creates index for performance when filtering by booking type
5. **Updates Existing Records**: Ensures all existing bookings have 'regular' booking_type
6. **Adds Documentation**: Comments explaining the column purpose

## Migration Features

- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Doesn't modify existing data
- **Performant**: Includes index for efficient querying
- **Validated**: Includes verification step

## After Migration

Once the migration is complete, you can:

1. **Create external bookings**:
   ```javascript
   const externalBooking = {
     // ... other booking fields
     booking_type: 'external'
   }
   ```

2. **Query by booking type**:
   ```javascript
   // Get only regular bookings
   const regularBookings = await supabase
     .from('bookings')
     .select('*')
     .eq('booking_type', 'regular')
   
   // Get only external bookings
   const externalBookings = await supabase
     .from('bookings')
     .select('*')
     .eq('booking_type', 'external')
   ```

3. **Update booking type**:
   ```javascript
   await supabase
     .from('bookings')
     .update({ booking_type: 'external' })
     .eq('id', bookingId)
   ```

## Troubleshooting

If you encounter issues:

1. **Permission Error**: Ensure you have admin access to the Supabase project
2. **Column Already Exists**: The migration is idempotent, so it's safe to run again
3. **Type Already Exists**: The enum type check prevents duplicate creation
4. **Verification Fails**: Run `node verify-booking-type.js` to diagnose issues

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove the column (this will also remove the index)
ALTER TABLE bookings DROP COLUMN IF EXISTS booking_type;

-- Remove the enum type
DROP TYPE IF EXISTS booking_type_enum;
```

⚠️ **Warning**: Rollback will permanently delete the booking_type data for all bookings.