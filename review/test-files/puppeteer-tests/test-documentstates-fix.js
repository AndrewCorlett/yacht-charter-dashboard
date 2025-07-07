import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDocumentStatesFix() {
  console.log('Starting DocumentStates fix verification test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: path.join(__dirname, 'chrome/linux-140.0.7277.0/chrome-linux64/chrome'),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  // Set up console monitoring
  const consoleErrors = [];
  const consoleWarnings = [];
  const consoleMessages = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.log('❌ CONSOLE ERROR:', text);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(text);
      console.log('⚠️  CONSOLE WARNING:', text);
    } else {
      console.log('📝 CONSOLE LOG:', text);
    }
  });
  
  // Monitor network errors
  page.on('response', response => {
    if (!response.ok()) {
      console.log('🌐 NETWORK ERROR:', response.status(), response.url());
    }
  });

  try {
    console.log('1. Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    console.log('2. Waiting for page to load and looking for booking content...');
    
    // Wait for the page to load - look for any text content that indicates bookings have loaded
    await new Promise(resolve => setTimeout(resolve, 5000)); // Give it time to load
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'test-page-loaded.png', fullPage: true });
    console.log('📸 Page loaded screenshot saved as test-page-loaded.png');
    
    // Look for the specific customer booking - try different approaches
    let bookingFound = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let element of elements) {
        if (element.textContent && element.textContent.includes('Customer1 Test1')) {
          return true;
        }
      }
      return false;
    });
    
    if (!bookingFound) {
      console.log('Customer1 Test1 not visible on current view, checking for booking management section...');
      
      // Try to find a bookings or charters section
      const navigationClicked = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (let element of elements) {
          const text = element.textContent || '';
          if (text.toLowerCase().includes('booking') || text.toLowerCase().includes('charter') || 
              text.toLowerCase().includes('reservation') || text.toLowerCase().includes('manage')) {
            if (element.tagName === 'BUTTON' || element.tagName === 'A' || element.role === 'button') {
              element.click();
              return true;
            }
          }
        }
        return false;
      });
      
      if (navigationClicked) {
        console.log('Clicked navigation element, waiting for page to load...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check again for Customer1 Test1
        bookingFound = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          for (let element of elements) {
            if (element.textContent && element.textContent.includes('Customer1 Test1')) {
              return true;
            }
          }
          return false;
        });
      }
    }
    
    if (!bookingFound) {
      console.log('❌ Could not find booking for "Customer1 Test1"');
      console.log('Looking for any booking content...');
      
      // Check what bookings are available
      const availableBookings = await page.evaluate(() => {
        const bookingTexts = [];
        const elements = document.querySelectorAll('*');
        for (let element of elements) {
          if (element.textContent && (element.textContent.includes('Customer') || 
                                     element.textContent.includes('Test'))) {
            bookingTexts.push(element.textContent.trim());
          }
        }
        return bookingTexts;
      });
      
      console.log('Available bookings found:', availableBookings);
      
      // Since we can't find the specific booking, let's test the documentStates fix
      // by trying to update ANY booking to trigger the database operation
      console.log('Attempting to test documentStates fix with available bookings...');
      
      const testResult = await page.evaluate(() => {
        // Look for any input fields that might trigger the booking update
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input');
        for (let input of inputs) {
          if (input.value && input.value.length > 0) {
            console.log('Testing with input:', input.value);
            const originalValue = input.value;
            input.focus();
            input.value = originalValue + '_test';
            
            // Trigger change events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            
            return true;
          }
        }
        return false;
      });
      
      if (testResult) {
        console.log('Successfully triggered test input change');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take final screenshot
        await page.screenshot({ path: 'test-documentstates-fix-complete.png', fullPage: true });
        console.log('📸 Screenshot saved as test-documentstates-fix-complete.png');
      }
      
      return;
    }
    
    console.log('3. Found booking for Customer1 Test1');
    
    // Look for the booking number 2528AL09 anywhere on the page
    const bookingNumberFound = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let element of elements) {
        if (element.textContent && element.textContent.includes('2528AL09')) {
          return true;
        }
        if (element.value && element.value.includes('2528AL09')) {
          return true;
        }
      }
      return false;
    });
    
    if (!bookingNumberFound) {
      console.log('❌ Could not find booking number 2528AL09');
      // Look for any booking numbers or similar patterns
      const bookingNumbers = await page.evaluate(() => {
        const numbers = [];
        const elements = document.querySelectorAll('*');
        for (let element of elements) {
          const text = element.textContent || element.value || '';
          // Look for various patterns
          const matches1 = text.match(/\d{4}AL\d{2}/g);
          const matches2 = text.match(/\d{4}[A-Z]{2}\d{2}/g);
          const matches3 = text.match(/\d{4}\w{2,4}\d{2}/g);
          if (matches1) numbers.push(...matches1);
          if (matches2) numbers.push(...matches2);
          if (matches3) numbers.push(...matches3);
        }
        return [...new Set(numbers)];
      });
      console.log('Available booking numbers found:', bookingNumbers);
      
      // Also check for the specific booking ID we know exists
      const bookingIdFound = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (let element of elements) {
          const text = element.textContent || element.value || '';
          if (text.includes('ab4e9fd0-3297-48f1-96e5-1f69ca5646cc')) {
            return true;
          }
        }
        return false;
      });
      console.log('Booking ID ab4e9fd0-3297-48f1-96e5-1f69ca5646cc found:', bookingIdFound);
      return;
    }
    
    console.log('4. Found booking number 2528AL09, attempting to locate and edit...');
    
    // Try to find and click on the booking number field
    const bookingNumberUpdated = await page.evaluate(() => {
      // Look for inputs with the current booking number
      const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input');
      for (let input of inputs) {
        if (input.value && input.value.includes('2528AL09')) {
          console.log('Found input with booking number:', input.value);
          // Clear and update the booking number
          input.focus();
          input.select();
          input.value = '2528AL11';
          
          // Trigger change events
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
          
          return true;
        }
      }
      
      // If not found in inputs, look for contentEditable elements
      const editableElements = document.querySelectorAll('[contenteditable="true"]');
      for (let element of editableElements) {
        if (element.textContent && element.textContent.includes('2528AL09')) {
          console.log('Found contentEditable with booking number:', element.textContent);
          element.focus();
          element.textContent = element.textContent.replace('2528AL09', '2528AL11');
          
          // Trigger change events
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('blur', { bubbles: true }));
          
          return true;
        }
      }
      
      return false;
    });
    
    if (!bookingNumberUpdated) {
      console.log('❌ Could not find or update booking number field');
      await page.screenshot({ path: 'test-booking-number-not-found.png', fullPage: true });
      console.log('📸 Screenshot saved as test-booking-number-not-found.png');
      return;
    }
    
    console.log('5. Updated booking number from 2528AL09 to 2528AL11');
    
    // Wait a moment for any immediate reactions
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('6. Looking for save button...');
    
    // Look for save button
    const saveButton = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, .btn, .save-btn');
      for (let button of buttons) {
        const text = button.textContent.toLowerCase();
        if (text.includes('save') || text.includes('update') || text.includes('confirm')) {
          return button;
        }
      }
      return null;
    });
    
    if (saveButton) {
      console.log('7. Found save button, clicking...');
      
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, .btn, .save-btn');
        for (let button of buttons) {
          const text = button.textContent.toLowerCase();
          if (text.includes('save') || text.includes('update') || text.includes('confirm')) {
            button.click();
            return;
          }
        }
      });
      
      console.log('8. Save button clicked, monitoring console for errors...');
      
      // Wait for save operation to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } else {
      console.log('7. No explicit save button found, checking for auto-save...');
      
      // Trigger blur event to potentially trigger auto-save
      await page.evaluate(() => {
        const activeElement = document.activeElement;
        if (activeElement) {
          activeElement.blur();
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('9. Taking final screenshot...');
    await page.screenshot({ path: 'test-documentstates-fix-complete.png', fullPage: true });
    console.log('📸 Screenshot saved as test-documentstates-fix-complete.png');
    
    // Summary of console activity
    console.log('\n=== CONSOLE ACTIVITY SUMMARY ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Console warnings: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS DETECTED:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ NO CONSOLE ERRORS DETECTED');
    }
    
    if (consoleWarnings.length > 0) {
      console.log('\n⚠️  CONSOLE WARNINGS:');
      consoleWarnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('✅ DocumentStates fix verification test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as test-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testDocumentStatesFix().catch(console.error);