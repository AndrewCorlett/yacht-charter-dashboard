import puppeteer from 'puppeteer';

async function testDatePersistence() {
  let browser;
  try {
    console.log('🚀 Starting date persistence test...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('http://localhost:3777', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    console.log('📄 Page loaded, looking for any clickable booking elements...');
    
    // Take initial screenshot
    await page.screenshot({ path: 'step1-initial.png' });
    
    // Look for any clickable booking elements
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for booking cells or any clickable elements
    const clickableElements = await page.$$eval('*', elements => {
      return elements
        .filter(el => el.classList.contains('cursor-pointer') || 
                     el.onclick || 
                     el.getAttribute('role') === 'button' ||
                     el.tagName === 'BUTTON')
        .map((el, index) => ({
          index,
          text: el.textContent.trim().substring(0, 50),
          classes: el.className
        }));
    });
    
    console.log('Found clickable elements:', clickableElements.slice(0, 5));
    
    if (clickableElements.length > 0) {
      // Try to click on something that looks like a booking
      console.log('🔗 Clicking on first clickable element...');
      await page.evaluate((index) => {
        const elements = Array.from(document.querySelectorAll('*'))
          .filter(el => el.classList.contains('cursor-pointer') || 
                       el.onclick || 
                       el.getAttribute('role') === 'button' ||
                       el.tagName === 'BUTTON');
        if (elements[index]) elements[index].click();
      }, 0);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.screenshot({ path: 'step2-after-click.png' });
      
      // Look for status toggles
      const toggles = await page.$$('[class*="bg-green"], [class*="bg-gray"], button');
      console.log(`Found ${toggles.length} potential toggle elements`);
      
      if (toggles.length > 0) {
        console.log('✅ Clicking first toggle to enable it...');
        await toggles[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({ path: 'step3-after-toggle.png' });
        
        // Check if date appears
        const hasDateIcon = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.some(el => el.textContent.includes('📅'));
        });
        
        if (hasDateIcon) {
          console.log('📅 Date icon found after toggle!');
          
          // Look for save button and click it
          const saveClicked = await page.evaluate(() => {
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
          
          if (saveClicked) {
            console.log('💾 Save button clicked!');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          console.log('🔄 Performing hard refresh...');
          await page.reload({ waitUntil: 'networkidle2' });
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          await page.screenshot({ path: 'step4-after-refresh.png' });
          
          // Check if date still exists after refresh
          const hasDateAfterRefresh = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            return elements.some(el => el.textContent.includes('📅'));
          });
          
          if (hasDateAfterRefresh) {
            console.log('✅ SUCCESS: Date persisted after refresh!');
          } else {
            console.log('❌ FAILED: Date disappeared after refresh');
          }
        } else {
          console.log('⚠️ No date icon found after toggle');
        }
      } else {
        console.log('⚠️ No toggle elements found');
      }
    } else {
      console.log('⚠️ No clickable elements found');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'final-state.png', fullPage: true });
    console.log('📸 Screenshots saved');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testDatePersistence();