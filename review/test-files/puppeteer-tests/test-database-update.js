import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseUpdate() {
  console.log('Testing DocumentStates Fix with Direct Database Update...');
  
  try {
    const bookingId = 'ab4e9fd0-3297-48f1-96e5-1f69ca5646cc';
    
    console.log('1. Fetching current booking...');
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching booking:', fetchError);
      return;
    }
    
    console.log('2. Current booking number:', currentBooking.booking_number);
    
    // Update the booking number
    const newBookingNumber = '2528AL11';
    console.log('3. Updating booking number to:', newBookingNumber);
    
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ booking_number: newBookingNumber })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ UPDATE ERROR:', updateError);
      
      // Check if it's a documentStates error
      if (updateError.message && updateError.message.includes('documentStates')) {
        console.error('🚨 DOCUMENTSTATES ERROR DETECTED!');
        console.error('The fix did not work properly.');
      } else {
        console.log('✅ Error is not related to documentStates');
      }
      return;
    }
    
    console.log('✅ Update successful!');
    console.log('Updated booking number:', updatedBooking.booking_number);
    
    // Revert the change
    console.log('4. Reverting to original booking number...');
    const { error: revertError } = await supabase
      .from('bookings')
      .update({ booking_number: currentBooking.booking_number })
      .eq('id', bookingId);
    
    if (revertError) {
      console.error('Error reverting booking:', revertError);
    } else {
      console.log('✅ Reverted to original booking number');
    }
    
    console.log('\n🎉 DOCUMENTSTATES FIX VERIFICATION: PASSED');
    console.log('✅ Booking update completed without documentStates errors');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Check if it's a documentStates error
    if (error.message && error.message.includes('documentStates')) {
      console.error('🚨 DOCUMENTSTATES ERROR DETECTED!');
      console.error('The fix did not work properly.');
    }
  }
}

testDatabaseUpdate();