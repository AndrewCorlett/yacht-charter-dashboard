/**
 * Debug Calendar Render Issues
 * 
 * Investigates why the calendar component isn't rendering yacht headers
 * and booking cells despite having data available.
 * 
 * @created 2025-06-27
 */

const puppeteer = require('puppeteer');

async function debugCalendarRender() {
  console.log('🔍 Debugging calendar render issues...');
  
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
    } else if (text.includes('calendar') || text.includes('yacht') || text.includes('booking')) {
      console.log('📊 Browser Log:', text);
    }
  });

  // Navigate to application
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Wait for React to load
  await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
  
  // Wait for data to load
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Debug calendar render process
  const renderDebug = await page.evaluate(() => {
    return new Promise(async (resolve) => {
      try {
        // Check if calendar component is mounted
        const calendarComponent = document.querySelector('[data-testid="yacht-calendar"]');
        
        if (!calendarComponent) {
          resolve({
            error: 'Calendar component not found',
            calendarComponent: null
          });
          return;
        }
        
        // Check for yacht headers specifically
        const yachtHeaders = document.querySelector('[data-testid="yacht-headers"]');
        const headerElements = yachtHeaders ? yachtHeaders.querySelectorAll('div') : [];
        
        // Check for calendar grid elements
        const gridContainer = document.querySelector('#calendar-scroll-area');
        const gridElements = gridContainer ? gridContainer.querySelectorAll('div') : [];
        
        // Check useUnifiedData hook results
        const { default: unifiedDataService } = await import('/src/services/UnifiedDataService.js');
        const charters = unifiedDataService.getAllCharters();
        const bookings = unifiedDataService.getAllBookings();
        
        // Test yacht data calculation in calendar
        const fixedYachts = [
          { id: 'calico-moon', name: 'Calico Moon' },
          { id: 'spectre', name: 'Spectre' },
          { id: 'alrisha', name: 'Alrisha' },
          { id: 'disk-drive', name: 'Disk Drive' },
          { id: 'zavaria', name: 'Zavaria' },
          { id: 'mridula-sarwar', name: 'Mridula Sarwar' }
        ];
        
        const uniqueYachts = new Map();
        
        // Start with fixed yachts
        fixedYachts.forEach(yacht => {
          uniqueYachts.set(yacht.id, yacht);
        });
        
        // Add yachts from charter data
        charters.forEach(charter => {
          const yachtId = charter.yachtName.toLowerCase().replace(/\s+/g, '-');
          if (!uniqueYachts.has(yachtId)) {
            uniqueYachts.set(yachtId, {
              id: yachtId,
              name: charter.yachtName
            });
          }
        });
        
        // Add yachts from booking data
        bookings.forEach(booking => {
          if (booking.yacht_name || booking.yacht_id) {
            const yachtName = booking.yacht_name || booking.yacht_id;
            const yachtId = yachtName.toLowerCase().replace(/\s+/g, '-');
            if (!uniqueYachts.has(yachtId)) {
              uniqueYachts.set(yachtId, {
                id: yachtId,
                name: yachtName
              });
            }
          }
        });
        
        const calculatedYachts = Array.from(uniqueYachts.values());
        
        // Check for React component error boundaries
        const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
        
        // Check if calendar is actually rendering by looking for grid template columns
        const gridStyleElements = document.querySelectorAll('[style*="gridTemplateColumns"]');
        
        resolve({
          calendarComponent: {
            found: !!calendarComponent,
            classes: calendarComponent ? calendarComponent.className : null,
            children: calendarComponent ? calendarComponent.children.length : 0
          },
          yachtHeaders: {
            containerFound: !!yachtHeaders,
            headerCount: headerElements.length,
            expectedYachts: calculatedYachts.length,
            calculatedYachts: calculatedYachts.map(y => ({ id: y.id, name: y.name }))
          },
          dataAvailability: {
            charters: charters.length,
            bookings: bookings.length,
            sampleCharter: charters[0] || null,
            sampleBooking: bookings[0] || null
          },
          gridElements: {
            scrollContainer: !!gridContainer,
            gridElementCount: gridElements.length,
            gridStyleElements: gridStyleElements.length
          },
          errorBoundaries: errorBoundaries.length,
          renderIssues: {
            missingYachtHeaders: !yachtHeaders || headerElements.length === 0,
            missingGridElements: !gridContainer || gridElements.length === 0,
            noCalendarComponent: !calendarComponent
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
  
  console.log('🧪 Calendar Render Debug Results:');
  console.log(JSON.stringify(renderDebug, null, 2));
  
  // Take screenshot for visual debugging
  await page.screenshot({ 
    path: './calendar-render-debug.png',
    fullPage: true 
  });
  
  await browser.close();
  
  return renderDebug;
}

// Run if called directly
if (require.main === module) {
  debugCalendarRender()
    .then(result => {
      console.log('✅ Calendar render debug completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('🚨 Debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugCalendarRender };