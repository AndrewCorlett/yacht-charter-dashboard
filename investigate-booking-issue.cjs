/**
 * Simple investigation script to check what's happening with booking creation
 */

const puppeteer = require('puppeteer');

async function investigateBookingIssue() {
  let browser;
  try {
    console.log('🔍 Investigating booking creation issue...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable detailed console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error' || text.includes('validation') || text.includes('error')) {
        console.log(`❌ ${type.toUpperCase()}: ${text}`);
      } else if (text.includes('booking') || text.includes('create')) {
        console.log(`📝 ${type.toUpperCase()}: ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`💥 PAGE ERROR: ${error.message}`);
    });
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    console.log('✅ Page loaded, checking form state...');
    
    // Wait for booking form
    await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
    
    // Check what yacht options are available
    const yachtOptions = await page.evaluate(() => {
      const select = document.querySelector('select[name="yacht"]');
      if (!select) return null;
      
      return Array.from(select.options).map(option => ({
        value: option.value,
        text: option.text
      }));
    });
    
    console.log('🚢 Available yacht options:', yachtOptions);
    
    // Check if yachts are loading
    const isLoadingYachts = await page.evaluate(() => {
      const loadingText = document.querySelector('.ios-input:contains("Loading yachts...")');
      return !!loadingText;
    });
    
    console.log('⏳ Are yachts loading?', isLoadingYachts);
    
    // Wait a bit and check again
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const yachtOptionsAfterWait = await page.evaluate(() => {
      const select = document.querySelector('select[name="yacht"]');
      if (!select) return null;
      
      return Array.from(select.options).map(option => ({
        value: option.value,
        text: option.text
      }));
    });
    
    console.log('🚢 Yacht options after wait:', yachtOptionsAfterWait);
    
    // Check if we can access the UnifiedDataService
    const unifiedDataStatus = await page.evaluate(() => {
      try {
        // Try to access services that might be available globally
        const unifiedService = window.unifiedDataService;
        const yachtService = window.yachtService;
        
        return {
          unifiedDataService: !!unifiedService,
          yachtService: !!yachtService,
          unifiedBookings: unifiedService ? unifiedService.getAllBookings().length : 'N/A',
          unifiedCharters: unifiedService ? unifiedService.getAllCharters().length : 'N/A'
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('🔧 Service availability:', unifiedDataStatus);
    
    // Check network requests related to yachts
    const networkRequests = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('yacht') || url.includes('supabase') || url.includes('booking')) {
        networkRequests.push({
          url,
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Refresh to see initial network requests
    await page.reload({ waitUntil: 'networkidle0' });
    
    console.log('🌐 Network requests:', networkRequests);
    
    // Check Supabase configuration
    const supabaseConfig = await page.evaluate(() => {
      return {
        url: window.location.origin,
        hasSupabase: !!window.supabase,
        userAgent: navigator.userAgent
      };
    });
    
    console.log('⚙️ Environment info:', supabaseConfig);
    
    // Try to fill and submit form to see detailed error
    console.log('\n🎯 Attempting to create booking to see detailed error...');
    
    await page.waitForSelector('[data-testid="booking-form"]', { timeout: 5000 });
    
    // If we have yacht options, select the first non-empty one
    if (yachtOptionsAfterWait && yachtOptionsAfterWait.length > 1) {
      const firstValidYacht = yachtOptionsAfterWait.find(opt => opt.value && opt.value !== '');
      if (firstValidYacht) {
        console.log(`Selecting yacht: ${firstValidYacht.text} (${firstValidYacht.value})`);
        await page.select('select[name="yacht"]', firstValidYacht.value);
      }
    }
    
    // Fill form
    await page.type('input[name="firstName"]', 'Test');
    await page.type('input[name="surname"]', 'Customer');
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="phone"]', '+44 7700 900000');
    await page.type('input[name="addressLine1"]', '123 Test Street');
    await page.type('input[name="city"]', 'London');
    await page.type('input[name="postcode"]', 'SW1A 1AA');
    await page.type('input[name="startDate"]', '2025-07-01');
    await page.type('input[name="endDate"]', '2025-07-07');
    
    console.log('✏️ Form filled, submitting...');
    
    // Submit and capture any errors
    await page.click('button[data-testid="submit-booking"]');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for error messages
    const errorMessages = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[style*="color: var(--color-ios-red)"], .text-red-500, [data-testid*="error"]');
      return Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text);
    });
    
    console.log('❌ Error messages found:', errorMessages);
    
    // Check for success messages
    const successMessages = await page.evaluate(() => {
      const successElements = document.querySelectorAll('[style*="color: var(--color-ios-green)"], .text-green-500, [data-testid*="success"]');
      return Array.from(successElements).map(el => el.textContent.trim()).filter(text => text);
    });
    
    console.log('✅ Success messages found:', successMessages);
    
    console.log('\n🔍 Investigation completed!');
    
    // Wait a bit before closing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

investigateBookingIssue()
  .then(() => {
    console.log('✅ Investigation completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Investigation failed:', error);
    process.exit(1);
  });