import puppeteer from 'puppeteer';

async function testBookingNumberEdit() {
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
    
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('2. Taking initial screenshot...');
    await page.screenshot({ path: 'test-1-initial.png', fullPage: true });
    
    console.log('3. Clicking on Customer1 Test1 booking...');
    
    const targetButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Customer1 Test1'));
    });
    
    if (targetButton) {
      await targetButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('4. Taking screenshot after clicking booking...');
      await page.screenshot({ path: 'test-2-booking-opened.png', fullPage: true });
      
      console.log('5. Looking for booking number edit button...');
      
      // Look for the edit button next to the booking number
      const editButton = await page.evaluateHandle(() => {
        // Find the edit button with the pencil icon
        const editButtons = Array.from(document.querySelectorAll('button'));
        return editButtons.find(btn => {
          const svg = btn.querySelector('svg');
          return svg && svg.querySelector('path[d*="15.232"]'); // Part of the pencil icon path
        });
      });
      
      if (editButton) {
        console.log('6. Found edit button! Clicking...');
        await editButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('7. Taking screenshot after clicking edit...');
        await page.screenshot({ path: 'test-3-edit-clicked.png', fullPage: true });
        
        // Look for input field that might have appeared
        console.log('8. Looking for booking number input field...');
        
        const inputField = await page.evaluateHandle(() => {
          // Look for any input that might contain the booking number
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.find(input => input.value === '2528AL20') || inputs[inputs.length - 1];
        });
        
        if (inputField) {
          console.log('9. Found input field! Editing booking number...');
          
          // Clear and type new booking number
          await inputField.click();
          await page.keyboard.down('Control');
          await page.keyboard.press('a');
          await page.keyboard.up('Control');
          await page.keyboard.type('2528AL10');
          
          console.log('10. Taking screenshot after edit...');
          await page.screenshot({ path: 'test-4-number-edited.png', fullPage: true });
          
          // Press Enter or look for save button
          console.log('11. Pressing Enter to save...');
          await page.keyboard.press('Enter');
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log('12. Taking screenshot after saving...');
          await page.screenshot({ path: 'test-5-after-save.png', fullPage: true });
          
          // Check if the booking number was updated
          const updatedBookingNumber = await page.evaluate(() => {
            const bookingNumberSpan = document.querySelector('span.font-mono');
            return bookingNumberSpan ? bookingNumberSpan.textContent : null;
          });
          
          console.log('13. Updated booking number:', updatedBookingNumber);
          
          if (updatedBookingNumber === '2528AL10') {
            console.log('✅ SUCCESS: Booking number successfully updated to 2528AL10!');
          } else {
            console.log('❌ FAILURE: Booking number was not updated correctly');
          }
          
        } else {
          console.log('❌ No input field found after clicking edit');
        }
      } else {
        console.log('❌ Edit button not found');
        
        // Let's try to find the booking number element anyway
        console.log('Alternative: Looking for booking number element...');
        
        const bookingNumberElement = await page.evaluateHandle(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          return spans.find(span => span.textContent === '2528AL20');
        });
        
        if (bookingNumberElement) {
          console.log('Found booking number element. Trying to click it...');
          await bookingNumberElement.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.screenshot({ path: 'test-3-alternative-click.png', fullPage: true });
        }
      }
    } else {
      console.log('❌ Target booking button not found');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  }
  
  console.log('Test completed. Browser will remain open for 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
}

testBookingNumberEdit().catch(console.error);