import puppeteer from 'puppeteer';

async function testCreateAndEditBooking() {
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
    console.log('Step 1: Loading application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Step 2: Taking initial screenshot...');
    await page.screenshot({ path: 'create-test-01-initial.png', fullPage: true });
    
    console.log('Step 3: Looking for any booking forms or creation buttons...');
    
    // Look for any elements that might create bookings
    const createButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      const found = [];
      
      for (let button of buttons) {
        const text = button.textContent?.toLowerCase() || '';
        if (text.includes('create') || text.includes('add') || text.includes('new') || text.includes('book')) {
          found.push({
            tagName: button.tagName,
            text: button.textContent.trim(),
            className: button.className,
            id: button.id
          });
        }
      }
      
      return found;
    });
    
    console.log('Found potential create buttons:', createButtons);
    
    // Look for existing bookings to understand the structure
    const existingBookings = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const bookings = [];
      
      for (let element of allElements) {
        const text = element.textContent || '';
        // Look for booking number patterns
        if (text.match(/\d{4}[A-Z]{2}\d{2}/)) {
          bookings.push({
            tagName: element.tagName,
            text: text.trim(),
            className: element.className,
            id: element.id
          });
        }
      }
      
      return bookings;
    });
    
    console.log('Found existing bookings:', existingBookings);
    
    if (existingBookings.length > 0) {
      console.log('✅ Found existing bookings - the fixes are working!');
      
      // Try to find an editable booking
      const firstBooking = existingBookings[0];
      console.log('Testing with first booking:', firstBooking);
      
      // Look for input fields near this booking
      const editableFields = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input:not([type])');
        const found = [];
        
        for (let input of inputs) {
          if (input.value && input.value.match(/\d{4}[A-Z]{2}\d{2}/)) {
            found.push({
              value: input.value,
              className: input.className,
              id: input.id,
              placeholder: input.placeholder
            });
          }
        }
        
        return found;
      });
      
      console.log('Found editable booking fields:', editableFields);
      
      if (editableFields.length > 0) {
        const fieldToEdit = editableFields[0];
        console.log('Step 4: Editing booking number...');
        
        // Find the input selector
        const inputSelector = fieldToEdit.id ? `#${fieldToEdit.id}` : 
                            fieldToEdit.className ? `input.${fieldToEdit.className.split(' ')[0]}` : 
                            `input[value="${fieldToEdit.value}"]`;
        
        try {
          // Edit the booking number
          await page.click(inputSelector);
          await page.keyboard.selectAll();
          
          const originalValue = fieldToEdit.value;
          let newValue = originalValue;
          
          // Change the last digit
          if (originalValue.match(/\d{4}[A-Z]{2}\d{2}/)) {
            const lastDigit = originalValue.slice(-1);
            const newLastDigit = lastDigit === '9' ? '0' : String(parseInt(lastDigit) + 1);
            newValue = originalValue.slice(0, -1) + newLastDigit;
          }
          
          console.log(`Changing booking number from "${originalValue}" to "${newValue}"`);
          await page.keyboard.type(newValue);
          
          // Look for save button
          const saveButton = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, input[type="submit"]');
            for (let button of buttons) {
              if (button.textContent && button.textContent.toLowerCase().includes('save')) {
                return {
                  tagName: button.tagName,
                  text: button.textContent.trim(),
                  className: button.className,
                  id: button.id
                };
              }
            }
            return null;
          });
          
          if (saveButton) {
            console.log('Step 5: Saving changes...');
            const consoleCountBefore = consoleMessages.length;
            
            const saveSelector = saveButton.id ? `#${saveButton.id}` : 
                               saveButton.className ? `button.${saveButton.className.split(' ')[0]}` : 
                               'button';
            
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
            
            // Take screenshot after save
            await page.screenshot({ path: 'create-test-02-after-save.png', fullPage: true });
            
            // Step 6: Refresh and check persistence
            console.log('Step 6: Refreshing to check persistence...');
            await page.reload({ waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if the new value persisted
            const persistedValue = await page.evaluate(() => {
              const inputs = document.querySelectorAll('input');
              for (let input of inputs) {
                if (input.value && input.value.match(/\d{4}[A-Z]{2}\d{2}/)) {
                  return input.value;
                }
              }
              return null;
            });
            
            console.log('Persisted booking number:', persistedValue);
            
            if (persistedValue === newValue) {
              console.log('✅ BOOKING NUMBER PERSISTED SUCCESSFULLY!');
            } else if (persistedValue === originalValue) {
              console.log('❌ BOOKING NUMBER REVERTED TO ORIGINAL VALUE');
            } else {
              console.log('⚠️ BOOKING NUMBER CHANGED TO DIFFERENT VALUE:', persistedValue);
            }
            
            // Final screenshot
            await page.screenshot({ path: 'create-test-03-final.png', fullPage: true });
            
          } else {
            console.log('❌ No save button found');
          }
          
        } catch (error) {
          console.error('Error during editing:', error);
        }
      } else {
        console.log('❌ No editable booking number fields found');
      }
    } else {
      console.log('❌ No existing bookings found');
    }
    
    console.log('\n=== FINAL TEST SUMMARY ===');
    console.log('Total console messages:', consoleMessages.length);
    
    const allErrors = consoleMessages.filter(msg => 
      msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed')
    );
    
    if (allErrors.length > 0) {
      console.log('❌ ERRORS DETECTED:');
      allErrors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('✅ NO ERRORS DETECTED');
    }
    
    console.log('\nScreenshots saved:');
    console.log('- create-test-01-initial.png');
    console.log('- create-test-02-after-save.png');
    console.log('- create-test-03-final.png');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'create-test-error.png', fullPage: true });
  } finally {
    // Keep browser open for inspection
    console.log('\nBrowser will remain open for 30 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

testCreateAndEditBooking().catch(console.error);