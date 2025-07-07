#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBookingNumberHoverEdit() {
  console.log('🚀 Starting booking number hover edit test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Set up console logging to capture errors
    const consoleErrors = [];
    const supabaseErrors = [];
    const documentStatesErrors = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log('❌ Console Error:', text);
        
        // Check for specific errors
        if (text.toLowerCase().includes('documentstates')) {
          documentStatesErrors.push(text);
          console.log('🚨 DOCUMENTSTATES ERROR DETECTED!');
        }
        if (text.toLowerCase().includes('supabase')) {
          supabaseErrors.push(text);
          console.log('🚨 SUPABASE ERROR DETECTED!');
        }
      } else if (msg.type() === 'warn') {
        console.log('⚠️  Console Warning:', text);
      }
    });
    
    // Set up error handling
    page.on('pageerror', (error) => {
      console.log('❌ Page Error:', error.message);
      consoleErrors.push(error.message);
    });
    
    // Navigate to the dashboard
    console.log('📍 Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    await sleep(3000);
    
    // Look for booking cards
    console.log('🔍 Looking for booking cards...');
    const bookingCards = await page.$$('button.flex-shrink-0.w-48.h-20');
    console.log(`📋 Found ${bookingCards.length} booking cards`);
    
    if (bookingCards.length > 0) {
      console.log('🔘 Clicking on first booking card...');
      await bookingCards[0].click();
      await sleep(3000);
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'booking-panel-opened.png', fullPage: true });
      console.log('📸 Screenshot after card click saved as booking-panel-opened.png');
      
      // Look for the booking number display (should be "BK202507565" or similar)
      console.log('🔍 Looking for booking number display...');
      
      // Try to find the booking number text
      const bookingNumberElements = await page.$$eval('*', elements => {
        return elements
          .filter(el => el.textContent && el.textContent.includes('BK'))
          .map(el => ({
            tag: el.tagName.toLowerCase(),
            text: el.textContent.trim(),
            className: el.className,
            id: el.id
          }));
      });
      
      console.log('📋 Found elements with BK:');
      bookingNumberElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.tag}: "${el.text}" (class: ${el.className})`);
      });
      
      // Look for the booking number span with font-mono class
      console.log('🔍 Looking for booking number span...');
      
      const bookingNumberSpan = await page.$('span.font-mono');
      if (bookingNumberSpan) {
        const bookingNumberText = await bookingNumberSpan.evaluate(el => el.textContent);
        console.log(`📋 Found booking number: "${bookingNumberText}"`);
        
        // Hover over the booking number to reveal the edit button
        console.log('🖱️  Hovering over booking number...');
        await bookingNumberSpan.hover();
        await sleep(1000);
        
        // Take screenshot after hover
        await page.screenshot({ path: 'after-hover.png', fullPage: true });
        console.log('📸 Screenshot after hover saved as after-hover.png');
        
        // Look for the edit button that should appear on hover
        console.log('🔍 Looking for edit button...');
        
        // Look for the edit button (should have an SVG with path for pencil icon)
        const editButton = await page.$('button[title="Edit booking number"]');
        if (editButton) {
          console.log('✅ Found edit button!');
          
          // Click the edit button
          console.log('🔘 Clicking edit button...');
          await editButton.click();
          await sleep(1000);
          
          // Take screenshot after clicking edit
          await page.screenshot({ path: 'after-edit-click.png', fullPage: true });
          console.log('📸 Screenshot after edit click saved as after-edit-click.png');
          
          // Look for the input field that should appear
          console.log('🔍 Looking for booking number input field...');
          
          const bookingNumberInput = await page.$('input.font-mono');
          if (bookingNumberInput) {
            console.log('✅ Found booking number input field!');
            
            // Get current value
            const currentValue = await bookingNumberInput.evaluate(el => el.value);
            console.log(`📋 Current booking number value: "${currentValue}"`);
            
            // Create new value by incrementing last two digits
            let newValue = currentValue;
            if (currentValue.length >= 2) {
              const lastTwoChars = currentValue.slice(-2);
              if (/^\d{2}$/.test(lastTwoChars)) {
                const lastTwoNum = parseInt(lastTwoChars, 10);
                const newLastTwo = String(lastTwoNum + 2).padStart(2, '0');
                newValue = currentValue.slice(0, -2) + newLastTwo;
              }
            }
            
            console.log(`📝 Changing booking number from "${currentValue}" to "${newValue}"`);
            
            // Clear and enter new value
            await bookingNumberInput.click();
            await bookingNumberInput.evaluate(el => el.select());
            await page.keyboard.type(newValue);
            
            await sleep(1000);
            
            // Take screenshot after editing
            await page.screenshot({ path: 'after-number-edit.png', fullPage: true });
            console.log('📸 Screenshot after number edit saved as after-number-edit.png');
            
            // Look for the save button (green checkmark)
            console.log('🔍 Looking for save button...');
            
            const saveButton = await page.$('button[title="Save"]');
            if (saveButton) {
              console.log('💾 Found save button!');
              
              // Clear existing errors before save
              consoleErrors.length = 0;
              supabaseErrors.length = 0;
              documentStatesErrors.length = 0;
              
              console.log('🔘 Clicking save button...');
              await saveButton.click();
              await sleep(5000); // Wait longer for save operation
              
              // Take screenshot after save
              await page.screenshot({ path: 'after-save-operation.png', fullPage: true });
              console.log('📸 Screenshot after save operation saved as after-save-operation.png');
              
              // Check for errors after save
              console.log('🔍 Checking for errors after save...');
              
              if (consoleErrors.length > 0) {
                console.log('❌ Console errors detected:');
                consoleErrors.forEach((error, index) => {
                  console.log(`  ${index + 1}. ${error}`);
                });
              } else {
                console.log('✅ No console errors detected after save!');
              }
              
              if (documentStatesErrors.length > 0) {
                console.log('🚨 DOCUMENTSTATES ERRORS FOUND - FIX NEEDED!');
                documentStatesErrors.forEach((error, index) => {
                  console.log(`  ${index + 1}. ${error}`);
                });
              } else {
                console.log('✅ No documentStates errors found - FIX WORKING!');
              }
              
              if (supabaseErrors.length > 0) {
                console.log('🚨 SUPABASE ERRORS FOUND:');
                supabaseErrors.forEach((error, index) => {
                  console.log(`  ${index + 1}. ${error}`);
                });
              } else {
                console.log('✅ No Supabase errors found');
              }
              
              // Check if the booking number display updated
              console.log('🔍 Checking if booking number display updated...');
              
              const updatedBookingNumberSpan = await page.$('span.font-mono');
              if (updatedBookingNumberSpan) {
                const updatedText = await updatedBookingNumberSpan.evaluate(el => el.textContent);
                console.log(`📋 Updated booking number display: "${updatedText}"`);
                
                if (updatedText === newValue) {
                  console.log('✅ Booking number display updated successfully!');
                } else {
                  console.log('❌ Booking number display did not update');
                }
              }
              
              // Hard refresh to test persistence
              console.log('🔄 Hard refreshing page to test persistence...');
              await page.reload({ waitUntil: 'networkidle2' });
              await sleep(5000);
              
              // Navigate back to booking and verify persistence
              console.log('🔍 Navigating back to booking to verify persistence...');
              
              const refreshedCards = await page.$$('button.flex-shrink-0.w-48.h-20');
              if (refreshedCards.length > 0) {
                await refreshedCards[0].click();
                await sleep(3000);
                
                // Check booking number after refresh
                const persistedBookingNumberSpan = await page.$('span.font-mono');
                if (persistedBookingNumberSpan) {
                  const persistedText = await persistedBookingNumberSpan.evaluate(el => el.textContent);
                  console.log(`📋 Booking number after refresh: "${persistedText}"`);
                  
                  if (persistedText === newValue) {
                    console.log('✅ Booking number change PERSISTED successfully!');
                  } else {
                    console.log('❌ Booking number change did NOT persist');
                  }
                }
              }
              
              // Final screenshot
              await page.screenshot({ path: 'final-persistence-check.png', fullPage: true });
              console.log('📸 Final persistence check screenshot saved as final-persistence-check.png');
              
            } else {
              console.log('❌ Save button not found');
            }
            
          } else {
            console.log('❌ Booking number input field not found');
          }
          
        } else {
          console.log('❌ Edit button not found');
        }
        
      } else {
        console.log('❌ Booking number span not found');
      }
      
    } else {
      console.log('❌ No booking cards found');
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  } finally {
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`  - Total console errors: ${consoleErrors.length}`);
    console.log(`  - DocumentStates errors: ${documentStatesErrors.length}`);
    console.log(`  - Supabase errors: ${supabaseErrors.length}`);
    
    if (documentStatesErrors.length === 0) {
      console.log('✅ SUCCESS: No documentStates errors detected - your fix is working!');
    } else {
      console.log('❌ FAILURE: DocumentStates errors still occurring - fix needs more work');
    }
    
    console.log('\n🏁 Test completed. Screenshots saved:');
    console.log('  - booking-panel-opened.png');
    console.log('  - after-hover.png');
    console.log('  - after-edit-click.png');
    console.log('  - after-number-edit.png');
    console.log('  - after-save-operation.png');
    console.log('  - final-persistence-check.png');
    
    // Keep browser open for 30 seconds for manual inspection
    console.log('🔍 Keeping browser open for 30 seconds for manual inspection...');
    await sleep(30000);
    
    await browser.close();
  }
}

// Run the test
testBookingNumberHoverEdit().catch(console.error);