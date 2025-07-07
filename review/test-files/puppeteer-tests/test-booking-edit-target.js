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
    
    console.log('3. Looking for the specific button with Customer1 Test1...');
    
    // Find the button that contains Customer1 Test1
    const targetButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Customer1 Test1'));
    });
    
    if (targetButton) {
      const buttonText = await targetButton.evaluate(el => el.textContent);
      console.log('4. Found target button with text:', buttonText);
      
      console.log('5. Clicking the button...');
      await targetButton.click();
      
      // Wait for potential modal or details to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('6. Taking screenshot after click...');
      await page.screenshot({ path: 'screenshot-2-after-click.png', fullPage: true });
      
      // Look for any modal or expanded view
      console.log('7. Looking for booking details form...');
      
      // Wait a bit more for any animations
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Look for input fields
      const inputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          value: input.value,
          placeholder: input.placeholder,
          className: input.className,
          visible: input.offsetWidth > 0 && input.offsetHeight > 0
        }))
      );
      
      console.log('8. Found input fields:', inputs);
      
      // Look specifically for booking number input
      const bookingInputs = inputs.filter(input => 
        input.value === '2528AL09' || 
        input.name?.toLowerCase().includes('booking') || 
        input.id?.toLowerCase().includes('booking') ||
        input.placeholder?.toLowerCase().includes('booking') ||
        input.placeholder?.toLowerCase().includes('number')
      );
      
      console.log('9. Booking-related inputs:', bookingInputs);
      
      if (bookingInputs.length > 0) {
        const bookingInput = bookingInputs[0];
        console.log('10. Found booking input:', bookingInput);
        
        // Build selector for the input
        let selector = '';
        if (bookingInput.id) {
          selector = `#${bookingInput.id}`;
        } else if (bookingInput.name) {
          selector = `input[name="${bookingInput.name}"]`;
        } else if (bookingInput.placeholder) {
          selector = `input[placeholder="${bookingInput.placeholder}"]`;
        } else {
          selector = `input[value="${bookingInput.value}"]`;
        }
        
        console.log('11. Using selector:', selector);
        
        // Focus and edit the input
        await page.focus(selector);
        await page.keyboard.selectAll();
        await page.keyboard.type('2528AL10');
        
        console.log('12. Updated booking number to 2528AL10');
        
        await page.screenshot({ path: 'screenshot-3-after-edit.png', fullPage: true });
        
        // Look for save button
        console.log('13. Looking for save button...');
        const saveButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(btn => 
            btn.textContent.toLowerCase().includes('save') || 
            btn.textContent.toLowerCase().includes('update') ||
            btn.type === 'submit'
          );
        });
        
        if (saveButton) {
          const saveButtonText = await saveButton.evaluate(el => el.textContent);
          console.log('14. Found save button:', saveButtonText);
          
          await saveButton.click();
          console.log('15. Clicked save button');
          
          // Wait for save to complete
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          console.log('16. Taking final screenshot...');
          await page.screenshot({ path: 'screenshot-4-final.png', fullPage: true });
          
          // Monitor for any success/error messages
          const messages = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            return elements
              .filter(el => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('saved') || text.includes('updated') || text.includes('success') || text.includes('error');
              })
              .map(el => el.textContent?.substring(0, 100));
          });
          
          console.log('17. Found status messages:', messages);
          
          console.log('✅ Test completed successfully!');
        } else {
          console.log('❌ No save button found');
        }
      } else {
        console.log('❌ No booking number input found');
        
        // Let's see all visible inputs
        const visibleInputs = inputs.filter(input => input.visible);
        console.log('Visible inputs:', visibleInputs);
      }
    } else {
      console.log('❌ Target button not found');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
  }
  
  console.log('Test completed. Browser will remain open for 15 seconds...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  await browser.close();
}

testBookingEdit().catch(console.error);