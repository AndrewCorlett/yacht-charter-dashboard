/**
 * Test Quick Create booking functionality
 * Tests creation and editing of booking numbers
 */

import puppeteer from 'puppeteer';

async function testQuickCreateBooking() {
  console.log('🚀 Starting Quick Create booking test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  try {
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-initial.png', fullPage: true });

    // Find and click Quick Create button
    console.log('🔍 Looking for Quick Create button...');
    
    // Wait for the page to load and find the button
    await page.waitForSelector('button', { timeout: 5000 });
    
    // Look for Quick Create button specifically
    const buttons = await page.$$('button');
    let quickCreateButton = null;
    
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent.trim());
      if (text.includes('Quick Create')) {
        quickCreateButton = button;
        break;
      }
    }
    
    if (quickCreateButton) {
      console.log('✅ Found Quick Create button');
      await quickCreateButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'test-after-quick-create.png', fullPage: true });
      
      // Fill the quick create form
      console.log('📝 Filling quick create form...');
      
      // Test data for Disk Drive
      const testData = {
        firstName: 'John',
        surname: 'Doe',
        email: 'john.doe@test.com',
        startDate: '2025-07-15',
        endDate: '2025-07-22'
      };
      
      // Fill form fields
      await fillFormField(page, 'First Name', testData.firstName);
      await fillFormField(page, 'Surname', testData.surname);
      await fillFormField(page, 'Email', testData.email);
      await fillFormField(page, 'Start Date', testData.startDate);
      await fillFormField(page, 'End Date', testData.endDate);
      
      // Select Disk Drive yacht
      console.log('🛥️ Selecting Disk Drive yacht...');
      await selectYacht(page, 'Disk Drive');
      
      // Take screenshot after form fill
      await page.screenshot({ path: 'test-form-filled.png', fullPage: true });
      
      // Submit the form
      console.log('📤 Submitting form...');
      await submitForm(page);
      
      // Wait for booking creation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take screenshot after submission
      await page.screenshot({ path: 'test-booking-created.png', fullPage: true });
      
      // Find the created booking
      console.log('🔍 Looking for created booking...');
      const bookingNumber = await findBookingNumber(page);
      
      if (bookingNumber) {
        console.log(`✅ Found booking number: ${bookingNumber}`);
        
        // Test editing the booking number
        console.log('✏️ Testing booking number editing...');
        await testEditBookingNumber(page, bookingNumber);
        
        console.log('✅ Test completed successfully!');
      } else {
        console.log('❌ No booking number found');
      }
    } else {
      console.log('❌ Quick Create button not found');
    }

    // Keep browser open for inspection
    console.log('🔍 Browser will remain open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

async function fillFormField(page, fieldName, value) {
  try {
    // Try multiple selector strategies
    const selectors = [
      `input[placeholder*="${fieldName}" i]`,
      `input[name*="${fieldName.toLowerCase().replace(' ', '_')}" i]`,
      `input[id*="${fieldName.toLowerCase().replace(' ', '_')}" i]`
    ];
    
    for (const selector of selectors) {
      const input = await page.$(selector);
      if (input) {
        // Clear field and type value
        await input.click({ clickCount: 3 }); // Select all
        await input.type(value);
        console.log(`✅ Filled ${fieldName}: ${value}`);
        return;
      }
    }
    
    console.log(`❌ Could not find field: ${fieldName}`);
  } catch (error) {
    console.log(`❌ Error filling ${fieldName}:`, error.message);
  }
}

async function selectYacht(page, yachtName) {
  try {
    // Look for yacht selector/dropdown
    const yachtSelectors = [
      'select[name*="yacht" i]',
      'select[id*="yacht" i]',
      'div[role="combobox"]',
      'button[aria-haspopup="listbox"]'
    ];
    
    for (const selector of yachtSelectors) {
      const element = await page.$(selector);
      if (element) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'select') {
          // Standard select dropdown
          await page.select(selector, yachtName);
          console.log(`✅ Selected yacht: ${yachtName}`);
          return;
        } else {
          // Custom dropdown
          await element.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Look for yacht option
          const option = await page.$(`text=${yachtName}`);
          if (option) {
            await option.click();
            console.log(`✅ Selected yacht: ${yachtName}`);
            return;
          }
        }
      }
    }
    
    console.log(`❌ Could not find yacht selector for: ${yachtName}`);
  } catch (error) {
    console.log(`❌ Error selecting yacht:`, error.message);
  }
}

