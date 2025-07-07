#!/usr/bin/env node

/**
 * Manual Booking Test
 * 
 * This test simulates very natural user behavior by manually clicking
 * and typing each field rather than using programmatic shortcuts.
 * This should resolve the React state synchronization issues.
 */

import puppeteer from 'puppeteer';

async function testManualBooking() {
  console.log('🧪 Testing manual booking creation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 200, // Very slow for realistic interaction
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Capture important console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('validation errors') || text.includes('error') || text.includes('success')) {
      console.log(`🔍 Console: [${msg.type()}] ${text}`);
    }
  });
  
  try {
    // Navigate to application
    console.log('🌐 Loading application...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    
    // Wait for React to fully load
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/manual-01-loaded.png' });
    console.log('✅ Application loaded');
    
    // Find and focus on the form
    const form = await page.$('form:has(input[name="firstName"])');
    if (!form) {
      console.log('❌ Form not found');
      return false;
    }
    
    console.log('✅ Form found');
    
    // Helper function for natural typing
    async function typeNaturally(selector, text) {
      console.log(`  ✏️  Typing "${text}" into ${selector}`);
      
      // Click the input to focus
      await page.click(selector);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Clear existing content
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      
      // Type character by character
      for (const char of text) {
        await page.keyboard.press(char);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Blur the input to trigger change events
      await page.keyboard.press('Tab');
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Fill customer information
    console.log('👤 Filling customer information...');
    await typeNaturally('input[name="firstName"]', 'John');
    await typeNaturally('input[name="surname"]', 'Doe');
    await typeNaturally('input[name="email"]', 'john.doe@example.com');
    await typeNaturally('input[name="phone"]', '07123456789');
    await typeNaturally('input[name="addressLine1"]', '123 Test Street');
    await typeNaturally('input[name="city"]', 'London');
    await typeNaturally('input[name="postcode"]', 'SW1A 1AA');
    
    // Select yacht
    console.log('🛥️ Selecting yacht...');
    await page.click('select[name="yacht"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get yacht options
    const yachtOptions = await page.$$('select[name="yacht"] option');
    if (yachtOptions.length > 1) {
      const yachtValue = await page.evaluate(el => el.value, yachtOptions[1]);
      await page.select('select[name="yacht"]', yachtValue);
      console.log(`  ✅ Selected yacht: ${yachtValue}`);
    } else {
      console.log('  ❌ No yacht options available');
    }
    
    // Fill dates more carefully
    console.log('📅 Setting dates...');
    
    // Calculate dates properly
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    console.log(`  📅 Start: ${startDateStr}, End: ${endDateStr}`);
    
    // Fill start date
    await page.click('input[name="startDate"]');
    await new Promise(resolve => setTimeout(resolve, 300));
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.type(startDateStr);
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Fill end date
    await page.click('input[name="endDate"]');
    await new Promise(resolve => setTimeout(resolve, 300));
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.type(endDateStr);
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'screenshots/manual-02-filled.png' });
    
    // Verify form data before submission
    const formData = await page.evaluate(() => {
      const form = document.querySelector('form:has(input[name="firstName"])');
      const data = {};
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        data[input.name] = input.value;
      });
      return data;
    });
    
    console.log('📋 Form data to submit:', formData);
    
    // Check if submit button is ready
    const submitButton = await page.$('button[type="submit"]');
    const isDisabled = await page.evaluate(el => el.disabled, submitButton);
    const buttonText = await page.evaluate(el => el.textContent, submitButton);
    
    console.log(`🔘 Submit button: "${buttonText}", disabled: ${isDisabled}`);
    
    if (isDisabled) {
      console.log('❌ Submit button is disabled - form validation failed');
      return false;
    }
    
    // Submit the form
    console.log('🚀 Submitting form...');
    await submitButton.click();
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot after submission
    await page.screenshot({ path: 'screenshots/manual-03-submitted.png' });
    
    // Check for success indicators
    const successIndicators = await page.evaluate(() => {
      const indicators = [];
      
      // Check for success messages
      const successSelectors = [
        '.success-message',
        '.alert-success',
        '[data-testid="success-message"]',
        '.text-green-500',
        '.text-green-600'
      ];
      
      successSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text) {
            indicators.push({ type: 'success', text, selector });
          }
        });
      });
      
      // Check for error messages
      const errorSelectors = [
        '.error-message',
        '.alert-error',
        '[data-testid="error-message"]',
        '.text-red-500',
        '.text-red-600'
      ];
      
      errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text) {
            indicators.push({ type: 'error', text, selector });
          }
        });
      });
      
      return indicators;
    });
    
    console.log('📊 Result indicators:', successIndicators);
    
    // Check if form was reset (indicates success)
    const formAfterSubmit = await page.evaluate(() => {
      const form = document.querySelector('form:has(input[name="firstName"])');
      const data = {};
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        data[input.name] = input.value;
      });
      return data;
    });
    
    console.log('📋 Form data after submit:', formAfterSubmit);
    
    // Determine success
    const hasSuccessMessage = successIndicators.some(i => i.type === 'success');
    const hasErrorMessage = successIndicators.some(i => i.type === 'error');
    const formWasReset = formAfterSubmit.firstName === '';
    
    if (hasSuccessMessage || formWasReset) {
      console.log('🎉 Booking creation appears to have succeeded!');
      return true;
    } else if (hasErrorMessage) {
      console.log('❌ Booking creation failed with errors');
      return false;
    } else {
      console.log('⚠️ Booking creation status unclear');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/manual-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testManualBooking().then(success => {
  console.log(`\n${success ? '🎉 SUCCESS' : '💥 FAILED'}: Manual booking test complete`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});