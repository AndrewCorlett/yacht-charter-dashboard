/**
 * Debug script to reproduce the booking update issue
 * Focuses on the crewExperienceFile field mapping problem
 */

const puppeteer = require('puppeteer');

async function debugBookingUpdate() {
  console.log('🔍 Starting booking update debugging...');
  
  let browser, page;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Monitor all network requests
    const failedRequests = [];
    const allRequests = [];
    
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure(),
        headers: request.headers(),
        postData: request.postData()
      });
      console.error(`❌ Request failed: ${request.method()} ${request.url()}`);
      console.error(`   Failure: ${request.failure()?.errorText || 'Unknown'}`);
    });
    
    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`❌ HTTP Error ${response.status()}: ${response.url()}`);
      }
    });
    
    page.on('request', request => {
      if (request.url().includes('bookings') && request.method() === 'PATCH') {
        allRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log(`📡 PATCH request to: ${request.url()}`);
        if (request.postData()) {
          console.log(`📦 Request body:`, request.postData());
        }
      }
    });
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`🐛 Console error: ${msg.text()}`);
      }
    });
    
    console.log('🌐 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'debug-01-initial.png' });
    
    // Navigate to bookings
    console.log('🧭 Navigating to bookings...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bookingsButton = buttons.find(btn => btn.textContent.trim() === 'Bookings');
      if (bookingsButton) {
        bookingsButton.click();
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'debug-02-bookings.png' });
    
    // Click on first booking
    console.log('📝 Opening first booking...');
    await page.evaluate(() => {
      // Find first tentative booking
      const tentativeElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.trim() === 'Tentative'
      );
      
      if (tentativeElements.length > 0) {
        tentativeElements[0].click();
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'debug-03-booking-panel.png' });
    
    // Check if we're now in the booking panel
    const isInBookingPanel = await page.evaluate(() => {
      return document.body.textContent.includes('Booking BK') || 
             document.body.textContent.includes('Trip Type') ||
             document.body.textContent.includes('Deposit Paid');
    });
    
    if (!isInBookingPanel) {
      console.log('❌ Not in booking panel, trying alternative approach...');
      // Let's manually create the scenario that would trigger the error
      await simulateBookingUpdate(page);
    } else {
      console.log('✅ Successfully opened booking panel');
      
      // Try to modify and save a booking
      console.log('🔧 Attempting to modify booking status...');
      
      // Check current network activity before making changes
      const initialRequestCount = allRequests.length;
      
      // Try to find and click a status toggle
      await page.evaluate(() => {
        // Look for status-related elements that might be clickable
        const statusElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent || '';
          return text.includes('Deposit Paid') || text.includes('Booking Confirmed');
        });
        
        // Try to find parent elements that might be clickable
        for (let el of statusElements) {
          let current = el;
          let depth = 0;
          while (current && depth < 5) {
            if (current.onclick || current.getAttribute('role') === 'button' || current.tagName === 'BUTTON') {
              current.click();
              console.log('Clicked status element');
              return;
            }
            current = current.parentElement;
            depth++;
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for a save button
      console.log('💾 Looking for save functionality...');
      const saveAttempted = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const saveButton = buttons.find(btn => {
          const text = btn.textContent.toLowerCase();
          return text.includes('save') || text.includes('update');
        });
        
        if (saveButton) {
          saveButton.click();
          console.log('Found and clicked save button');
          return true;
        }
        
        // Look for keyboard shortcuts or auto-save mechanisms
        // Trigger a change event that might cause auto-save
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        if (inputs.length > 0) {
          const input = inputs[0];
          const event = new Event('change', { bubbles: true });
          input.dispatchEvent(event);
          console.log('Triggered change event on input');
          return true;
        }
        
        return false;
      });
      
      if (saveAttempted) {
        console.log('✅ Save attempt made, waiting for network activity...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.log('❌ No save button found, simulating update...');
        await simulateBookingUpdate(page);
      }
    }
    
    // Check for new requests after our actions
    const finalRequestCount = allRequests.length;
    if (finalRequestCount > initialRequestCount) {
      console.log(`📈 ${finalRequestCount - initialRequestCount} new requests made`);
    }
    
    await page.screenshot({ path: 'debug-04-final.png' });
    
    // Report findings
    console.log('\n📊 DEBUGGING RESULTS:');
    console.log(`Total failed requests: ${failedRequests.length}`);
    console.log(`Total booking PATCH requests: ${allRequests.length}`);
    
    if (failedRequests.length > 0) {
      console.log('\n❌ FAILED REQUESTS:');
      failedRequests.forEach((req, i) => {
        console.log(`${i + 1}. ${req.method} ${req.url}`);
        console.log(`   Error: ${req.failure?.errorText || 'Unknown'}`);
        if (req.postData) {
          console.log(`   Body: ${req.postData.substring(0, 200)}...`);
        }
      });
    }
    
    if (allRequests.length > 0) {
      console.log('\n📡 BOOKING UPDATE REQUESTS:');
      allRequests.forEach((req, i) => {
        console.log(`${i + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          try {
            const data = JSON.parse(req.postData);
            console.log(`   Body keys: ${Object.keys(data).join(', ')}`);
            
            // Check for the problematic crewExperienceFile field
            if (data.crewExperienceFile && typeof data.crewExperienceFile === 'object') {
              console.log(`   🔍 Found crewExperienceFile object:`, data.crewExperienceFile);
              console.log(`   ⚠️  This should be split into individual fields!`);
            }
            
            if (data.crew_experience_file_name || data.crew_experience_file_url || data.crew_experience_file_size) {
              console.log(`   ✅ Found individual crew experience fields`);
            }
          } catch (e) {
            console.log(`   Body: ${req.postData.substring(0, 100)}...`);
          }
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    if (browser) {
      console.log('🔚 Closing browser...');
      await browser.close();
    }
  }
}

async function simulateBookingUpdate(page) {
  console.log('🧪 Simulating booking update to trigger the error...');
  
  // Inject a function that simulates the problematic update
  await page.evaluate(() => {
    // Simulate the exact data that would be sent from BookingPanel
    const problemData = {
      id: 'test-booking-id',
      yacht: 'spectre',
      firstName: 'John',
      surname: 'Doe',
      email: 'john@example.com',
      phone: '+44123456789',
      startDate: '2025-06-28',
      endDate: '2025-07-02',
      depositPaid: true, // Status change that triggers save
      
      // This is the problematic field - it's an object instead of individual fields
      crewExperienceFile: {
        name: 'crew-experience.pdf',
        url: 'https://example.com/file.pdf',
        size: 1024000
      },
      
      status: {
        bookingConfirmed: false,
        depositPaid: true,
        finalPaymentPaid: false,
        contractSent: false,
        contractSigned: false,
        depositInvoiceSent: false,
        receiptIssued: false
      }
    };
    
    // Simulate the transform process that happens in supabase.js
    const transformFieldNames = (data) => {
      const fieldMappings = {
        'firstName': 'customer_first_name',
        'surname': 'customer_surname',
        'email': 'customer_email',
        'phone': 'customer_phone',
        'startDate': 'start_date',
        'endDate': 'end_date',
        'depositPaid': 'deposit_paid',
        'crewExperienceFileName': 'crew_experience_file_name',
        'crewExperienceFileUrl': 'crew_experience_file_url',
        'crewExperienceFileSize': 'crew_experience_file_size'
      };
      
      const transformed = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Skip nested status object
        if (key === 'status' && typeof value === 'object') {
          continue;
        }
        
        // This is where the bug occurs - crewExperienceFile object is passed through unchanged
        const dbFieldName = fieldMappings[key] || key;
        transformed[dbFieldName] = value;
      }
      
      return transformed;
    };
    
    console.log('🔍 Original data:', problemData);
    const transformedData = transformFieldNames(problemData);
    console.log('🔄 Transformed data:', transformedData);
    
    // Check if the problematic field is still an object
    if (transformedData.crewExperienceFile && typeof transformedData.crewExperienceFile === 'object') {
      console.error('❌ BUG REPRODUCED: crewExperienceFile is still an object!');
      console.error('   Database expects: crew_experience_file_name, crew_experience_file_url, crew_experience_file_size');
      console.error('   But received: crewExperienceFile =', transformedData.crewExperienceFile);
    }
    
    // This would cause a 400 error when sent to Supabase
    return transformedData;
  });
}

if (require.main === module) {
  debugBookingUpdate().catch(console.error);
}

module.exports = { debugBookingUpdate };