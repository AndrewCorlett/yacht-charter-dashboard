-- Add final_payment_paid column to bookings table
-- This column was referenced in the frontend but missing from the database schema

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS final_payment_paid BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN bookings.final_payment_paid IS 'Indicates if the final payment has been made for the booking';