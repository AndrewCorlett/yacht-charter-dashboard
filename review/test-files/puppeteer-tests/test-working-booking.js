#!/usr/bin/env node

/**
 * Working Booking Test
 * 
 * This test uses the correct date setting method and should successfully create a booking.
 */

import puppeteer from 'puppeteer';

async function testWorkingBooking() {
  console.log('🎯 Testing working booking creation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Capture important console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text, timestamp: new Date() });
    if (text.includes('validation') || text.includes('error') || text.includes('success') || text.includes('booking')) {
      console.log(`🔍 [${msg.type()}] ${text}`);
    }
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ path: 'screenshots/working-01-loaded.png' });
    console.log('✅ Application loaded');
    
    // Find the form
    const form = await page.$('form:has(input[name="firstName"])');
    if (!form) {
      console.log('❌ Form not found');
      return false;
    }
    
    console.log('✅ Form found');
    
    // Fill form fields using a combination of methods
    console.log('📝 Filling form fields...');
    
    // Helper for text inputs (using type for realistic behavior)
    async function fillTextInput(selector, value) {
      await page.click(selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');
      await page.type(selector, value, { delay: 50 });
      await page.keyboard.press('Tab');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Fill customer information
    await fillTextInput('input[name="firstName"]', 'John');
    await fillTextInput('input[name="surname"]', 'Doe');
    await fillTextInput('input[name="email"]', 'john.doe@example.com');
    await fillTextInput('input[name="phone"]', '07123456789');
    await fillTextInput('input[name="addressLine1"]', '123 Test Street');
    await fillTextInput('input[name="city"]', 'London');
    await fillTextInput('input[name="postcode"]', 'SW1A 1AA');
    
    // Select yacht
    console.log('🛥️ Selecting yacht...');
    const yachtOptions = await page.$$('select[name="yacht"] option');
    if (yachtOptions.length > 1) {
      const yachtValue = await page.evaluate(el => el.value, yachtOptions[1]);
      await page.select('select[name="yacht"]', yachtValue);
      console.log(`  ✅ Selected yacht: ${yachtValue}`);
    }
    
    // Set dates using the working method (direct value setting + events)
    console.log('📅 Setting dates using working method...');
    await page.evaluate(() => {
      const startInput = document.querySelector('input[name="startDate"]');
      const endInput = document.querySelector('input[name="endDate"]');
      
      // Set values directly
      startInput.value = '2025-07-12';
      endInput.value = '2025-07-19';
      
      // Create and dispatch events to trigger React's onChange handlers
      const createEvent = (type) => new Event(type, { bubbles: true });
      
      startInput.dispatchEvent(createEvent('input'));
      startInput.dispatchEvent(createEvent('change'));
      endInput.dispatchEvent(createEvent('input'));
      endInput.dispatchEvent(createEvent('change'));
      
      console.log('📅 Dates set and events dispatched');
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify form data
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
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'screenshots/working-02-filled.png' });
    
    // Check submit button state
    const submitButton = await page.$('button[type="submit"]');
    const isDisabled = await page.evaluate(el => el.disabled, submitButton);
    const buttonText = await page.evaluate(el => el.textContent, submitButton);
    
    console.log(`🔘 Submit button: "${buttonText}", disabled: ${isDisabled}`);
    
    if (isDisabled) {
      console.log('❌ Submit button is disabled');
      return false;
    }
    
    // Submit the form
    console.log('🚀 Submitting form...');
    await submitButton.click();
    
    // Wait for processing
    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot after submission
    await page.screenshot({ path: 'screenshots/working-03-submitted.png' });
    
    // Check for results
    const results = await page.evaluate(() => {
      const indicators = {
        success: [],
        errors: [],
        formReset: false
      };
      
      // Check for success messages
      const successSelectors = [
        '.success-message', '.alert-success', '[data-testid="success-message"]',
        '.text-green-500', '.text-green-600', '.success'
      ];
      
      successSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text) {
            indicators.success.push({ selector, text });
          }
        });
      });
      
      // Check for error messages
      const errorSelectors = [
        '.error-message', '.alert-error', '[data-testid="error-message"]',
        '.text-red-500', '.text-red-600', '.error'
      ];
      
      errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text) {
            indicators.errors.push({ selector, text });
          }
        });
      });
      
      // Check if form was reset (indicates success)
      const firstNameInput = document.querySelector('input[name="firstName"]');
      indicators.formReset = firstNameInput ? firstNameInput.value === '' : false;
      
      return indicators;
    });
    
    console.log('📊 Results:', results);
    
    // Analyze console messages for additional clues
    console.log('📱 Console analysis:');
    const validationErrors = consoleMessages.filter(msg => 
      msg.text.includes('validation errors') || 
      msg.text.includes('Booking validation')
    );
    
    if (validationErrors.length > 0) {
      console.log('  ❌ Validation errors detected:', validationErrors.length);
      validationErrors.forEach(msg => {
        console.log(`    ${msg.text}`);
      });
    } else {
      console.log('  ✅ No validation errors in console');
    }
    
    // Determine success
    const hasSuccess = results.success.length > 0;
    const hasErrors = results.errors.length > 0;
    const formWasReset = results.formReset;
    const noValidationErrors = validationErrors.length === 0;
    
    console.log('\n📈 Success Indicators:');
    console.log(`  Success messages: ${hasSuccess ? '✅' : '❌'}`);
    console.log(`  No error messages: ${!hasErrors ? '✅' : '❌'}`);
    console.log(`  Form was reset: ${formWasReset ? '✅' : '❌'}`);
    console.log(`  No validation errors: ${noValidationErrors ? '✅' : '❌'}`);
    
    const success = (hasSuccess || formWasReset) && !hasErrors && noValidationErrors;
    
    if (success) {
      console.log('🎉 Booking creation succeeded!');
    } else {
      console.log('❌ Booking creation failed');
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/working-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testWorkingBooking().then(success => {
  console.log(`\n${success ? '🎉 SUCCESS' : '💥 FAILED'}: Working booking test complete`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});