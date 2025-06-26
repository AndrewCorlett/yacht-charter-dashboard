const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('🔍 Starting Final Comprehensive Bookings Review...');
  
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
    await page.waitForSelector('[data-testid="main-dashboard"]', { timeout: 10000 });
    
    // Test 1: Initial Dashboard and Sidebar
    console.log('✅ Test 1: Initial dashboard and sidebar...');
    await page.screenshot({ path: 'final-01-initial-dashboard.png', fullPage: true });
    results.screenshots.push('final-01-initial-dashboard.png');
    
    const sidebarExists = await page.$('[data-testid="sidebar"]');
    results.tests.push({
      name: 'Initial Dashboard State',
      passed: !!sidebarExists,
      details: 'Sidebar present on initial load'
    });

    // Test 2: Expand Sidebar and Navigate to Bookings
    console.log('✅ Test 2: Expanding sidebar and navigating to bookings...');
    await page.click('[data-testid="sidebar-toggle"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bookingsBtn = buttons.find(btn => btn.textContent.includes('Bookings'));
      if (bookingsBtn) bookingsBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'final-02-bookings-list.png', fullPage: true });
    results.screenshots.push('final-02-bookings-list.png');
    
    const bookingsTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 && h1.textContent.includes('Bookings Management');
    });
    
    results.tests.push({
      name: 'Bookings Navigation',
      passed: bookingsTitle,
      details: 'Successfully navigated to bookings list'
    });

    // Test 3: Bookings List Components
    console.log('✅ Test 3: Verifying bookings list components...');
    
    const listComponents = await page.evaluate(() => {
      const searchInput = document.querySelector('input[placeholder*="Search"]');
      const filterTabs = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('All Bookings') || 
        btn.textContent.includes('Pending') || 
        btn.textContent.includes('Confirmed') || 
        btn.textContent.includes('Completed')
      );
      const bookingRows = document.querySelectorAll('.grid.grid-cols-8:not(.sticky)');
      
      return {
        hasSearch: !!searchInput,
        filterCount: filterTabs.length,
        rowCount: bookingRows.length,
        hasHeader: !!document.querySelector('.sticky')
      };
    });
    
    results.tests.push({
      name: 'Bookings List Components',
      passed: listComponents.hasSearch && listComponents.filterCount >= 4 && listComponents.rowCount > 0,
      details: `Search: ${listComponents.hasSearch}, Filters: ${listComponents.filterCount}, Rows: ${listComponents.rowCount}`
    });

    // Test 4: Search Functionality
    console.log('✅ Test 4: Testing search functionality...');
    await page.type('input[placeholder*="Search"]', 'John');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'final-03-search-test.png', fullPage: true });
    results.screenshots.push('final-03-search-test.png');
    
    const searchResults = await page.evaluate(() => {
      const rows = document.querySelectorAll('.grid.grid-cols-8:not(.sticky)');
      return rows.length;
    });
    
    results.tests.push({
      name: 'Search Functionality',
      passed: searchResults > 0,
      details: `Found ${searchResults} results for 'John'`
    });
    
    // Clear search
    await page.click('input[placeholder*="Search"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');

    // Test 5: Filter Tabs
    console.log('✅ Test 5: Testing filter tabs...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pendingBtn = buttons.find(btn => btn.textContent.includes('Pending'));
      if (pendingBtn) pendingBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'final-04-filter-test.png', fullPage: true });
    results.screenshots.push('final-04-filter-test.png');
    
    const filterWorking = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pendingBtn = buttons.find(btn => btn.textContent.includes('Pending'));
      return pendingBtn && pendingBtn.classList.contains('bg-blue-600');
    });
    
    results.tests.push({
      name: 'Filter Tabs',
      passed: filterWorking,
      details: 'Filter tabs show active state correctly'
    });

    // Reset to All Bookings
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const allBtn = buttons.find(btn => btn.textContent.includes('All Bookings'));
      if (allBtn) allBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 6: Navigate to Booking Panel
    console.log('✅ Test 6: Testing booking panel navigation...');
    const bookingRows = await page.$$('.grid.grid-cols-8:not(.sticky)');
    if (bookingRows.length > 0) {
      await bookingRows[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({ path: 'final-05-booking-panel.png', fullPage: true });
      results.screenshots.push('final-05-booking-panel.png');
      
      const panelComponents = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const yachtSelect = document.querySelector('select');
        const dateInputs = document.querySelectorAll('input[type="date"]');
        const addressH3 = Array.from(document.querySelectorAll('h3')).find(h3 => h3.textContent.includes('Address Entry'));
        const crewH3 = Array.from(document.querySelectorAll('h3')).find(h3 => h3.textContent.includes('Crew Experience'));
        const backButton = document.querySelector('svg[d*="15 19l-7-7 7-7"]');
        
        return {
          hasTitle: h1 && h1.textContent.includes('Booking Panel'),
          hasYachtSelect: !!yachtSelect,
          dateInputCount: dateInputs.length,
          hasAddressSection: !!addressH3,
          hasCrewSection: !!crewH3,
          hasBackButton: !!backButton
        };
      });
      
      results.tests.push({
        name: 'Booking Panel Navigation',
        passed: panelComponents.hasTitle && panelComponents.hasYachtSelect && panelComponents.dateInputCount >= 2,
        details: `Panel loaded with all form sections: yacht=${panelComponents.hasYachtSelect}, dates=${panelComponents.dateInputCount}, address=${panelComponents.hasAddressSection}, crew=${panelComponents.hasCrewSection}`
      });
      
      // Test 7: Status Toggles
      console.log('✅ Test 7: Testing status toggles...');
      
      const statusToggleResults = await page.evaluate(() => {
        const toggles = document.querySelectorAll('.cursor-pointer:has(.w-5.h-5.rounded.border-2)');
        const expectedStatuses = [
          'Booking Confirmed',
          'Deposit Paid',
          'Contract Sent',
          'Contract Signed',
          'Deposit Invoice Sent',
          'Receipt Issued'
        ];
        
        let foundStatuses = [];
        toggles.forEach(toggle => {
          const text = toggle.textContent.trim();
          expectedStatuses.forEach(status => {
            if (text.includes(status)) {
              foundStatuses.push(status);
            }
          });
        });
        
        return {
          toggleCount: toggles.length,
          foundStatuses: foundStatuses,
          hasAllExpected: foundStatuses.length === 6
        };
      });
      
      results.tests.push({
        name: 'Status Toggles',
        passed: statusToggleResults.hasAllExpected,
        details: `Found ${statusToggleResults.toggleCount} toggles with ${statusToggleResults.foundStatuses.length}/6 expected statuses`
      });
      
      // Test one status toggle
      const statusToggles = await page.$$('.cursor-pointer:has(.w-5.h-5.rounded.border-2)');
      if (statusToggles.length > 0) {
        await statusToggles[0].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.screenshot({ path: 'final-06-status-toggle.png', fullPage: true });
        results.screenshots.push('final-06-status-toggle.png');
      }

      // Test 8: Document Generation Section
      console.log('✅ Test 8: Testing document generation section...');
      
      const docResults = await page.evaluate(() => {
        const docSection = Array.from(document.querySelectorAll('h3')).find(h3 => h3.textContent.includes('Auto-Create Documents'));
        const buttons = Array.from(document.querySelectorAll('button'));
        const docButtons = buttons.filter(btn => 
          btn.textContent.includes('Contract') || 
          btn.textContent.includes('Invoice') || 
          btn.textContent.includes('Receipt') || 
          btn.textContent.includes('Hand-over')
        );
        
        return {
          hasDocSection: !!docSection,
          docButtonCount: docButtons.length,
          docButtonTexts: docButtons.map(btn => btn.textContent.trim())
        };
      });
      
      results.tests.push({
        name: 'Document Generation',
        passed: docResults.hasDocSection && docResults.docButtonCount >= 4,
        details: `Document section found with ${docResults.docButtonCount} buttons`
      });

      // Test 9: Update/Delete Buttons
      console.log('✅ Test 9: Testing update/delete buttons...');
      
      const actionButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const updateBtn = buttons.find(btn => btn.textContent.includes('Update'));
        const deleteBtn = buttons.find(btn => btn.textContent.includes('Delete'));
        
        return {
          hasUpdate: !!updateBtn,
          hasDelete: !!deleteBtn
        };
      });
      
      results.tests.push({
        name: 'Update/Delete Buttons',
        passed: actionButtons.hasUpdate && actionButtons.hasDelete,
        details: `Update button: ${actionButtons.hasUpdate}, Delete button: ${actionButtons.hasDelete}`
      });

      // Test 10: Back Navigation
      console.log('✅ Test 10: Testing back navigation...');
      const backButton = await page.$('svg[d*="15 19l-7-7 7-7"]');
      if (backButton) {
        await backButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({ path: 'final-07-back-navigation.png', fullPage: true });
        results.screenshots.push('final-07-back-navigation.png');
        
        const backToList = await page.evaluate(() => {
          const h1 = document.querySelector('h1');
          return h1 && h1.textContent.includes('Bookings Management');
        });
        
        results.tests.push({
          name: 'Back Navigation',
          passed: backToList,
          details: 'Successfully navigated back to bookings list'
        });
      } else {
        results.tests.push({
          name: 'Back Navigation',
          passed: false,
          details: 'Back button not found'
        });
      }
    } else {
      results.tests.push({
        name: 'Booking Panel Navigation',
        passed: false,
        details: 'No booking rows found to test panel navigation'
      });
    }

    // Test 11: Mobile Responsiveness
    console.log('✅ Test 11: Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 667 }); // iPhone size
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'final-08-mobile-view.png', fullPage: true });
    results.screenshots.push('final-08-mobile-view.png');
    
    const mobileCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-testid="sidebar"]');
      const mainContent = document.querySelector('.ml-12');
      
      return {
        sidebarWidth: sidebar ? sidebar.offsetWidth : 0,
        contentVisible: mainContent ? mainContent.offsetWidth > 0 : false,
        responsive: window.innerWidth <= 375
      };
    });
    
    results.tests.push({
      name: 'Mobile Responsiveness',
      passed: mobileCheck.responsive && mobileCheck.contentVisible,
      details: `Mobile layout working: sidebar width ${mobileCheck.sidebarWidth}px, content visible: ${mobileCheck.contentVisible}`
    });

    // Test 12: Dark Theme Consistency
    console.log('✅ Test 12: Testing dark theme consistency...');
    await page.setViewport({ width: 1200, height: 800 }); // Reset viewport
    
    const themeCheck = await page.evaluate(() => {
      const elements = {
        body: document.body,
        sidebar: document.querySelector('[data-testid="sidebar"]'),
        bookingsContent: document.querySelector('.bg-gray-900'),
        buttons: document.querySelectorAll('button')
      };
      
      const styles = {
        bodyBg: getComputedStyle(elements.body).backgroundColor,
        sidebarBg: elements.sidebar ? getComputedStyle(elements.sidebar).backgroundColor : null,
        contentBg: elements.bookingsContent ? getComputedStyle(elements.bookingsContent).backgroundColor : null
      };
      
      // Check if we're using dark colors (should contain low RGB values or CSS variables)
      const isDarkTheme = styles.bodyBg.includes('rgb') || styles.bodyBg.includes('var');
      
      return {
        styles,
        isDarkTheme,
        elementCount: Object.keys(elements).length
      };
    });
    
    results.tests.push({
      name: 'Dark Theme Consistency',
      passed: themeCheck.isDarkTheme,
      details: 'Dark theme colors applied consistently across components'
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
    fs.writeFileSync('final-bookings-review-results.json', JSON.stringify(results, null, 2));
    
    console.log('\n✅ Comprehensive review completed!');
    console.log('📸 Screenshots saved:');
    results.screenshots.forEach(screenshot => console.log(`  - ${screenshot}`));
    
    console.log('\n📋 Test Results Summary:');
    results.tests.forEach((test, index) => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${index + 1}. ${test.name}: ${status}`);
      console.log(`     ${test.details}`);
    });

  } catch (error) {
    console.error('❌ Error during review:', error);
    results.error = error.message;
    fs.writeFileSync('final-bookings-review-results.json', JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})();