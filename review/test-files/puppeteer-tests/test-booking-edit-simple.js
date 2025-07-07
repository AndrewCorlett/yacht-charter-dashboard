import puppeteer from 'puppeteer';

async function testBookingEdit() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', (msg) => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  // Enable error logging
  page.on('pageerror', (err) => {
    console.log(`[BROWSER ERROR] ${err.message}`);
  });
  
  try {
    console.log('1. Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('2. Taking initial screenshot...');
    await page.screenshot({ path: 'screenshot-1-initial.png', fullPage: true });
    
    console.log('3. Searching for booking text in the page...');
    const pageContent = await page.evaluate(() => {
      return document.body.innerText;
    });
    
    console.log('Page contains booking number 2528AL09:', pageContent.includes('2528AL09'));
    console.log('Page contains customer name:', pageContent.includes('Customer1 Test1'));
    
    // Look for any elements containing our booking information
    const bookingElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements
        .filter(el => {
          const text = el.textContent || '';
          return text.includes('2528AL09') || text.includes('Customer1 Test1');
        })
        .map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          text: el.textContent.substring(0, 100),
          clickable: el.onclick !== null || el.style.cursor === 'pointer'
        }));
    });
    
    console.log('Found booking elements:', bookingElements);
    
    if (bookingElements.length > 0) {
      console.log('4. Clicking on the first booking element...');
      
      // Click on the first element containing our booking
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const bookingElement = elements.find(el => {
          const text = el.textContent || '';
          return text.includes('2528AL09') || text.includes('Customer1 Test1');
        });
        
        if (bookingElement) {
          // Try to find a clickable parent
          let clickableElement = bookingElement;
          while (clickableElement && clickableElement.tagName !== 'BODY') {
            if (clickableElement.onclick || 
                clickableElement.style.cursor === 'pointer' || 
                clickableElement.tagName === 'BUTTON' ||
                clickableElement.tagName === 'A' ||
                clickableElement.classList.contains('clickable') ||
                clickableElement.classList.contains('booking') ||
                clickableElement.getAttribute('role') === 'button') {
              break;
            }
            clickableElement = clickableElement.parentElement;
          }
          
          console.log('Clicking element:', clickableElement.tagName, clickableElement.className);
          clickableElement.click();
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('5. Taking screenshot after click...');
      await page.screenshot({ path: 'screenshot-2-after-click.png', fullPage: true });
      
      // Look for input fields that might contain the booking number
      console.log('6. Looking for booking number input field...');
      const inputElements = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        return inputs.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          value: input.value,
          placeholder: input.placeholder,
          className: input.className
        }));
      });
      
      console.log('Found input elements:', inputElements);
      
      // Look for input with our booking number
      const bookingInput = inputElements.find(input => 
        input.value === '2528AL09' || 
        input.name?.includes('booking') || 
        input.id?.includes('booking')
      );
      
      if (bookingInput) {
        console.log('7. Found booking number input:', bookingInput);
        
        // Clear and update the booking number
        const selector = bookingInput.id ? `#${bookingInput.id}` : 
                        bookingInput.name ? `input[name="${bookingInput.name}"]` : 
                        `input[value="${bookingInput.value}"]`;
        
        console.log('Using selector:', selector);
        
        await page.focus(selector);
        await page.keyboard.selectAll();
        await page.keyboard.type('2528AL10');
        
        console.log('8. Taking screenshot after edit...');
        await page.screenshot({ path: 'screenshot-3-after-edit.png', fullPage: true });
        
        // Look for save button
        console.log('9. Looking for save button...');
        const saveButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveBtn = buttons.find(btn => 
            btn.textContent.includes('Save') || 
            btn.textContent.includes('Update') ||
            btn.type === 'submit'
          );
          return saveBtn ? {
            text: saveBtn.textContent,
            type: saveBtn.type,
            className: saveBtn.className
          } : null;
        });
        
        if (saveButton) {
          console.log('10. Found save button:', saveButton);
          
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const saveBtn = buttons.find(btn => 
              btn.textContent.includes('Save') || 
              btn.textContent.includes('Update') ||
              btn.type === 'submit'
            );
            if (saveBtn) {
              saveBtn.click();
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          console.log('11. Taking final screenshot...');
          await page.screenshot({ path: 'screenshot-4-final.png', fullPage: true });
          
          console.log('Test completed successfully!');
        } else {
          console.log('Save button not found');
        }
      } else {
        console.log('Booking number input not found');
      }
    } else {
      console.log('No booking elements found on the page');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
  }
  
  console.log('Test completed. Closing browser in 5 seconds...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testBookingEdit().catch(console.error);