/**
 * Simple booking test to inspect the UI
 */

import puppeteer from 'puppeteer';

async function testSimpleBooking() {
  console.log('🚀 Starting simple booking test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  try {
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'simple-test-initial.png', fullPage: true });

    // Find and click Quick Create button
    console.log('🔍 Looking for Quick Create button...');
    const buttons = await page.$$('button');
    let quickCreateButton = null;
    
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent.trim());
      if (text.includes('Quick Create')) {
        quickCreateButton = button;
        break;
      }
    }
    
    if (quickCreateButton) {
      console.log('✅ Found Quick Create button');
      await quickCreateButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'simple-test-after-quick-create.png', fullPage: true });
      
      // List all input fields
      console.log('🔍 Finding all input fields...');
      const inputs = await page.$$('input');
      console.log(`Found ${inputs.length} input fields:`);
      
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const placeholder = await input.evaluate(el => el.placeholder || '');
        const name = await input.evaluate(el => el.name || '');
        const id = await input.evaluate(el => el.id || '');
        const type = await input.evaluate(el => el.type || '');
        console.log(`  Input ${i + 1}: type="${type}", placeholder="${placeholder}", name="${name}", id="${id}"`);
      }
      
      // List all select fields
      console.log('🔍 Finding all select fields...');
      const selects = await page.$$('select');
      console.log(`Found ${selects.length} select fields:`);
      
      for (let i = 0; i < selects.length; i++) {
        const select = selects[i];
        const name = await select.evaluate(el => el.name || '');
        const id = await select.evaluate(el => el.id || '');
        const options = await select.$$eval('option', options => 
          options.map(opt => ({ value: opt.value, text: opt.textContent.trim() }))
        );
        console.log(`  Select ${i + 1}: name="${name}", id="${id}"`);
        console.log(`    Options:`, options);
      }
      
      // Fill the form with basic data
      console.log('📝 Filling form with test data...');
      
      try {
        // Fill the first few inputs (likely name and email)
        if (inputs.length >= 1) {
          await inputs[0].click({ clickCount: 3 });
          await inputs[0].type('John');
          console.log('✅ Filled first field: John');
        }
        
        if (inputs.length >= 2) {
          await inputs[1].click({ clickCount: 3 });
          await inputs[1].type('Doe');
          console.log('✅ Filled second field: Doe');
        }
        
        if (inputs.length >= 3) {
          await inputs[2].click({ clickCount: 3 });
          await inputs[2].type('john.doe@test.com');
          console.log('✅ Filled third field: john.doe@test.com');
        }
        
        // Fill date fields if they exist
        for (let i = 3; i < inputs.length; i++) {
          const input = inputs[i];
          const type = await input.evaluate(el => el.type);
          if (type === 'date') {
            const dateValue = i === 3 ? '2025-07-15' : '2025-07-22';
            await input.click();
            await input.type(dateValue);
            console.log(`✅ Filled date field ${i + 1}: ${dateValue}`);
          }
        }
        
        // Select yacht if select exists
        if (selects.length > 0) {
          const yachtSelect = selects[0];
          const options = await yachtSelect.$$eval('option', options => 
            options.map(opt => ({ value: opt.value, text: opt.textContent.trim() }))
          );
          
          // Find Disk Drive option
          const diskDriveOption = options.find(opt => 
            opt.text.toLowerCase().includes('disk') || 
            opt.text.toLowerCase().includes('drive')
          );
          
          if (diskDriveOption) {
            await page.select('select', diskDriveOption.value);
            console.log(`✅ Selected yacht: ${diskDriveOption.text}`);
          } else {
            console.log('❌ Disk Drive option not found in select');
          }
        }
        
        await page.screenshot({ path: 'simple-test-form-filled.png', fullPage: true });
        
        // Submit the form
        console.log('📤 Submitting form...');
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          console.log('✅ Clicked submit button');
          
          // Wait for submission
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          await page.screenshot({ path: 'simple-test-after-submit.png', fullPage: true });
          
          // Look for booking number
          const pageText = await page.evaluate(() => document.body.innerText);
          const bookingMatch = pageText.match(/\b\d{8}\b/);
          
          if (bookingMatch) {
            console.log(`✅ Found booking number: ${bookingMatch[0]}`);
          } else {
            console.log('❌ No booking number found');
            console.log('Page content preview:', pageText.substring(0, 500));
          }
        } else {
          console.log('❌ Submit button not found');
        }
        
      } catch (formError) {
        console.error('❌ Form filling error:', formError);
      }
    } else {
      console.log('❌ Quick Create button not found');
    }

    // Keep browser open
    console.log('🔍 Browser will remain open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 60000));

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'simple-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testSimpleBooking().catch(console.error);