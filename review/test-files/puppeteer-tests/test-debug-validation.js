#!/usr/bin/env node

/**
 * Debug Validation Test
 * 
 * This test specifically extracts validation errors from the browser console
 * to understand exactly what's failing in the BookingModel validation.
 */

import puppeteer from 'puppeteer';

async function debugValidation() {
  console.log('🔍 Debugging validation errors...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // More detailed console logging
  page.on('console', msg => {
    const text = msg.text();
    console.log(`[${msg.type()}] ${text}`);
    
    // Try to get more details for object handles
    if (text.includes('JSHandle@object')) {
      // This is logged as an object, we need to extract it
      // We'll handle this in the page evaluation
    }
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Inject a function to capture validation errors
    await page.evaluateOnNewDocument(() => {
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        if (args[0] === 'Booking validation errors:' && args[1]) {
          window.lastValidationErrors = args[1];
        }
      };
      
      console.error = function(...args) {
        originalConsoleError.apply(console, args);
        if (args[0] === 'Booking validation errors:' && args[1]) {
          window.lastValidationErrors = args[1];
        }
      };
    });
    
    // Fill form with correct date format
    async function fillField(selector, value) {
      await page.click(selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');
      await page.type(selector, value, { delay: 20 });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Fill form
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
    
    // Fill dates correctly
    const today = new Date();
    const startDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Using dates: start=${startDateStr}, end=${endDateStr}`);
    
    await fillField('input[name="startDate"]', startDateStr);
    await fillField('input[name="endDate"]', endDateStr);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/debug-filled.png' });
    
    // Submit form
    const submitButton = await page.$('button[type="submit"]');
    await submitButton.click();
    
    // Wait for validation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract validation errors from the page
    const validationErrors = await page.evaluate(() => {
      return window.lastValidationErrors || null;
    });
    
    console.log('🔍 Validation errors extracted:', validationErrors);
    
    // Also check for any visible error messages on the page
    const visibleErrors = await page.evaluate(() => {
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
      
      const errors = [];
      errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text) {
            errors.push({ selector, text });
          }
        });
      });
      
      return errors;
    });
    
    console.log('👁️ Visible errors:', visibleErrors);
    
    // Get the actual form data that was submitted
    const formData = await page.evaluate(() => {
      const form = document.querySelector('form:has(input[name="firstName"])');
      const data = {};
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        data[input.name] = input.value;
      });
      return data;
    });
    
    console.log('📋 Form data submitted:', formData);
    
    await page.screenshot({ path: 'screenshots/debug-after-submit.png' });
    
    return { validationErrors, visibleErrors, formData };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return null;
  } finally {
    await browser.close();
  }
}

// Run the debug
debugValidation().then(result => {
  if (result) {
    console.log('\n📊 Debug Results:');
    console.log('==================');
    console.log('Validation Errors:', result.validationErrors);
    console.log('Visible Errors:', result.visibleErrors);
    console.log('Form Data:', result.formData);
    console.log('==================');
  }
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});