#!/usr/bin/env node

/**
 * Debug Validation Test for Quick Create Booking Feature
 * 
 * This test will capture the exact validation errors being reported
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
    
    // Capture detailed console messages for validation errors
    page.on('console', async (msg) => {
      const text = msg.text();
      if (text.includes('validation') || text.includes('Booking validation errors')) {
        console.log(`[VALIDATION ERROR] ${text}`);
        
        // Try to capture the JSHandle object value
        if (msg.args().length > 0) {
          try {
            const args = [];
            for (let i = 0; i < msg.args().length; i++) {
              const arg = msg.args()[i];
              const value = await arg.jsonValue();
              args.push(value);
            }
            console.log('[VALIDATION ERROR DETAILS]', JSON.stringify(args, null, 2));
          } catch (error) {
            console.log('[VALIDATION ERROR DETAILS] Could not extract:', error.message);
          }
        }
      }
    });
    
    // Navigate to the application
    await page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
    
    // Wait for the form to load
    await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
    
    // Get available yachts
    await new Promise(resolve => setTimeout(resolve, 3000));
    const yachtOptions = await page.$$eval('select[name="yacht"] option', options => 
      options.map(option => ({ value: option.value, text: option.text }))
    );
    
    // Fill out the form with test data that should be valid
    const testData = {
      yacht: yachtOptions[1]?.value || '',
      firstName: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
      phone: '07123456789', // UK format
      addressLine1: '123 Test Street',
      addressLine2: 'Apt 4B',
      city: 'London',
      postcode: 'SW1A 1AA',
      startDate: '2025-08-01',
      endDate: '2025-08-07',
      portOfDeparture: 'Test Marina',
      portOfArrival: 'Test Harbor'
    };
    
    console.log('Test data being used:', testData);
    
    // Fill the form
    if (testData.yacht) {
      await page.select('select[name="yacht"]', testData.yacht);
    }
    
    // Fill the form using evaluate to set values directly
    await page.evaluate((data) => {
      document.querySelector('input[name="firstName"]').value = data.firstName;
      document.querySelector('input[name="surname"]').value = data.surname;
      document.querySelector('input[name="email"]').value = data.email;
      document.querySelector('input[name="phone"]').value = data.phone;
      document.querySelector('input[name="addressLine1"]').value = data.addressLine1;
      document.querySelector('input[name="addressLine2"]').value = data.addressLine2;
      document.querySelector('input[name="city"]').value = data.city;
      document.querySelector('input[name="postcode"]').value = data.postcode;
      document.querySelector('input[name="startDate"]').value = data.startDate;
      document.querySelector('input[name="endDate"]').value = data.endDate;
      document.querySelector('input[name="portOfDeparture"]').value = data.portOfDeparture;
      document.querySelector('input[name="portOfArrival"]').value = data.portOfArrival;
      
      // Trigger change events for React
      const fields = ['firstName', 'surname', 'email', 'phone', 'addressLine1', 'addressLine2', 
                     'city', 'postcode', 'startDate', 'endDate', 'portOfDeparture', 'portOfArrival'];
      fields.forEach(field => {
        const element = document.querySelector(`input[name="${field}"]`);
        if (element) {
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }, testData);
    
    // Take a screenshot of the filled form
    await page.screenshot({ path: path.join(config.screenshotDir, 'validation-debug-filled.png'), fullPage: true });
    
    // Now let's check what the form values actually are
    const formValues = await page.evaluate(() => {
      const form = document.querySelector('[data-testid="booking-form"] form');
      const formData = new FormData(form);
      const values = {};
      for (let [key, value] of formData.entries()) {
        values[key] = value;
      }
      return values;
    });
    
    console.log('Actual form values:', formValues);
    
    // Submit the form and capture the validation errors
    console.log('Submitting form to capture validation errors...');
    await page.click('button[data-testid="submit-booking"]');
    
    // Wait for validation to occur
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for any visible error messages
    const errorMessages = await page.$$eval('[class*="text-red"], [style*="color: red"], [data-testid*="error"]', elements => 
      elements.map(el => ({
        text: el.textContent.trim(),
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        testId: el.getAttribute('data-testid')
      }))
    );
    
    if (errorMessages.length > 0) {
      console.log('Visible error messages in UI:', errorMessages);
    } else {
      console.log('No visible error messages found in UI');
    }
    
    // Take final screenshot
    await page.screenshot({ path: path.join(config.screenshotDir, 'validation-debug-after-submit.png'), fullPage: true });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main().catch(console.error);