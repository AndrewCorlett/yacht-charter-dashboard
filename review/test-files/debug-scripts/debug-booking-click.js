import puppeteer from 'puppeteer';

async function debugBookingClick() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to main page
    console.log('Navigating to main page...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click on one of the upcoming charter cards
    console.log('Looking for upcoming charter cards...');
    const clicked = await page.evaluate(() => {
      // Find charter cards in the upcoming charters section
      const cards = document.querySelectorAll('.rounded-lg.p-4, [class*="charter"], [class*="booking"]');
      console.log('Found cards:', cards.length);
      
      // Look for cards with booking info
      let targetCard = null;
      cards.forEach(card => {
        const text = card.textContent || '';
        if (text.includes('ed.asd') || text.includes('Spectre') || text.includes('Zavaria')) {
          targetCard = card;
        }
      });
      
      if (targetCard) {
        console.log('Clicking on charter card:', targetCard.textContent.substring(0, 50));
        targetCard.click();
        return true;
      }
      
      // Alternative: look for any clickable element with booking info
      const clickables = document.querySelectorAll('a, button, div[onclick], div[role="button"]');
      for (const el of clickables) {
        if (el.textContent.includes('ed.asd') || el.textContent.includes('20202021')) {
          el.click();
          return true;
        }
      }
      
      return false;
    });
    
    if (!clicked) {
      console.log('Could not find charter card to click');
      
      // Try to navigate via sidebar
      console.log('Trying sidebar navigation...');
      const sidebarClicked = await page.evaluate(() => {
        const links = document.querySelectorAll('nav a, aside a, [role="navigation"] a');
        for (const link of links) {
          if (link.textContent.includes('Booking') || link.textContent.includes('Management')) {
            link.click();
            return true;
          }
        }
        return false;
      });
      
      if (!sidebarClicked) {
        console.log('Could not find booking management link in sidebar');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Wait for navigation/modal
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of current page
    await page.screenshot({ path: 'debug-booking-details-page.png', fullPage: true });
    console.log('Screenshot captured: debug-booking-details-page.png');
    
    // Analyze the page for booking number
    const pageAnalysis = await page.evaluate(() => {
      const results = {
        currentURL: window.location.href,
        pageTitle: document.title,
        hasBookingNumber: false,
        bookingNumberInfo: [],
        inputs: [],
        editableElements: []
      };
      
      // Look for booking number
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const text = el.textContent || '';
        
        // Check for booking number pattern (8 digits)
        if (text.match(/\b\d{8}\b/) && el.children.length === 0) {
          results.hasBookingNumber = true;
          results.bookingNumberInfo.push({
            value: text.match(/\b\d{8}\b/)[0],
            element: el.tagName,
            className: el.className,
            isInput: el.tagName === 'INPUT',
            isEditable: el.contentEditable === 'true',
            parentElement: el.parentElement ? {
              tag: el.parentElement.tagName,
              className: el.parentElement.className,
              hasIcon: el.parentElement.querySelector('svg, i, .icon') !== null
            } : null
          });
        }
        
        // Check for "Booking Number" label
        if (text.includes('Booking Number') && el.children.length === 0) {
          const parent = el.parentElement;
          const sibling = el.nextElementSibling;
          results.bookingNumberInfo.push({
            type: 'label',
            labelText: text.trim(),
            nextElement: sibling ? {
              tag: sibling.tagName,
              className: sibling.className,
              text: sibling.textContent
            } : null,
            parentInfo: parent ? parent.outerHTML.substring(0, 200) : null
          });
        }
      });
      
      // Find all inputs
      document.querySelectorAll('input').forEach(input => {
        results.inputs.push({
          type: input.type,
          name: input.name,
          value: input.value,
          placeholder: input.placeholder,
          disabled: input.disabled,
          readOnly: input.readOnly
        });
      });
      
      // Find editable elements
      document.querySelectorAll('[contenteditable="true"], [role="textbox"]').forEach(el => {
        results.editableElements.push({
          tag: el.tagName,
          className: el.className,
          text: el.textContent
        });
      });
      
      return results;
    });
    
    console.log('\n=== Page Analysis ===');
    console.log(JSON.stringify(pageAnalysis, null, 2));
    
    // If we found a booking number, try to interact with it
    if (pageAnalysis.hasBookingNumber) {
      console.log('\nTrying to edit booking number...');
      
      const editResult = await page.evaluate(() => {
        const results = {
          attempts: [],
          success: false
        };
        
        // Find elements with booking number
        const elements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.match(/\b\d{8}\b/) && el.children.length === 0
        );
        
        elements.forEach((el, index) => {
          const attempt = {
            index,
            element: el.tagName,
            className: el.className,
            actions: []
          };
          
          // Try hover
          const hoverEvent = new MouseEvent('mouseover', { bubbles: true });
          el.dispatchEvent(hoverEvent);
          attempt.actions.push('hover');
          
          // Try click
          el.click();
          attempt.actions.push('click');
          
          // Try double click
          const dblClickEvent = new MouseEvent('dblclick', { bubbles: true });
          el.dispatchEvent(dblClickEvent);
          attempt.actions.push('double-click');
          
          // Check parent for edit icon/button
          const parent = el.parentElement;
          if (parent) {
            const editIcon = parent.querySelector('svg, i, button, [class*="edit"]');
            if (editIcon) {
              editIcon.click();
              attempt.actions.push('clicked-edit-icon');
              results.success = true;
            }
            
            // Try clicking parent
            parent.click();
            attempt.actions.push('clicked-parent');
          }
          
          results.attempts.push(attempt);
        });
        
        return results;
      });
      
      console.log('\n=== Edit Attempts ===');
      console.log(JSON.stringify(editResult, null, 2));
      
      // Wait for any changes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take final screenshot
      await page.screenshot({ path: 'debug-after-edit-attempt.png', fullPage: true });
      console.log('Final screenshot captured: debug-after-edit-attempt.png');
      
      // Check if edit mode activated
      const editModeCheck = await page.evaluate(() => {
        return {
          hasModal: document.querySelector('.modal, [role="dialog"]') !== null,
          hasFocusedInput: document.activeElement && document.activeElement.tagName === 'INPUT',
          activeElementInfo: document.activeElement ? {
            tag: document.activeElement.tagName,
            type: document.activeElement.type,
            value: document.activeElement.value,
            name: document.activeElement.name
          } : null,
          newInputs: Array.from(document.querySelectorAll('input')).filter(input => 
            input.offsetParent !== null && !input.disabled
          ).map(input => ({
            type: input.type,
            value: input.value,
            placeholder: input.placeholder
          }))
        };
      });
      
      console.log('\n=== Edit Mode Check ===');
      console.log(JSON.stringify(editModeCheck, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  }
  
  console.log('\nDebug complete. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');
  
  // Keep browser open
  await new Promise(() => {});
}

debugBookingClick().catch(console.error);