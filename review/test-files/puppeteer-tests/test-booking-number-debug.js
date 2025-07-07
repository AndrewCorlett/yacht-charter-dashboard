import puppeteer from 'puppeteer';

async function debugBookingNumber() {
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
    await page.screenshot({ path: 'debug-1-initial.png', fullPage: true });
    
    console.log('3. Clicking on Customer1 Test1 booking...');
    
    const targetButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Customer1 Test1'));
    });
    
    if (targetButton) {
      await targetButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('4. Taking screenshot after click...');
      await page.screenshot({ path: 'debug-2-after-click.png', fullPage: true });
      
      console.log('5. Debugging booking data...');
      
      // Debug the booking data that's loaded
      const bookingDebugInfo = await page.evaluate(() => {
        // Try to access the booking data from the React component
        const reactFiberKey = Object.keys(window).find(key => key.startsWith('__reactFiber'));
        
        // Also check if there's any global booking data
        const globalBookingData = window.bookingData || window.currentBooking || null;
        
        // Look for any div containing booking number text
        const bookingNumberDivs = Array.from(document.querySelectorAll('div')).filter(div => 
          div.textContent && div.textContent.includes('Booking Number')
        );
        
        // Look for any elements with booking number
        const elementsWithBookingNumber = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && (el.textContent.includes('2528AL09') || el.textContent.toLowerCase().includes('booking number'))
        );
        
        return {
          globalBookingData,
          bookingNumberDivs: bookingNumberDivs.map(div => ({
            text: div.textContent,
            innerHTML: div.innerHTML,
            className: div.className
          })),
          elementsWithBookingNumber: elementsWithBookingNumber.map(el => ({
            tagName: el.tagName,
            text: el.textContent?.substring(0, 100),
            className: el.className,
            id: el.id
          })),
          pageText: document.body.innerText.includes('2528AL09') ? 'Found 2528AL09' : 'No 2528AL09 found'
        };
      });
      
      console.log('6. Booking debug info:', JSON.stringify(bookingDebugInfo, null, 2));
      
      // Check if the booking number editor div exists but is hidden
      console.log('7. Checking for BookingNumberEditor div...');
      const bookingNumberEditorInfo = await page.evaluate(() => {
        const bookingNumberDiv = document.querySelector('div:has(> div > span:contains("Booking Number"))');
        const allDivs = Array.from(document.querySelectorAll('div')).filter(div => 
          div.textContent && div.textContent.includes('Booking Number')
        );
        
        return {
          bookingNumberDiv: bookingNumberDiv ? {
            visible: bookingNumberDiv.offsetWidth > 0 && bookingNumberDiv.offsetHeight > 0,
            innerHTML: bookingNumberDiv.innerHTML,
            className: bookingNumberDiv.className
          } : null,
          allBookingNumberDivs: allDivs.map(div => ({
            visible: div.offsetWidth > 0 && div.offsetHeight > 0,
            text: div.textContent,
            className: div.className
          }))
        };
      });
      
      console.log('8. Booking number editor info:', JSON.stringify(bookingNumberEditorInfo, null, 2));
      
      // Let's also check what's in the form data state
      console.log('9. Checking React component state via DOM inspection...');
      
      await page.screenshot({ path: 'debug-3-detailed.png', fullPage: true });
      
      // Let's scroll and look for the booking number section
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('10. Looking for any hidden booking number fields...');
      
      const allTextContent = await page.evaluate(() => {
        return {
          bodyText: document.body.innerText,
          hasBookingNumber: document.body.innerText.includes('Booking Number'),
          has2528AL09: document.body.innerText.includes('2528AL09'),
          allSpans: Array.from(document.querySelectorAll('span')).map(span => span.textContent).filter(text => text && text.includes('Booking'))
        };
      });
      
      console.log('11. All text content analysis:', JSON.stringify(allTextContent, null, 2));
      
    } else {
      console.log('Target button not found');
    }
    
  } catch (error) {
    console.error('Error during debug:', error);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  }
  
  console.log('Debug completed. Browser will remain open for 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
}

debugBookingNumber().catch(console.error);