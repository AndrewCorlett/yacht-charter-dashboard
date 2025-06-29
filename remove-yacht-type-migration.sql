-- Remove yacht_type column from yachts table
-- This column is unnecessary as yacht names are sufficient identification

-- First, remove any references to yacht_type in the application code
-- Then apply this migration to clean up the database schema

BEGIN;

-- Remove yacht_type column from yachts table
ALTER TABLE yachts DROP COLUMN IF EXISTS yacht_type;

-- Verify the column has been removed
-- The yachts table should now only contain: id, name, length_feet, cabins, berths, 
-- engine_type, year_built, location, daily_rate, weekly_rate, is_active, description, 
-- specifications, created_at, updated_at

COMMIT;