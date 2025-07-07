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
    
    console.log('3. Looking for Customer1 Test1 booking...');
    
    // Look for the specific button containing our customer name
    const customerButton = await page.$('button');
    if (customerButton) {
      const buttonText = await customerButton.evaluate(el => el.textContent);
      console.log('Found button with text:', buttonText);
      
      if (buttonText.includes('Customer1 Test1')) {
        console.log('4. Found Customer1 Test1 button! Clicking...');
        await customerButton.click();
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('5. Taking screenshot after click...');
        await page.screenshot({ path: 'screenshot-2-after-click.png', fullPage: true });
        
        // Look for modal or expanded view
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('6. Looking for input fields...');
        const allInputs = await page.$$eval('input', inputs => 
          inputs.map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            value: input.value,
            placeholder: input.placeholder,
            className: input.className
          }))
        );
        
        console.log('Found inputs:', allInputs);
        
        // Look for booking number input specifically
        const bookingNumberInput = allInputs.find(input => 
          input.value === '2528AL09' || 
          input.name?.toLowerCase().includes('booking') || 
          input.id?.toLowerCase().includes('booking') ||
          input.placeholder?.toLowerCase().includes('booking')
        );
        
        if (bookingNumberInput) {
          console.log('7. Found booking number input:', bookingNumberInput);
          
          // Focus on the input and change the value
          const selector = bookingNumberInput.id ? `#${bookingNumberInput.id}` : 
                          bookingNumberInput.name ? `input[name="${bookingNumberInput.name}"]` : 
                          `input[value="${bookingNumberInput.value}"]`;
          
          console.log('8. Editing booking number using selector:', selector);
          
          await page.focus(selector);
          await page.keyboard.selectAll();
          await page.keyboard.type('2528AL10');
          
          console.log('9. Taking screenshot after edit...');
          await page.screenshot({ path: 'screenshot-3-after-edit.png', fullPage: true });
          
          // Look for save button
          const saveButtons = await page.$$eval('button', buttons => 
            buttons.map(btn => ({
              text: btn.textContent,
              type: btn.type,
              className: btn.className,
              disabled: btn.disabled
            })).filter(btn => 
              btn.text.toLowerCase().includes('save') || 
              btn.text.toLowerCase().includes('update') ||
              btn.type === 'submit'
            )
          );
          
          console.log('10. Found save buttons:', saveButtons);
          
          if (saveButtons.length > 0) {
            console.log('11. Clicking save button...');
            
            await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const saveBtn = buttons.find(btn => 
                btn.textContent.toLowerCase().includes('save') || 
                btn.textContent.toLowerCase().includes('update') ||
                btn.type === 'submit'
              );
              if (saveBtn && !saveBtn.disabled) {
                saveBtn.click();
              }
            });
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('12. Taking final screenshot...');
            await page.screenshot({ path: 'screenshot-4-final.png', fullPage: true });
            
            console.log('Test completed successfully!');
          } else {
            console.log('No save button found');
          }
        } else {
          console.log('No booking number input found');
          
          // Let's try to find any input with the booking number value
          const allInputsWithValues = await page.$$eval('input', inputs => 
            inputs.map(input => ({
              type: input.type,
              name: input.name,
              id: input.id,
              value: input.value,
              placeholder: input.placeholder
            })).filter(input => input.value && input.value.length > 0)
          );
          
          console.log('All inputs with values:', allInputsWithValues);
        }
      } else {
        console.log('Button does not contain Customer1 Test1');
      }
    } else {
      console.log('No button found');
    }
    
    // Alternative: Look for any clickable elements containing Customer1 Test1
    console.log('Alternative approach: Looking for any clickable element with Customer1 Test1...');
    
    const customerElements = await page.$$eval('*', elements => 
      elements
        .filter(el => el.textContent && el.textContent.includes('Customer1 Test1'))
        .map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          text: el.textContent.substring(0, 50),
          clickable: el.tagName === 'BUTTON' || el.tagName === 'A' || el.onclick !== null
        }))
    );
    
    console.log('Found customer elements:', customerElements);
    
    if (customerElements.length > 0) {
      console.log('Attempting to click on customer element...');
      
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const customerElement = elements.find(el => 
          el.textContent && el.textContent.includes('Customer1 Test1')
        );
        
        if (customerElement) {
          // Find the clickable parent or the element itself
          let clickableElement = customerElement;
          while (clickableElement && clickableElement !== document.body) {
            if (clickableElement.tagName === 'BUTTON' || 
                clickableElement.tagName === 'A' || 
                clickableElement.onclick !== null ||
                clickableElement.style.cursor === 'pointer') {
              break;
            }
            clickableElement = clickableElement.parentElement;
          }
          
          if (clickableElement) {
            console.log('Clicking on:', clickableElement.tagName, clickableElement.className);
            clickableElement.click();
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: 'screenshot-5-alternative-click.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
  }
  
  console.log('Test completed. Closing browser in 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
}

testBookingEdit().catch(console.error);