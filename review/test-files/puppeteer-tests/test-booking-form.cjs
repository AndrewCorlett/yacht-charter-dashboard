#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testBookingForm() {
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, 
      args: ['--no-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    const page = await browser.newPage();
    
    console.log('🔍 Testing booking form functionality...');
    
    // Monitor console for errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`❌ Console error: ${msg.text()}`);
      }
    });
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('✅ Application loaded');
    
    // Look for the booking form
    console.log('🔍 Looking for booking form...');
    const formSelector = '[data-testid="booking-form"]';
    
    try {
      await page.waitForSelector(formSelector, { timeout: 5000 });
      console.log('✅ Booking form found');
    } catch (e) {
      console.log('❌ Booking form not found with data-testid, trying other selectors...');
      
      // Check for form element
      const form = await page.$('form');
      if (form) {
        console.log('✅ Generic form element found');
      } else {
        console.log('❌ No form elements found');
        await page.screenshot({ path: 'no-form-screenshot.png' });
        return;
      }
    }
    
    // Test form fields
    console.log('🔍 Testing form fields...');
    
    const fields = {
      firstName: '[data-testid="input-firstName"]',
      surname: '[data-testid="input-surname"]',
      email: '[data-testid="input-email"]',
      yacht: 'select[name="yacht"]',
      startDate: '[data-testid="input-startDate"]',
      endDate: '[data-testid="input-endDate"]',
      submitButton: '[data-testid="submit-booking"]'
    };
    
    const fieldResults = {};
    
    for (const [fieldName, selector] of Object.entries(fields)) {
      try {
        const element = await page.$(selector);
        fieldResults[fieldName] = !!element;
        console.log(`${element ? '✅' : '❌'} ${fieldName}: ${!!element}`);
      } catch (e) {
        fieldResults[fieldName] = false;
        console.log(`❌ ${fieldName}: false (error: ${e.message})`);
      }
    }
    
    // Try to fill the form if fields exist
    if (fieldResults.firstName && fieldResults.surname && fieldResults.email) {
      console.log('🔍 Attempting to fill form...');
      
      try {
        await page.type(fields.firstName, 'John');
        await page.type(fields.surname, 'Smith');
        await page.type(fields.email, 'john.smith@example.com');
        console.log('✅ Basic fields filled');
        
        if (fieldResults.startDate && fieldResults.endDate) {
          await page.type(fields.startDate, '2025-07-01');
          await page.type(fields.endDate, '2025-07-07');
          console.log('✅ Date fields filled');
        }
        
        // Take screenshot after filling
        await page.screenshot({ path: 'form-filled-screenshot.png' });
        console.log('📸 Screenshot saved: form-filled-screenshot.png');
        
        // Try to submit (but don't actually submit to avoid creating test data)
        if (fieldResults.submitButton) {
          console.log('✅ Submit button found (not clicking to avoid test data)');
        }
        
      } catch (e) {
        console.log(`❌ Error filling form: ${e.message}`);
      }
    }
    
    console.log(`\n📊 Form Test Results:`);
    console.log(`  - Form found: ${!!await page.$(formSelector) || !!await page.$('form')}`);
    console.log(`  - Fields working: ${Object.values(fieldResults).filter(Boolean).length}/${Object.keys(fieldResults).length}`);
    console.log(`  - Console errors: ${consoleErrors.length}`);
    console.log(`  - UnifiedDataService error: ${consoleErrors.some(e => e.includes('UnifiedDataService') || e.includes('getInstance')) ? 'YES' : 'NO'}`);
    
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    if (browser) await browser.close();
  }
}

testBookingForm();