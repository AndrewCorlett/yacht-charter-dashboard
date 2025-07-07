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