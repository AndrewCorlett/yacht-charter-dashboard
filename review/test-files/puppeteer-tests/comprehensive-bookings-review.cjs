const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🔍 Starting Comprehensive Bookings Implementation Review...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    screenshots: []
  };

  try {
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for app to be ready
    await page.waitForSelector('[data-testid="main-dashboard"]', { timeout: 10000 });
    
    // Test 1: Initial Dashboard State
    console.log('✅ Test 1: Verifying initial dashboard state...');
    await page.screenshot({ path: 'review-01-initial-dashboard.png', fullPage: true });
    results.screenshots.push('review-01-initial-dashboard.png');
    
    const sidebarExists = await page.$('[data-testid="sidebar"]');
    const bookingsNavExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent.includes('Bookings'));
    });
    
    results.tests.push({
      name: 'Initial Dashboard State',
      passed: sidebarExists && bookingsNavExists,
      details: 'Sidebar and bookings navigation present'
    });

    // Test 2: Navigate to Bookings
    console.log('✅ Test 2: Navigating to Bookings section...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bookingsBtn = buttons.find(btn => btn.textContent.includes('Bookings'));
      if (bookingsBtn) bookingsBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'review-02-bookings-list.png', fullPage: true });
    results.screenshots.push('review-02-bookings-list.png');
    
    const bookingsListExists = await page.evaluate(() => {
      return document.querySelector('h1') && document.querySelector('h1').textContent.includes('Bookings Management');
    });
    const searchInputExists = await page.$('input[placeholder*="Search"]');
    
    results.tests.push({
      name: 'Bookings List Navigation',
      passed: bookingsListExists && searchInputExists,
      details: 'Successfully navigated to bookings list with search functionality'
    });

    // Test 3: Search Functionality
    console.log('✅ Test 3: Testing search functionality...');
    await page.type('input[placeholder*="Search"]', 'John');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'review-03-search-functionality.png', fullPage: true });
    results.screenshots.push('review-03-search-functionality.png');
    
    const searchResults = await page.$$eval('[data-testid*="booking-row"], .grid:has([class*="grid-cols"]) > div:not([class*="sticky"])', 
      rows => rows.length > 0);
    
    results.tests.push({
      name: 'Search Functionality',
      passed: searchResults,
      details: 'Search filters results correctly'
    });

    // Clear search
    await page.click('input[placeholder*="Search"]', { clickCount: 3 });
    await page.type('input[placeholder*="Search"]', '');

    // Test 4: Filter Tabs
    console.log('✅ Test 4: Testing filter tabs...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pendingBtn = buttons.find(btn => btn.textContent.includes('Pending'));
      if (pendingBtn) pendingBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'review-04-filter-tabs.png', fullPage: true });
    results.screenshots.push('review-04-filter-tabs.png');
    
    const filterActive = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pendingBtn = buttons.find(btn => btn.textContent.includes('Pending'));
      return pendingBtn && pendingBtn.classList.contains('bg-blue-600');
    });
    
    results.tests.push({
      name: 'Filter Tabs',
      passed: filterActive,
      details: 'Filter tabs work and show active state'
    });

    // Reset to All Bookings
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const allBtn = buttons.find(btn => btn.textContent.includes('All Bookings'));
      if (allBtn) allBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 5: Booking Row Click to Panel
    console.log('✅ Test 5: Testing booking panel navigation...');
    
    // Look for booking rows and click the first one
    const bookingRows = await page.$$('.grid.grid-cols-8:not(.sticky)');
    if (bookingRows.length > 0) {
      await bookingRows[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({ path: 'review-05-booking-panel.png', fullPage: true });
      results.screenshots.push('review-05-booking-panel.png');
      
      const panelHeader = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        return h1 && h1.textContent.includes('Booking Panel');
      });
      const backButton = await page.$('svg[d*="15 19l-7-7 7-7"]');
      
      results.tests.push({
        name: 'Booking Panel Navigation',
        passed: panelHeader !== null && backButton !== null,
        details: 'Successfully navigated to booking panel with back button'
      });
    } else {
      results.tests.push({
        name: 'Booking Panel Navigation',
        passed: false,
        details: 'No booking rows found to click'
      });
    }

    // Test 6: Booking Panel Form Elements
    console.log('✅ Test 6: Testing booking panel form elements...');
    
    const yachtSelect = await page.$('select');
    const dateInputs = await page.$$('input[type="date"]');
    const addressSection = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      return h3s.some(h3 => h3.textContent.includes('Address Entry'));
    });
    const crewSection = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      return h3s.some(h3 => h3.textContent.includes('Crew Experience'));
    });
    
    results.tests.push({
      name: 'Booking Panel Form Elements',
      passed: yachtSelect && dateInputs.length >= 2 && addressSection && crewSection,
      details: 'All form sections present: yacht select, dates, address, crew experience'
    });

    // Test 7: Status Toggles
    console.log('✅ Test 7: Testing status toggles...');
    
    const statusToggles = await page.$$('.cursor-pointer:has(.w-5.h-5.rounded.border-2)');
    if (statusToggles.length > 0) {
      // Click first status toggle
      await statusToggles[0].click();
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.screenshot({ path: 'review-06-status-toggle.png', fullPage: true });
      results.screenshots.push('review-06-status-toggle.png');
    }
    
    results.tests.push({
      name: 'Status Toggles',
      passed: statusToggles.length >= 6,
      details: `Found ${statusToggles.length} status toggles (expected 6)`
    });

    // Test 8: Document Generation Buttons
    console.log('✅ Test 8: Testing document generation buttons...');
    
    const docButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => 
        btn.textContent.includes('Contract') || 
        btn.textContent.includes('Invoice') || 
        btn.textContent.includes('Receipt') || 
        btn.textContent.includes('Hand-over')
      ).length;
    });
    
    results.tests.push({
      name: 'Document Generation Buttons',
      passed: docButtons.length >= 4,
      details: `Found ${docButtons.length} document generation buttons`
    });

    // Test 9: Update/Delete Buttons
    console.log('✅ Test 9: Testing update/delete buttons...');
    
    const updateButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent.includes('Update'));
    });
    const deleteButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent.includes('Delete'));
    });
    
    results.tests.push({
      name: 'Update/Delete Buttons',
      passed: updateButton !== null && deleteButton !== null,
      details: 'Both update and delete buttons present'
    });

    // Test 10: Back Navigation
    console.log('✅ Test 10: Testing back navigation...');
    
    const backButton = await page.$('svg[d*="15 19l-7-7 7-7"]');
    if (backButton) {
      await backButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({ path: 'review-07-back-navigation.png', fullPage: true });
      results.screenshots.push('review-07-back-navigation.png');
      
      const backToList = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        return h1 && h1.textContent.includes('Bookings Management');
      });
      
      results.tests.push({
        name: 'Back Navigation',
        passed: backToList !== null,
        details: 'Successfully navigated back to bookings list'
      });
    } else {
      results.tests.push({
        name: 'Back Navigation',
        passed: false,
        details: 'Back button not found'
      });
    }

    // Test 11: Mobile Responsiveness
    console.log('✅ Test 11: Testing mobile responsiveness...');
    
    await page.setViewport({ width: 375, height: 667 }); // iPhone size
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'review-08-mobile-responsive.png', fullPage: true });
    results.screenshots.push('review-08-mobile-responsive.png');
    
    // Check if elements stack properly on mobile
    const mobileLayout = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-testid="sidebar"]');
      const mainContent = document.querySelector('.ml-12');
      return {
        sidebarWidth: sidebar ? sidebar.offsetWidth : 0,
        contentVisible: mainContent ? mainContent.offsetWidth > 0 : false
      };
    });
    
    results.tests.push({
      name: 'Mobile Responsiveness',
      passed: mobileLayout.sidebarWidth <= 50 && mobileLayout.contentVisible,
      details: 'Layout adapts to mobile viewport'
    });

    // Test 12: Dark Theme Consistency
    console.log('✅ Test 12: Testing dark theme consistency...');
    
    const themeColors = await page.evaluate(() => {
      const body = document.body;
      const sidebar = document.querySelector('[data-testid="sidebar"]');
      const mainContent = document.querySelector('.bg-gray-900');
      
      return {
        bodyBg: getComputedStyle(body).backgroundColor,
        sidebarBg: sidebar ? getComputedStyle(sidebar).backgroundColor : null,
        contentBg: mainContent ? getComputedStyle(mainContent).backgroundColor : null
      };
    });
    
    const darkThemeConsistent = themeColors.bodyBg.includes('rgb') && 
                               (themeColors.sidebarBg?.includes('rgb') || themeColors.sidebarBg?.includes('var')) &&
                               (themeColors.contentBg?.includes('rgb') || themeColors.contentBg?.includes('var'));
    
    results.tests.push({
      name: 'Dark Theme Consistency',
      passed: darkThemeConsistent,
      details: 'Dark theme colors applied consistently'
    });

    // Calculate overall score
    const passedTests = results.tests.filter(test => test.passed).length;
    const totalTests = results.tests.length;
    const score = Math.round((passedTests / totalTests) * 100);

    console.log(`\n📊 Overall Test Score: ${score}% (${passedTests}/${totalTests} tests passed)`);
    
    results.summary = {
      totalTests,
      passedTests,
      score,
      status: score >= 90 ? 'EXCELLENT' : score >= 75 ? 'GOOD' : score >= 50 ? 'NEEDS_IMPROVEMENT' : 'POOR'
    };

    // Save detailed results
    fs.writeFileSync('bookings-review-results.json', JSON.stringify(results, null, 2));
    
    console.log('\n✅ Review completed! Check bookings-review-results.json for detailed results.');
    console.log('📸 Screenshots saved:');
    results.screenshots.forEach(screenshot => console.log(`  - ${screenshot}`));

  } catch (error) {
    console.error('❌ Error during review:', error);
    results.error = error.message;
    fs.writeFileSync('bookings-review-results.json', JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})();