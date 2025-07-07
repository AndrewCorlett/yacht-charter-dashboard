/**
 * Test script to investigate booking persistence issue
 * Tests the complete flow: create booking -> refresh page -> check if booking exists
 */

const puppeteer = require('puppeteer');

async function testBookingPersistence() {
  let browser;
  try {
    console.log('🔍 Starting booking persistence investigation...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log(`🖥️  CONSOLE [${msg.type()}]:`, msg.text());
    });
    
    page.on('pageerror', error => {
      console.log(`❌ PAGE ERROR:`, error.message);
    });
    
    page.on('requestfailed', request => {
      console.log(`🚫 REQUEST FAILED:`, request.url(), request.failure().errorText);
    });
    
    console.log('1️⃣ Loading dashboard...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-screenshots/01-initial-page.png', fullPage: true });
    
    console.log('2️⃣ Filling out Quick Create form...');
    
    // Wait for the booking form to be visible
    await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
    
    // Wait for yacht options to load and select first one
    await page.waitForSelector('select[name="yacht"] option:nth-child(2)', { timeout: 10000 });
    await page.select('select[name="yacht"]', await page.$eval('select[name="yacht"] option:nth-child(2)', el => el.value));
    await page.type('input[name="firstName"]', 'Test');
    await page.type('input[name="surname"]', 'Customer');
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="phone"]', '+44 7700 900000');
    await page.type('input[name="addressLine1"]', '123 Test Street');
    await page.type('input[name="city"]', 'London');
    await page.type('input[name="postcode"]', 'SW1A 1AA');
    await page.type('input[name="startDate"]', '2025-07-01');
    await page.type('input[name="endDate"]', '2025-07-07');
    
    // Take screenshot after filling form
    await page.screenshot({ path: 'test-screenshots/02-form-filled.png', fullPage: true });
    
    console.log('3️⃣ Submitting booking...');
    
    // Click submit button
    await page.click('button[data-testid="submit-booking"]');
    
    // Wait for either success modal or error
    try {
      await page.waitForSelector('.ios-card', { timeout: 5000 });
      console.log('✅ Form submitted - checking for success/error messages...');
      
      // Check for success modal or inline messages
      const successModal = await page.$('.modal'); // Adjust selector based on your modal
      const successMessage = await page.$('[data-testid="booking-success"]');
      const errorMessage = await page.$('.text-red-500, [style*="color: var(--color-ios-red)"]');
      
      if (successModal) {
        console.log('✅ Success modal appeared');
      } else if (successMessage) {
        console.log('✅ Success message appeared');
      } else if (errorMessage) {
        const errorText = await page.evaluate(el => el.textContent, errorMessage);
        console.log('❌ Error message:', errorText);
      }
      
    } catch (error) {
      console.log('⚠️  No clear success/error indication found');
    }
    
    // Take screenshot after submission
    await page.screenshot({ path: 'test-screenshots/03-after-submission.png', fullPage: true });
    
    console.log('4️⃣ Waiting for any modal to close...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait a bit for any modals
    
    console.log('5️⃣ Checking if booking appears in the data...');
    
    // Check local storage and session storage
    const localStorage = await page.evaluate(() => {
      return Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {});
    });
    
    const sessionStorage = await page.evaluate(() => {
      return Object.keys(sessionStorage).reduce((acc, key) => {
        acc[key] = sessionStorage.getItem(key);
        return acc;
      }, {});
    });
    
    console.log('📦 Local Storage:', JSON.stringify(localStorage, null, 2));
    console.log('📦 Session Storage:', JSON.stringify(sessionStorage, null, 2));
    
    // Check if booking appears in UnifiedDataService
    const unifiedDataCheck = await page.evaluate(() => {
      // Access the unified data service if available globally
      if (window.unifiedDataService) {
        return {
          bookings: window.unifiedDataService.getAllBookings(),
          charters: window.unifiedDataService.getAllCharters()
        };
      }
      return null;
    });
    
    if (unifiedDataCheck) {
      console.log('📊 Unified Data Service - Bookings:', unifiedDataCheck.bookings.length);
      console.log('📊 Unified Data Service - Charters:', unifiedDataCheck.charters.length);
    }
    
    console.log('6️⃣ Refreshing page to test persistence...');
    
    // Refresh the page
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Take screenshot after refresh
    await page.screenshot({ path: 'test-screenshots/04-after-refresh.png', fullPage: true });
    
    console.log('7️⃣ Checking if booking still exists after refresh...');
    
    // Check the data again after refresh
    const postRefreshData = await page.evaluate(() => {
      if (window.unifiedDataService) {
        return {
          bookings: window.unifiedDataService.getAllBookings(),
          charters: window.unifiedDataService.getAllCharters()
        };
      }
      return null;
    });
    
    if (postRefreshData) {
      console.log('📊 After Refresh - Bookings:', postRefreshData.bookings.length);
      console.log('📊 After Refresh - Charters:', postRefreshData.charters.length);
      
      // Look for our test booking
      const testBooking = postRefreshData.bookings.find(b => 
        b.customer_email === 'test@example.com' || 
        b.email === 'test@example.com'
      );
      
      if (testBooking) {
        console.log('✅ Test booking found after refresh!', testBooking);
      } else {
        console.log('❌ Test booking NOT found after refresh!');
        console.log('Available bookings:', postRefreshData.bookings.map(b => ({
          id: b.id,
          email: b.customer_email || b.email,
          name: b.customer_first_name || b.firstName
        })));
      }
    }
    
    console.log('8️⃣ Checking browser network requests...');
    
    // Navigate to bookings section to see if data loads there
    const bookingsTab = await page.$('nav button:has-text("Bookings"), [data-section="bookings"]');
    if (bookingsTab) {
      await bookingsTab.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: 'test-screenshots/05-bookings-section.png', fullPage: true });
    }
    
    console.log('\n🔍 Investigation Complete!');
    console.log('📸 Screenshots saved to test-screenshots/');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// Run the test
testBookingPersistence()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });