import puppeteer from 'puppeteer';

async function testBookingNumberEdit() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        time: new Date().toISOString()
      });
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push({
      text: error.toString(),
      time: new Date().toISOString()
    });
  });

  try {
    console.log('1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('2. Going to Booking Management section...');
    // Click on Booking Management
    await page.waitForSelector('nav', { timeout: 5000 });
    
    // Try to find and click the booking link
    const bookingLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.find(link => 
        link.href.includes('/bookings') || 
        link.textContent.includes('Booking')
      );
    });
    
    if (bookingLink && bookingLink.asElement()) {
      await bookingLink.asElement().click();
    } else {
      // Fallback: navigate directly
      await page.goto('http://localhost:5173/bookings', { waitUntil: 'networkidle0' });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('3. Creating a new booking...');
    // Click "New Booking" button
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('New Booking')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fill in booking details
    console.log('   - Selecting yacht: Disk Drive');
    // Wait for the form to be ready
    await page.waitForSelector('select', { timeout: 5000 });
    
    // Find and select yacht
    const yachtSelect = await page.evaluateHandle(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      return selects.find(s => 
        s.name === 'yacht_id' || 
        s.id === 'yacht_id' ||
        s.getAttribute('data-field') === 'yacht_id' ||
        Array.from(s.options).some(opt => opt.text.includes('yacht'))
      );
    });
    
    if (yachtSelect && yachtSelect.asElement()) {
      await yachtSelect.asElement().select('disk-drive');
    } else {
      // Try alternative approach
      await page.evaluate(() => {
        const select = document.querySelector('select');
        if (select) {
          const option = Array.from(select.options).find(opt => 
            opt.value === 'disk-drive' || opt.text.includes('Disk Drive')
          );
          if (option) {
            select.value = option.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
    }
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('   - Selecting charter type: Bareboat');
    // Find and select charter type
    const charterSelect = await page.evaluateHandle(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      return selects.find(s => 
        s.name === 'charter_type' || 
        s.id === 'charter_type' ||
        s.getAttribute('data-field') === 'charter_type' ||
        Array.from(s.options).some(opt => opt.text.toLowerCase().includes('bareboat'))
      );
    });
    
    if (charterSelect && charterSelect.asElement()) {
      await charterSelect.asElement().select('bareboat');
    } else {
      // Try alternative approach
      await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        for (const select of selects) {
          const option = Array.from(select.options).find(opt => 
            opt.value === 'bareboat' || opt.text.toLowerCase().includes('bareboat')
          );
          if (option) {
            select.value = option.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      });
    }
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('   - Setting dates in January 2025');
    // Find date inputs
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs.length >= 2) {
      // Clear and type start date
      await dateInputs[0].click({ clickCount: 3 });
      await dateInputs[0].type('2025-01-15');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear and type end date
      await dateInputs[1].click({ clickCount: 3 });
      await dateInputs[1].type('2025-01-22');
    }
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('   - Entering customer details');
    // Find customer name input
    const nameInput = await page.evaluateHandle(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      return inputs.find(i => 
        i.name === 'customer_name' ||
        i.placeholder?.toLowerCase().includes('customer') ||
        i.placeholder?.toLowerCase().includes('name')
      );
    });
    
    if (nameInput && nameInput.asElement()) {
      await nameInput.asElement().type('Test Customer');
    }
    
    // Find email input
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.type('test@example.com');
    }
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('4. Saving the booking...');
    // Find and click Save button
    const saveButtons = await page.$$('button');
    for (const button of saveButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Save') || text.includes('Create')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('5. Looking for the booking number...');
    // Get the booking number from the list or details
    let originalBookingNumber = null;
    
    // Check if we're redirected to the booking details
    const bookingNumberElement = await page.$('[data-booking-number], .booking-number');
    if (bookingNumberElement) {
      originalBookingNumber = await page.evaluate(el => el.textContent, bookingNumberElement);
    } else {
      // Look for booking number in the list
      const rows = await page.$$('tr');
      for (const row of rows) {
        const text = await page.evaluate(el => el.textContent, row);
        if (text.includes('Test Customer')) {
          // Extract booking number from the row
          const match = text.match(/\d{8}/);
          if (match) {
            originalBookingNumber = match[0];
          }
          break;
        }
      }
    }

    console.log(`   Original booking number: ${originalBookingNumber}`);

    console.log('6. Clicking on the booking to view details...');
    // If not already in details view, click on the booking
    if (!await page.$('.booking-details')) {
      const bookingRows = await page.$$('tr');
      for (const row of bookingRows) {
        const text = await page.evaluate(el => el.textContent, row);
        if (text.includes('Test Customer')) {
          await row.click();
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('7. Finding the booking number and clicking edit icon...');
    // Look for edit icon next to booking number
    const editClicked = await page.evaluate((bookingNum) => {
      // Find all elements containing the booking number
      const elements = Array.from(document.querySelectorAll('*'));
      
      for (const el of elements) {
        // Skip if element has children (to avoid parent containers)
        if (el.children.length > 0) continue;
        
        if (el.textContent && el.textContent.trim() === bookingNum) {
          // Look for nearby edit button/icon
          let sibling = el.nextElementSibling;
          let parent = el.parentElement;
          
          // Check siblings
          while (sibling) {
            if (sibling.tagName === 'BUTTON' || sibling.querySelector('button')) {
              const btn = sibling.tagName === 'BUTTON' ? sibling : sibling.querySelector('button');
              btn.click();
              return true;
            }
            // Check for SVG icons
            if (sibling.querySelector('svg')) {
              sibling.click();
              return true;
            }
            sibling = sibling.nextElementSibling;
          }
          
          // Check parent for edit button
          if (parent) {
            const buttons = parent.querySelectorAll('button');
            for (const btn of buttons) {
              if (btn.textContent.includes('Edit') || btn.querySelector('svg')) {
                btn.click();
                return true;
              }
            }
          }
        }
      }
      
      // Fallback: look for any edit button/icon
      const allButtons = document.querySelectorAll('button');
      for (const btn of allButtons) {
        if (btn.getAttribute('aria-label')?.includes('Edit') || 
            btn.title?.includes('Edit') ||
            btn.querySelector('svg')) {
          btn.click();
          return true;
        }
      }
      
      return false;
    }, originalBookingNumber);
    
    if (!editClicked) {
      console.log('   WARNING: Could not find edit button');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('8. Getting current NN value...');
    
    // If we couldn't find the booking number, try to extract it from the page
    if (!originalBookingNumber) {
      // Look for any 8-digit number on the page
      const pageText = await page.evaluate(() => document.body.textContent);
      const match = pageText.match(/\d{8}/);
      if (match) {
        originalBookingNumber = match[0];
        console.log(`   Found booking number on page: ${originalBookingNumber}`);
      }
    }
    
    if (!originalBookingNumber) {
      console.log('   ERROR: Could not find booking number');
      throw new Error('Could not find booking number');
    }
    
    // Extract NN from booking number (last 2 digits)
    const nn = originalBookingNumber.slice(-2);
    const nnNumber = parseInt(nn, 10);
    console.log(`   Current NN value: ${nn}`);

    console.log('9. Adding 5 to NN number...');
    const newNn = (nnNumber + 5).toString().padStart(2, '0');
    const newBookingNumber = originalBookingNumber.slice(0, -2) + newNn;
    console.log(`   New booking number will be: ${newBookingNumber}`);

    // Find the input field and update it
    const inputUpdated = await page.evaluate((oldNum, newNum) => {
      // Look for input field with the booking number
      const inputs = Array.from(document.querySelectorAll('input'));
      
      for (const input of inputs) {
        if (input.value === oldNum || input.value.includes(oldNum)) {
          // Clear and set new value
          input.focus();
          input.select();
          input.value = newNum;
          
          // Trigger change events
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      
      // If no input found, check if we're in inline edit mode
      const editableElements = document.querySelectorAll('[contenteditable="true"]');
      for (const el of editableElements) {
        if (el.textContent === oldNum) {
          el.textContent = newNum;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('blur', { bubbles: true }));
          return true;
        }
      }
      
      return false;
    }, originalBookingNumber, newBookingNumber);
    
    if (!inputUpdated) {
      console.log('   WARNING: Could not find input field to update');
      // Try keyboard approach as fallback
      await page.keyboard.press('Tab');
      await page.keyboard.type(newBookingNumber);
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('10. Saving the edited booking number...');
    // Click save/confirm button
    const confirmButtons = await page.$$('button');
    for (const button of confirmButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Save') || text.includes('Confirm') || text.includes('✓')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('11. Checking console for errors...');
    console.log(`   Console errors so far: ${consoleErrors.length}`);

    console.log('12. Refreshing the page...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('13. Verifying the booking number persists...');
    // Wait for the page to fully load after refresh
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Look for the booking number in various ways
    let persistedBookingNumber = null;
    
    // Method 1: Check page content
    const pageContent = await page.content();
    
    // Method 2: Look for the booking in the list or details
    const foundNumbers = await page.evaluate(() => {
      const text = document.body.textContent;
      const matches = text.match(/\d{8}/g);
      return matches || [];
    });
    
    console.log(`   Found numbers on page: ${foundNumbers.join(', ')}`);
    
    if (pageContent.includes(newBookingNumber) || foundNumbers.includes(newBookingNumber)) {
      persistedBookingNumber = newBookingNumber;
      console.log(`   ✓ Booking number persisted: ${persistedBookingNumber}`);
    } else if (pageContent.includes(originalBookingNumber) || foundNumbers.includes(originalBookingNumber)) {
      persistedBookingNumber = originalBookingNumber;
      console.log(`   ✗ Booking number reverted to: ${persistedBookingNumber}`);
    } else {
      console.log('   ✗ Could not find booking number after refresh');
      
      // Try to navigate back to the booking
      const bookingRow = await page.evaluate((customerName) => {
        const rows = Array.from(document.querySelectorAll('tr'));
        for (const row of rows) {
          if (row.textContent.includes(customerName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, 'Test Customer');
      
      if (bookingRow) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const detailsNumbers = await page.evaluate(() => {
          const text = document.body.textContent;
          const matches = text.match(/\d{8}/g);
          return matches || [];
        });
        console.log(`   Numbers in booking details: ${detailsNumbers.join(', ')}`);
        
        if (detailsNumbers.includes(newBookingNumber)) {
          persistedBookingNumber = newBookingNumber;
          console.log(`   ✓ Found persisted booking number in details: ${persistedBookingNumber}`);
        } else if (detailsNumbers.includes(originalBookingNumber)) {
          persistedBookingNumber = originalBookingNumber;
          console.log(`   ✗ Booking number reverted in details: ${persistedBookingNumber}`);
        }
      }
    }

    // Return results
    const results = {
      originalBookingNumber,
      editedBookingNumber: newBookingNumber,
      persistedAfterRefresh: persistedBookingNumber === newBookingNumber,
      actualPersistedNumber: persistedBookingNumber,
      consoleErrors,
      success: persistedBookingNumber === newBookingNumber
    };

    console.log('\n=== TEST RESULTS ===');
    console.log(JSON.stringify(results, null, 2));

    return results;

  } catch (error) {
    console.error('Test failed:', error);
    return {
      error: error.message,
      consoleErrors,
      success: false
    };
  } finally {
    console.log('\nTest completed. Browser will remain open for inspection.');
    // Keep browser open for manual inspection
    // await browser.close();
  }
}

// Run the test
testBookingNumberEdit().then(results => {
  console.log('\nFinal results:', results);
  if (!results.success) {
    process.exit(1);
  }
});