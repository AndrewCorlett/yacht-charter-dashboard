# Database Migration Guide - Booking Type Column

## Overview
This migration adds the `booking_type` column to the `bookings` table to support external bookings (bookings made outside the system that need to be tracked for proper sequential numbering).

## Why This Migration is Required
1. **Code Already References It**: The application code already tries to use `booking_type` field
2. **External Bookings**: Need to distinguish between regular and external bookings
3. **Data Integrity**: Ensures all bookings are properly categorized

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `migrations/add-booking-type-column.sql`
   - Paste into the SQL Editor
   - Click "Run"

3. **Verify Success**
   - You should see: "booking_type column successfully added to bookings table"
   - Check the Table Editor to confirm the column exists

### Option 2: Using Command Line

1. **Check Current Status**
   ```bash
   node run-migration.js
   ```
   This will show you the migration SQL and test if the column already exists.

2. **Apply Migration**
   - Follow the instructions displayed by the script
   - Copy the SQL and run it in Supabase SQL Editor

## Migration Safety

✅ **Safe to Run Multiple Times**: The migration uses `IF NOT EXISTS` checks
✅ **No Data Loss**: Existing bookings are set to 'regular' by default
✅ **Backward Compatible**: Doesn't break existing functionality

## Post-Migration Verification

After running the migration, verify it worked:

1. **Check Column Exists**
   - In Supabase Table Editor, open the `bookings` table
   - Confirm `booking_type` column is present
   - Check it has enum type with values: 'regular', 'external'

2. **Test the Application**
   - Create a new booking (should be 'regular' type)
   - Try the external booking feature
   - Edit a booking number and verify sequential numbering

## Troubleshooting

### Error: "Failed to add booking_type column"
- Check you have proper permissions in Supabase
- Verify you're connected to the correct database

### Error: "booking_type already exists"
- This is fine! The migration has already been applied
- The application should work correctly

### Application Still Shows Errors
- Clear browser cache and refresh
- Restart the development server
- Check that environment variables are set correctly

## Rollback (If Needed)

To remove the booking_type column:
```sql
ALTER TABLE bookings DROP COLUMN IF EXISTS booking_type;
DROP TYPE IF EXISTS booking_type_enum;
```

⚠️ **Warning**: Only rollback if you're sure you don't need external booking functionality