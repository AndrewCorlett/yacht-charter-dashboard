/**
 * Test booking creation and editing
 */

import puppeteer from 'puppeteer';

async function testBookingEdit() {
  console.log('🚀 Starting booking edit test...');
  
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
    await page.screenshot({ path: 'edit-test-initial.png', fullPage: true });

    // Find and click Quick Create button
    console.log('🔍 Looking for Quick Create button...');
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
      
      // Fill the form quickly
      console.log('📝 Filling quick create form...');
      
      const inputs = await page.$$('input');
      const selects = await page.$$('select');
      
      // Fill basic fields
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type('Test');
      
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type('User');
      
      await inputs[2].click({ clickCount: 3 });
      await inputs[2].type('test@example.com');
      
      // Fill dates (inputs 8 and 9 are the date fields)
      await inputs[8].click();
      await inputs[8].type('2025-07-20');
      
      await inputs[9].click();
      await inputs[9].type('2025-07-27');
      
      // Select Disk Drive yacht
      await page.select('select[name="yacht"]', '234a2f45-1e79-44fb-b5aa-3c058f777255');
      console.log('✅ Selected Disk Drive yacht');
      
      await page.screenshot({ path: 'edit-test-form-filled.png', fullPage: true });
      
      // Submit the form
      console.log('📤 Submitting form...');
      const submitButton = await page.$('button[type="submit"]');
      await submitButton.click();
      
      // Wait for booking creation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await page.screenshot({ path: 'edit-test-after-submit.png', fullPage: true });
      
      // Look for the new booking in the list
      console.log('🔍 Looking for the new booking...');
      
      // Find all booking buttons that contain "Disk Drive" and "Test User"
      const allButtons = await page.$$('button');
      let newBookingButton = null;
      
      for (const button of allButtons) {
        const text = await button.evaluate(el => el.textContent.trim());
        if (text.includes('Disk Drive') && text.includes('Test')) {
          newBookingButton = button;
          console.log(`✅ Found new booking: ${text.substring(0, 100)}...`);
          break;
        }
      }
      
      if (newBookingButton) {
        // Click on the booking to view details
        console.log('🔍 Clicking on booking to view details...');
        await newBookingButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({ path: 'edit-test-booking-details.png', fullPage: true });
        
        // Look for booking number in the details panel
        console.log('🔍 Looking for booking number...');
        const pageText = await page.evaluate(() => document.body.innerText);
        
        // Look for 8-digit booking number pattern
        const bookingNumberMatch = pageText.match(/\b\d{8}\b/);
        
        if (bookingNumberMatch) {
          const bookingNumber = bookingNumberMatch[0];
          console.log(`✅ Found booking number: ${bookingNumber}`);
          
          // Now test editing the booking number
          console.log('✏️ Testing booking number editing...');
          
          // Look for the booking number element that can be edited
          const bookingNumberElement = await page.evaluateHandle((number) => {
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            let node;
            while (node = walker.nextNode()) {
              if (node.textContent.includes(number)) {
                return node.parentElement;
              }
            }
            return null;
          }, bookingNumber);
          
          if (bookingNumberElement) {
            // Try to hover and find edit button
            await bookingNumberElement.hover();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Look for edit button nearby
            const editButton = await page.$('button[title*="Edit"]');
            if (editButton) {
              await editButton.click();
              console.log('✅ Clicked edit button');
              
              await new Promise(resolve => setTimeout(resolve, 500));
              await page.screenshot({ path: 'edit-test-edit-mode.png', fullPage: true });
              
              // Find edit input
              const editInput = await page.$('input[type="text"]');
              if (editInput) {
                // Calculate new booking number (increment last 2 digits by 5)
                const newNumber = incrementBookingNumber(bookingNumber, 5);
                console.log(`📝 Changing ${bookingNumber} to ${newNumber}`);
                
                // Clear and type new number
                await editInput.click({ clickCount: 3 });
                await editInput.type(newNumber);
                
                // Save
                const saveButton = await page.$('button[title*="Save"]');
                if (saveButton) {
                  await saveButton.click();
                  console.log('✅ Clicked save button');
                  
                  // Wait for save
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  await page.screenshot({ path: 'edit-test-after-edit.png', fullPage: true });
                  
                  // Verify change
                  const updatedPageText = await page.evaluate(() => document.body.innerText);
                  if (updatedPageText.includes(newNumber)) {
                    console.log('✅ Booking number successfully updated!');
                    
                    // Test persistence - refresh page
                    console.log('🔄 Testing persistence by refreshing page...');
                    await page.reload({ waitUntil: 'networkidle2' });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const refreshedPageText = await page.evaluate(() => document.body.innerText);
                    if (refreshedPageText.includes(newNumber)) {
                      console.log('✅ Booking number change persisted after refresh!');
                    } else {
                      console.log('❌ Booking number change did not persist');
                    }
                  } else {
                    console.log(`❌ Update failed. New number ${newNumber} not found`);
                  }
                } else {
                  console.log('❌ Save button not found');
                }
              } else {
                console.log('❌ Edit input not found');
              }
            } else {
              console.log('❌ Edit button not found');
              
              // Try alternative approach - look for any editable element
              const editableElements = await page.$$('[contenteditable="true"], input, textarea');
              console.log(`Found ${editableElements.length} potentially editable elements`);
            }
          } else {
            console.log('❌ Booking number element not found for editing');
          }
        } else {
          console.log('❌ No booking number found in details');
          console.log('Page content preview:', pageText.substring(0, 1000));
        }
      } else {
        console.log('❌ Could not find the new booking');
      }
    } else {
      console.log('❌ Quick Create button not found');
    }

    // Keep browser open for inspection
    console.log('🔍 Browser will remain open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 60000));

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'edit-test-error.png', fullPage: true });
  } finally {
    await browser.close();
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
testBookingEdit().catch(console.error);