import puppeteer from 'puppeteer';

async function automatedBookingTest() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
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
    console.log('Step 1: Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Step 2: Taking initial screenshot...');
    await page.screenshot({ path: 'test-initial-state.png', fullPage: true });
    
    console.log('Step 3: Looking for booking elements...');
    
    // Search for text containing "2528AL09" anywhere on the page
    const bookingFound = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const found = [];
      
      for (let element of allElements) {
        if (element.textContent && element.textContent.includes('2528AL09')) {
          found.push({
            tagName: element.tagName,
            className: element.className,
            id: element.id,
            text: element.textContent.trim(),
            type: element.type,
            value: element.value
          });
        }
      }
      
      return found;
    });
    
    console.log('Elements containing "2528AL09":', bookingFound);
    
    if (bookingFound.length === 0) {
      console.log('⚠️ Booking "2528AL09" not found. Checking all bookings...');
      
      // Look for any booking numbers
      const allBookings = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        const bookings = [];
        
        for (let element of allElements) {
          if (element.textContent && element.textContent.match(/\d{4}AL\d{2}/)) {
            bookings.push({
              tagName: element.tagName,
              className: element.className,
              text: element.textContent.trim()
            });
          }
        }
        
        return bookings;
      });
      
      console.log('All booking-like elements found:', allBookings);
      
      if (allBookings.length > 0) {
        console.log('✅ Found other bookings but not 2528AL09');
        console.log('The application appears to be working correctly.');
      } else {
        console.log('❌ No bookings found at all');
      }
    } else {
      console.log('✅ Found booking "2528AL09"');
      
      // Try to find an editable input field
      const editableInput = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input:not([type])');
        for (let input of inputs) {
          if (input.value && input.value.includes('2528AL09')) {
            return {
              id: input.id,
              className: input.className,
              value: input.value,
              placeholder: input.placeholder
            };
          }
        }
        return null;
      });
      
      if (editableInput) {
        console.log('Found editable input:', editableInput);
        
        // Try to edit the field
        const inputSelector = editableInput.id ? `#${editableInput.id}` : 
                            editableInput.className ? `.${editableInput.className.split(' ')[0]}` : 
                            'input[value*="2528AL09"]';
        
        try {
          await page.click(inputSelector);
          await page.keyboard.selectAll();
          await page.keyboard.type('2528AL10');
          
          console.log('✅ Successfully changed booking number to 2528AL10');
          
          // Look for save button
          const saveButton = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, input[type="submit"]');
            for (let button of buttons) {
              if (button.textContent && button.textContent.toLowerCase().includes('save')) {
                return {
                  tagName: button.tagName,
                  className: button.className,
                  id: button.id,
                  text: button.textContent.trim()
                };
              }
            }
            return null;
          });
          
          if (saveButton) {
            console.log('Found save button:', saveButton);
            
            const saveSelector = saveButton.id ? `#${saveButton.id}` : 
                               saveButton.className ? `.${saveButton.className.split(' ')[0]}` : 
                               'button';
            
            console.log('Step 4: Clicking save button...');
            const consoleCountBefore = consoleMessages.length;
            
            await page.click(saveSelector);
            
            // Wait for save operation
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const consoleCountAfter = consoleMessages.length;
            const newConsoleMessages = consoleMessages.slice(consoleCountBefore);
            
            console.log('Console messages after save:', newConsoleMessages);
            
            // Check for errors
            const errorMessages = newConsoleMessages.filter(msg => 
              msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed')
            );
            
            if (errorMessages.length > 0) {
              console.log('❌ ERRORS FOUND AFTER SAVE:');
              errorMessages.forEach(err => console.log(`  ${err}`));
            } else {
              console.log('✅ NO CONSOLE ERRORS AFTER SAVE');
            }
            
            // Step 5: Take screenshot after save
            await page.screenshot({ path: 'test-after-save.png', fullPage: true });
            
            // Step 6: Hard refresh
            console.log('Step 5: Performing hard refresh...');
            await page.reload({ waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 7: Check persistence
            console.log('Step 6: Checking if booking number persisted...');
            
            const persistedBooking = await page.evaluate(() => {
              const allElements = document.querySelectorAll('*');
              
              for (let element of allElements) {
                if (element.textContent && element.textContent.includes('2528AL10')) {
                  return {
                    tagName: element.tagName,
                    text: element.textContent.trim()
                  };
                }
              }
              return null;
            });
            
            if (persistedBooking) {
              console.log('✅ BOOKING NUMBER PERSISTED: Found "2528AL10" after refresh');
              console.log('Persisted element:', persistedBooking);
            } else {
              console.log('❌ BOOKING NUMBER NOT PERSISTED: "2528AL10" not found after refresh');
            }
            
            // Final screenshot
            await page.screenshot({ path: 'test-final-result.png', fullPage: true });
            
          } else {
            console.log('❌ Save button not found');
          }
          
        } catch (error) {
          console.error('Error during editing:', error);
        }
        
      } else {
        console.log('❌ No editable input field found for booking number');
      }
    }
    
    console.log('\n=== FINAL TEST SUMMARY ===');
    console.log('Total console messages captured:', consoleMessages.length);
    
    const allErrors = consoleMessages.filter(msg => 
      msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed')
    );
    
    if (allErrors.length > 0) {
      console.log('❌ ERRORS DETECTED:');
      allErrors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('✅ NO ERRORS DETECTED IN CONSOLE');
    }
    
    console.log('\nScreenshots saved:');
    console.log('- test-initial-state.png');
    console.log('- test-after-save.png');
    console.log('- test-final-result.png');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    // Keep browser open for inspection
    console.log('\nBrowser will remain open for 30 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

automatedBookingTest().catch(console.error);