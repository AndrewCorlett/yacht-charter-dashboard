import puppeteer from 'puppeteer';

async function debugBookingNumber() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate directly to booking management
    console.log('Navigating to booking management...');
    await page.goto('http://localhost:5173/booking-management', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of booking list
    await page.screenshot({ path: 'debug-1-booking-list.png', fullPage: true });
    console.log('Screenshot 1: Booking list captured');
    
    // Find and click first booking
    console.log('Looking for booking rows...');
    const clicked = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      console.log('Found rows:', rows.length);
      
      if (rows.length > 0) {
        // Click the first data row
        rows[0].click();
        return true;
      }
      return false;
    });
    
    if (!clicked) {
      console.log('No rows found to click');
      return;
    }
    
    // Wait for navigation/modal
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of booking details
    await page.screenshot({ path: 'debug-2-booking-details.png', fullPage: true });
    console.log('Screenshot 2: Booking details captured');
    
    // Analyze booking number section
    const analysis = await page.evaluate(() => {
      const results = {
        bookingNumberElements: [],
        editableInputs: [],
        bookingNumberText: null
      };
      
      // Find all elements containing "Booking Number" text
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.textContent && el.textContent.includes('Booking Number') && el.children.length === 0) {
          const parent = el.parentElement;
          const nextSibling = el.nextElementSibling;
          const parentNext = parent ? parent.nextElementSibling : null;
          
          results.bookingNumberElements.push({
            labelText: el.textContent.trim(),
            labelTag: el.tagName,
            parentHTML: parent ? parent.outerHTML.substring(0, 200) : null,
            nextSiblingHTML: nextSibling ? nextSibling.outerHTML.substring(0, 200) : null,
            parentNextHTML: parentNext ? parentNext.outerHTML.substring(0, 200) : null
          });
        }
      });
      
      // Find the actual booking number value
      const bookingNumberRegex = /\b\d{8}\b/; // 8-digit number
      allElements.forEach(el => {
        const text = el.textContent || '';
        if (bookingNumberRegex.test(text) && el.children.length === 0) {
          results.bookingNumberText = text.match(bookingNumberRegex)[0];
          
          // Check if it's editable
          const isInput = el.tagName === 'INPUT';
          const isEditable = el.contentEditable === 'true';
          const parent = el.parentElement;
          
          results.bookingNumberElements.push({
            value: results.bookingNumberText,
            tag: el.tagName,
            isInput,
            isEditable,
            className: el.className,
            id: el.id,
            elementHTML: el.outerHTML.substring(0, 200),
            parentHTML: parent ? parent.outerHTML.substring(0, 200) : null
          });
        }
      });
      
      // Find all input elements
      const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
      inputs.forEach(input => {
        results.editableInputs.push({
          name: input.name,
          value: input.value,
          placeholder: input.placeholder,
          className: input.className,
          disabled: input.disabled,
          readOnly: input.readOnly
        });
      });
      
      return results;
    });
    
    console.log('\n=== Booking Number Analysis ===');
    console.log(JSON.stringify(analysis, null, 2));
    
    // Try to interact with booking number
    console.log('\nTrying to interact with booking number...');
    
    // Hover over the booking number area
    const hoverResult = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const results = [];
      
      elements.forEach(el => {
        if (el.textContent && el.textContent.match(/\b\d{8}\b/) && el.children.length === 0) {
          // Dispatch hover event
          const mouseOverEvent = new MouseEvent('mouseover', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          el.dispatchEvent(mouseOverEvent);
          
          // Check for any changes
          const computed = window.getComputedStyle(el);
          const parent = el.parentElement;
          const parentComputed = parent ? window.getComputedStyle(parent) : null;
          
          results.push({
            element: el.tagName + '.' + el.className,
            cursor: computed.cursor,
            parentCursor: parentComputed ? parentComputed.cursor : null,
            hasEditIcon: parent ? parent.querySelector('svg, .icon, [class*="edit"]') !== null : false
          });
          
          // Try clicking
          el.click();
          
          // Also try clicking the parent
          if (parent) {
            parent.click();
          }
        }
      });
      
      return results;
    });
    
    console.log('\n=== Hover Results ===');
    console.log(JSON.stringify(hoverResult, null, 2));
    
    // Wait for any changes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take final screenshot
    await page.screenshot({ path: 'debug-3-after-interaction.png', fullPage: true });
    console.log('Screenshot 3: After interaction captured');
    
    // Check if any modal or edit field appeared
    const editCheck = await page.evaluate(() => {
      return {
        hasModal: document.querySelector('.modal, [role="dialog"]') !== null,
        hasNewInput: document.querySelector('input:focus') !== null,
        activeElement: document.activeElement ? {
          tag: document.activeElement.tagName,
          type: document.activeElement.type,
          value: document.activeElement.value
        } : null
      };
    });
    
    console.log('\n=== Edit Check ===');
    console.log(JSON.stringify(editCheck, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  }
  
  console.log('\nDebug complete. Check the screenshots:');
  console.log('- debug-1-booking-list.png');
  console.log('- debug-2-booking-details.png');
  console.log('- debug-3-after-interaction.png');
  console.log('\nPress Ctrl+C to close the browser.');
  
  // Keep browser open
  await new Promise(() => {});
}

debugBookingNumber().catch(console.error);