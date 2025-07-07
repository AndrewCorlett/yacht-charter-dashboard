import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bixbaqhbfbgxvuihvqgi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeGJhcWhiZmJneHZ1aWh2cWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4NzI2MjMsImV4cCI6MjAzNTQ0ODYyM30.lVFiIhTkWDfN0z9KtCKzN9xNjAGKLKXQB4KrIqvpJ0k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookingData() {
  try {
    console.log('Checking booking data...');
    
    // First, check all bookings
    const { data: allBookings, error: allError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('Error fetching all bookings:', allError);
      return;
    }
    
    console.log(`Total bookings found: ${allBookings.length}`);
    
    // Look for the specific booking
    const targetBooking = allBookings.find(booking => 
      booking.booking_number === '2528AL09' || 
      booking.booking_number === '2528AL10' ||
      booking.booking_number?.includes('2528AL')
    );
    
    if (targetBooking) {
      console.log('Found target booking:', targetBooking);
    } else {
      console.log('Target booking not found. Checking all booking numbers...');
      
      const bookingNumbers = allBookings.map(b => b.booking_number).filter(Boolean);
      console.log('All booking numbers:', bookingNumbers);
      
      // Look for any booking with "Customer1 Test1"
      const customerBookings = allBookings.filter(booking => 
        booking.guest_name?.includes('Customer1') || 
        booking.guest_name?.includes('Test1') ||
        booking.guest_name?.includes('Customer1 Test1')
      );
      
      if (customerBookings.length > 0) {
        console.log('Found bookings for Customer1 Test1:', customerBookings);
      } else {
        console.log('No bookings found for Customer1 Test1');
        
        // Show first 5 bookings as examples
        console.log('First 5 bookings as examples:');
        allBookings.slice(0, 5).forEach((booking, index) => {
          console.log(`${index + 1}. Booking Number: ${booking.booking_number}, Guest: ${booking.guest_name}, Status: ${booking.status}`);
        });
      }
    }
    
    // Check if there are any bookings with similar patterns
    const similarBookings = allBookings.filter(booking => 
      booking.booking_number?.match(/\d{4}AL\d{2}/)
    );
    
    if (similarBookings.length > 0) {
      console.log('Found bookings with similar patterns:');
      similarBookings.forEach(booking => {
        console.log(`- ${booking.booking_number}: ${booking.guest_name}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking booking data:', error);
  }
}

checkBookingData().catch(console.error);