/**
 * Test with console monitoring to see errors
 */

import puppeteer from 'puppeteer';

async function testWithConsoleMonitoring() {
  console.log('🚀 Starting test with console monitoring...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // Monitor console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ BROWSER ERROR: ${text}`);
    } else if (type === 'warn') {
      console.log(`⚠️  BROWSER WARNING: ${text}`);
    } else if (type === 'log' && (text.includes('booking') || text.includes('error'))) {
      console.log(`📝 BROWSER LOG: ${text}`);
    }
  });

  // Monitor network requests
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (url.includes('supabase') || url.includes('booking')) {
      console.log(`🌐 NETWORK: ${status} ${url}`);
    }
  });

  try {
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Find existing booking
    console.log('🔍 Looking for existing bookings...');
    const buttons = await page.$$('button');
    let targetBookingButton = null;
    
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent.trim());
      if (text.includes('Zavaria') || text.includes('Alrisha')) {
        targetBookingButton = button;
        console.log(`✅ Found existing booking`);
        break;
      }
    }
    
    if (targetBookingButton) {
      // Click on the booking to view details
      console.log('🔍 Clicking on booking to view details...');
      await targetBookingButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Look for booking number
      const pageText = await page.evaluate(() => document.body.innerText);
      const oldFormatMatches = pageText.match(/\bBK\w+/g);
      const newFormatMatches = pageText.match(/\b\d{8}\b/g);
      const bookingNumberMatches = newFormatMatches || oldFormatMatches;
      
      if (bookingNumberMatches && bookingNumberMatches.length > 0) {
        const bookingNumber = bookingNumberMatches[0];
        console.log(`✅ Found booking number: ${bookingNumber}`);
        
        // Find the booking number element and edit button
        const allElements = await page.$$('*');
        let bookingNumberElement = null;
        
        for (const element of allElements) {
          try {
            const text = await element.evaluate(el => el.textContent || '');
            if (text.trim() === bookingNumber) {
              bookingNumberElement = element;
              break;
            }
          } catch (e) {
            // Skip
          }
        }
        
        if (bookingNumberElement) {
          // Hover and find edit button
          await bookingNumberElement.hover();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const editButtons = await page.$$('button');
          let editButton = null;
          
          for (const button of editButtons) {
            const title = await button.evaluate(el => el.title || '');
            if (title.toLowerCase().includes('edit')) {
              editButton = button;
              break;
            }
          }
          
          if (editButton) {
            console.log('✅ Clicking edit button...');
            await editButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Find edit input
            const editInputs = await page.$$('input[type="text"]');
            let editInput = null;
            
            for (const input of editInputs) {
              const value = await input.evaluate(el => el.value || '');
              if (value === bookingNumber) {
                editInput = input;
                break;
              }
            }
            
            if (editInput) {
              // Use a valid new format booking number
              const newNumber = '2529ZA88';
              console.log(`📝 Changing ${bookingNumber} to ${newNumber}`);
              
              await editInput.click({ clickCount: 3 });
              await editInput.type(newNumber);
              
              // Find and click save button
              const saveButtons = await page.$$('button');
              let saveButton = null;
              
              for (const button of saveButtons) {
                const title = await button.evaluate(el => el.title || '');
                if (title.toLowerCase().includes('save')) {
                  saveButton = button;
                  break;
                }
              }
              
              if (saveButton) {
                console.log('✅ Clicking save button...');
                console.log('📊 Monitoring console for errors...');
                
                await saveButton.click();
                
                // Wait longer and monitor console
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Check if the number updated
                const updatedPageText = await page.evaluate(() => document.body.innerText);
                
                if (updatedPageText.includes(newNumber)) {
                  console.log('✅ Booking number successfully updated!');
                } else if (updatedPageText.includes(bookingNumber)) {
                  console.log('❌ Booking number reverted to original value');
                } else {
                  console.log('❓ Unexpected state - booking number not found');
                }
                
                console.log('Final page state:');
                console.log(updatedPageText.substring(0, 800));
              }
            }
          }
        }
      }
    }

    // Keep browser open for inspection
    console.log('🔍 Browser will remain open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 60000));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testWithConsoleMonitoring().catch(console.error);