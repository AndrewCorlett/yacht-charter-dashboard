#!/usr/bin/env node

/**
 * Realistic Booking Creation Test
 * 
 * This test simulates real user input by typing character by character
 * and clicking elements naturally, rather than using programmatic DOM manipulation.
 * This ensures React state updates properly trigger.
 */

import puppeteer from 'puppeteer';
import path from 'path';

async function testRealisticBookingCreation() {
  console.log('🚀 Starting realistic booking creation test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 50,      // Add delay between actions
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Navigate to application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Wait for app to load
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/realistic-01-initial.png' });
    console.log('✅ Application loaded successfully');
    
    // Find the Quick Create Booking form
    console.log('🔍 Looking for Quick Create Booking form...');
    
    // Try multiple selectors to find the form
    const formSelectors = [
      'form[data-testid="create-booking-form"]',
      'form:has(input[name="firstName"])',
      'form:has(input[placeholder*="First"])',
      '.create-booking-section form',
      'form'
    ];
    
    let form = null;
    for (const selector of formSelectors) {
      try {
        form = await page.$(selector);
        if (form) {
          console.log(`✅ Found form with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!form) {
      console.log('❌ Could not find booking form');
      await page.screenshot({ path: 'screenshots/realistic-error-no-form.png' });
      return false;
    }
    
    // Take screenshot of form
    await page.screenshot({ path: 'screenshots/realistic-02-form-found.png' });
    
    // Fill form fields with realistic typing
    console.log('✍️ Filling form with realistic user input...');
    
    // Helper function to type realistically
    async function typeRealistically(selector, text) {
      const element = await page.$(selector);
      if (!element) {
        console.log(`❌ Could not find element: ${selector}`);
        return false;
      }
      
      // Click the element first
      await element.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear any existing content
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');
      
      // Type the text character by character
      await page.type(selector, text, { delay: 50 });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    }
    
    // Fill customer information
    console.log('👤 Filling customer information...');
    await typeRealistically('input[name="firstName"]', 'John');
    await typeRealistically('input[name="surname"]', 'Doe');
    await typeRealistically('input[name="email"]', 'john.doe@example.com');
    await typeRealistically('input[name="phone"]', '07123456789');
    await typeRealistically('input[name="addressLine1"]', '123 Test Street');
    await typeRealistically('input[name="city"]', 'London');
    await typeRealistically('input[name="postcode"]', 'SW1A 1AA');
    
    // Select yacht
    console.log('🛥️ Selecting yacht...');
    const yachtSelect = await page.$('select[name="yacht"]');
    if (yachtSelect) {
      await yachtSelect.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get available options
      const options = await page.$$('select[name="yacht"] option');
      if (options.length > 1) {
        // Select the first real yacht (not the placeholder)
        await page.select('select[name="yacht"]', await page.evaluate(el => el.value, options[1]));
        console.log('✅ Yacht selected');
      } else {
        console.log('❌ No yacht options available');
      }
    } else {
      console.log('❌ Could not find yacht selector');
    }
    
    // Fill dates
    console.log('📅 Setting dates...');
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    
    await typeRealistically('input[name="startDate"]', startDate.toISOString().split('T')[0]);
    await typeRealistically('input[name="endDate"]', endDate.toISOString().split('T')[0]);
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'screenshots/realistic-03-form-filled.png' });
    
    // Submit the form
    console.log('🚀 Submitting booking form...');
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      // Check if button is enabled
      const isDisabled = await page.evaluate(el => el.disabled, submitButton);
      if (isDisabled) {
        console.log('❌ Submit button is disabled');
        await page.screenshot({ path: 'screenshots/realistic-error-disabled-button.png' });
        return false;
      }
      
      // Click submit button
      await submitButton.click();
      console.log('✅ Submit button clicked');
      
      // Wait for submission to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take screenshot after submission
      await page.screenshot({ path: 'screenshots/realistic-04-after-submit.png' });
      
      // Check for success or error messages
      const successMessage = await page.$('.success-message, .alert-success, [data-testid="success-message"]');
      const errorMessage = await page.$('.error-message, .alert-error, [data-testid="error-message"]');
      
      if (successMessage) {
        const text = await page.evaluate(el => el.textContent, successMessage);
        console.log('✅ Success message:', text);
        return true;
      } else if (errorMessage) {
        const text = await page.evaluate(el => el.textContent, errorMessage);
        console.log('❌ Error message:', text);
        return false;
      } else {
        console.log('⚠️ No clear success/error message found');
        
        // Check console for any errors
        const logs = await page.evaluate(() => {
          return window.console.messages || [];
        });
        console.log('Console logs:', logs);
        
        return false;
      }
    } else {
      console.log('❌ Could not find submit button');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'screenshots/realistic-error-exception.png' });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testRealisticBookingCreation().then(success => {
  if (success) {
    console.log('🎉 Realistic booking creation test PASSED!');
    process.exit(0);
  } else {
    console.log('💥 Realistic booking creation test FAILED!');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});