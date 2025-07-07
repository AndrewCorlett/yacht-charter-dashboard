import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookingNumbers() {
    try {
        console.log('=== CHECKING BOOKING NUMBERS IN DATABASE ===\n');
        
        // 1. Query all bookings with their booking numbers, ordered by updated_at
        console.log('1. All bookings ordered by most recently updated:');
        const { data: allBookings, error: allError } = await supabase
            .from('bookings')
            .select('id, booking_number, updated_at, created_at')
            .order('updated_at', { ascending: false })
            .limit(20);
        
        if (allError) {
            console.error('Error fetching all bookings:', allError);
        } else {
            console.table(allBookings);
        }
        
        // 2. Look for booking numbers ending with specific patterns (09, 11, etc.)
        console.log('\n2. Bookings with numbers ending in 09, 11, or similar test patterns:');
        const { data: patternBookings, error: patternError } = await supabase
            .from('bookings')
            .select('id, booking_number, updated_at, created_at')
            .or('booking_number.like.%09,booking_number.like.%11,booking_number.like.%TEST%');
        
        if (patternError) {
            console.error('Error fetching pattern bookings:', patternError);
        } else {
            console.table(patternBookings);
        }
        
        // 3. Check for recent updates (last 60 minutes)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        console.log('\n3. Bookings updated in the last 60 minutes:');
        const { data: recentBookings, error: recentError } = await supabase
            .from('bookings')
            .select('id, booking_number, updated_at, created_at')
            .gte('updated_at', oneHourAgo)
            .order('updated_at', { ascending: false });
        
        if (recentError) {
            console.error('Error fetching recent bookings:', recentError);
        } else {
            console.table(recentBookings);
            console.log(`Found ${recentBookings.length} bookings updated in the last 60 minutes`);
        }
        
        // 4. Get total count of bookings
        console.log('\n4. Total booking count:');
        const { count, error: countError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.error('Error getting booking count:', countError);
        } else {
            console.log(`Total bookings in database: ${count}`);
        }
        
        // 5. Check for any booking number duplicates
        console.log('\n5. Checking for duplicate booking numbers:');
        const { data: duplicates, error: dupError } = await supabase
            .from('bookings')
            .select('booking_number')
            .not('booking_number', 'is', null);
        
        if (dupError) {
            console.error('Error checking duplicates:', dupError);
        } else {
            const bookingNumbers = duplicates.map(b => b.booking_number);
            const duplicateNumbers = bookingNumbers.filter((num, index) => bookingNumbers.indexOf(num) !== index);
            
            if (duplicateNumbers.length > 0) {
                console.log('Duplicate booking numbers found:', [...new Set(duplicateNumbers)]);
            } else {
                console.log('No duplicate booking numbers found');
            }
        }
        
    } catch (error) {
        console.error('Script error:', error);
    }
}

checkBookingNumbers();