import puppeteer from 'puppeteer';

async function testBookingCreation() {
  const browser = await puppeteer.launch({ 
    headless: false, // Run in visible mode to see what's happening
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('error', err => console.log('PAGE ERROR:', err.message));
    page.on('pageerror', err => console.log('PAGE SCRIPT ERROR:', err.message));
    
    console.log('Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take a screenshot to see the current state
    await page.screenshot({ path: 'test-initial-load.png', fullPage: true });
    console.log('Initial page screenshot saved as test-initial-load.png');
    
    // Look for Quick Create booking form or booking panel
    console.log('Looking for booking form elements...');
    
    // Check for various possible selectors for the booking form
    const possibleSelectors = [
      '[data-testid="quick-create-form"]',
      '.booking-panel',
      '.quick-create',
      '[class*="booking"]',
      '[class*="BookingPanel"]',
      'form',
      '.form'
    ];
    
    let foundForm = null;
    for (const selector of possibleSelectors) {
      const element = await page.$(selector);
      if (element) {
        console.log(`Found element with selector: ${selector}`);
        foundForm = selector;
        break;
      }
    }
    
    if (!foundForm) {
      console.log('No booking form found with standard selectors. Checking page content...');
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('Page content preview:', bodyText.substring(0, 500));
      
      // Check for any forms on the page
      const forms = await page.$$eval('form', forms => forms.length);
      console.log(`Found ${forms} form(s) on the page`);
      
      if (forms > 0) {
        foundForm = 'form';
      }
    }
    
    if (foundForm) {
      console.log(`Using form selector: ${foundForm}`);
      
      // Look for yacht selector (could be dropdown or input)
      const yachtSelectors = [
        'select[name*="yacht"]',
        'input[name*="yacht"]',
        '[data-testid*="yacht"]',
        '.yacht-selector',
        'select',
        'input[type="text"]'
      ];
      
      let yachtField = null;
      for (const selector of yachtSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log(`Found yacht field with selector: ${selector}`);
          yachtField = selector;
          break;
        }
      }
      
      if (yachtField) {
        // Try to fill in yacht selection
        try {
          if (yachtField.includes('select')) {
            // Handle dropdown
            await page.select(yachtField, 'Zavaria');
            console.log('Selected Zavaria from dropdown');
          } else {
            // Handle input field
            await page.focus(yachtField);
            await page.type(yachtField, 'Zavaria');
            console.log('Typed Zavaria into input field');
          }
        } catch (error) {
          console.log('Error selecting yacht:', error.message);
        }
      }
      
      // Look for other common booking fields
      const dateFields = await page.$$('[type="date"], [name*="date"], [data-testid*="date"]');
      console.log(`Found ${dateFields.length} date field(s)`);
      
      if (dateFields.length > 0) {
        try {
          // Fill in start date (today)
          const today = new Date().toISOString().split('T')[0];
          await page.focus('[type="date"]');
          await page.evaluate((date) => {
            const dateInput = document.querySelector('[type="date"]');
            if (dateInput) dateInput.value = date;
          }, today);
          console.log('Set start date to today');
        } catch (error) {
          console.log('Error setting date:', error.message);
        }
      }
      
      // Look for guest count fields
      const guestFields = await page.$$('[name*="guest"], [name*="passenger"], [type="number"]');
      console.log(`Found ${guestFields.length} guest/number field(s)`);
      
      if (guestFields.length > 0) {
        try {
          await page.focus('[type="number"]');
          await page.type('[type="number"]', '4');
          console.log('Set guest count to 4');
        } catch (error) {
          console.log('Error setting guest count:', error.message);
        }
      }
      
      // Take a screenshot after filling fields
      await page.screenshot({ path: 'test-form-filled.png', fullPage: true });
      console.log('Form filled screenshot saved as test-form-filled.png');
      
      // Look for submit button
      const submitSelectors = [
        'button[type="submit"]',
        '.submit-btn',
        '[data-testid*="submit"]',
        'button:contains("Create")',
        'button:contains("Submit")',
        'button'
      ];
      
      let submitButton = null;
      for (const selector of submitSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log(`Found submit button with selector: ${selector}`);
          submitButton = selector;
          break;
        }
      }
      
      if (submitButton) {
        console.log('Attempting to submit form...');
        
        // Listen for network requests to catch API calls
        const requests = [];
        page.on('request', request => {
          requests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers()
          });
        });
        
        try {
          await page.click(submitButton);
          console.log('Clicked submit button');
          
          // Wait for potential navigation or response
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check for any success/error messages
          const messages = await page.$$eval('[class*="message"], [class*="alert"], [class*="error"], [class*="success"]', 
            elements => elements.map(el => el.textContent));
          
          if (messages.length > 0) {
            console.log('Found messages on page:', messages);
          }
          
          // Check console for any JavaScript errors
          const logs = await page.evaluate(() => {
            return window.console.logs || [];
          });
          
          console.log('Recent API requests:', requests.filter(r => r.url.includes('api') || r.url.includes('supabase')));
          console.log('All requests:', requests.map(r => ({ url: r.url, method: r.method })));
          
          // Take final screenshot
          await page.screenshot({ path: 'test-form-submitted.png', fullPage: true });
          console.log('Form submitted screenshot saved as test-form-submitted.png');
          
        } catch (error) {
          console.log('Error submitting form:', error.message);
        }
      } else {
        console.log('No submit button found');
      }
      
    } else {
      console.log('No booking form found on the page');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testBookingCreation().catch(console.error);