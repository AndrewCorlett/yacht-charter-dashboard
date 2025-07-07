import puppeteer from 'puppeteer';

async function testServer() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    console.log('Navigating to http://localhost:3777...');
    
    await page.goto('http://localhost:3777', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const title = await page.title();
    console.log('Page title:', title);
    
    const url = page.url();
    console.log('Current URL:', url);
    
    // Take screenshot
    await page.screenshot({ path: 'server-test-screenshot.png' });
    console.log('Screenshot saved as server-test-screenshot.png');
    
    // Check if React app loaded
    const reactRoot = await page.$('#root');
    if (reactRoot) {
      console.log('✅ React app loaded successfully');
    } else {
      console.log('❌ React app not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testServer();