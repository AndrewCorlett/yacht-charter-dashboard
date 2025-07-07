#!/usr/bin/env node

/**
 * Detailed Puppeteer Test for Quick Create Booking Feature
 * 
 * This test will dig deeper into the validation errors and form submission issues
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  baseUrl: 'http://localhost:5173',
  headless: false,
  screenshotDir: path.join(__dirname, 'screenshots'),
  slowMo: 100,
};

if (!fs.existsSync(config.screenshotDir)) {
  fs.mkdirSync(config.screenshotDir, { recursive: true });
}

const testResults = {
  errors: [],
  warnings: [],
  screenshots: [],
  validationErrors: [],
  formData: {},
  yachts: []
};

async function takeScreenshot(page, filename, description) {
  const screenshotPath = path.join(config.screenshotDir, filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  testResults.screenshots.push({
    filename,
    path: screenshotPath,
    description,
    timestamp: new Date().toISOString()
  });
  console.log(`📸 Screenshot saved: ${filename} - ${description}`);
}

async function main() {
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: config.headless,
      slowMo: config.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture all console messages
    page.on('console', (msg) => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
    });
    
    // Navigate to the application
    await page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'detailed-01-initial.png', 'Initial load');
    
    // Wait for the form to load
    await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
    await takeScreenshot(page, 'detailed-02-form-loaded.png', 'Form loaded');
    
    // Get available yachts
    await new Promise(resolve => setTimeout(resolve, 3000));
    const yachtOptions = await page.$$eval('select[name="yacht"] option', options => 
      options.map(option => ({ value: option.value, text: option.text }))
    );
    
    console.log('Available yachts:', yachtOptions);
    testResults.yachts = yachtOptions;
    
    // Fill out the form with test data
    const testData = {
      yacht: yachtOptions[1]?.value || '',
      firstName: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
      phone: '+44 7123 456789',
      addressLine1: '123 Test Street',
      addressLine2: 'Apt 4B',
      city: 'London',
      postcode: 'SW1A 1AA',
      startDate: '2025-08-01',
      endDate: '2025-08-07',
      portOfDeparture: 'Test Marina',
      portOfArrival: 'Test Harbor'
    };
    
    testResults.formData = testData;
    
    // Fill the form
    if (testData.yacht) {
      await page.select('select[name="yacht"]', testData.yacht);
    }
    
    await page.type('input[name="firstName"]', testData.firstName);
    await page.type('input[name="surname"]', testData.surname);
    await page.type('input[name="email"]', testData.email);
    await page.type('input[name="phone"]', testData.phone);
    await page.type('input[name="addressLine1"]', testData.addressLine1);
    await page.type('input[name="addressLine2"]', testData.addressLine2);
    await page.type('input[name="city"]', testData.city);
    await page.type('input[name="postcode"]', testData.postcode);
    await page.type('input[name="startDate"]', testData.startDate);
    await page.type('input[name="endDate"]', testData.endDate);
    await page.type('input[name="portOfDeparture"]', testData.portOfDeparture);
    await page.type('input[name="portOfArrival"]', testData.portOfArrival);
    
    await takeScreenshot(page, 'detailed-03-form-filled.png', 'Form filled');
    
    // Add a console listener to capture validation errors
    const validationErrors = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('validation') || text.includes('error')) {
        validationErrors.push(text);
      }
    });
    
    // Submit the form
    console.log('Submitting form...');
    await page.click('button[data-testid="submit-booking"]');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for any error messages in the UI
    const errorElements = await page.$$('.text-red-500, .border-red-500, [style*="color: red"], [class*="error"]');
    if (errorElements.length > 0) {
      console.log(`Found ${errorElements.length} error elements in the UI`);
      
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
        testResults.validationErrors.push(errorText);
      }
    }
    
    // Check for success elements
    const successElements = await page.$$('.text-green-500, [data-testid="booking-success"]');
    if (successElements.length > 0) {
      console.log(`Found ${successElements.length} success elements`);
    }
    
    // Check for any validation error messages
    const validationMessages = await page.$$eval('[class*="text-red"], [style*="color: red"]', elements => 
      elements.map(el => el.textContent)
    );
    
    if (validationMessages.length > 0) {
      console.log('Validation messages found:', validationMessages);
      testResults.validationErrors.push(...validationMessages);
    }
    
    await takeScreenshot(page, 'detailed-04-after-submission.png', 'After form submission');
    
    // Check the state of the submit button
    const submitButton = await page.$('button[data-testid="submit-booking"]');
    const isDisabled = await submitButton.evaluate(el => el.disabled);
    const buttonText = await submitButton.evaluate(el => el.textContent);
    
    console.log(`Submit button - Disabled: ${isDisabled}, Text: ${buttonText}`);
    
    // Check if the form is still visible or if a modal appeared
    const formVisible = await page.$('[data-testid="booking-form"]');
    const modalVisible = await page.$('[class*="modal"], [class*="overlay"]');
    
    console.log(`Form visible: ${!!formVisible}, Modal visible: ${!!modalVisible}`);
    
    // Wait a bit more to see if anything changes
    await new Promise(resolve => setTimeout(resolve, 3000));
    await takeScreenshot(page, 'detailed-05-final-state.png', 'Final state');
    
  } catch (error) {
    console.error('Test failed:', error);
    testResults.errors.push(error.message);
    
    if (page) {
      await takeScreenshot(page, 'detailed-06-error.png', 'Error state');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate report
  console.log('\n=== DETAILED TEST REPORT ===');
  console.log('Yachts available:', testResults.yachts.length);
  console.log('Test data used:', testResults.formData);
  console.log('Validation errors found:', testResults.validationErrors);
  console.log('Screenshots taken:', testResults.screenshots.length);
  
  // Write detailed report
  const reportPath = path.join(config.screenshotDir, 'detailed-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`Report saved to: ${reportPath}`);
}

main().catch(console.error);