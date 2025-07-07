# Migration Summary: Add booking_type Column

## Current Status
❌ **Migration NOT Applied** - The `booking_type` column does not exist in the `bookings` table yet.

## Migration Options

### Option 1: Manual SQL Execution (Recommended)
**Status**: ✅ Ready to execute  
**File**: `MIGRATION_INSTRUCTIONS.md`

1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste the SQL from `migrations/add-booking-type-column.sql`
3. Click "Run"
4. Verify with `node verify-booking-type.js`

### Option 2: PostgreSQL Direct Connection
**Status**: ⚠️ Requires database password  
**File**: `apply-migration-postgres.js`

1. Get database password from Supabase Dashboard → Settings → Database
2. Update the password in the script
3. Run `node apply-migration-postgres.js`

### Option 3: Supabase CLI (Not Available)
**Status**: ❌ Not working  
**Issue**: Docker daemon not running + remote operations not configured

## Migration Details

### What Gets Added
- **Enum Type**: `booking_type_enum` with values ('regular', 'external')
- **Column**: `booking_type` on `bookings` table
- **Default**: All existing bookings get `booking_type = 'regular'`
- **Index**: Performance index on `booking_type` column
- **Constraint**: NOT NULL with default value

### Schema Changes
```sql
-- New column
ALTER TABLE bookings ADD COLUMN booking_type booking_type_enum DEFAULT 'regular' NOT NULL;

-- New index
CREATE INDEX idx_bookings_booking_type ON bookings(booking_type);
```

## Verification

After applying the migration, run:
```bash
node verify-booking-type.js
```

Expected results:
- ✅ Column exists and accepts 'regular' and 'external' values
- ✅ Enum validation rejects invalid values
- ✅ Existing bookings have 'regular' booking_type
- ✅ New bookings can be created with either booking_type
- ✅ Booking updates work correctly

## Usage After Migration

### Create External Booking
```javascript
const externalBooking = {
  // ... other fields
  booking_type: 'external'
}
```

### Query by Booking Type
```javascript
// Get regular bookings
const regularBookings = await supabase
  .from('bookings')
  .select('*')
  .eq('booking_type', 'regular')

// Get external bookings  
const externalBookings = await supabase
  .from('bookings')
  .select('*')
  .eq('booking_type', 'external')
```

### Update Booking Type
```javascript
await supabase
  .from('bookings')
  .update({ booking_type: 'external' })
  .eq('id', bookingId)
```

## Integration Points

The `booking_type` field is already integrated into:
- `/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/src/lib/supabase.js` (field mapping)
- Booking creation/update workflows
- Frontend components expecting this field

## Next Steps

1. **Apply Migration**: Use Option 1 (manual SQL execution) - it's the most reliable
2. **Verify**: Run `node verify-booking-type.js` to confirm success
3. **Test**: Create a test booking with `booking_type: 'external'`
4. **Deploy**: The frontend code is already ready to use this field

## Files Created for Migration

- `migrations/add-booking-type-column.sql` - Migration SQL
- `MIGRATION_INSTRUCTIONS.md` - Step-by-step manual instructions
- `apply-migration.js` - Automated script (failed due to RPC limitations)
- `apply-migration-postgres.js` - Direct PostgreSQL connection script
- `verify-booking-type.js` - Verification script

## Migration Safety

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Non-destructive**: Doesn't modify existing data
- ✅ **Reversible**: Can be rolled back if needed
- ✅ **Performant**: Includes index for efficient queries
- ✅ **Validated**: Includes verification tests