async function submitForm(page) {
  try {
    // Look for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Create")',
      'button:has-text("Save")',
      'button:has-text("Submit")'
    ];
    
    for (const selector of submitSelectors) {
      const button = await page.$(selector);
      if (button) {
        await button.click();
        console.log('✅ Clicked submit button');
        return;
      }
    }
    
    console.log('❌ Submit button not found');
  } catch (error) {
    console.log(`❌ Error submitting form:`, error.message);
  }
}

async function findBookingNumber(page) {
  try {
    // Wait for page to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Look for booking number patterns
    const pageText = await page.evaluate(() => document.body.innerText);
    
    // Match 8-digit booking number (YYWWBCNN format)
    const bookingNumberMatch = pageText.match(/\b\d{8}\b/);
    
    if (bookingNumberMatch) {
      return bookingNumberMatch[0];
    }
    
    // Look for booking number in specific elements
    const bookingElements = await page.$$('[data-testid*="booking"], .booking-number, .booking-code');
    for (const element of bookingElements) {
      const text = await element.evaluate(el => el.textContent.trim());
      if (text.match(/^\d{8}$/)) {
        return text;
      }
    }
    
    return null;
  } catch (error) {
    console.log(`❌ Error finding booking number:`, error.message);
    return null;
  }
}

async function testEditBookingNumber(page, originalNumber) {
  try {
    console.log(`🔍 Testing edit of booking number: ${originalNumber}`);
    
    // Look for the booking number element
    const bookingElement = await page.$(`text=${originalNumber}`);
    if (bookingElement) {
      // Hover to reveal edit button
      await bookingElement.hover();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Look for edit button
      const editButton = await page.$('button[title="Edit booking number"]');
      if (editButton) {
        await editButton.click();
        console.log('✅ Clicked edit button');
        
        // Wait for input field
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find edit input
        const editInput = await page.$('input[type="text"]');
        if (editInput) {
          // Calculate new number (increment last 2 digits by 5)
          const newNumber = incrementBookingNumber(originalNumber, 5);
          console.log(`📝 Changing ${originalNumber} to ${newNumber}`);
          
          // Clear and type new number
          await editInput.selectText();
          await editInput.type(newNumber);
          
          // Save
          const saveButton = await page.$('button[title="Save"]');
          if (saveButton) {
            await saveButton.click();
            console.log('✅ Clicked save button');
            
            // Wait for save
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify change
            const updatedNumber = await findBookingNumber(page);
            if (updatedNumber === newNumber) {
              console.log('✅ Booking number successfully updated!');
              return true;
            } else {
              console.log(`❌ Update failed. Expected: ${newNumber}, Got: ${updatedNumber}`);
              return false;
            }
          } else {
            console.log('❌ Save button not found');
          }
        } else {
          console.log('❌ Edit input not found');
        }
      } else {
        console.log('❌ Edit button not found');
      }
    } else {
      console.log('❌ Booking number element not found');
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Error editing booking number:`, error.message);
    return false;
  }
}

function incrementBookingNumber(bookingNumber, increment) {
  // Extract last 2 digits (NN) and increment
  const prefix = bookingNumber.substring(0, 6);
  const nn = parseInt(bookingNumber.substring(6, 8), 10);
  const newNN = (nn + increment).toString().padStart(2, '0');
  return prefix + newNN;
}

// Run the test
testQuickCreateBooking().catch(console.error);