#!/usr/bin/env node

/**
 * State Debugging Test
 * 
 * This test specifically checks the React state vs DOM state mismatch
 * by injecting debugging code into the form submission handler.
 */

import puppeteer from 'puppeteer';

async function testStateDebugging() {
  console.log('🔍 Testing React state vs DOM state...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Monitor console for debugging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('DEBUG:') || text.includes('STATE:') || text.includes('validation')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Application loaded');
    
    // Inject debugging code into the form submission
    await page.evaluate(() => {
      // Find the form
      const form = document.querySelector('form:has(input[name="firstName"])');
      if (form) {
        const originalSubmit = form.onsubmit;
        
        form.addEventListener('submit', function(e) {
          console.log('DEBUG: Form submit intercepted');
          
          // Get DOM values
          const domData = {};
          const inputs = form.querySelectorAll('input, select');
          inputs.forEach(input => {
            domData[input.name] = input.value;
          });
          
          console.log('DEBUG: DOM values:', JSON.stringify(domData, null, 2));
          
          // Try to access React state if possible
          const reactFiber = form._reactInternalFiber || form._reactInternalInstance;
          if (reactFiber) {
            console.log('DEBUG: React fiber found, trying to access state...');
          } else {
            console.log('DEBUG: No React fiber found on form element');
          }
          
          // Let the original submission continue
        }, true);
      }
    });
    
    // Fill the form
    console.log('📝 Filling form...');
    
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
      
      console.log('DEBUG: Setting dates...');
      
      startInput.value = '2025-07-12';
      endInput.value = '2025-07-19';
      
      console.log('DEBUG: Date values set:', {
        startDate: startInput.value,
        endDate: endInput.value
      });
      
      // Trigger multiple event types to ensure React picks them up
      const events = ['input', 'change', 'blur'];
      events.forEach(eventType => {
        startInput.dispatchEvent(new Event(eventType, { bubbles: true }));
        endInput.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      console.log('DEBUG: Events dispatched for date inputs');
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check values before submission
    const preSubmitData = await page.evaluate(() => {
      const form = document.querySelector('form:has(input[name="firstName"])');
      const data = {};
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        data[input.name] = input.value;
      });
      return data;
    });
    
    console.log('📋 Pre-submit DOM data:', preSubmitData);
    
    // Submit form
    console.log('🚀 Submitting form...');
    const submitButton = await page.$('button[type="submit"]');
    await submitButton.click();
    
    // Wait for any debugging output
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if any validation errors are visible
    const validationErrors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.text-red-500, .text-red-600, .error, [data-testid*="error"]');
      const errors = [];
      errorElements.forEach(el => {
        const text = el.textContent.trim();
        if (text) {
          errors.push({
            text,
            element: el.tagName,
            className: el.className
          });
        }
      });
      return errors;
    });
    
    console.log('❌ Visible validation errors:', validationErrors);
    
    return true;
    
  } catch (error) {
    console.error('❌ State debugging failed:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testStateDebugging().then(success => {
  console.log(`\n${success ? '✅ SUCCESS' : '❌ FAILED'}: State debugging complete`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});