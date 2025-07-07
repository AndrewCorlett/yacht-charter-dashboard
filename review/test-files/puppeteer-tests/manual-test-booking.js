import puppeteer from 'puppeteer';

async function manualTestBooking() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Track console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    const message = `[${msg.type()}] ${msg.text()}`;
    console.log(message);
    consoleMessages.push(message);
  });
  
  // Track errors
  page.on('error', (error) => {
    console.error('PAGE ERROR:', error);
    consoleMessages.push(`[ERROR] ${error.message}`);
  });
  
  page.on('pageerror', (error) => {
    console.error('PAGE ERROR:', error);
    consoleMessages.push(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    console.log('Opening localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    console.log('✅ Page loaded successfully!');
    console.log('Please manually:');
    console.log('1. Navigate to booking management');
    console.log('2. Find booking "2528AL09" (Customer1 Test1)');
    console.log('3. Edit booking number to "2528AL10"');
    console.log('4. Click save');
    console.log('5. Check console for errors');
    console.log('6. Refresh page');
    console.log('7. Verify booking number persisted');
    
    console.log('\nWaiting for 60 seconds for manual testing...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    console.log('\n=== CONSOLE MESSAGES CAPTURED ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    // Check for errors
    const errorMessages = consoleMessages.filter(msg => 
      msg.includes('[error]') || msg.includes('[ERROR]') || msg.includes('Error')
    );
    
    if (errorMessages.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errorMessages.forEach(err => console.log(err));
    } else {
      console.log('\n✅ NO CONSOLE ERRORS DETECTED');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

manualTestBooking().catch(console.error);