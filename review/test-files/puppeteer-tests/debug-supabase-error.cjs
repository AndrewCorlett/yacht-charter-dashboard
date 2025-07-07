/**
 * Debug Supabase Error
 * 
 * Gets the actual error details from the browser console
 * 
 * @created 2025-06-27
 */

const puppeteer = require('puppeteer');

async function debugSupabaseError() {
  console.log('🔍 Debugging Supabase error in detail...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  
  // Capture all console messages with details
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    console.log(`[${type.toUpperCase()}] ${text}`);
    
    // If this is an error with an object, try to get more details
    if (type === 'error' && text.includes('JSHandle@error')) {
      // We'll handle this in the evaluation
    }
  });

  // Navigate to application
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Wait for React to load
  await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
  
  // Wait a bit for UnifiedDataService to attempt initialization
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Get detailed error information
  const errorDetails = await page.evaluate(() => {
    return new Promise(async (resolve) => {
      try {
        // Import the services to check their state
        const { supabase, db } = await import('/src/lib/supabase.js');
        const { default: unifiedDataService } = await import('/src/services/UnifiedDataService.js');
        
        // Test the db.getBookings call directly
        let dbTestResult;
        try {
          const bookings = await db.getBookings();
          dbTestResult = {
            success: true,
            count: bookings.length,
            sample: bookings[0] || null
          };
        } catch (dbError) {
          dbTestResult = {
            success: false,
            error: dbError.message,
            stack: dbError.stack
          };
        }
        
        resolve({
          hasSupabase: !!supabase,
          dbAvailable: db.isAvailable(),
          unifiedServiceState: {
            isInitialized: unifiedDataService.isInitialized,
            useSupabase: unifiedDataService.useSupabase,
            bookingCount: unifiedDataService.getAllBookings().length,
            charterCount: unifiedDataService.getAllCharters().length
          },
          dbTestResult
        });
        
      } catch (error) {
        resolve({
          error: error.message,
          stack: error.stack
        });
      }
    });
  });
  
  console.log('🧪 Detailed Error Analysis:');
  console.log(JSON.stringify(errorDetails, null, 2));
  
  await browser.close();
  
  return errorDetails;
}

// Run if called directly
if (require.main === module) {
  debugSupabaseError()
    .then(result => {
      console.log('✅ Debug completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('🚨 Debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugSupabaseError };