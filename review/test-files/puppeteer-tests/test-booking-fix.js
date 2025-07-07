import puppeteer from 'puppeteer';
import fs from 'fs';

async function testBookingFix() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  
  console.log('Starting test for booking number change...');
  
  // Track console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    const message = `[${msg.type()}] ${msg.text()}`;
    console.log(message);
    consoleMessages.push(message);
  });
  
  // Track errors
  page.on('error', (error) => {
    console.error('PAGE ERROR:', error);
    consoleMessages.push(`[ERROR] ${error.message}`);
  });
  
  page.on('pageerror', (error) => {
    console.error('PAGE ERROR:', error);
    consoleMessages.push(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    // Step 1: Navigate to localhost:5173
    console.log('1. Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Go to booking management section
    console.log('2. Going to booking management section...');
    
    // First try to find navigation - look for different possible navigation patterns
    const navElements = await page.$$eval('[data-testid*="nav"], nav, [class*="nav"], [class*="menu"]', 
      elements => elements.map(el => ({ 
        text: el.textContent.trim(), 
        class: el.className,
        id: el.id 
      }))
    );
    console.log('Navigation elements found:', navElements);
    
    // Try to find booking/management related links
    const bookingLink = await page.$x("//a[contains(text(), 'Booking') or contains(text(), 'booking') or contains(text(), 'Management') or contains(text(), 'management')]");
    if (bookingLink.length > 0) {
      console.log('Found booking link, clicking...');
      await bookingLink[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      // Try alternative navigation patterns
      const allLinks = await page.$$eval('a', links => 
        links.map(link => ({ 
          text: link.textContent.trim(), 
          href: link.href,
          className: link.className 
        }))
      );
      console.log('All links found:', allLinks);
      
      // Look for any link that might lead to bookings
      const possibleBookingLinks = allLinks.filter(link => 
        link.text.toLowerCase().includes('booking') || 
        link.text.toLowerCase().includes('management') ||
        link.href.includes('booking')
      );
      
      if (possibleBookingLinks.length > 0) {
        console.log('Found possible booking links:', possibleBookingLinks);
        await page.click(`a[href*="${possibleBookingLinks[0].href.split('/').pop()}"]`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Step 3: Find the booking with booking number "2528AL09"
    console.log('3. Looking for booking "2528AL09"...');
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of current state
    await page.screenshot({ path: 'test-booking-state-1.png', fullPage: true });
    
    // Look for the booking number in various ways
    const bookingElements = await page.$$eval('*', elements => {
      const results = [];
      elements.forEach(el => {
        if (el.textContent && el.textContent.includes('2528AL09')) {
          results.push({
            text: el.textContent.trim(),
            tagName: el.tagName,
            className: el.className,
            id: el.id
          });
        }
      });
      return results;
    });
    
    console.log('Elements containing "2528AL09":', bookingElements);
    
    if (bookingElements.length === 0) {
      console.log('Booking 2528AL09 not found. Looking for any bookings...');
      
      // Look for any booking-like patterns
      const allText = await page.evaluate(() => document.body.innerText);
      console.log('Page content snippet:', allText.substring(0, 500));
      
      // Look for input fields that might contain booking numbers
      const inputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({ 
          value: input.value, 
          placeholder: input.placeholder,
          type: input.type,
          className: input.className,
          id: input.id
        }))
      );
      console.log('Input fields found:', inputs);
      
      throw new Error('Booking 2528AL09 not found on the page');
    }
    
    // Step 4: Edit the booking number
    console.log('4. Attempting to edit booking number...');
    
    // Try to find an editable field with the booking number
    const editableField = await page.$x("//input[@value='2528AL09'] | //input[contains(@value, '2528AL09')] | //*[contains(text(), '2528AL09')]//input | //*[contains(text(), '2528AL09')]/following-sibling::input | //*[contains(text(), '2528AL09')]/parent::*/input");
    
    if (editableField.length > 0) {
      console.log('Found editable field for booking number');
      await editableField[0].click();
      await editableField[0].clear();
      await editableField[0].type('2528AL10');
      console.log('Changed booking number to 2528AL10');
    } else {
      // Try to find edit button or similar
      const editButton = await page.$x("//button[contains(text(), 'Edit') or contains(text(), 'edit')] | //a[contains(text(), 'Edit') or contains(text(), 'edit')]");
      if (editButton.length > 0) {
        console.log('Found edit button, clicking...');
        await editButton[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now try to find the booking number field again
        const bookingInput = await page.$x("//input[@value='2528AL09'] | //input[contains(@value, '2528AL09')]");
        if (bookingInput.length > 0) {
          await bookingInput[0].click();
          await bookingInput[0].clear();
          await bookingInput[0].type('2528AL10');
          console.log('Changed booking number to 2528AL10');
        }
      }
    }
    
    // Step 5: Click save and monitor console
    console.log('5. Looking for save button...');
    const saveButton = await page.$x("//button[contains(text(), 'Save') or contains(text(), 'save')] | //input[@type='submit']");
    
    if (saveButton.length > 0) {
      console.log('Found save button, clicking...');
      const consoleCountBefore = consoleMessages.length;
      
      await saveButton[0].click();
      
      // Wait for save operation to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const consoleCountAfter = consoleMessages.length;
      const newConsoleMessages = consoleMessages.slice(consoleCountBefore);
      
      console.log('Console messages after save:', newConsoleMessages);
      
      // Check for errors
      const errorMessages = newConsoleMessages.filter(msg => 
        msg.includes('[error]') || msg.includes('[ERROR]') || msg.includes('Error')
      );
      
      if (errorMessages.length > 0) {
        console.log('❌ ERRORS FOUND:', errorMessages);
      } else {
        console.log('✅ NO CONSOLE ERRORS DETECTED');
      }
      
      // Step 6: Take screenshot after save
      await page.screenshot({ path: 'test-booking-after-save.png', fullPage: true });
      
      // Step 7: Hard refresh
      console.log('6. Performing hard refresh...');
      await page.reload({ waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 8: Check if booking number persisted
      console.log('7. Checking if booking number persisted...');
      
      const updatedBookingElements = await page.$$eval('*', elements => {
        const results = [];
        elements.forEach(el => {
          if (el.textContent && el.textContent.includes('2528AL10')) {
            results.push({
              text: el.textContent.trim(),
              tagName: el.tagName
            });
          }
        });
        return results;
      });
      
      console.log('Elements containing "2528AL10" after refresh:', updatedBookingElements);
      
      if (updatedBookingElements.length > 0) {
        console.log('✅ BOOKING NUMBER PERSISTED: 2528AL10 found after refresh');
      } else {
        console.log('❌ BOOKING NUMBER NOT PERSISTED: 2528AL10 not found after refresh');
      }
      
      // Step 9: Final screenshot
      await page.screenshot({ path: 'test-booking-final-result.png', fullPage: true });
      
    } else {
      console.log('❌ Save button not found');
    }
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('All console messages:', consoleMessages);
    console.log('Screenshots saved:');
    console.log('- test-booking-state-1.png');
    console.log('- test-booking-after-save.png');
    console.log('- test-booking-final-result.png');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-booking-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testBookingFix().catch(console.error);