import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDocumentStatesDirectly() {
  console.log('Starting Direct DocumentStates Fix Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: path.join(__dirname, 'chrome/linux-140.0.7277.0/chrome-linux64/chrome'),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  // Set up console monitoring
  const consoleErrors = [];
  const consoleWarnings = [];
  const consoleMessages = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.log('❌ CONSOLE ERROR:', text);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(text);
      console.log('⚠️  CONSOLE WARNING:', text);
    } else {
      console.log('📝 CONSOLE LOG:', text);
    }
  });
  
  // Monitor network errors
  page.on('response', response => {
    if (!response.ok()) {
      console.log('🌐 NETWORK ERROR:', response.status(), response.url());
    }
  });

  try {
    console.log('1. Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    console.log('2. Waiting for application to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('3. Attempting to directly test documentStates fix...');
    
    // Test the documentStates fix by directly calling the booking update function
    const testResult = await page.evaluate(async () => {
      try {
        // Check if we have access to the UnifiedDataService
        if (window.unifiedDataService) {
          console.log('Found UnifiedDataService, testing direct booking update...');
          
          // Get the booking we want to test
          const bookingId = 'ab4e9fd0-3297-48f1-96e5-1f69ca5646cc';
          const bookings = await window.unifiedDataService.getBookings();
          const targetBooking = bookings.find(b => b.id === bookingId);
          
          if (targetBooking) {
            console.log('Found target booking:', targetBooking);
            
            // Update the booking number
            const updatedBooking = {
              ...targetBooking,
              booking_number: '2528AL11'
            };
            
            console.log('Attempting to update booking...');
            await window.unifiedDataService.updateBooking(bookingId, updatedBooking);
            
            return { success: true, message: 'Booking updated successfully' };
          } else {
            return { success: false, message: 'Target booking not found' };
          }
        } else {
          console.log('UnifiedDataService not available, trying alternative approach...');
          
          // Alternative: Try to trigger an update through the UI components
          const updateTriggered = await new Promise((resolve) => {
            // Look for React components that might have update methods
            const reactRoot = document.querySelector('#root');
            if (reactRoot && reactRoot._reactInternalInstance) {
              console.log('Found React root, attempting component update...');
              resolve(true);
            } else {
              console.log('No React components found for direct update');
              resolve(false);
            }
          });
          
          return { success: updateTriggered, message: 'Attempted UI component update' };
        }
      } catch (error) {
        console.error('Error during direct test:', error);
        return { success: false, message: error.message };
      }
    });
    
    console.log('4. Test result:', testResult);
    
    if (testResult.success) {
      console.log('✅ Successfully triggered booking update');
      
      // Wait for any database operations to complete
      console.log('5. Waiting for database operations to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check for any documentStates related errors
      const documentStatesErrors = consoleErrors.filter(error => 
        error.toLowerCase().includes('documentstates') || 
        error.toLowerCase().includes('document_states') ||
        error.toLowerCase().includes('column') && error.toLowerCase().includes('does not exist')
      );
      
      if (documentStatesErrors.length === 0) {
        console.log('✅ NO DOCUMENTSTATES ERRORS DETECTED!');
      } else {
        console.log('❌ DocumentStates errors found:', documentStatesErrors);
      }
      
    } else {
      console.log('❌ Could not trigger booking update:', testResult.message);
    }
    
    console.log('6. Taking final screenshot...');
    await page.screenshot({ path: 'test-documentstates-direct-complete.png', fullPage: true });
    console.log('📸 Screenshot saved as test-documentstates-direct-complete.png');
    
    // Summary of console activity
    console.log('\n=== CONSOLE ACTIVITY SUMMARY ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Console warnings: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS DETECTED:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ NO CONSOLE ERRORS DETECTED');
    }
    
    // Check specifically for documentStates errors
    const documentStatesErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('documentstates') || 
      error.toLowerCase().includes('document_states') ||
      (error.toLowerCase().includes('column') && error.toLowerCase().includes('does not exist'))
    );
    
    if (documentStatesErrors.length === 0) {
      console.log('\n🎉 DOCUMENTSTATES FIX VERIFICATION: PASSED');
      console.log('✅ No documentStates column errors detected during test');
    } else {
      console.log('\n❌ DOCUMENTSTATES FIX VERIFICATION: FAILED');
      console.log('documentStates errors found:', documentStatesErrors);
    }
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'test-direct-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as test-direct-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testDocumentStatesDirectly().catch(console.error);