# Technical Implementation Details - June 29, 2025

## Problem Analysis

### Issue 1: Supabase Environment Variable Configuration

#### Symptoms
```javascript
// Console output showing the problem
Configuration: {
  useSupabase: false, 
  hasSupabaseClient: false, 
  configEnabled: false, 
  dbAvailable: false
}

Raw env values: {
  VITE_SUPABASE_URL: undefined, 
  VITE_SUPABASE_ANON_KEY: undefined, 
  VITE_USE_SUPABASE: undefined
}
```

#### Root Cause Analysis
Two conflicting Supabase configuration files:

1. **`/src/lib/supabase.js`** - Strict configuration
   ```javascript
   const hasRequiredEnvVars = !!(supabaseUrl && supabaseAnonKey)
   const shouldUseSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
   
   export const supabaseConfig = {
     enabled: !!(supabase && shouldUseSupabase),
     // No fallbacks - fails in production
   }
   ```

2. **`/src/services/supabase/supabaseClient.js`** - With fallbacks
   ```javascript
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
     (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') 
       ? 'https://kbwjtihjyhapaclyytxn.supabase.co' 
       : import.meta.env.VITE_SUPABASE_URL)
   ```

### Issue 2: Field Name Transformation

#### Database Schema (PostgreSQL snake_case)
```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    balance_due DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    customer_first_name TEXT,
    yacht_name TEXT,
    booking_status booking_status,
    -- etc.
);
```

#### Frontend Data (JavaScript camelCase)
```javascript
const bookingUpdate = {
  balanceDue: 1500,
  totalAmount: 3000,
  firstName: "John",
  yachtName: "Sea Explorer",
  bookingStatus: "confirmed"
}
```

#### Missing Transformation
The `db` helper had transformation logic, but direct Supabase calls did not:
```javascript
// OLD: Working transformation via db helper
const updatedBooking = await db.updateBooking(id, updates)

// NEW: Broken - no transformation
const { data, error } = await supabase
  .from('bookings')
  .update(updates)  // ❌ camelCase fields sent directly
```

## Implementation Solutions

### Solution 1: Unified Supabase Client Usage

#### Import Change
```javascript
// Before
import { supabase, supabaseConfig, db } from '../lib/supabase.js'

// After  
import { supabase, supabaseConfig } from '../services/supabase/supabaseClient.js'
```

#### Method Replacements
```javascript
// Replace db helper calls with direct Supabase calls
// OLD
const supabaseBookings = await db.getBookings()
const bookingSubscription = db.subscribeToBookings((payload) => {

// NEW
const { data: supabaseBookings, error } = await supabase
  .from('bookings')
  .select('*')
  .order('created_at', { ascending: false })

const bookingSubscription = supabase
  .channel('bookings-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
```

### Solution 2: Field Name Transformation

#### Complete Transformation Function
```javascript
transformFieldNames(data) {
  const fieldMappings = {
    // Financial fields
    'balanceDue': 'balance_due',
    'totalAmount': 'total_amount',
    'depositAmount': 'deposit_amount',
    'baseRate': 'base_rate',
    
    // Customer fields
    'firstName': 'customer_first_name',
    'surname': 'customer_surname',
    'email': 'customer_email',
    'phone': 'customer_phone',
    
    // Yacht fields
    'yachtName': 'yacht_name',
    'yachtType': 'yacht_type',
    'yachtLocation': 'yacht_location',
    
    // Status fields
    'bookingStatus': 'booking_status',
    'paymentStatus': 'payment_status',
    'bookingConfirmed': 'booking_confirmed',
    
    // ... complete mapping
  }
  
  const transformed = {}
  
  for (const [key, value] of Object.entries(data)) {
    // Skip nested objects
    if (key === 'status' && typeof value === 'object') continue
    if (key === 'documentStates') continue
    
    // Handle file objects
    if (key === 'crewExperienceFile' && value && typeof value === 'object') {
      if (value.name) transformed.crew_experience_file_name = value.name
      if (value.url) transformed.crew_experience_file_url = value.url  
      if (value.size) transformed.crew_experience_file_size = value.size
      continue
    }
    
    // Transform field name
    const dbFieldName = fieldMappings[key] || key
    
    // Validate against schema
    if (validDatabaseFields.includes(dbFieldName)) {
      transformed[dbFieldName] = value
    }
  }
  
  return transformed
}
```

#### Usage in CRUD Operations
```javascript
// Update with transformation
async updateBooking(id, updates) {
  if (this.useSupabase && supabase) {
    const transformedUpdates = this.transformFieldNames(updates)
    
    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update(transformedUpdates)  // ✅ snake_case fields
      .eq('id', id)
      .select()
      .single()
  }
}

// Create with transformation  
async addBooking(booking) {
  if (this.useSupabase && supabase) {
    const transformedBooking = this.transformFieldNames(booking)
    
    const { data: newBooking, error } = await supabase
      .from('bookings')
      .insert([transformedBooking])  // ✅ snake_case fields
      .select()
      .single()
  }
}
```

## Testing Implementation

### Manual Transformation Test
```javascript
const testData = {
  balanceDue: 1500,
  totalAmount: 3000,
  firstName: "John",
  yachtName: "Sea Explorer",
  bookingStatus: "confirmed",
  crewExperienceFile: {
    name: "license.pdf",
    url: "https://example.com/license.pdf", 
    size: 12345
  },
  status: { confirmed: true },  // Should be skipped
  documentStates: { contract: "sent" }  // Should be skipped
}

// Result after transformation
{
  balance_due: 1500,
  total_amount: 3000,
  customer_first_name: "John",
  yacht_name: "Sea Explorer", 
  booking_status: "confirmed",
  crew_experience_file_name: "license.pdf",
  crew_experience_file_url: "https://example.com/license.pdf",
  crew_experience_file_size: 12345
  // status and documentStates properly excluded
}
```

## Database Schema Validation

### Valid Database Fields Whitelist
```javascript
const validDatabaseFields = [
  // Core fields
  'id', 'booking_number', 'ical_uid',
  
  // Customer fields  
  'customer_first_name', 'customer_surname', 'customer_email', 'customer_phone',
  'customer_street', 'customer_city', 'customer_postcode', 'customer_country',
  
  // Yacht fields
  'yacht_id', 'yacht_name', 'yacht_type', 'yacht_location',
  
  // Booking details
  'charter_type', 'start_date', 'end_date', 'port_of_departure', 'port_of_arrival',
  
  // Status tracking
  'booking_status', 'payment_status', 'booking_confirmed', 'deposit_paid',
  'final_payment_paid', 'contract_sent', 'contract_signed', 'deposit_invoice_sent',
  'receipt_issued',
  
  // Financial
  'base_rate', 'total_amount', 'deposit_amount', 'balance_due',
  
  // Files
  'crew_experience_file_name', 'crew_experience_file_url', 'crew_experience_file_size',
  
  // Notes
  'special_requirements', 'notes',
  
  // Timestamps
  'created_at', 'updated_at', 'created_by', 'updated_by'
];
```

## Error Handling

### Before Fix
```
PATCH https://kbwjtihjyhapaclyytxn.supabase.co/rest/v1/bookings 400 (Bad Request)
{
  code: 'PGRST204', 
  message: "Could not find the 'balanceDue' column of 'bookings' in the schema cache"
}
```

### After Fix
- ✅ All field names properly transformed to snake_case
- ✅ Invalid fields filtered out before database call
- ✅ Successful PATCH requests with correct column names
- ✅ Proper error handling with meaningful messages

## Performance Considerations

### Real-time Subscriptions
Fixed subscription setup to ensure proper cleanup:
```javascript
const bookingSubscription = supabase
  .channel('bookings-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, callback)
  .subscribe()  // ✅ Essential for activation

// Proper cleanup in destructor
this.subscriptions.forEach(sub => {
  if (sub) supabase.removeChannel(sub)
})
```

### Memory Management
- Transformation creates new objects rather than mutating input
- Validation prevents unnecessary database calls with invalid fields
- Subscription cleanup prevents memory leaks

## Security Considerations

### Environment Variable Fallbacks
```javascript
// Fallback values only for known deployment environments
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') 
    ? 'https://kbwjtihjyhapaclyytxn.supabase.co'  // Known safe fallback
    : import.meta.env.VITE_SUPABASE_URL)
```

### Field Validation  
- Whitelist approach prevents injection of arbitrary fields
- Type checking on nested objects before decomposition
- No direct passthrough of user input to database

This implementation ensures robust, secure, and maintainable Supabase integration.