import puppeteer from 'puppeteer';
import fs from 'fs/promises';

// Helper function for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function debugBookingNumberEditor() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for the app to load - use a more specific selector
    await page.waitForSelector('[data-testid="sidebar"], .sidebar, nav', { timeout: 10000 });
    await delay(2000); // Give React time to render
    
    console.log('Looking for Booking Management link...');
    // Try to navigate to Booking Management
    const bookingLink = await page.$('a[href="/booking-management"]');
    
    if (bookingLink) {
      await bookingLink.click();
    } else {
      // Try clicking by text
      const clicked = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const bookingLink = links.find(link => 
          link.textContent.includes('Booking Management') || 
          link.textContent.includes('Bookings')
        );
        if (bookingLink) {
          bookingLink.click();
          return true;
        }
        return false;
      });
      
      if (!clicked) {
        console.log('Could not find Booking Management link, navigating directly...');
        await page.goto('http://localhost:5173/booking-management', { waitUntil: 'networkidle0' });
      }
    }
    
    // Wait for navigation
    await delay(2000);
    
    // Wait for booking list to load
    await page.waitForSelector('table, .booking-list, [data-testid="booking-list"]', { timeout: 10000 });
    
    // Take screenshot of booking list
    await page.screenshot({ path: 'debug-booking-list.png', fullPage: true });
    console.log('Captured booking list screenshot');
    
    // Find and click on a booking (preferably the one with number 20202021)
    console.log('Looking for bookings...');
    
    // First, let's see what's on the page
    const tableContent = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      const rows = document.querySelectorAll('tbody tr, tr[role="row"]');
      return {
        tableCount: tables.length,
        rowCount: rows.length,
        firstRowText: rows[0]?.textContent?.substring(0, 100),
        hasBookingNumber: Array.from(rows).some(row => row.textContent?.includes('20202021'))
      };
    });
    console.log('Table content:', tableContent);
    
    // Try to find and click a booking row
    const clicked = await page.evaluate(() => {
      // Find rows that have booking data
      const rows = Array.from(document.querySelectorAll('tbody tr, tr[role="row"]'));
      const dataRow = rows.find(row => {
        const text = row.textContent || '';
        // Look for rows with booking numbers or dates
        return text.includes('202') || text.includes('2025') || text.includes('Booking');
      });
      
      if (dataRow) {
        // Try to find a clickable element within the row
        const clickable = dataRow.querySelector('a, button') || dataRow;
        clickable.click();
        return true;
      }
      
      // If no specific booking row found, click the first non-header row
      const firstDataRow = rows.find(row => !row.querySelector('th'));
      if (firstDataRow) {
        firstDataRow.click();
        return true;
      }
      
      return false;
    });
    
    if (!clicked) {
      console.log('Could not find a booking row to click');
      throw new Error('No booking rows found');
    }
    
    // Wait for booking details to load
    await page.waitForSelector('.booking-details, .booking-form, [data-testid="booking-details"]', { timeout: 10000 });
    await delay(2000); // Give time for any animations
    
    // Take screenshot of booking details
    await page.screenshot({ path: 'debug-booking-details-full.png', fullPage: true });
    console.log('Captured booking details screenshot');
    
    // Focus on booking number section
    const bookingNumberSection = await page.$('.booking-number, [data-testid="booking-number"], .field-booking-number');
    if (bookingNumberSection) {
      await bookingNumberSection.screenshot({ path: 'debug-booking-number-section.png' });
      console.log('Captured booking number section screenshot');
    }
    
    // Check DOM structure and BookingNumberEditor presence
    const domAnalysis = await page.evaluate(() => {
      const results = {
        bookingNumberEditor: {
          exists: false,
          selector: null,
          html: null
        },
        bookingNumberDisplay: {
          selectors: [],
          elements: []
        },
        editableElements: [],
        consoleErrors: []
      };
      
      // Check for BookingNumberEditor component
      const editorSelectors = [
        '[data-testid="booking-number-editor"]',
        '.booking-number-editor',
        '[class*="BookingNumberEditor"]',
        '.editable-booking-number'
      ];
      
      for (const selector of editorSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          results.bookingNumberEditor.exists = true;
          results.bookingNumberEditor.selector = selector;
          results.bookingNumberEditor.html = element.outerHTML;
          break;
        }
      }
      
      // Find booking number displays
      const numberSelectors = [
        '.booking-number',
        '[data-testid="booking-number"]',
        '.field-booking-number',
        'input[name="bookingNumber"]',
        'label:has-text("Booking Number") + *',
        '*:has-text("Booking Number")'
      ];
      
      numberSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el && el.textContent.includes('202')) {
              results.bookingNumberDisplay.selectors.push(selector);
              results.bookingNumberDisplay.elements.push({
                tagName: el.tagName,
                className: el.className,
                id: el.id,
                textContent: el.textContent.trim(),
                innerHTML: el.innerHTML.substring(0, 200),
                isEditable: el.contentEditable === 'true' || el.tagName === 'INPUT',
                hasClickHandler: typeof el.onclick === 'function',
                parentHTML: el.parentElement ? el.parentElement.outerHTML.substring(0, 200) : null
              });
            }
          });
        } catch (e) {
          // Ignore selector errors
        }
      });
      
      // Check for any editable elements
      const editableInputs = document.querySelectorAll('input[type="text"], [contenteditable="true"]');
      editableInputs.forEach(el => {
        results.editableElements.push({
          tagName: el.tagName,
          name: el.name || '',
          value: el.value || el.textContent,
          placeholder: el.placeholder || '',
          className: el.className
        });
      });
      
      return results;
    });
    
    console.log('\n=== DOM Analysis Results ===');
    console.log(JSON.stringify(domAnalysis, null, 2));
    
    // Check for hover effects on booking number
    console.log('\nChecking hover effects...');
    const hoverResults = await page.evaluate(() => {
      const results = {
        hoverEffects: [],
        clickableElements: []
      };
      
      // Find elements that might respond to hover
      const potentialElements = document.querySelectorAll('*');
      potentialElements.forEach(el => {
        if (el.textContent && el.textContent.includes('202') && el.textContent.length < 50) {
          const computedStyle = window.getComputedStyle(el);
          const cursor = computedStyle.cursor;
          
          if (cursor === 'pointer' || cursor === 'hand') {
            results.clickableElements.push({
              text: el.textContent.trim(),
              cursor: cursor,
              tagName: el.tagName,
              className: el.className
            });
          }
          
          // Trigger hover
          const hoverEvent = new MouseEvent('mouseover', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          el.dispatchEvent(hoverEvent);
          
          // Check if anything changed
          const hoverStyle = window.getComputedStyle(el);
          if (hoverStyle.cursor !== computedStyle.cursor) {
            results.hoverEffects.push({
              element: el.tagName + '.' + el.className,
              beforeCursor: computedStyle.cursor,
              afterCursor: hoverStyle.cursor
            });
          }
        }
      });
      
      return results;
    });
    
    console.log('\n=== Hover Analysis Results ===');
    console.log(JSON.stringify(hoverResults, null, 2));
    
    // Try clicking on booking number text
    console.log('\nAttempting to click on booking number text...');
    const clickResults = await page.evaluate(() => {
      const results = {
        clickAttempts: [],
        clickEvents: []
      };
      
      // Find all elements containing booking number
      const elements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.includes('202') && el.textContent.length < 50
      );
      
      elements.forEach((el, index) => {
        try {
          // Record click attempt
          results.clickAttempts.push({
            index: index,
            text: el.textContent.trim(),
            tagName: el.tagName,
            className: el.className
          });
          
          // Add event listener to capture click
          el.addEventListener('click', (e) => {
            results.clickEvents.push({
              target: e.target.tagName + '.' + e.target.className,
              timestamp: Date.now()
            });
          });
          
          // Trigger click
          el.click();
          
          // Also try dispatching click event
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          el.dispatchEvent(clickEvent);
        } catch (e) {
          results.clickAttempts[index].error = e.message;
        }
      });
      
      return results;
    });
    
    console.log('\n=== Click Results ===');
    console.log(JSON.stringify(clickResults, null, 2));
    
    // Wait a moment to see if anything changes
    await delay(2000);
    
    // Take another screenshot after clicks
    await page.screenshot({ path: 'debug-after-clicks.png', fullPage: true });
    console.log('Captured screenshot after click attempts');
    
    // Check console for errors
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      // Try to capture any React errors
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('React DevTools detected');
      }
      return errors;
    });
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Check for specific BookingNumberEditor implementation
    const componentCheck = await page.evaluate(() => {
      // Check if component is imported/used
      const scripts = Array.from(document.querySelectorAll('script'));
      const hasBookingNumberEditor = scripts.some(script => 
        script.textContent && script.textContent.includes('BookingNumberEditor')
      );
      
      // Check React component tree if possible
      const reactCheck = {
        hasReact: !!window.React,
        hasReactDOM: !!window.ReactDOM,
        components: []
      };
      
      // Try to find React components
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el._reactInternalFiber || el.__reactInternalInstance) {
          const fiber = el._reactInternalFiber || el.__reactInternalInstance;
          if (fiber && fiber.type && fiber.type.name) {
            reactCheck.components.push(fiber.type.name);
          }
        }
      });
      
      return {
        hasBookingNumberEditor,
        reactCheck
      };
    });
    
    console.log('\n=== Component Check ===');
    console.log(JSON.stringify(componentCheck, null, 2));
    
    // Save all results to a file
    const debugReport = {
      timestamp: new Date().toISOString(),
      domAnalysis,
      hoverResults,
      clickResults,
      componentCheck,
      screenshots: [
        'debug-booking-list.png',
        'debug-booking-details-full.png',
        'debug-booking-number-section.png',
        'debug-after-clicks.png'
      ]
    };
    
    await fs.writeFile('debug-booking-number-report.json', JSON.stringify(debugReport, null, 2));
    console.log('\nDebug report saved to debug-booking-number-report.json');
    
  } catch (error) {
    console.error('Error during debugging:', error);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  }
  
  console.log('\nDebug session complete. Browser will remain open for manual inspection.');
  console.log('Press Ctrl+C to close.');
  
  // Keep browser open for manual inspection
  await new Promise(() => {});
}

debugBookingNumberEditor().catch(console.error);