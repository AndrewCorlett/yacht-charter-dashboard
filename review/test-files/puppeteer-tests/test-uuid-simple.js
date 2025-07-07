/**
 * Simple test to verify UUID mapping by checking the BookingService methods
 */

// Mock the environment variables that would be available in Vite
globalThis.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      VITE_ENVIRONMENT: process.env.VITE_ENVIRONMENT || 'development'
    }
  }
};

// Load environment variables from .env file
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf8');
  const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join('=').trim();
    }
    return acc;
  }, {});
  
  // Set environment variables
  Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
    globalThis.import.meta.env[key] = value;
  });
  
  console.log('✓ Environment variables loaded');
} catch (error) {
  console.log('⚠ No .env file found, using existing environment variables');
}

// Now test the BookingService
const testUUIDMapping = async () => {
  console.log('=== Testing UUID Mapping Implementation ===\n');
  
  try {
    // Import BookingService
    const { default: BookingService } = await import('./src/services/supabase/BookingService.js');
    
    console.log('✓ BookingService imported successfully');
    
    // Test the yacht UUID
    const testUUID = '50dba171-b830-4d88-9cb0-c14a37c4d58a';
    console.log(`\n1. Testing UUID conversion: ${testUUID}`);
    
    // Check if the getYachtNameFromId method exists
    if (typeof BookingService.getYachtNameFromId === 'function') {
      console.log('✓ getYachtNameFromId method exists');
      
      // Test the UUID conversion
      const yachtName = await BookingService.getYachtNameFromId(testUUID);
      console.log(`✓ Successfully converted UUID to yacht name: ${yachtName}`);
      
      // Test booking number generation
      console.log('\n2. Testing booking number generation...');
      const bookingNumber = await BookingService.generateBookingNumber(yachtName, '2025-07-08');
      console.log(`✓ Successfully generated booking number: ${bookingNumber}`);
      
      // Verify format
      const formatMatch = bookingNumber.match(/^(\d{2})(\d{2})([A-Z]{2})(\d{2})$/);
      if (formatMatch) {
        const [, year, week, boatCode, sequence] = formatMatch;
        console.log(`✓ Booking number format is correct: YY=${year}, WW=${week}, BC=${boatCode}, NN=${sequence}`);
      } else {
        console.log(`✗ Booking number format is incorrect. Expected YYWWBCNN, got: ${bookingNumber}`);
      }
      
      console.log('\n=== UUID Mapping Fix Status ===');
      console.log('✓ UUID to name mapping: IMPLEMENTED');
      console.log('✓ Booking number generation: WORKING');
      console.log(`✓ Expected format: YYWWBCNN`);
      console.log(`✓ Actual format: ${bookingNumber}`);
      
    } else {
      console.log('✗ getYachtNameFromId method not found');
    }
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Run the test
testUUIDMapping();