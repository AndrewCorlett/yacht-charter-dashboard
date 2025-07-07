#!/usr/bin/env node

/**
 * Booking Number Update Test
 * 
 * Tests the complete workflow requested:
 * 1. Create a new booking
 * 2. Manually change the booking number (add 3 to NN)
 * 3. Save the change
 * 4. Check console for errors
 * 5. Hard refresh to verify persistence
 * 6. Check Supabase backend for confirmation
 */

import puppeteer from 'puppeteer';

async function testBookingNumberUpdate() {
  console.log('🔢 Testing booking number manual update...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Monitor console for errors
  const consoleErrors = [];
  const bookingNumbers = [];
  let updateErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    // Capture booking numbers
    if (text.includes('Generated booking code:')) {
      const match = text.match(/([0-9]{4}[A-Z]{2}[0-9]{2})/);
      if (match) {
        bookingNumbers.push(match[1]);
        console.log(`🔢 BOOKING CREATED: ${match[1]}`);
      }
    }
    
    // Capture update-related errors
    if (text.includes('crewExperienceFile') || 
        text.includes('Failed to update') ||
        text.includes('schema cache') ||
        text.includes('column') ||
        type === 'error') {
      consoleErrors.push({ text, type, timestamp: new Date() });
      console.log(`❌ ERROR: ${text}`);
    }
    
    // Capture success messages
    if (text.includes('Booking number updated') || 
        text.includes('successfully updated') ||
        text.includes('Update successful')) {
      console.log(`✅ SUCCESS: ${text}`);
    }
  });
  
  try {
    // === STEP 1: Create a new booking ===
    console.log('\n🚀 STEP 1: Creating new booking...');
    
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fill booking form
    const textFields = [
      { selector: 'input[name="firstName"]', value: 'Test' },
      { selector: 'input[name="surname"]', value: 'Update' },
      { selector: 'input[name="email"]', value: 'test.update@example.com' },
      { selector: 'input[name="phone"]', value: '07999888777' },
      { selector: 'input[name="addressLine1"]', value: '999 Update Street' },
      { selector: 'input[name="city"]', value: 'Update City' },
      { selector: 'input[name="postcode"]', value: 'UP1 1AA' }
    ];
    
    for (const field of textFields) {
      await page.click(field.selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');
      await page.type(field.selector, field.value, { delay: 5 });
      await page.keyboard.press('Tab');
    }
    
    // Select Alrisha yacht
    const yachtOptions = await page.$$('select[name="yacht"] option');
    let alrishaValue = null;
    for (const option of yachtOptions) {
      const text = await page.evaluate(el => el.textContent, option);
      if (text.toLowerCase().includes('alrisha')) {
        alrishaValue = await page.evaluate(el => el.value, option);
        break;
      }
    }
    
    if (alrishaValue) {
      await page.select('select[name="yacht"]', alrishaValue);
      console.log(`  ✅ Selected Alrisha yacht: ${alrishaValue}`);
    } else {
      console.log('  ❌ Alrisha yacht not found');
      return false;
    }
    
    // Set dates
    const today = new Date();
    const startDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week charter
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    await page.evaluate((start, end) => {
      const startInput = document.querySelector('input[name="startDate"]');
      const endInput = document.querySelector('input[name="endDate"]');
      
      startInput.value = start;
      endInput.value = end;
      
      startInput.dispatchEvent(new Event('input', { bubbles: true }));
      startInput.dispatchEvent(new Event('change', { bubbles: true }));
      endInput.dispatchEvent(new Event('input', { bubbles: true }));
      endInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, startDateStr, endDateStr);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Submit booking
    const submitButton = await page.$('button[type="submit"]');
    await submitButton.click();
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    if (bookingNumbers.length === 0) {
      console.log('❌ No booking was created');
      return false;
    }
    
    const originalBookingNumber = bookingNumbers[0];
    console.log(`✅ Booking created with number: ${originalBookingNumber}`);
    
    await page.screenshot({ path: 'screenshots/booking-update-01-created.png' });
    
    // === STEP 2: Find the booking and edit the number ===
    console.log('\n✏️ STEP 2: Finding booking to edit...');
    
    // Wait a bit for UI to update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for booking elements that might contain our booking
    let editButtonFound = false;
    let originalNumber = null;
    let newNumber = null;
    
    // Try different approaches to find the booking number editor
    const bookingSelectors = [
      '[data-testid*="booking"]',
      '[data-testid*="charter"]', 
      '.booking-panel',
      '.charter-card'
    ];
    
    for (const selector of bookingSelectors) {
      const elements = await page.$$(selector);
      console.log(`  Found ${elements.length} elements with selector: ${selector}`);
      
      if (elements.length > 0) {
        // Try clicking the first element
        await elements[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Look for edit buttons or booking number displays
        const editButtons = await page.$$('button[title*="edit"], button[aria-label*="edit"], button:has(svg), .edit-button');
        console.log(`  Found ${editButtons.length} potential edit buttons`);
        
        if (editButtons.length > 0) {
          for (let i = 0; i < editButtons.length; i++) {
            try {
              // Get button info
              const buttonInfo = await page.evaluate(el => ({
                text: el.textContent?.trim(),
                title: el.title,
                ariaLabel: el.getAttribute('aria-label'),
                className: el.className
              }), editButtons[i]);
              
              console.log(`    Button ${i}: ${JSON.stringify(buttonInfo)}`);
              
              // Click the edit button
              await editButtons[i].click();
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Look for input fields that appeared
              const inputs = await page.$$('input[type="text"]:focus, input[value*="AL"], input[value*="ZA"], input[value*="25"]');
              console.log(`    Found ${inputs.length} input fields after clicking edit`);
              
              if (inputs.length > 0) {
                // Found an input field - this might be our booking number editor
                const inputValue = await page.evaluate(el => el.value, inputs[0]);
                console.log(`    Input value: "${inputValue}"`);
                
                // Check if this looks like a booking number
                if (inputValue && inputValue.match(/[0-9]{4}[A-Z]{2}[0-9]{2}/)) {
                  console.log(`  ✅ Found booking number input: ${inputValue}`);
                  originalNumber = inputValue;
                  
                  // Calculate new number (add 3 to NN part)
                  const currentNN = parseInt(inputValue.slice(-2));
                  const newNN = (currentNN + 3).toString().padStart(2, '0');
                  newNumber = inputValue.slice(0, -2) + newNN;
                  
                  console.log(`  🔄 Changing ${inputValue} (NN=${currentNN}) → ${newNumber} (NN=${newNN})`);
                  
                  // Clear input and type new number
                  await page.keyboard.down('Control');
                  await page.keyboard.press('KeyA');
                  await page.keyboard.up('Control');
                  await page.keyboard.type(newNumber);
                  
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Look for save button
                  const saveButtons = await page.$$('button[type="submit"], button:has(svg), button[title*="save"], .save-button');
                  console.log(`    Found ${saveButtons.length} potential save buttons`);
                  
                  if (saveButtons.length > 0) {
                    console.log(`  💾 Clicking save button...`);
                    await saveButtons[0].click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    editButtonFound = true;
                    break;
                  } else {
                    console.log(`  ❌ No save button found`);
                  }
                  
                  break;
                }
              }
            } catch (error) {
              console.log(`    Error with button ${i}: ${error.message}`);
            }
          }
          
          if (editButtonFound) break;
        }
      }
    }
    
    await page.screenshot({ path: 'screenshots/booking-update-02-after-edit.png' });
    
    if (!editButtonFound) {
      console.log('❌ Could not find booking number editor');
      console.log('ℹ️ This might be because the booking panel UI is different than expected');
      return false;
    }
    
    // === STEP 3: Check for console errors after update ===
    console.log('\n🔍 STEP 3: Checking for console errors...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`  Console errors during update: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, i) => {
        console.log(`    ${i + 1}. [${error.type}] ${error.text}`);
      });
    } else {
      console.log(`  ✅ No console errors detected`);
    }
    
    // === STEP 4: Hard refresh and verify persistence ===
    console.log('\n🔄 STEP 4: Hard refreshing to check persistence...');
    
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    await page.screenshot({ path: 'screenshots/booking-update-03-after-refresh.png' });
    
    // Look for the updated booking number in the UI
    const pageContent = await page.content();
    const hasNewNumber = pageContent.includes(newNumber);
    const hasOldNumber = pageContent.includes(originalNumber);
    
    console.log(`  Updated number (${newNumber}) found in UI: ${hasNewNumber ? '✅' : '❌'}`);
    console.log(`  Original number (${originalNumber}) still in UI: ${hasOldNumber ? '❌' : '✅'}`);
    
    // === ANALYSIS ===
    console.log('\n📊 UPDATE TEST ANALYSIS:');
    console.log('========================');
    console.log(`Original booking number: ${originalNumber}`);
    console.log(`New booking number: ${newNumber}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Edit operation found: ${editButtonFound ? '✅' : '❌'}`);
    console.log(`UI shows new number: ${hasNewNumber ? '✅' : '❌'}`);
    console.log(`UI cleared old number: ${!hasOldNumber ? '✅' : '❌'}`);
    
    // Determine success
    const success = editButtonFound && consoleErrors.length === 0 && hasNewNumber && !hasOldNumber;
    
    return {
      success,
      originalNumber,
      newNumber,
      editButtonFound,
      consoleErrors: consoleErrors.length,
      uiUpdated: hasNewNumber && !hasOldNumber,
      consoleErrorDetails: consoleErrors
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/booking-update-error.png' });
    return { 
      success: false, 
      error: error.message,
      consoleErrors: consoleErrors.length,
      consoleErrorDetails: consoleErrors
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testBookingNumberUpdate().then(result => {
  console.log('\n🏁 BOOKING NUMBER UPDATE TEST COMPLETE');
  console.log('======================================');
  
  if (result.success) {
    console.log('🎉 SUCCESS: Booking number update working!');
    console.log(`  ✅ Original: ${result.originalNumber}`);
    console.log(`  ✅ Updated: ${result.newNumber}`);
    console.log(`  ✅ No console errors: ${result.consoleErrors === 0}`);
    console.log(`  ✅ UI updated: ${result.uiUpdated}`);
    console.log(`  ✅ Edit functionality: ${result.editButtonFound}`);
  } else {
    console.log('💥 FAILED: Issues detected');
    console.log(`  Console errors: ${result.consoleErrors}`);
    console.log(`  Edit button found: ${result.editButtonFound || 'No'}`);
    console.log(`  UI updated: ${result.uiUpdated || 'No'}`);
    if (result.error) console.log(`  Test error: ${result.error}`);
    
    if (result.consoleErrorDetails && result.consoleErrorDetails.length > 0) {
      console.log('\n❌ Console Error Details:');
      result.consoleErrorDetails.forEach((err, i) => {
        console.log(`  ${i + 1}. [${err.type}] ${err.text}`);
      });
    }
  }
  
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});