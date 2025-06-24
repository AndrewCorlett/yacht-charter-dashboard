import puppeteer from 'puppeteer';

async function verifyServer() {
  console.log('Launching browser to verify server...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'dashboard-screenshot.png',
      fullPage: true 
    });
    console.log('Screenshot saved as dashboard-screenshot.png');
    
    // Check for main elements
    const title = await page.$eval('h1', el => el.textContent);
    console.log('Page title:', title);
    
    const hasCalendar = await page.$eval('h2', el => el.textContent);
    console.log('Calendar header:', hasCalendar);
    
    // Check for yacht names
    const yachtNames = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div'));
      return elements
        .filter(el => ['Spectre', 'Disk Drive', 'Arriva'].some(name => el.textContent === name))
        .map(el => el.textContent);
    });
    console.log('Found yachts:', yachtNames);
    
    // Check for navigation buttons
    const hasNavButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return {
        today: buttons.some(b => b.textContent === 'Today'),
        viewModes: buttons.filter(b => ['day', 'week', 'month'].includes(b.textContent)).map(b => b.textContent)
      };
    });
    console.log('Navigation buttons:', hasNavButtons);
    
    // Check for bookings
    const bookings = await page.evaluate(() => {
      const bookingCells = Array.from(document.querySelectorAll('.bg-green-100, .bg-red-100'));
      return bookingCells.length;
    });
    console.log('Number of booking cells found:', bookings);
    
    console.log('\n✅ Server is working! Dashboard is accessible at http://localhost:5173');
    
  } catch (error) {
    console.error('Error verifying server:', error);
  } finally {
    await browser.close();
  }
}

// Wait a bit for server to start
setTimeout(() => {
  verifyServer();
}, 2000);