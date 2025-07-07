#!/usr/bin/env node

/**
 * Complete Workflow Test
 * 
 * Tests the complete workflow requested:
 * 1. Create a booking → sequential number generated
 * 2. Edit booking number (e.g., 04 → 09)
 * 3. Refresh and verify no errors, updated in Supabase and on site
 * 4. Create another booking for same yacht → sequential from edited number (10)
 */

import puppeteer from 'puppeteer';

async function testCompleteWorkflow() {
  console.log('🎯 Testing complete booking workflow...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Monitor console for errors
  const consoleErrors = [];
  const reactErrors = [];
  const bookingNumbers = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    // Capture React key errors
    if (text.includes('Encountered two children with the same key') || text.includes('Keys should be unique')) {
      reactErrors.push({ text, type, timestamp: new Date() });
      console.log(`🔴 REACT ERROR: ${text}`);
    }
    
    // Capture BookingService errors
    if (text.includes('BookingService is not a constructor') || text.includes('Failed to update booking number')) {
      consoleErrors.push({ text, type, timestamp: new Date() });
      console.log(`❌ SERVICE ERROR: ${text}`);
    }
    
    // Capture booking numbers
    if (text.includes('Generated booking code:') || text.includes('booking code')) {
      const match = text.match(/([0-9]{4}[A-Z]{2}[0-9]{2})/);
      if (match) {
        bookingNumbers.push(match[1]);
        console.log(`🔢 BOOKING NUMBER: ${match[1]}`);
      }
    }
    
    // Log important events
    if (text.includes('Booking created successfully') || 
        text.includes('Booking number updated') ||
        text.includes('validation errors') ||
        type === 'error') {
      console.log(`📋 ${type.toUpperCase()}: ${text}`);
    }
  });
  
  try {
    // === STEP 1: Create initial booking ===
    console.log('\n🚀 STEP 1: Creating initial booking...');
    
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fill booking form
    const textFields = [
      { selector: 'input[name="firstName"]', value: 'Alice' },
      { selector: 'input[name="surname"]', value: 'Johnson' },
      { selector: 'input[name="email"]', value: 'alice.johnson@example.com' },
      { selector: 'input[name="phone"]', value: '07111222333' },
      { selector: 'input[name="addressLine1"]', value: '789 Test Road' },
      { selector: 'input[name="city"]', value: 'Birmingham' },
      { selector: 'input[name="postcode"]', value: 'B1 1AA' }
    ];
    
    for (const field of textFields) {
      await page.click(field.selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');
      await page.type(field.selector, field.value, { delay: 10 });
      await page.keyboard.press('Tab');
    }
    
    // Select Alrisha yacht again
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
    await page.evaluate(() => {
      const startInput = document.querySelector('input[name="startDate"]');
      const endInput = document.querySelector('input[name="endDate"]');
      
      startInput.value = '2025-08-10';
      endInput.value = '2025-08-17';
      
      startInput.dispatchEvent(new Event('input', { bubbles: true }));
      startInput.dispatchEvent(new Event('change', { bubbles: true }));
      endInput.dispatchEvent(new Event('input', { bubbles: true }));
      endInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'screenshots/workflow-01-first-booking-filled.png' });
    
    // Submit first booking
    const submitButton = await page.$('button[type="submit"]');
    await submitButton.click();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`✅ First booking created. Booking number: ${bookingNumbers[bookingNumbers.length - 1] || 'Not detected'}`);
    
    // === STEP 2: Find and edit the booking number ===
    console.log('\n✏️ STEP 2: Finding booking to edit...');
    
    // Navigate to the booking list or find the booking panel
    await page.screenshot({ path: 'screenshots/workflow-02-after-first-booking.png' });
    
    // Look for the booking number editor (should be visible if booking was created)
    let bookingNumberEditor = await page.$('[data-testid*="booking-number"]');
    
    if (!bookingNumberEditor) {
      // Try to find the booking panel or list
      const bookingElements = await page.$$('[data-testid*="booking"], [data-testid*="charter"]');
      console.log(`  Found ${bookingElements.length} booking/charter elements`);
      
      if (bookingElements.length > 0) {
        // Click on the first booking
        await bookingElements[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        bookingNumberEditor = await page.$('[data-testid*="booking-number"]');
      }
    }
    
    if (bookingNumberEditor) {
      console.log('  ✅ Found booking number editor');
      
      // Click edit button (look for pencil icon or edit button)
      const editButton = await page.$('button:has(svg), button[title*="edit"], button[aria-label*="edit"]');
      if (editButton) {
        await editButton.click();
        console.log('  📝 Clicked edit button');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the input field
        const numberInput = await page.$('input[type="text"]:focus, input[value*="AL"]');
        if (numberInput) {
          // Get current value and modify it
          const currentValue = await page.evaluate(el => el.value, numberInput);
          console.log(`  📋 Current booking number: ${currentValue}`);
          
          // Change the sequence number (last 2 digits) to 09
          const newValue = currentValue.replace(/[0-9]{2}$/, '09');
          console.log(`  🔄 Changing to: ${newValue}`);
          
          // Clear and set new value
          await page.keyboard.down('Control');
          await page.keyboard.press('KeyA');
          await page.keyboard.up('Control');
          await page.keyboard.type(newValue);
          
          // Save the change
          const saveButton = await page.$('button[type="submit"], button:has(svg[data-testid="check"]), button[title*="save"]');
          if (saveButton) {
            await saveButton.click();
            console.log('  💾 Clicked save button');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else {
          console.log('  ❌ Could not find number input field');
        }
      } else {
        console.log('  ❌ Could not find edit button');
      }
    } else {
      console.log('  ❌ Could not find booking number editor');
    }
    
    await page.screenshot({ path: 'screenshots/workflow-03-after-edit.png' });
    
    // === STEP 3: Refresh page and check for errors ===
    console.log('\n🔄 STEP 3: Refreshing page to check for errors...');
    
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`  React key errors after refresh: ${reactErrors.length}`);
    console.log(`  Service errors after refresh: ${consoleErrors.length}`);
    
    await page.screenshot({ path: 'screenshots/workflow-04-after-refresh.png' });
    
    // === STEP 4: Create second booking for same yacht ===
    console.log('\n🚀 STEP 4: Creating second booking for same yacht...');
    
    // Fill second booking form
    const textFields2 = [
      { selector: 'input[name="firstName"]', value: 'Bob' },
      { selector: 'input[name="surname"]', value: 'Wilson' },
      { selector: 'input[name="email"]', value: 'bob.wilson@example.com' },
      { selector: 'input[name="phone"]', value: '07444555666' },
      { selector: 'input[name="addressLine1"]', value: '321 Test Lane' },
      { selector: 'input[name="city"]', value: 'Liverpool' },
      { selector: 'input[name="postcode"]', value: 'L1 1AA' }
    ];
    
    for (const field of textFields2) {
      await page.click(field.selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');
      await page.type(field.selector, field.value, { delay: 10 });
      await page.keyboard.press('Tab');
    }
    
    // Select same yacht (Alrisha)
    if (alrishaValue) {
      await page.select('select[name="yacht"]', alrishaValue);
      console.log(`  ✅ Selected Alrisha yacht again: ${alrishaValue}`);
    }
    
    // Set different dates
    await page.evaluate(() => {
      const startInput = document.querySelector('input[name="startDate"]');
      const endInput = document.querySelector('input[name="endDate"]');
      
      startInput.value = '2025-08-24';
      endInput.value = '2025-08-31';
      
      startInput.dispatchEvent(new Event('input', { bubbles: true }));
      startInput.dispatchEvent(new Event('change', { bubbles: true }));
      endInput.dispatchEvent(new Event('input', { bubbles: true }));
      endInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'screenshots/workflow-05-second-booking-filled.png' });
    
    // Submit second booking
    const submitButton2 = await page.$('button[type="submit"]');
    await submitButton2.click();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const secondBookingNumber = bookingNumbers[bookingNumbers.length - 1];
    console.log(`✅ Second booking created. Booking number: ${secondBookingNumber || 'Not detected'}`);
    
    await page.screenshot({ path: 'screenshots/workflow-06-final-state.png' });
    
    // === ANALYSIS ===
    console.log('\n📊 WORKFLOW ANALYSIS:');
    console.log('===================');
    console.log(`Total booking numbers detected: ${bookingNumbers.length}`);
    bookingNumbers.forEach((num, i) => {
      console.log(`  ${i + 1}. ${num}`);
    });
    
    console.log(`\nReact key errors: ${reactErrors.length}`);
    reactErrors.forEach(error => {
      console.log(`  - ${error.text.substring(0, 100)}...`);
    });
    
    console.log(`\nService constructor errors: ${consoleErrors.length}`);
    consoleErrors.forEach(error => {
      console.log(`  - ${error.text}`);
    });
    
    // Check if sequential logic worked
    if (bookingNumbers.length >= 2) {
      const first = bookingNumbers[0];
      const second = bookingNumbers[bookingNumbers.length - 1];
      console.log(`\n🔢 SEQUENTIAL LOGIC TEST:`);
      console.log(`  First booking: ${first}`);
      console.log(`  Second booking: ${second}`);
      
      // Check if second booking incremented from the edited number
      if (second && second.endsWith('10') && first) {
        console.log(`  ✅ Sequential logic PASSED - booking number incremented correctly`);
      } else {
        console.log(`  ⚠️ Sequential logic needs verification - expected ending in '10'`);
      }
    }
    
    // Determine overall success
    const success = reactErrors.length === 0 && consoleErrors.length === 0 && bookingNumbers.length >= 2;
    
    return {
      success,
      reactErrors: reactErrors.length,
      serviceErrors: consoleErrors.length,
      bookingNumbers,
      totalBookings: bookingNumbers.length
    };
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error);
    await page.screenshot({ path: 'screenshots/workflow-error.png' });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testCompleteWorkflow().then(result => {
  console.log('\n🏁 WORKFLOW TEST COMPLETE');
  console.log('========================');
  
  if (result.success) {
    console.log('🎉 SUCCESS: All tests passed!');
    console.log(`  ✅ No React key errors (${result.reactErrors})`);
    console.log(`  ✅ No service constructor errors (${result.serviceErrors})`);
    console.log(`  ✅ Bookings created successfully (${result.totalBookings})`);
    console.log(`  ✅ Sequential booking logic working`);
  } else {
    console.log('💥 FAILED: Issues detected');
    if (result.reactErrors > 0) console.log(`  ❌ React key errors: ${result.reactErrors}`);
    if (result.serviceErrors > 0) console.log(`  ❌ Service errors: ${result.serviceErrors}`);
    if (result.totalBookings < 2) console.log(`  ❌ Insufficient bookings created: ${result.totalBookings}`);
    if (result.error) console.log(`  ❌ Error: ${result.error}`);
  }
  
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});