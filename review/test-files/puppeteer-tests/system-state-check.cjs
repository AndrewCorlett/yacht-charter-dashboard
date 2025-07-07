const puppeteer = require('puppeteer');

(async () => {
  console.log('📷 Taking current system state screenshot...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to application
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for main content to load
    await page.waitForSelector('[data-testid="main-dashboard"], .dashboard-container, #root > div', { timeout: 10000 });
    
    // Wait additional time for React components to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/system-current-state.png',
      fullPage: true 
    });
    
    // Get page information
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasMainDashboard: !!document.querySelector('[data-testid="main-dashboard"]'),
        hasSitrepSection: !!document.querySelector('.sitrep-section, [data-testid="sitrep-section"]'),
        hasCalendar: !!document.querySelector('.calendar-container, [data-testid="yacht-timeline-calendar"]'),
        visibleElements: document.querySelectorAll('*').length,
        bodyText: document.body.innerText.substring(0, 500) + '...'
      };
    });
    
    console.log('📊 Current System State:');
    console.log('- Title:', pageInfo.title);
    console.log('- URL:', pageInfo.url);
    console.log('- Main Dashboard:', pageInfo.hasMainDashboard ? '✅' : '❌');
    console.log('- SitRep Section:', pageInfo.hasSitrepSection ? '✅' : '❌');
    console.log('- Calendar:', pageInfo.hasCalendar ? '✅' : '❌');
    console.log('- Total DOM Elements:', pageInfo.visibleElements);
    console.log('- Page Content Preview:', pageInfo.bodyText);
    
    console.log('✅ Screenshot saved as: system-current-state.png');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();