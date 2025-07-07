/**
 * Test to debug date input issue in the booking form
 */

const puppeteer = require('puppeteer');

async function testDateInputIssue() {
  let browser;
  try {
    console.log('🔍 Testing date input behavior...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
    
    console.log('1️⃣ Form loaded, checking date inputs...');
    
    // Check the date input elements
    const dateInputInfo = await page.evaluate(() => {
      const startDateInput = document.querySelector('input[name="startDate"]');
      const endDateInput = document.querySelector('input[name="endDate"]');
      
      return {
        startDate: {
          exists: !!startDateInput,
          type: startDateInput?.type,
          value: startDateInput?.value,
          placeholder: startDateInput?.placeholder,
          required: startDateInput?.required
        },
        endDate: {
          exists: !!endDateInput,
          type: endDateInput?.type,
          value: endDateInput?.value,
          placeholder: endDateInput?.placeholder,
          required: endDateInput?.required
        }
      };
    });
    
    console.log('📅 Date input info:', JSON.stringify(dateInputInfo, null, 2));
    
    // Try different methods to set date values
    console.log('2️⃣ Testing different date input methods...');
    
    // Method 1: Regular type
    console.log('   Method 1: Regular page.type()');
    await page.focus('input[name="startDate"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA'); // Select all
    await page.keyboard.up('Control');
    await page.type('input[name="startDate"]', '2025-07-01');
    
    await page.focus('input[name="endDate"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA'); // Select all
    await page.keyboard.up('Control');
    await page.type('input[name="endDate"]', '2025-07-07');
    
    let valuesAfterType = await page.evaluate(() => ({
      startDate: document.querySelector('input[name="startDate"]').value,
      endDate: document.querySelector('input[name="endDate"]').value
    }));
    
    console.log('   Values after type:', valuesAfterType);
    
    // Method 2: Set property directly
    console.log('   Method 2: Setting value property directly');
    await page.evaluate(() => {
      document.querySelector('input[name="startDate"]').value = '2025-07-01';
      document.querySelector('input[name="endDate"]').value = '2025-07-07';
      
      // Trigger change events
      document.querySelector('input[name="startDate"]').dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('input[name="endDate"]').dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    let valuesAfterDirect = await page.evaluate(() => ({
      startDate: document.querySelector('input[name="startDate"]').value,
      endDate: document.querySelector('input[name="endDate"]').value
    }));
    
    console.log('   Values after direct set:', valuesAfterDirect);
    
    // Method 3: Using React's way
    console.log('   Method 3: Triggering React events');
    await page.evaluate(() => {
      const startDateInput = document.querySelector('input[name="startDate"]');
      const endDateInput = document.querySelector('input[name="endDate"]');
      
      // Set value
      startDateInput.value = '2025-07-01';
      endDateInput.value = '2025-07-07';
      
      // Create and dispatch input event (React listens to this)
      const inputEvent = new Event('input', { bubbles: true });
      startDateInput.dispatchEvent(inputEvent);
      endDateInput.dispatchEvent(inputEvent);
      
      // Also dispatch change event
      const changeEvent = new Event('change', { bubbles: true });
      startDateInput.dispatchEvent(changeEvent);
      endDateInput.dispatchEvent(changeEvent);
    });
    
    let valuesAfterReact = await page.evaluate(() => ({
      startDate: document.querySelector('input[name="startDate"]').value,
      endDate: document.querySelector('input[name="endDate"]').value
    }));
    
    console.log('   Values after React events:', valuesAfterReact);
    
    // Fill the rest of the form
    console.log('3️⃣ Filling rest of form...');
    await page.select('select[name="yacht"]', 'c2c363c7-ca98-43e9-901d-630ea62ccdce');
    await page.type('input[name="firstName"]', 'Test');
    await page.type('input[name="surname"]', 'Customer');
    await page.type('input[name="email"]', 'test@dates.com');
    await page.type('input[name="phone"]', '+44 7700 900000');
    await page.type('input[name="addressLine1"]', '123 Test Street');
    await page.type('input[name="city"]', 'London');
    await page.type('input[name="postcode"]', 'SW1A 1AA');
    
    // Check form data before submission
    console.log('4️⃣ Checking form data before submission...');
    const formData = await page.evaluate(() => {
      const form = document.querySelector('[data-testid="booking-form"] form');
      const formData = new FormData(form);
      const data = {};
      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }
      return data;
    });
    
    console.log('📋 Form data:', JSON.stringify(formData, null, 2));
    
    // Try submission
    console.log('5️⃣ Submitting form...');
    await page.click('button[data-testid="submit-booking"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for validation errors
    const validationErrors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[style*="color: var(--color-ios-red)"]');
      return Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text);
    });
    
    console.log('❌ Validation errors:', validationErrors);
    
    console.log('\n🏁 Date input test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testDateInputIssue()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });