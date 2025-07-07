import puppeteer from 'puppeteer';

async function testBookingToggle() {
  let browser;
  try {
    console.log('🚀 Starting booking toggle date persistence test...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('http://localhost:3777', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    console.log('📄 Page loaded, navigating to Bookings...');
    
    // Click on Bookings in the sidebar
    await page.click('a[href*="bookings"], button:has-text("Bookings"), [data-testid="bookings"]').catch(() => {
      // Try different approach
      return page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a, button'));
        const bookingLink = links.find(el => el.textContent.toLowerCase().includes('booking'));
        if (bookingLink) bookingLink.click();
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'bookings-page.png' });
    
    console.log('📋 Looking for booking entries...');
    
    // Look for booking calendar cells or list items
    const bookingCells = await page.$$eval('[class*="booking"], [data-booking], .cursor-pointer', cells => {
      return cells.map((cell, index) => ({
        index,
        text: cell.textContent.trim().substring(0, 100),
        classes: cell.className
      }));
    }).catch(() => []);
    
    console.log('Found booking cells:', bookingCells.slice(0, 3));
    
    if (bookingCells.length > 0) {
      console.log('🔗 Clicking on first booking...');
      await page.click('[class*="booking"], [data-booking], .cursor-pointer').catch(() => {
        console.log('Failed to click booking with CSS selector, trying evaluate');
        return page.evaluate(() => {
          const elements = document.querySelectorAll('[class*="booking"], [data-booking], .cursor-pointer');
          if (elements[0]) elements[0].click();
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.screenshot({ path: 'booking-detail.png' });
      
      console.log('🔍 Looking for status toggles in booking panel...');
      
      // Look specifically for toggle containers with status labels
      const statusToggles = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const toggleContainers = elements.filter(el => {
          const text = el.textContent.toLowerCase();
          return (text.includes('booking confirmed') || 
                  text.includes('deposit paid') || 
                  text.includes('full payment') ||
                  text.includes('contract sent')) &&
                 (el.classList.contains('cursor-pointer') || 
                  el.onclick ||
                  el.querySelector('[type="checkbox"]'));
        });
        
        return toggleContainers.map((el, index) => ({
          index,
          text: el.textContent.trim().substring(0, 100),
          hasCheckbox: !!el.querySelector('[type="checkbox"]')
        }));
      });
      
      console.log('Found status toggles:', statusToggles);
      
      if (statusToggles.length > 0) {
        console.log('✅ Clicking on first status toggle...');
        
        // Click the first status toggle
        await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          const toggle = elements.find(el => {
            const text = el.textContent.toLowerCase();
            return (text.includes('booking confirmed') || 
                    text.includes('deposit paid') || 
                    text.includes('full payment') ||
                    text.includes('contract sent')) &&
                   (el.classList.contains('cursor-pointer') || 
                    el.onclick ||
                    el.querySelector('[type="checkbox"]'));
          });
          if (toggle) toggle.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: 'after-toggle.png' });
        
        // Check if date appears
        const dateInfo = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          const dateElements = elements.filter(el => el.textContent.includes('📅'));
          return {
            hasDate: dateElements.length > 0,
            dateTexts: dateElements.map(el => el.textContent.trim())
          };
        });
        
        console.log('Date check result:', dateInfo);
        
        if (dateInfo.hasDate) {
          console.log('📅 Date found! Saving booking...');
          
          // Try to save
          const saveResult = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const saveBtn = buttons.find(btn => 
              btn.textContent.toLowerCase().includes('save') ||
              btn.textContent.toLowerCase().includes('update')
            );
            if (saveBtn) {
              saveBtn.click();
              return true;
            }
            return false;
          });
          
          if (saveResult) {
            console.log('💾 Save clicked, waiting...');
            await new Promise(resolve => setTimeout(resolve, 4000));
          }
          
          console.log('🔄 Performing hard refresh...');
          await page.reload({ waitUntil: 'networkidle2' });
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          await page.screenshot({ path: 'after-refresh.png' });
          
          // Check if date persisted
          const dateAfterRefresh = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const dateElements = elements.filter(el => el.textContent.includes('📅'));
            return {
              hasDate: dateElements.length > 0,
              dateTexts: dateElements.map(el => el.textContent.trim())
            };
          });
          
          console.log('Date after refresh:', dateAfterRefresh);
          
          if (dateAfterRefresh.hasDate) {
            console.log('✅ SUCCESS: Date persisted after refresh!');
            console.log('Date texts:', dateAfterRefresh.dateTexts);
          } else {
            console.log('❌ FAILED: Date disappeared after refresh');
          }
        } else {
          console.log('⚠️ No date appeared after clicking toggle');
        }
      } else {
        console.log('⚠️ No status toggles found');
      }
    } else {
      console.log('⚠️ No booking cells found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testBookingToggle();