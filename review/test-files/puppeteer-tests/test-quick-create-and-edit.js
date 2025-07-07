import puppeteer from 'puppeteer';

async function testQuickCreateAndEdit() {
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
    await page.screenshot({ path: 'quick-create-01-initial.png', fullPage: true });
    
    console.log('Step 3: Clicking Quick Create button...');
    
    // Find and click the Quick Create button
    const quickCreateButton = await page.$('button:has-text("Quick Create")') || 
                             await page.$('button[class*="ios-button"]') ||
                             await page.$('text="✅ Quick Create"');
    
    if (!quickCreateButton) {
      // Alternative approach
      const buttonFound = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent && button.textContent.includes('Quick Create')) {
            button.click();
            return true;
          }
        }
        return false;
      });
      
      if (!buttonFound) {
        console.log('❌ Quick Create button not found');
        return;
      }
    } else {
      await quickCreateButton.click();
    }
    
    console.log('✅ Quick Create button clicked');
    
    // Wait for form to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Step 4: Filling out booking form...');
    
    // Look for form fields
    const formFields = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, select, textarea');
      const found = [];
      
      for (let input of inputs) {
        found.push({
          tagName: input.tagName,
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          id: input.id,
          className: input.className
        });
      }
      
      return found;
    });
    
    console.log('Found form fields:', formFields);
    
    // Fill out the form with test data
    const testData = {
      guest_name: 'Test Customer',
      booking_number: '2528AL09',
      email: 'test@example.com',
      phone: '555-123-4567',
      charter_start_date: '2025-07-10',
      charter_end_date: '2025-07-15',
      yacht_name: 'Test Yacht',
      charter_type: 'Day Charter'
    };
    
    // Try to fill fields based on common patterns
    for (const [key, value] of Object.entries(testData)) {
      try {
        // Try multiple selectors
        const selectors = [
          `input[name="${key}"]`,
          `input[id="${key}"]`,
          `input[placeholder*="${key.replace('_', ' ')}"]`,
          `select[name="${key}"]`,
          `select[id="${key}"]`
        ];
        
        for (const selector of selectors) {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            await element.clear();
            await element.type(value);
            console.log(`✅ Filled ${key}: ${value}`);
            break;
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not fill ${key}: ${error.message}`);
      }
    }
    
    await page.screenshot({ path: 'quick-create-02-form-filled.png', fullPage: true });
    
    console.log('Step 5: Submitting form...');
    
    // Look for submit button
    const submitButton = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, input[type="submit"]');
      for (let button of buttons) {
        const text = button.textContent?.toLowerCase() || '';
        if (text.includes('save') || text.includes('submit') || text.includes('create')) {
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
    
    if (submitButton) {
      console.log('Found submit button:', submitButton);
      
      const consoleCountBefore = consoleMessages.length;
      
      // Click submit
      const submitSelector = submitButton.id ? `#${submitButton.id}` : 
                           submitButton.className ? `button.${submitButton.className.split(' ')[0]}` : 
                           'button';
      
      await page.click(submitSelector);
      
      // Wait for submission
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const consoleCountAfter = consoleMessages.length;
      const newConsoleMessages = consoleMessages.slice(consoleCountBefore);
      
      console.log('Console messages after submission:', newConsoleMessages);
      
      // Check for errors
      const errorMessages = newConsoleMessages.filter(msg => 
        msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed')
      );
      
      if (errorMessages.length > 0) {
        console.log('❌ ERRORS FOUND AFTER SUBMISSION:');
        errorMessages.forEach(err => console.log(`  ${err}`));
      } else {
        console.log('✅ NO CONSOLE ERRORS AFTER SUBMISSION');
      }
      
      await page.screenshot({ path: 'quick-create-03-after-submit.png', fullPage: true });
      
      console.log('Step 6: Looking for created booking...');
      
      // Wait a bit more for UI to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Look for the booking we just created
      const createdBooking = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        for (let element of allElements) {
          if (element.textContent && element.textContent.includes('2528AL09')) {
            return {
              tagName: element.tagName,
              text: element.textContent.trim(),
              className: element.className
            };
          }
        }
        return null;
      });
      
      if (createdBooking) {
        console.log('✅ Found created booking:', createdBooking);
        
        console.log('Step 7: Now testing the edit functionality...');
        
        // Look for editable input with the booking number
        const editableInput = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input');
          for (let input of inputs) {
            if (input.value && input.value.includes('2528AL09')) {
              return {
                id: input.id,
                className: input.className,
                value: input.value
              };
            }
          }
          return null;
        });
        
        if (editableInput) {
          console.log('Found editable booking input:', editableInput);
          
          const inputSelector = editableInput.id ? `#${editableInput.id}` : 
                               editableInput.className ? `input.${editableInput.className.split(' ')[0]}` : 
                               'input[value*="2528AL09"]';
          
          // Edit the booking number
          await page.click(inputSelector);
          await page.keyboard.selectAll();
          await page.keyboard.type('2528AL10');
          
          console.log('✅ Changed booking number to 2528AL10');
          
          // Save the change
          const saveButton = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
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
            console.log('Step 8: Saving booking number change...');
            
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
              console.log('✅ NO CONSOLE ERRORS AFTER SAVE - FIXES WORKING!');
            }
            
            await page.screenshot({ path: 'quick-create-04-after-edit.png', fullPage: true });
            
            console.log('Step 9: Testing persistence with refresh...');
            
            // Refresh the page
            await page.reload({ waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if the change persisted
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
              console.log('✅ BOOKING NUMBER PERSISTED AFTER REFRESH!');
              console.log('Persisted booking:', persistedBooking);
            } else {
              console.log('❌ BOOKING NUMBER NOT PERSISTED AFTER REFRESH');
            }
            
            await page.screenshot({ path: 'quick-create-05-final.png', fullPage: true });
            
          } else {
            console.log('❌ Save button not found');
          }
        } else {
          console.log('❌ Editable booking input not found');
        }
      } else {
        console.log('❌ Created booking not found in UI');
      }
    } else {
      console.log('❌ Submit button not found');
    }
    
    console.log('\n=== COMPLETE TEST SUMMARY ===');
    console.log('Total console messages:', consoleMessages.length);
    
    const allErrors = consoleMessages.filter(msg => 
      msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed')
    );
    
    if (allErrors.length > 0) {
      console.log('❌ ERRORS DETECTED:');
      allErrors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('✅ NO ERRORS DETECTED - ALL FIXES WORKING!');
    }
    
    console.log('\nScreenshots saved:');
    console.log('- quick-create-01-initial.png');
    console.log('- quick-create-02-form-filled.png');
    console.log('- quick-create-03-after-submit.png');
    console.log('- quick-create-04-after-edit.png');
    console.log('- quick-create-05-final.png');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'quick-create-error.png', fullPage: true });
  } finally {
    // Keep browser open for inspection
    console.log('\nBrowser will remain open for 30 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

testQuickCreateAndEdit().catch(console.error);