-- Add booking_type column to bookings table
-- This column is used to distinguish between regular bookings and external bookings
-- External bookings are created for blocking dates when the yacht is unavailable (e.g., owner use, maintenance)

-- Create the booking type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_type_enum') THEN
        CREATE TYPE booking_type_enum AS ENUM ('regular', 'external');
    END IF;
END $$;

-- Add the booking_type column with a default value of 'regular'
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_type booking_type_enum DEFAULT 'regular';

-- Add comment for documentation
COMMENT ON COLUMN bookings.booking_type IS 'Indicates if this is a regular customer booking or an external booking (owner use, maintenance, etc.)';

-- Create an index for better query performance when filtering by booking type
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);

-- Update any existing bookings to have the default value (safety measure)
UPDATE bookings 
SET booking_type = 'regular' 
WHERE booking_type IS NULL;