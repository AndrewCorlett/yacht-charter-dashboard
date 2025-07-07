/**
 * Focused test to investigate booking creation and persistence
 */

const puppeteer = require('puppeteer');

async function testBookingCreation() {
  let browser;
  try {
    console.log('🔍 Testing booking creation and persistence...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console messages for debugging
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (text.includes('booking') || text.includes('create') || text.includes('save') || 
          text.includes('error') || text.includes('validation') || text.includes('supabase')) {
        console.log(`🖥️ [${type.toUpperCase()}]: ${text}`);
      }
    });
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
    
    console.log('1️⃣ Form loaded, filling data...');
    
    // Fill the form with valid data
    await page.select('select[name="yacht"]', 'c2c363c7-ca98-43e9-901d-630ea62ccdce'); // Alrisha
    await page.type('input[name="firstName"]', 'Test');
    await page.type('input[name="surname"]', 'Customer');
    await page.type('input[name="email"]', 'test@persistence.com');
    await page.type('input[name="phone"]', '+44 7700 900000');
    await page.type('input[name="addressLine1"]', '123 Test Street');
    await page.type('input[name="city"]', 'London');
    await page.type('input[name="postcode"]', 'SW1A 1AA');
    await page.type('input[name="startDate"]', '2025-07-01');
    await page.type('input[name="endDate"]', '2025-07-07');
    
    console.log('2️⃣ Submitting booking...');
    
    // Click submit and wait for response
    await page.click('button[data-testid="submit-booking"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('3️⃣ Checking result...');
    
    // Check for success or error messages
    const messages = await page.evaluate(() => {
      const results = {
        errors: [],
        success: [],
        modals: []
      };
      
      // Check for error messages
      const errorSelectors = [
        '[style*="color: var(--color-ios-red)"]',
        '.text-red-500',
        '[data-testid*="error"]'
      ];
      
      errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text && !results.errors.includes(text)) {
            results.errors.push(text);
          }
        });
      });
      
      // Check for success messages
      const successSelectors = [
        '[style*="color: var(--color-ios-green)"]',
        '.text-green-500',
        '[data-testid*="success"]'
      ];
      
      successSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text && !results.success.includes(text)) {
            results.success.push(text);
          }
        });
      });
      
      // Check for modals
      const modalElements = document.querySelectorAll('.modal, [class*="Modal"], [data-testid*="modal"]');
      modalElements.forEach(el => {
        if (el.style.display !== 'none' && !el.hidden) {
          results.modals.push(el.textContent.trim());
        }
      });
      
      return results;
    });
    
    console.log('📝 Form submission results:');
    console.log('   Errors:', messages.errors);
    console.log('   Success:', messages.success);
    console.log('   Modals:', messages.modals);
    
    // Check if booking was added to local state
    const localData = await page.evaluate(() => {
      try {
        // Try to access different data sources
        const results = {};
        
        // Check if unifiedDataService is available
        if (window.unifiedDataService) {
          results.unifiedBookings = window.unifiedDataService.getAllBookings().length;
          results.unifiedCharters = window.unifiedDataService.getAllCharters().length;
          
          // Look for our test booking
          const testBooking = window.unifiedDataService.getAllBookings().find(b => 
            (b.customer_email || b.email) === 'test@persistence.com'
          );
          results.testBookingFound = !!testBooking;
          if (testBooking) {
            results.testBookingData = {
              id: testBooking.id,
              email: testBooking.customer_email || testBooking.email,
              name: (testBooking.customer_first_name || testBooking.firstName) + ' ' + (testBooking.customer_surname || testBooking.surname)
            };
          }
        }
        
        // Check localStorage and sessionStorage
        results.localStorage = Object.keys(localStorage).length;
        results.sessionStorage = Object.keys(sessionStorage).length;
        
        return results;
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 Local data status:', localData);
    
    console.log('4️⃣ Refreshing page to test persistence...');
    
    // Refresh the page
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check data after refresh
    const postRefreshData = await page.evaluate(() => {
      try {
        const results = {};
        
        if (window.unifiedDataService) {
          results.unifiedBookings = window.unifiedDataService.getAllBookings().length;
          results.unifiedCharters = window.unifiedDataService.getAllCharters().length;
          
          // Look for our test booking
          const testBooking = window.unifiedDataService.getAllBookings().find(b => 
            (b.customer_email || b.email) === 'test@persistence.com'
          );
          results.testBookingFound = !!testBooking;
          if (testBooking) {
            results.testBookingData = {
              id: testBooking.id,
              email: testBooking.customer_email || testBooking.email,
              name: (testBooking.customer_first_name || testBooking.firstName) + ' ' + (testBooking.customer_surname || testBooking.surname)
            };
          }
        }
        
        return results;
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 Post-refresh data:', postRefreshData);
    
    // Final analysis
    console.log('\n🎯 ANALYSIS:');
    console.log('===========');
    
    if (messages.errors.length > 0) {
      console.log('❌ BOOKING CREATION FAILED');
      console.log('   Reason: Form validation or submission errors');
      console.log('   Errors:', messages.errors);
    } else if (messages.success.length > 0 || messages.modals.length > 0) {
      console.log('✅ BOOKING CREATION APPEARED TO SUCCEED');
      
      if (localData.testBookingFound) {
        console.log('✅ Booking was added to local state');
      } else {
        console.log('❌ Booking was NOT added to local state');
      }
      
      if (postRefreshData.testBookingFound) {
        console.log('✅ Booking persisted after page refresh');
      } else {
        console.log('❌ BOOKING DISAPPEARED AFTER PAGE REFRESH');
        console.log('   This confirms the persistence issue!');
      }
    } else {
      console.log('❓ UNCLEAR RESULT - No clear success or error indication');
    }
    
    console.log('\n🏁 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testBookingCreation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });