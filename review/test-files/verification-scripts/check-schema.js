import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    try {
        console.log('=== CHECKING BOOKINGS TABLE SCHEMA ===\n');
        
        // Get a sample booking to see all available columns
        const { data: sampleBooking, error: sampleError } = await supabase
            .from('bookings')
            .select('*')
            .limit(1);
        
        if (sampleError) {
            console.error('Error fetching sample booking:', sampleError);
        } else if (sampleBooking && sampleBooking.length > 0) {
            console.log('Available columns in bookings table:');
            console.log(Object.keys(sampleBooking[0]).sort());
            console.log('\nSample booking data:');
            console.log(JSON.stringify(sampleBooking[0], null, 2));
        }
        
    } catch (error) {
        console.error('Script error:', error);
    }
}

checkSchema();