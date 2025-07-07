#!/usr/bin/env node

/**
 * Network Debugging Test
 * 
 * This test monitors network requests during booking creation
 * to see what API calls are being made and if any are failing.
 */

import puppeteer from 'puppeteer';

async function testNetworkDebugging() {
  console.log('🌐 Testing network requests during booking creation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Monitor all network requests
  const requests = [];
  const responses = [];
  const failures = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('requestfailed', request => {
    failures.push({
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    
    if (msg.type() === 'error' || msg.text().includes('error')) {
      console.log(`🔴 Console Error: ${msg.text()}`);
    }
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Application loaded, monitoring network traffic...');
    
    // Clear previous requests to focus on booking creation
    requests.length = 0;
    responses.length = 0;
    failures.length = 0;
    
    // Fill form quickly
    console.log('📝 Filling form...');
    
    // Fill text fields
    const textFields = [
      { selector: 'input[name="firstName"]', value: 'John' },
      { selector: 'input[name="surname"]', value: 'Doe' },
      { selector: 'input[name="email"]', value: 'john.doe@example.com' },
      { selector: 'input[name="phone"]', value: '07123456789' },
      { selector: 'input[name="addressLine1"]', value: '123 Test Street' },
      { selector: 'input[name="city"]', value: 'London' },
      { selector: 'input[name="postcode"]', value: 'SW1A 1AA' }
    ];
    
    for (const field of textFields) {
      await page.click(field.selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');
      await page.type(field.selector, field.value, { delay: 10 });
      await page.keyboard.press('Tab');
    }
    
    // Select yacht
    const yachtOptions = await page.$$('select[name="yacht"] option');
    if (yachtOptions.length > 1) {
      const yachtValue = await page.evaluate(el => el.value, yachtOptions[1]);
      await page.select('select[name="yacht"]', yachtValue);
    }
    
    // Set dates correctly
    await page.evaluate(() => {
      const startInput = document.querySelector('input[name="startDate"]');
      const endInput = document.querySelector('input[name="endDate"]');
      
      startInput.value = '2025-07-12';
      endInput.value = '2025-07-19';
      
      startInput.dispatchEvent(new Event('input', { bubbles: true }));
      startInput.dispatchEvent(new Event('change', { bubbles: true }));
      endInput.dispatchEvent(new Event('input', { bubbles: true }));
      endInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🚀 Submitting form and monitoring network...');
    
    // Submit form
    const submitButton = await page.$('button[type="submit"]');
    await submitButton.click();
    
    // Wait and monitor
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Analyze network activity
    console.log('\n📊 Network Analysis:');
    console.log(`Total requests: ${requests.length}`);
    console.log(`Total responses: ${responses.length}`);
    console.log(`Failed requests: ${failures.length}`);
    
    // Filter Supabase requests
    const supabaseRequests = requests.filter(req => req.url.includes('supabase'));
    const supabaseResponses = responses.filter(res => res.url.includes('supabase'));
    
    console.log('\n🏗️ Supabase Activity:');
    console.log(`Supabase requests: ${supabaseRequests.length}`);
    console.log(`Supabase responses: ${supabaseResponses.length}`);
    
    // Show Supabase requests in detail
    if (supabaseRequests.length > 0) {
      console.log('\n📋 Supabase Requests:');
      supabaseRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          console.log(`     Data: ${req.postData.substring(0, 200)}${req.postData.length > 200 ? '...' : ''}`);
        }
      });
    }
    
    // Show Supabase responses in detail
    if (supabaseResponses.length > 0) {
      console.log('\n📥 Supabase Responses:');
      supabaseResponses.forEach((res, i) => {
        console.log(`  ${i + 1}. ${res.status} ${res.statusText} - ${res.url}`);
      });
    }
    
    // Show any failures
    if (failures.length > 0) {
      console.log('\n❌ Failed Requests:');
      failures.forEach((fail, i) => {
        console.log(`  ${i + 1}. ${fail.url} - ${fail.failure.errorText}`);
      });
    }
    
    // Show console errors
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    if (errors.length > 0) {
      console.log('\n🔴 Console Errors:');
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text}`);
      });
    }
    
    // Check for specific booking-related network activity
    const bookingRequests = requests.filter(req => 
      req.url.includes('/bookings') || 
      req.method === 'POST' && req.url.includes('supabase')
    );
    
    console.log(`\n🎯 Booking-specific requests: ${bookingRequests.length}`);
    if (bookingRequests.length > 0) {
      bookingRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          console.log(`     Payload: ${req.postData}`);
        }
      });
    }
    
    return {
      totalRequests: requests.length,
      supabaseRequests: supabaseRequests.length,
      bookingRequests: bookingRequests.length,
      failures: failures.length,
      consoleErrors: errors.length
    };
    
  } catch (error) {
    console.error('❌ Network test failed:', error);
    return null;
  } finally {
    await browser.close();
  }
}

// Run the test
testNetworkDebugging().then(result => {
  if (result) {
    console.log('\n📈 Summary:');
    console.log(`- Total network requests: ${result.totalRequests}`);
    console.log(`- Supabase requests: ${result.supabaseRequests}`);
    console.log(`- Booking-specific requests: ${result.bookingRequests}`);
    console.log(`- Failed requests: ${result.failures}`);
    console.log(`- Console errors: ${result.consoleErrors}`);
    
    if (result.bookingRequests === 0) {
      console.log('\n❌ NO BOOKING REQUESTS DETECTED - This indicates the form submission is not reaching the backend!');
    } else {
      console.log('\n✅ Booking requests detected - Issue may be with request processing');
    }
  }
  
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});