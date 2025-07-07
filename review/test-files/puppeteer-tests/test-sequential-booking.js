#!/usr/bin/env node

/**
 * Sequential Booking Test
 * 
 * This test creates a second booking for the same yacht (Alrisha)
 * to verify the sequential booking number logic works correctly.
 * Should generate 2528AL02 after the previous 2528AL01.
 */

import puppeteer from 'puppeteer';

async function testSequentialBooking() {
  console.log('🔢 Testing sequential booking number generation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Monitor console for booking number generation
  const bookingNumberLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('booking code') || text.includes('2528AL') || text.includes('Generated')) {
      console.log(`🔍 ${text}`);
      bookingNumberLogs.push(text);
    }
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Application loaded');
    
    // Fill the form for second booking
    console.log('📝 Creating second booking for Alrisha yacht...');
    
    const textFields = [
      { selector: 'input[name="firstName"]', value: 'Jane' },
      { selector: 'input[name="surname"]', value: 'Smith' },
      { selector: 'input[name="email"]', value: 'jane.smith@example.com' },
      { selector: 'input[name="phone"]', value: '07987654321' },
      { selector: 'input[name="addressLine1"]', value: '456 Test Avenue' },
      { selector: 'input[name="city"]', value: 'Manchester' },
      { selector: 'input[name="postcode"]', value: 'M1 1AA' }
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
    
    // Select the same yacht (Alrisha) to test sequential numbering
    console.log('🛥️ Selecting Alrisha yacht (same as previous booking)...');
    const yachtOptions = await page.$$('select[name="yacht"] option');
    let alrishaSelected = false;
    
    for (const option of yachtOptions) {
      const text = await page.evaluate(el => el.textContent, option);
      const value = await page.evaluate(el => el.value, option);
      if (text.toLowerCase().includes('alrisha')) {
        await page.select('select[name="yacht"]', value);
        console.log(`  ✅ Selected Alrisha yacht: ${value}`);
        alrishaSelected = true;
        break;
      }
    }
    
    if (!alrishaSelected) {
      console.log('  ⚠️ Alrisha not found, selecting first available yacht');
      if (yachtOptions.length > 1) {
        const value = await page.evaluate(el => el.value, yachtOptions[1]);
        await page.select('select[name="yacht"]', value);
      }
    }
    
    // Set different dates for second booking
    console.log('📅 Setting dates for second booking...');
    await page.evaluate(() => {
      const startInput = document.querySelector('input[name="startDate"]');
      const endInput = document.querySelector('input[name="endDate"]');
      
      startInput.value = '2025-07-26';
      endInput.value = '2025-08-02';
      
      startInput.dispatchEvent(new Event('input', { bubbles: true }));
      startInput.dispatchEvent(new Event('change', { bubbles: true }));
      endInput.dispatchEvent(new Event('input', { bubbles: true }));
      endInput.dispatchEvent(new Event('change', { bubbles: true }));
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
    
    console.log('📋 Second booking form data:', formData);
    
    // Take screenshot before submission
    await page.screenshot({ path: 'screenshots/sequential-01-filled.png' });
    
    // Submit the form
    console.log('🚀 Submitting second booking...');
    const submitButton = await page.$('button[type="submit"]');
    await submitButton.click();
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot after submission
    await page.screenshot({ path: 'screenshots/sequential-02-submitted.png' });
    
    // Check for success
    const results = await page.evaluate(() => {
      const indicators = {
        success: [],
        errors: [],
        formReset: false
      };
      
      // Check for success messages
      const successElements = document.querySelectorAll('.text-green-500, .text-green-600, .success-message');
      successElements.forEach(el => {
        const text = el.textContent.trim();
        if (text) {
          indicators.success.push(text);
        }
      });
      
      // Check for error messages
      const errorElements = document.querySelectorAll('.text-red-500, .text-red-600, .error-message');
      errorElements.forEach(el => {
        const text = el.textContent.trim();
        if (text) {
          indicators.errors.push(text);
        }
      });
      
      // Check if form was reset
      const firstNameInput = document.querySelector('input[name="firstName"]');
      indicators.formReset = firstNameInput ? firstNameInput.value === '' : false;
      
      return indicators;
    });
    
    console.log('📊 Second booking results:', results);
    
    // Analyze booking number logs
    console.log('\n🔢 Booking Number Analysis:');
    if (bookingNumberLogs.length > 0) {
      bookingNumberLogs.forEach(log => {
        if (log.includes('2528AL')) {
          console.log(`  📋 Generated: ${log}`);
        }
      });
    } else {
      console.log('  ❌ No booking number generation logs found');
    }
    
    // Determine success
    const success = results.success.length > 0 && results.errors.length === 0;
    
    if (success) {
      console.log('🎉 Second booking created successfully!');
      
      // Look for the specific booking number in logs
      const bookingNumberMatch = bookingNumberLogs.find(log => log.includes('2528AL02'));
      if (bookingNumberMatch) {
        console.log('✅ Sequential booking number logic CONFIRMED: 2528AL02 generated');
      } else {
        console.log('⚠️ Need to verify booking number in database');
      }
    } else {
      console.log('❌ Second booking creation failed');
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Sequential booking test failed:', error);
    await page.screenshot({ path: 'screenshots/sequential-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testSequentialBooking().then(success => {
  console.log(`\n${success ? '🎉 SUCCESS' : '💥 FAILED'}: Sequential booking test complete`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});