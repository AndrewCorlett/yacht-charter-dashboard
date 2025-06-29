/**
 * Debug Calendar Bookings
 * 
 * Investigates why the calendar isn't showing bookings
 * even though the data is available.
 * 
 * @created 2025-06-27
 */

const puppeteer = require('puppeteer');

async function debugCalendarBookings() {
  console.log('🔍 Debugging calendar bookings display...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      console.log('🔴 Browser Error:', text);
    } else if (type === 'warn') {
      console.log('🟡 Browser Warning:', text);
    } else if (text.includes('BookingContext') || text.includes('calendar') || text.includes('booking')) {
      console.log('📊 Browser Log:', text);
    }
  });

  // Navigate to application
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Wait for React to load
  await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
  
  // Wait for data to load (longer wait)
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Debug calendar data
  const calendarDebug = await page.evaluate(() => {
    return new Promise(async (resolve) => {
      try {
        // Import required modules
        const { default: unifiedDataService } = await import('/src/services/UnifiedDataService.js');
        
        // Get data from UnifiedDataService (try multiple times in case of timing issues)
        let unifiedBookings = unifiedDataService.getAllBookings();
        let unifiedCharters = unifiedDataService.getAllCharters();
        
        // If no data, wait and try again
        if (unifiedBookings.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          unifiedBookings = unifiedDataService.getAllBookings();
          unifiedCharters = unifiedDataService.getAllCharters();
        }
        
        // Check UnifiedDataService state
        const unifiedState = {
          isInitialized: unifiedDataService.isInitialized,
          useSupabase: unifiedDataService.useSupabase,
          lastUpdate: unifiedDataService.getLastUpdate()
        };
        
        // Check calendar elements
        const calendarGrid = document.querySelector('.calendar-grid') || 
                            document.querySelector('[class*="calendar"]') ||
                            document.querySelector('.grid');
        
        const bookingCells = document.querySelectorAll('.booking-cell');
        const allCells = document.querySelectorAll('[class*="cell"]');
        
        // Check yacht headers
        const yachtHeaders = document.querySelectorAll('[class*="yacht"]');
        
        // Get calendar component data by checking React props
        let calendarProps = null;
        try {
          const calendarComponent = document.querySelector('[data-testid*="calendar"], .ios-card h2');
          if (calendarComponent && calendarComponent._reactInternalFiber) {
            calendarProps = calendarComponent._reactInternalFiber.memoizedProps;
          }
        } catch (e) {
          // React internals might be different in newer versions
        }
        
        resolve({
          unifiedData: {
            bookings: unifiedBookings.length,
            charters: unifiedCharters.length,
            sampleBooking: unifiedBookings[0] || null,
            sampleCharter: unifiedCharters[0] || null,
            unifiedState: unifiedState
          },
          calendarElements: {
            hasCalendarGrid: !!calendarGrid,
            bookingCells: bookingCells.length,
            allCells: allCells.length,
            yachtHeaders: yachtHeaders.length,
            calendarProps: calendarProps ? 'found' : 'not found'
          },
          domStructure: {
            calendarSelectors: [
              '.calendar-grid',
              '.booking-cell',
              '[class*="calendar"]',
              '[class*="yacht"]',
              '.ios-card'
            ].map(selector => ({
              selector,
              count: document.querySelectorAll(selector).length
            }))
          }
        });
        
      } catch (error) {
        resolve({
          error: error.message,
          stack: error.stack
        });
      }
    });
  });
  
  console.log('🧪 Calendar Debug Results:');
  console.log(JSON.stringify(calendarDebug, null, 2));
  
  // Take screenshot for visual debugging
  await page.screenshot({ 
    path: './calendar-debug.png',
    fullPage: true 
  });
  
  await browser.close();
  
  return calendarDebug;
}

// Run if called directly
if (require.main === module) {
  debugCalendarBookings()
    .then(result => {
      console.log('✅ Calendar debug completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('🚨 Debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugCalendarBookings };