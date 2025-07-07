/**
 * Test editing of existing booking numbers
 */

import puppeteer from 'puppeteer';

async function testExistingBookingEdit() {
  console.log('🚀 Starting existing booking edit test...');
  
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
    await page.screenshot({ path: 'existing-edit-initial.png', fullPage: true });

    // Look for existing bookings in the list
    console.log('🔍 Looking for existing bookings...');
    
    // Find all booking buttons
    const buttons = await page.$$('button');
    let targetBookingButton = null;
    
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent.trim());
      // Look for a booking that might contain customer info (not the nav buttons)
      if (text.includes('Alrisha') || text.includes('Zavaria') || text.includes('Spectre')) {
        targetBookingButton = button;
        console.log(`✅ Found existing booking: ${text.substring(0, 80)}...`);
        break;
      }
    }
    
    if (targetBookingButton) {
      // Click on the booking to view details
      console.log('🔍 Clicking on booking to view details...');
      await targetBookingButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ path: 'existing-edit-booking-details.png', fullPage: true });
      
      // Look for booking number in the details panel
      console.log('🔍 Looking for booking number in details...');
      const pageText = await page.evaluate(() => document.body.innerText);
      
      // Look for booking number patterns (both old and new formats)
      // New format: 8 digits (YYWWBCNN)
      // Old format: BK followed by numbers
      const newFormatMatches = pageText.match(/\b\d{8}\b/g);
      const oldFormatMatches = pageText.match(/\bBK\w+/g);
      
      const bookingNumberMatches = newFormatMatches || oldFormatMatches;
      
      if (bookingNumberMatches && bookingNumberMatches.length > 0) {
        const bookingNumber = bookingNumberMatches[0];
        console.log(`✅ Found booking number: ${bookingNumber}`);
        
        // Now test editing the booking number
        console.log('✏️ Testing booking number editing...');
        
        // Look for elements containing the booking number
        const allElements = await page.$$('*');
        let bookingNumberElement = null;
        
        for (const element of allElements) {
          try {
            const text = await element.evaluate(el => el.textContent || '');
            if (text.trim() === bookingNumber) {
              bookingNumberElement = element;
              console.log('✅ Found booking number element');
              break;
            }
          } catch (e) {
            // Skip elements that can't be evaluated
          }
        }
        
        if (bookingNumberElement) {
          // Try to hover and find edit button
          console.log('🔍 Hovering over booking number element...');
          await bookingNumberElement.hover();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await page.screenshot({ path: 'existing-edit-hover.png', fullPage: true });
          
          // Look for edit button that appears on hover
          const editButtons = await page.$$('button');
          let editButton = null;
          
          for (const button of editButtons) {
            const title = await button.evaluate(el => el.title || el.getAttribute('title') || '');
            const ariaLabel = await button.evaluate(el => el.getAttribute('aria-label') || '');
            
            if (title.toLowerCase().includes('edit') || ariaLabel.toLowerCase().includes('edit')) {
              editButton = button;
              console.log(`✅ Found edit button with title: "${title}"`);
              break;
            }
          }
          
          if (editButton) {
            await editButton.click();
            console.log('✅ Clicked edit button');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.screenshot({ path: 'existing-edit-edit-mode.png', fullPage: true });
            
            // Find edit input
            const editInputs = await page.$$('input[type="text"]');
            let editInput = null;
            
            for (const input of editInputs) {
              const value = await input.evaluate(el => el.value || '');
              if (value === bookingNumber || value.includes(bookingNumber)) {
                editInput = input;
                console.log(`✅ Found edit input with value: "${value}"`);
                break;
              }
            }
            
            if (editInput) {
              // Calculate new booking number based on format
              let newNumber;
              
              if (bookingNumber.match(/^\d{8}$/)) {
                // New format: increment last 2 digits by 3
                newNumber = incrementBookingNumber(bookingNumber, 3);
              } else {
                // Old format: convert to new format
                newNumber = '2529ZA99'; // Valid YYWWBCNN format for testing
              }
              
              console.log(`📝 Changing ${bookingNumber} to ${newNumber}`);
              
              // Clear and type new number
              await editInput.click({ clickCount: 3 });
              await editInput.type(newNumber);
              
              await page.screenshot({ path: 'existing-edit-new-number.png', fullPage: true });
              
              // Look for save button
              const saveButtons = await page.$$('button');
              let saveButton = null;
              
              for (const button of saveButtons) {
                const title = await button.evaluate(el => el.title || el.getAttribute('title') || '');
                const ariaLabel = await button.evaluate(el => el.getAttribute('aria-label') || '');
                const text = await button.evaluate(el => el.textContent.trim() || '');
                
                if (title.toLowerCase().includes('save') || 
                    ariaLabel.toLowerCase().includes('save') ||
                    text.toLowerCase().includes('save')) {
                  saveButton = button;
                  console.log(`✅ Found save button`);
                  break;
                }
              }
              
              if (saveButton) {
                await saveButton.click();
                console.log('✅ Clicked save button');
                
                // Wait for save
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                await page.screenshot({ path: 'existing-edit-after-save.png', fullPage: true });
                
                // Verify change
                const updatedPageText = await page.evaluate(() => document.body.innerText);
                if (updatedPageText.includes(newNumber)) {
                  console.log('✅ Booking number successfully updated!');
                  
                  // Test persistence - refresh page
                  console.log('🔄 Testing persistence by refreshing page...');
                  await page.reload({ waitUntil: 'networkidle2' });
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  
                  await page.screenshot({ path: 'existing-edit-after-refresh.png', fullPage: true });
                  
                  const refreshedPageText = await page.evaluate(() => document.body.innerText);
                  if (refreshedPageText.includes(newNumber)) {
                    console.log('✅ Booking number change persisted after refresh!');
                    
                    // Check database for the update
                    console.log('📊 Changes should now be visible in the database');
                  } else {
                    console.log('❌ Booking number change did not persist after refresh');
                  }
                } else {
                  console.log(`❌ Update failed. New number ${newNumber} not found on page`);
                  console.log('Updated page content preview:', updatedPageText.substring(0, 500));
                }
              } else {
                console.log('❌ Save button not found');
                
                // Check what buttons are available
                const availableButtons = await page.$$('button');
                console.log(`Found ${availableButtons.length} buttons after edit:`);
                for (let i = 0; i < Math.min(availableButtons.length, 10); i++) {
                  const btn = availableButtons[i];
                  const title = await btn.evaluate(el => el.title || '');
                  const text = await btn.evaluate(el => el.textContent.trim() || '');
                  console.log(`  Button ${i + 1}: title="${title}", text="${text}"`);
                }
              }
            } else {
              console.log('❌ Edit input not found');
            }
          } else {
            console.log('❌ Edit button not found after hover');
            
            // List all visible buttons for debugging
            const allButtons = await page.$$('button');
            console.log(`Found ${allButtons.length} buttons total:`);
            for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
              const btn = allButtons[i];
              const title = await btn.evaluate(el => el.title || '');
              const text = await btn.evaluate(el => el.textContent.trim() || '');
              console.log(`  Button ${i + 1}: title="${title}", text="${text.substring(0, 30)}"`);
            }
          }
        } else {
          console.log('❌ Booking number element not found for editing');
        }
      } else {
        console.log('❌ No booking number found in details');
        console.log('Page content preview:', pageText.substring(0, 1000));
      }
    } else {
      console.log('❌ No existing bookings found');
    }

    // Keep browser open for inspection
    console.log('🔍 Browser will remain open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 60000));

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'existing-edit-error.png', fullPage: true });
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
testExistingBookingEdit().catch(console.error);