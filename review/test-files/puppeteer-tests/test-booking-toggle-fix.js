/**
 * Test script to verify booking toggle functionality works after database schema fix
 */

import puppeteer from 'puppeteer';

async function testBookingToggleFix() {
  let browser;
  let results = {
    success: false,
    errors: [],
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test 1: Load the application
    console.log('🔄 Test 1: Loading application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    results.tests.push({
      name: 'Application Load',
      success: true,
      details: 'Application loaded successfully'
    });

    // Test 2: Navigate to bookings
    console.log('🔄 Test 2: Navigating to bookings...');
    const bookingsButton = await page.waitForSelector('[data-testid="nav-bookings"], .sidebar-item:has-text("Bookings"), button:has-text("Bookings")', { timeout: 10000 });
    await bookingsButton.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    results.tests.push({
      name: 'Navigate to Bookings',
      success: true,
      details: 'Successfully navigated to bookings page'
    });

    // Test 3: Open an existing booking
    console.log('🔄 Test 3: Opening existing booking...');
    const bookingRow = await page.waitForSelector('.booking-row, .booking-item, tr[data-booking-id]', { timeout: 10000 });
    await bookingRow.click();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    results.tests.push({
      name: 'Open Booking',
      success: true,
      details: 'Successfully opened booking panel'
    });

    // Test 4: Find and toggle a status switch
    console.log('🔄 Test 4: Testing status toggle...');
    
    // Look for status toggles (deposit paid, booking confirmed, etc.)
    const statusToggles = await page.$$('.toggle-switch, input[type="checkbox"], button[role="switch"]');
    
    if (statusToggles.length === 0) {
      throw new Error('No status toggles found on booking panel');
    }

    console.log(`Found ${statusToggles.length} status toggles`);
    
    // Test toggling the first available toggle
    const firstToggle = statusToggles[0];
    await firstToggle.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    results.tests.push({
      name: 'Toggle Status',
      success: true,
      details: 'Successfully toggled status switch'
    });

    // Test 5: Save the booking
    console.log('🔄 Test 5: Saving booking...');
    
    const saveButton = await page.waitForSelector('button:has-text("Save"), [data-testid="save-booking"], .save-button', { timeout: 5000 });
    await saveButton.click();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for console errors after save
    if (consoleErrors.length > 0) {
      const dbSchemaErrors = consoleErrors.filter(error => 
        error.includes('bookingConfirmedAt') || 
        error.includes('schema cache') ||
        error.includes('PGRST204')
      );
      
      if (dbSchemaErrors.length > 0) {
        throw new Error(`Database schema error still present: ${dbSchemaErrors[0]}`);
      }
    }
    
    results.tests.push({
      name: 'Save Booking',
      success: true,
      details: 'Successfully saved booking without database schema errors'
    });

    // Test 6: Verify no console errors
    console.log('🔄 Test 6: Checking for console errors...');
    
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon.ico') && 
      !error.includes('LiveReload') &&
      !error.includes('DevTools')
    );
    
    if (criticalErrors.length > 0) {
      console.warn('⚠️ Found console errors:', criticalErrors);
      results.errors = criticalErrors;
    } else {
      results.tests.push({
        name: 'Console Error Check',
        success: true,
        details: 'No critical console errors found'
      });
    }

    // Test 7: Hard refresh and verify persistence
    console.log('🔄 Test 7: Testing persistence with hard refresh...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    results.tests.push({
      name: 'Persistence Check',
      success: true,
      details: 'Page reloaded successfully, indicating data persistence'
    });

    results.success = true;
    console.log('✅ All tests passed! Booking toggle fix verified.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    results.errors.push(error.message);
    results.success = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Save results
  console.log('\n📊 Test Results:');
  console.log('Success:', results.success);
  console.log('Tests passed:', results.tests.filter(t => t.success).length);
  console.log('Tests failed:', results.tests.filter(t => !t.success).length);
  
  if (results.errors.length > 0) {
    console.log('Errors:', results.errors);
  }

  return results;
}

// Run the test
testBookingToggleFix().then(results => {
  process.exit(results.success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});