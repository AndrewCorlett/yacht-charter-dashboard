#!/usr/bin/env node

/**
 * Form Validation Test
 * 
 * This test specifically checks the form validation and submission process
 * to identify exactly where the booking creation is failing.
 */

import puppeteer from 'puppeteer';

async function testFormValidation() {
  console.log('🔍 Testing form validation and submission...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport and enable console logging
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture network responses
  const networkResponses = [];
  page.on('response', response => {
    networkResponses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers(),
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    // Navigate to application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Wait for React to load
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/validation-01-initial.png' });
    
    // Find the form
    const form = await page.$('form:has(input[name="firstName"])');
    if (!form) {
      console.log('❌ Form not found');
      return false;
    }
    
    console.log('✅ Form found');
    
    // Fill form fields realistically
    async function fillField(selector, value) {
      try {
        await page.click(selector);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');
        await page.type(selector, value, { delay: 20 });
        await new Promise(resolve => setTimeout(resolve, 100));
        return true;
      } catch (error) {
        console.log(`❌ Failed to fill ${selector}: ${error.message}`);
        return false;
      }
    }
    
    console.log('✍️ Filling form fields...');
    
    // Fill customer information
    await fillField('input[name="firstName"]', 'John');
    await fillField('input[name="surname"]', 'Doe');
    await fillField('input[name="email"]', 'john.doe@example.com');
    await fillField('input[name="phone"]', '07123456789');
    await fillField('input[name="addressLine1"]', '123 Test Street');
    await fillField('input[name="city"]', 'London');
    await fillField('input[name="postcode"]', 'SW1A 1AA');
    
    // Select yacht
    await page.click('select[name="yacht"]');
    const options = await page.$$('select[name="yacht"] option');
    if (options.length > 1) {
      const optionValue = await page.evaluate(el => el.value, options[1]);
      await page.select('select[name="yacht"]', optionValue);
    }
    
    // Fill dates
    const today = new Date();
    const startDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    await fillField('input[name="startDate"]', startDate.toISOString().split('T')[0]);
    await fillField('input[name="endDate"]', endDate.toISOString().split('T')[0]);
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'screenshots/validation-02-filled.png' });
    
    // Check form data before submission
    const formData = await page.evaluate(() => {
      const form = document.querySelector('form:has(input[name="firstName"])');
      const data = {};
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        data[input.name] = input.value;
      });
      return data;
    });
    
    console.log('📋 Form data before submission:', formData);
    
    // Check if submit button is enabled
    const submitButton = await page.$('button[type="submit"]');
    const isDisabled = await page.evaluate(el => el.disabled, submitButton);
    const buttonText = await page.evaluate(el => el.textContent, submitButton);
    
    console.log(`🔘 Submit button: "${buttonText}", disabled: ${isDisabled}`);
    
    // Submit the form
    console.log('🚀 Submitting form...');
    await submitButton.click();
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot after submission
    await page.screenshot({ path: 'screenshots/validation-03-after-submit.png' });
    
    // Check for any error messages
    const errorSelectors = [
      '.error-message',
      '.alert-error',
      '[data-testid="error-message"]',
      '.text-red-500',
      '.text-red-600',
      '.text-danger',
      '.error',
      '.invalid-feedback'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      const errorElements = await page.$$(selector);
      if (errorElements.length > 0) {
        for (const element of errorElements) {
          const text = await page.evaluate(el => el.textContent, element);
          if (text.trim()) {
            console.log(`❌ Error found (${selector}): ${text}`);
            errorFound = true;
          }
        }
      }
    }
    
    // Check for success messages
    const successSelectors = [
      '.success-message',
      '.alert-success',
      '[data-testid="success-message"]',
      '.text-green-500',
      '.text-green-600',
      '.text-success',
      '.success'
    ];
    
    let successFound = false;
    for (const selector of successSelectors) {
      const successElements = await page.$$(selector);
      if (successElements.length > 0) {
        for (const element of successElements) {
          const text = await page.evaluate(el => el.textContent, element);
          if (text.trim()) {
            console.log(`✅ Success found (${selector}): ${text}`);
            successFound = true;
          }
        }
      }
    }
    
    // Log console messages
    console.log('📱 Console messages:');
    consoleMessages.forEach(msg => {
      console.log(`  [${msg.type}] ${msg.text}`);
    });
    
    // Log network requests
    console.log('🌐 Network requests:');
    networkRequests.forEach(req => {
      if (req.url.includes('supabase') || req.method !== 'GET') {
        console.log(`  ${req.method} ${req.url}`);
      }
    });
    
    // Log network responses
    console.log('📡 Network responses:');
    networkResponses.forEach(resp => {
      if (resp.url.includes('supabase') || resp.status >= 400) {
        console.log(`  ${resp.status} ${resp.url}`);
      }
    });
    
    // Final state check
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'screenshots/validation-04-final.png' });
    
    if (successFound) {
      console.log('🎉 Booking creation appears to have succeeded!');
      return true;
    } else if (errorFound) {
      console.log('❌ Booking creation failed with errors');
      return false;
    } else {
      console.log('⚠️ Booking creation status unclear');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'screenshots/validation-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testFormValidation().then(success => {
  console.log(`\n${success ? '🎉 SUCCESS' : '💥 FAILED'}: Form validation test complete`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});