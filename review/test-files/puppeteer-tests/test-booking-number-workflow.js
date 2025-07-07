/**
 * Test comprehensive booking number workflow
 * Tests creation, editing, and persistence of booking numbers
 */

import puppeteer from 'puppeteer';

async function testBookingNumberWorkflow() {
  console.log('🚀 Starting booking number workflow test...');
  
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

    // Wait for the page to load
    await page.waitForSelector('body', { timeout: 5000 });

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-initial-state.png', fullPage: true });

    // Look for create booking button/section
    console.log('🔍 Looking for booking creation interface...');
    
    // Wait for and click create booking button
    const createBookingSelector = 'button[data-testid="create-booking"], button:contains("Create Booking"), button:contains("Quick Create")';
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Take screenshot to see available buttons
    await page.screenshot({ path: 'test-available-buttons.png', fullPage: true });

    // Try to find create booking button
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons on page`);
    
    let createBookingButton = null;
    for (let button of buttons) {
      const text = await button.evaluate(el => el.textContent.trim());
      console.log(`Button text: "${text}"`);
      if (text.toLowerCase().includes('create') || text.toLowerCase().includes('book')) {
        createBookingButton = button;
        break;
      }
    }

    if (!createBookingButton) {
      // Try alternative approach - look for booking panel
      console.log('🔍 Looking for booking panel...');
      const bookingPanelExists = await page.$('.booking-panel, [data-testid="booking-panel"]');
      if (bookingPanelExists) {
        console.log('✅ Found booking panel');
      } else {
        console.log('❌ No booking panel found');
        
        // Look for any form elements that might be booking-related
        const forms = await page.$$('form');
        console.log(`Found ${forms.length} forms on page`);
        
        const inputs = await page.$$('input[type="text"], input[type="email"], input[type="date"]');
        console.log(`Found ${inputs.length} input fields`);
        
        if (inputs.length > 0) {
          console.log('📝 Found input fields, proceeding with form filling...');
          
          // Test data for Disk Drive booking
          const testBookingData = {
            customerFirstName: 'John',
            customerSurname: 'Doe',
            customerEmail: 'john.doe@example.com',
            startDate: '2025-07-15',
            endDate: '2025-07-20'
          };

          // Fill out the form
          console.log('📝 Filling out booking form...');
          
          // Fill customer details
          await fillInputByPlaceholder(page, 'first name', testBookingData.customerFirstName);
          await fillInputByPlaceholder(page, 'surname', testBookingData.customerSurname);
          await fillInputByPlaceholder(page, 'email', testBookingData.customerEmail);
          await fillInputByPlaceholder(page, 'start date', testBookingData.startDate);
          await fillInputByPlaceholder(page, 'end date', testBookingData.endDate);
          
          // Select Disk Drive yacht
          console.log('🛥️ Selecting Disk Drive yacht...');
          await selectYacht(page, 'disk-drive');
          
          // Take screenshot after form filling
          await page.screenshot({ path: 'test-form-filled.png', fullPage: true });
          
          // Submit the form
          console.log('📤 Submitting booking form...');
          await submitBookingForm(page);
          
          // Wait for booking to be created
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Take screenshot after submission
          await page.screenshot({ path: 'test-booking-created.png', fullPage: true });
          
          // Look for the booking number
          console.log('🔍 Looking for generated booking number...');
          const bookingNumber = await findBookingNumber(page);
          
          if (bookingNumber) {
            console.log(`✅ Found booking number: ${bookingNumber}`);
            
            // Test editing the booking number
            console.log('✏️ Testing booking number editing...');
            await testBookingNumberEdit(page, bookingNumber);
            
          } else {
            console.log('❌ No booking number found');
          }
        } else {
          console.log('❌ No form fields found');
        }
      }
    } else {
      console.log('✅ Found create booking button');
      await createBookingButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Continue with booking creation...
      await page.screenshot({ path: 'test-after-create-click.png', fullPage: true });
    }

    // Keep browser open for manual inspection
    console.log('🔍 Test completed. Browser will remain open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Helper functions
async function fillInputByPlaceholder(page, placeholder, value) {
  try {
    const input = await page.$(`input[placeholder*="${placeholder}" i]`);
    if (input) {
      await input.clear();
      await input.type(value);
      console.log(`✅ Filled ${placeholder}: ${value}`);
    } else {
      console.log(`❌ Input not found for placeholder: ${placeholder}`);
    }
  } catch (error) {
    console.log(`❌ Error filling ${placeholder}:`, error.message);
  }
}

async function selectYacht(page, yachtName) {
  try {
    // Look for yacht selector
    const yachtSelect = await page.$('select[name="yacht"], select[name="yachtId"]');
    if (yachtSelect) {
      await yachtSelect.selectOption({ label: yachtName });
      console.log(`✅ Selected yacht: ${yachtName}`);
    } else {
      console.log('❌ Yacht selector not found');
    }
  } catch (error) {
    console.log(`❌ Error selecting yacht:`, error.message);
  }
}

async function submitBookingForm(page) {
  try {
    // Look for submit button
    const submitButton = await page.$('button[type="submit"], button:contains("Create"), button:contains("Save")');
    if (submitButton) {
      await submitButton.click();
      console.log('✅ Clicked submit button');
    } else {
      console.log('❌ Submit button not found');
    }
  } catch (error) {
    console.log(`❌ Error submitting form:`, error.message);
  }
}

async function findBookingNumber(page) {
  try {
    // Look for booking number in various formats
    const bookingNumberSelectors = [
      '[data-testid="booking-number"]',
      '.booking-number',
      'span[class*="booking-number"]',
      'div[class*="booking-number"]'
    ];
    
    for (const selector of bookingNumberSelectors) {
      const element = await page.$(selector);
      if (element) {
        const text = await element.evaluate(el => el.textContent.trim());
        if (text.match(/^\d{8}$/)) {
          return text;
        }
      }
    }
    
    // Look for any 8-digit number that might be a booking number
    const pageText = await page.evaluate(() => document.body.innerText);
    const bookingNumberMatch = pageText.match(/\b\d{8}\b/);
    
    return bookingNumberMatch ? bookingNumberMatch[0] : null;
  } catch (error) {
    console.log(`❌ Error finding booking number:`, error.message);
    return null;
  }
}

async function testBookingNumberEdit(page, originalBookingNumber) {
  try {
    console.log(`🔍 Testing edit functionality for booking number: ${originalBookingNumber}`);
    
    // Look for the booking number editor
    const bookingNumberElement = await page.$('[data-testid="booking-number"], .booking-number');
    if (bookingNumberElement) {
      // Try to hover and click edit
      await bookingNumberElement.hover();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Look for edit button
      const editButton = await page.$('button[title="Edit booking number"]');
      if (editButton) {
        await editButton.click();
        console.log('✅ Clicked edit button');
        
        // Wait for edit input to appear
        await page.waitForSelector('input[type="text"]', { timeout: 2000 });
        
        // Calculate new booking number (add 5 to NN)
        const newBookingNumber = incrementBookingNumber(originalBookingNumber, 5);
        console.log(`📝 Changing booking number from ${originalBookingNumber} to ${newBookingNumber}`);
        
        // Clear and type new number
        const editInput = await page.$('input[type="text"]');
        await editInput.selectAll();
        await editInput.type(newBookingNumber);
        
        // Save the change
        const saveButton = await page.$('button[title="Save"]');
        if (saveButton) {
          await saveButton.click();
          console.log('✅ Clicked save button');
          
          // Wait for save to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify the change
          const updatedNumber = await findBookingNumber(page);
          if (updatedNumber === newBookingNumber) {
            console.log('✅ Booking number successfully updated!');
          } else {
            console.log(`❌ Booking number not updated. Expected: ${newBookingNumber}, Got: ${updatedNumber}`);
          }
        } else {
          console.log('❌ Save button not found');
        }
      } else {
        console.log('❌ Edit button not found');
      }
    } else {
      console.log('❌ Booking number element not found');
    }
  } catch (error) {
    console.log(`❌ Error testing booking number edit:`, error.message);
  }
}

function incrementBookingNumber(bookingNumber, increment) {
  // Extract NN part (last 2 digits) and increment
  const nn = parseInt(bookingNumber.substr(-2), 10);
  const newNN = (nn + increment).toString().padStart(2, '0');
  return bookingNumber.substr(0, 6) + newNN;
}

// Run the test
testBookingNumberWorkflow().catch(console.error);