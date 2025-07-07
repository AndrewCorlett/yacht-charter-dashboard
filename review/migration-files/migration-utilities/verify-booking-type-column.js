import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase environment variables not found');
    console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBookingTypeColumn() {
    console.log('🔍 Checking for booking_type column in bookings table...\n');

    try {
        // Try to select the booking_type column
        const { data, error } = await supabase
            .from('bookings')
            .select('id, booking_type')
            .limit(1);

        if (error) {
            if (error.message.includes('column') && error.message.includes('booking_type')) {
                console.log('❌ booking_type column does NOT exist in bookings table');
                console.log('\n📌 To add the column, please:');
                console.log('1. Go to your Supabase dashboard');
                console.log('2. Navigate to SQL Editor');
                console.log('3. Copy and paste the contents of: migrations/add_booking_type_column.sql');
                console.log('4. Execute the SQL');
            } else {
                console.error('❌ Error checking bookings table:', error.message);
            }
            return false;
        }

        console.log('✅ booking_type column EXISTS in bookings table!');
        
        // Get more details about existing bookings
        const { data: bookings, count } = await supabase
            .from('bookings')
            .select('id, booking_type', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(10);

        if (bookings && bookings.length > 0) {
            console.log(`\n📊 Found ${count} total bookings`);
            console.log('\n📋 Recent bookings with booking_type:');
            bookings.forEach(booking => {
                console.log(`   - Booking ${booking.id}: ${booking.booking_type || 'null'}`);
            });

            // Count by type
            const typeCount = bookings.reduce((acc, booking) => {
                const type = booking.booking_type || 'null';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});

            console.log('\n📈 Booking type distribution (from sample):');
            Object.entries(typeCount).forEach(([type, count]) => {
                console.log(`   - ${type}: ${count}`);
            });
        } else {
            console.log('\n📊 No bookings found in the table');
        }

        return true;

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        return false;
    }
}

// Run the verification
verifyBookingTypeColumn()
    .then(exists => {
        if (exists) {
            console.log('\n✅ Column verification complete - booking_type column is ready to use!');
        } else {
            console.log('\n⚠️  Column verification complete - migration needed');
        }
        process.exit(exists ? 0 : 1);
    });