import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeBookingChanges() {
    try {
        console.log('=== ANALYZING BOOKING CHANGES ===\n');
        
        // Focus on the booking with ID 'ab4e9fd0-3297-48f1-96e5-1f69ca5646cc' (2528AL09)
        // This appears to be the one that was updated most recently
        const targetBookingId = 'ab4e9fd0-3297-48f1-96e5-1f69ca5646cc';
        
        console.log('1. Detailed view of most recently updated booking:');
        const { data: detailedBooking, error: detailError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', targetBookingId)
            .single();
        
        if (detailError) {
            console.error('Error fetching detailed booking:', detailError);
        } else {
            console.log('Booking Details:');
            console.log('ID:', detailedBooking.id);
            console.log('Current Booking Number:', detailedBooking.booking_number);
            console.log('Created At:', detailedBooking.created_at);
            console.log('Updated At:', detailedBooking.updated_at);
            console.log('Customer Name:', detailedBooking.customer_first_name, detailedBooking.customer_surname);
            console.log('Booking Status:', detailedBooking.booking_status);
            console.log('');
        }
        
        // Check if there are any other bookings that might have been modified
        console.log('2. All bookings with recent updates (last 2 hours):');
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data: recentBookings, error: recentError } = await supabase
            .from('bookings')
            .select('id, booking_number, updated_at, customer_first_name, customer_surname, booking_status')
            .gte('updated_at', twoHoursAgo)
            .order('updated_at', { ascending: false });
        
        if (recentError) {
            console.error('Error fetching recent bookings:', recentError);
        } else {
            console.table(recentBookings);
        }
        
        // Look for any booking that might have been changed from a different number
        console.log('\n3. Checking for any bookings that might have been test targets:');
        const { data: potentialTargets, error: targetError } = await supabase
            .from('bookings')
            .select('id, booking_number, updated_at, customer_first_name, customer_surname, change_history')
            .or('booking_number.like.%TEST%,booking_number.like.%2528AL%,booking_number.like.%11,booking_number.like.%09');
        
        if (targetError) {
            console.error('Error fetching potential targets:', targetError);
        } else {
            console.log('Potential test target bookings:');
            potentialTargets.forEach(booking => {
                console.log(`\n--- Booking ${booking.booking_number} ---`);
                console.log('ID:', booking.id);
                console.log('Customer:', booking.customer_first_name, booking.customer_surname);
                console.log('Last Updated:', booking.updated_at);
                
                // Check for recent booking_number changes in change history
                if (booking.change_history && Array.isArray(booking.change_history)) {
                    const bookingNumberChanges = booking.change_history.filter(change => 
                        change.changes && change.changes.booking_number
                    );
                    
                    if (bookingNumberChanges.length > 0) {
                        console.log('Booking number changes found:');
                        bookingNumberChanges.forEach(change => {
                            console.log(`  ${change.timestamp}: ${change.changes.booking_number.old} → ${change.changes.booking_number.new}`);
                        });
                    } else {
                        console.log('No booking number changes in history');
                    }
                }
            });
        }
        
        // Check current time to understand timeline
        console.log('\n4. Current time analysis:');
        console.log('Current UTC time:', new Date().toISOString());
        console.log('Current local time:', new Date().toLocaleString());
        
        if (detailedBooking) {
            const updateTime = new Date(detailedBooking.updated_at);
            const timeDiff = (Date.now() - updateTime.getTime()) / (1000 * 60); // minutes
            console.log(`Last update was ${timeDiff.toFixed(1)} minutes ago`);
        }
        
    } catch (error) {
        console.error('Script error:', error);
    }
}

analyzeBookingChanges();