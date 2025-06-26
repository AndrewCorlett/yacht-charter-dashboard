const puppeteer = require('puppeteer');

async function takeScreenshot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('Loading application...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2', timeout: 10000 });

    // Wait for content to load
    await page.waitForSelector('body', { timeout: 5000 });
    
    console.log('Taking fresh screenshot...');
    await page.screenshot({ 
      path: 'fresh-verification-screenshot.png'
    });

    console.log('Screenshot saved as fresh-verification-screenshot.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshot();