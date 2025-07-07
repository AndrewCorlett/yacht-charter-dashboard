#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBookingCardEdit() {
  console.log('🚀 Starting booking card edit test...');
  
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
    
    // Look for booking cards (the ones we saw in the previous test)
    console.log('🔍 Looking for booking cards...');
    
    const bookingCards = await page.$$('button.flex-shrink-0.w-48.h-20');
    console.log(`📋 Found ${bookingCards.length} booking cards`);
    
    if (bookingCards.length > 0) {
      // Get the text content of the first booking card
      const firstCardText = await bookingCards[0].evaluate(el => el.textContent);
      console.log(`🎯 First booking card text: "${firstCardText}"`);
      
      console.log('🔘 Clicking on first booking card...');
      await bookingCards[0].click();
      await sleep(3000);
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'after-card-click.png', fullPage: true });
      console.log('📸 Screenshot after card click saved as after-card-click.png');
      
      // Look for booking number input field
      console.log('🔍 Looking for booking number input field...');
      
      const inputs = await page.$$('input');
      console.log(`📝 Found ${inputs.length} input fields`);
      
      let bookingNumberInput = null;
      let originalValue = '';
      
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const type = await input.evaluate(el => el.type);
        const name = await input.evaluate(el => el.name);
        const value = await input.evaluate(el => el.value);
        const placeholder = await input.evaluate(el => el.placeholder);
        const id = await input.evaluate(el => el.id);
        
        console.log(`  Input ${i + 1}: type=${type}, name=${name}, value="${value}", placeholder="${placeholder}", id=${id}`);
        
        // Check if this looks like a booking number field
        if ((name && name.toLowerCase().includes('booking')) || 
            (placeholder && placeholder.toLowerCase().includes('booking')) ||
            (id && id.toLowerCase().includes('booking'))) {
          
          console.log(`🎯 Found booking number field: name="${name}", placeholder="${placeholder}", id="${id}"`);
          bookingNumberInput = input;
          originalValue = value;
          break;
        }
      }
      
      if (bookingNumberInput && originalValue) {
        console.log(`📋 Original booking number: "${originalValue}"`);
        
        // Create new value by incrementing last two digits
        let newValue = originalValue;
        if (originalValue.length >= 2) {
          const lastTwoChars = originalValue.slice(-2);
          if (/^\d{2}$/.test(lastTwoChars)) {
            const lastTwoNum = parseInt(lastTwoChars, 10);
            const newLastTwo = String(lastTwoNum + 2).padStart(2, '0');
            newValue = originalValue.slice(0, -2) + newLastTwo;
          } else {
            // If last two aren't digits, just append "11"
            newValue = originalValue + '11';
          }
        } else {
          newValue = originalValue + '11';
        }
        
        console.log(`📝 Changing booking number from "${originalValue}" to "${newValue}"`);
        
        // Clear and enter new value
        await bookingNumberInput.click();
        await bookingNumberInput.evaluate(el => el.select());
        await page.keyboard.type(newValue);
        
        await sleep(1000);
        
        // Take screenshot after editing
        await page.screenshot({ path: 'after-edit.png', fullPage: true });
        console.log('📸 Screenshot after editing saved as after-edit.png');
        
        // Look for save button
        console.log('🔍 Looking for save button...');
        
        const buttons = await page.$$('button');
        let saveButton = null;
        
        for (const button of buttons) {
          const text = await button.evaluate(el => el.textContent);
          if (text && (text.toLowerCase().includes('save') || 
                      text.toLowerCase().includes('update') ||
                      text.toLowerCase().includes('confirm'))) {
            console.log(`💾 Found save button: "${text}"`);
            saveButton = button;
            break;
          }
        }
        
        if (saveButton) {
          console.log('🔘 Clicking save button...');
          
          // Clear existing errors before save
          consoleErrors.length = 0;
          supabaseErrors.length = 0;
          documentStatesErrors.length = 0;
          
          await saveButton.click();
          await sleep(5000); // Wait longer for save operation
          
          // Take screenshot after save
          await page.screenshot({ path: 'after-save.png', fullPage: true });
          console.log('📸 Screenshot after save saved as after-save.png');
          
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
          
          // Hard refresh to test persistence
          console.log('🔄 Hard refreshing page to test persistence...');
          await page.reload({ waitUntil: 'networkidle2' });
          await sleep(5000);
          
          // Take screenshot after refresh
          await page.screenshot({ path: 'after-refresh.png', fullPage: true });
          console.log('📸 Screenshot after refresh saved as after-refresh.png');
          
          // Try to navigate back to the same booking to verify persistence
          console.log('🔍 Checking if booking number change persisted...');
          
          // Click on the same booking card again
          const refreshedCards = await page.$$('button.flex-shrink-0.w-48.h-20');
          if (refreshedCards.length > 0) {
            await refreshedCards[0].click();
            await sleep(2000);
            
            // Check the booking number field again
            const refreshedInputs = await page.$$('input');
            for (const input of refreshedInputs) {
              const name = await input.evaluate(el => el.name);
              const value = await input.evaluate(el => el.value);
              const placeholder = await input.evaluate(el => el.placeholder);
              const id = await input.evaluate(el => el.id);
              
              if ((name && name.toLowerCase().includes('booking')) || 
                  (placeholder && placeholder.toLowerCase().includes('booking')) ||
                  (id && id.toLowerCase().includes('booking'))) {
                
                console.log(`📋 Booking number after refresh: "${value}"`);
                
                if (value === newValue) {
                  console.log('✅ Booking number change PERSISTED successfully!');
                } else {
                  console.log('❌ Booking number change did NOT persist');
                }
                break;
              }
            }
          }
          
          // Final screenshot
          await page.screenshot({ path: 'final-verification.png', fullPage: true });
          console.log('📸 Final verification screenshot saved as final-verification.png');
          
        } else {
          console.log('❌ No save button found');
        }
        
      } else {
        console.log('❌ No booking number field found');
        
        // Show all input fields for debugging
        console.log('🔍 All input fields found:');
        const allInputs = await page.$$('input');
        for (let i = 0; i < allInputs.length; i++) {
          const input = allInputs[i];
          const type = await input.evaluate(el => el.type);
          const name = await input.evaluate(el => el.name);
          const value = await input.evaluate(el => el.value);
          const placeholder = await input.evaluate(el => el.placeholder);
          const id = await input.evaluate(el => el.id);
          
          console.log(`  Input ${i + 1}: type=${type}, name=${name}, value="${value}", placeholder="${placeholder}", id=${id}`);
        }
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
    console.log('  - after-card-click.png');
    console.log('  - after-edit.png');
    console.log('  - after-save.png');
    console.log('  - after-refresh.png');
    console.log('  - final-verification.png');
    
    // Keep browser open for 30 seconds for manual inspection
    console.log('🔍 Keeping browser open for 30 seconds for manual inspection...');
    await sleep(30000);
    
    await browser.close();
  }
}

// Run the test
testBookingCardEdit().catch(console.error);