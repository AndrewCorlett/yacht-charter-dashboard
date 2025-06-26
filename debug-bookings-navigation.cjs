const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Debugging Bookings Navigation...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for app to be ready
    await page.waitForSelector('[data-testid="main-dashboard"]', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ path: 'debug-01-initial.png', fullPage: true });
    
    // Check sidebar state
    console.log('🔍 Checking sidebar state...');
    const sidebarInfo = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-testid="sidebar"]');
      const toggleBtn = document.querySelector('[data-testid="sidebar-toggle"]');
      const buttons = Array.from(document.querySelectorAll('button'));
      
      return {
        sidebarExists: !!sidebar,
        sidebarWidth: sidebar ? sidebar.offsetWidth : 0,
        sidebarClasses: sidebar ? sidebar.className : null,
        toggleExists: !!toggleBtn,
        totalButtons: buttons.length,
        buttonTexts: buttons.map(btn => btn.textContent.trim()).filter(text => text.length > 0)
      };
    });
    
    console.log('Sidebar Info:', sidebarInfo);
    
    // Try to expand sidebar first
    console.log('🔧 Expanding sidebar...');
    await page.click('[data-testid="sidebar-toggle"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'debug-02-sidebar-expanded.png', fullPage: true });
    
    // Check if bookings button is now visible
    const bookingsCheck = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bookingsBtn = buttons.find(btn => btn.textContent.includes('Bookings'));
      return {
        found: !!bookingsBtn,
        text: bookingsBtn ? bookingsBtn.textContent : null,
        visible: bookingsBtn ? bookingsBtn.offsetParent !== null : false
      };
    });
    
    console.log('Bookings Button Check:', bookingsCheck);
    
    if (bookingsCheck.found) {
      console.log('✅ Clicking Bookings button...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const bookingsBtn = buttons.find(btn => btn.textContent.includes('Bookings'));
        if (bookingsBtn) bookingsBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: 'debug-03-after-bookings-click.png', fullPage: true });
      
      // Check what's displayed now
      const currentView = await page.evaluate(() => {
        const h1Elements = Array.from(document.querySelectorAll('h1'));
        const mainContent = document.querySelector('.ml-12');
        
        return {
          h1Texts: h1Elements.map(h1 => h1.textContent),
          hasBookingsManagement: h1Elements.some(h1 => h1.textContent.includes('Bookings Management')),
          hasBookingPanel: h1Elements.some(h1 => h1.textContent.includes('Booking Panel')),
          hasCalendar: h1Elements.some(h1 => h1.textContent.includes('Calendar')),
          mainContentChildren: mainContent ? mainContent.children.length : 0
        };
      });
      
      console.log('Current View:', currentView);
      
    } else {
      console.log('❌ Bookings button not found after expanding sidebar');
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await browser.close();
  }
})();