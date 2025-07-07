#!/usr/bin/env node

/**
 * Date Input Test
 * 
 * This test specifically focuses on the date input issue
 * to understand why dates are being corrupted.
 */

import puppeteer from 'puppeteer';

async function testDateInput() {
  console.log('📅 Testing date input functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/date-test-01-initial.png' });
    
    // Find the date inputs
    const startDateInput = await page.$('input[name="startDate"]');
    const endDateInput = await page.$('input[name="endDate"]');
    
    if (!startDateInput || !endDateInput) {
      console.log('❌ Date inputs not found');
      return false;
    }
    
    console.log('✅ Date inputs found');
    
    // Test different date setting methods
    console.log('🧪 Testing different date setting methods...');
    
    // Method 1: Direct value setting
    console.log('📝 Method 1: Direct value setting');
    await page.evaluate(() => {
      const startInput = document.querySelector('input[name="startDate"]');
      const endInput = document.querySelector('input[name="endDate"]');
      startInput.value = '2025-07-12';
      endInput.value = '2025-07-19';
      
      // Trigger change events
      startInput.dispatchEvent(new Event('input', { bubbles: true }));
      startInput.dispatchEvent(new Event('change', { bubbles: true }));
      endInput.dispatchEvent(new Event('input', { bubbles: true }));
      endInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let formData1 = await page.evaluate(() => {
      return {
        startDate: document.querySelector('input[name="startDate"]').value,
        endDate: document.querySelector('input[name="endDate"]').value
      };
    });
    console.log('  Result Method 1:', formData1);
    
    // Method 2: Using Puppeteer's evaluate to set valueAsDate
    console.log('📝 Method 2: Using valueAsDate');
    await page.evaluate(() => {
      const startInput = document.querySelector('input[name="startDate"]');
      const endInput = document.querySelector('input[name="endDate"]');
      
      startInput.valueAsDate = new Date('2025-07-12');
      endInput.valueAsDate = new Date('2025-07-19');
      
      // Trigger change events
      startInput.dispatchEvent(new Event('input', { bubbles: true }));
      startInput.dispatchEvent(new Event('change', { bubbles: true }));
      endInput.dispatchEvent(new Event('input', { bubbles: true }));
      endInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let formData2 = await page.evaluate(() => {
      return {
        startDate: document.querySelector('input[name="startDate"]').value,
        endDate: document.querySelector('input[name="endDate"]').value
      };
    });
    console.log('  Result Method 2:', formData2);
    
    // Method 3: Clear and type step by step
    console.log('📝 Method 3: Clear and type step by step');
    
    // Clear start date
    await page.click('input[name="startDate"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Delete');
    
    // Type start date slowly
    await page.type('input[name="startDate"]', '2025-07-12', { delay: 100 });
    await page.keyboard.press('Tab');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clear end date
    await page.click('input[name="endDate"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Delete');
    
    // Type end date slowly
    await page.type('input[name="endDate"]', '2025-07-19', { delay: 100 });
    await page.keyboard.press('Tab');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let formData3 = await page.evaluate(() => {
      return {
        startDate: document.querySelector('input[name="startDate"]').value,
        endDate: document.querySelector('input[name="endDate"]').value
      };
    });
    console.log('  Result Method 3:', formData3);
    
    // Take final screenshot
    await page.screenshot({ path: 'screenshots/date-test-02-final.png' });
    
    // Test React state
    console.log('🔍 Checking React state...');
    const reactState = await page.evaluate(() => {
      // Try to access React state through the form
      const form = document.querySelector('form:has(input[name="firstName"])');
      if (form && form._reactInternalFiber) {
        // This is a hack to try to access React state
        return 'React state access attempted but not directly available';
      }
      return 'React state not accessible';
    });
    console.log('  React state:', reactState);
    
    // Check if the issue is browser-specific
    const userAgent = await page.evaluate(() => navigator.userAgent);
    console.log('🌐 Browser:', userAgent);
    
    // Final form state check
    const finalFormData = await page.evaluate(() => {
      const form = document.querySelector('form:has(input[name="firstName"])');
      const data = {};
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        data[input.name] = input.value;
      });
      return data;
    });
    
    console.log('📋 Final form data:', finalFormData);
    
    return true;
    
  } catch (error) {
    console.error('❌ Date test failed:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testDateInput().then(success => {
  console.log(`\n${success ? '✅ SUCCESS' : '❌ FAILED'}: Date input test complete`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});