#!/usr/bin/env node

/**
 * Functional Deep Dive Test
 * 
 * This test dives deep into specific functionality of each section to verify
 * all features work correctly before scaling changes.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class FunctionalDeepDiveTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      testResults: {},
      screenshots: [],
      errors: [],
      functionalityTests: {
        dashboard: { status: 'PENDING', tests: [] },
        bookings: { status: 'PENDING', tests: [] },
        settings: { status: 'PENDING', tests: [] },
        admin: { status: 'PENDING', tests: [] }
      }
    };
  }

  async initialize() {
    console.log('🎯 Starting Functional Deep Dive Test...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 300
    });
    
    this.page = await this.browser.newPage();
    
    // Monitor console errors
    this.page.on('console', (message) => {
      if (message.type() === 'error') {
        this.results.errors.push({
          timestamp: new Date().toISOString(),
          text: message.text()
        });
      }
    });

    await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Expand sidebar for navigation
    await this.page.click('[data-testid="sidebar-toggle"]');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async takeScreenshot(description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `functional-${description}-${timestamp}.png`;
    const filepath = path.join(process.cwd(), 'test-screenshots', 'functional-deep-dive', filename);
    
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await this.page.screenshot({ path: filepath, fullPage: true });
    
    this.results.screenshots.push({
      description,
      filename,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📸 Screenshot: ${description}`);
  }

  async navigateToSection(sectionName) {
    const clicked = await this.page.evaluate((targetText) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes(targetText));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, sectionName);
    
    if (clicked) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }
    return false;
  }

  async testDashboardFunctionality() {
    console.log('\n📊 Testing Dashboard Functionality...');
    
    const dashboardTests = [];
    
    // Navigate to Dashboard
    await this.navigateToSection('Dashboard');
    await this.takeScreenshot('01-dashboard-loaded');
    
    // Test 1: SitRep Section
    console.log('  🔍 Testing SitRep Section...');
    const sitrepTest = await this.page.evaluate(() => {
      // Look for SitRep indicators
      const sitrepElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.includes('sitrep') || text.includes('situation');
      });
      
      // Look for dashboard stats
      const statElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.includes('total') || text.includes('pending') || text.includes('confirmed') || text.includes('revenue');
      });
      
      return {
        sitrepElementsFound: sitrepElements.length,
        statElementsFound: statElements.length,
        sitrepElementsText: sitrepElements.slice(0, 3).map(el => el.textContent.trim()),
        statElementsText: statElements.slice(0, 5).map(el => el.textContent.trim())
      };
    });
    
    dashboardTests.push({
      name: 'SitRep Section',
      status: sitrepTest.sitrepElementsFound > 0 || sitrepTest.statElementsFound > 0 ? 'PASS' : 'FAIL',
      details: sitrepTest
    });
    
    // Test 2: Calendar/Timeline View
    console.log('  📅 Testing Calendar/Timeline...');
    const calendarTest = await this.page.evaluate(() => {
      const calendarSelectors = ['.calendar', '.timeline', '.yacht-timeline', '[data-testid*="calendar"]'];
      let calendarFound = false;
      let calendarInfo = {};
      
      for (const selector of calendarSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          calendarFound = true;
          calendarInfo.selector = selector;
          calendarInfo.count = elements.length;
          calendarInfo.visible = Array.from(elements).some(el => el.offsetParent !== null);
          break;
        }
      }
      
      // Look for date-related elements
      const dateElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/) ||
               text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/) ||
               text.match(/\b\d{4}-\d{2}-\d{2}\b/);
      });
      
      return {
        calendarFound,
        calendarInfo,
        dateElementsFound: dateElements.length,
        dateTexts: dateElements.slice(0, 5).map(el => el.textContent.trim())
      };
    });
    
    dashboardTests.push({
      name: 'Calendar/Timeline',
      status: calendarTest.calendarFound || calendarTest.dateElementsFound > 0 ? 'PASS' : 'FAIL',
      details: calendarTest
    });
    
    // Test 3: Quick Create Widget
    console.log('  ⚡ Testing Quick Create Widget...');
    const quickCreateTest = await this.page.evaluate(() => {
      const createButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.toLowerCase().includes('create') ||
        btn.textContent.toLowerCase().includes('quick') ||
        btn.textContent.toLowerCase().includes('new')
      );
      
      return {
        createButtonsFound: createButtons.length,
        buttonTexts: createButtons.slice(0, 3).map(btn => btn.textContent.trim())
      };
    });
    
    dashboardTests.push({
      name: 'Quick Create Widget',
      status: quickCreateTest.createButtonsFound > 0 ? 'PASS' : 'FAIL',
      details: quickCreateTest
    });
    
    // Test 4: Widget Layout
    console.log('  🧩 Testing Widget Layout...');
    const widgetTest = await this.page.evaluate(() => {
      const widgetSelectors = ['.widget', '.card', '.panel', '.dashboard-widget'];
      let widgets = [];
      
      for (const selector of widgetSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        widgets.push(...elements);
      }
      
      const visibleWidgets = widgets.filter(w => w.offsetParent !== null);
      
      return {
        totalWidgets: widgets.length,
        visibleWidgets: visibleWidgets.length,
        widgetTypes: [...new Set(widgets.map(w => w.className || '').filter(c => c))]
      };
    });
    
    dashboardTests.push({
      name: 'Widget Layout',
      status: widgetTest.visibleWidgets > 0 ? 'PASS' : 'FAIL',
      details: widgetTest
    });
    
    this.results.functionalityTests.dashboard = {
      status: dashboardTests.every(t => t.status === 'PASS') ? 'PASS' : 'PARTIAL',
      tests: dashboardTests
    };
    
    await this.takeScreenshot('02-dashboard-tested');
  }

  async testBookingsFunctionality() {
    console.log('\n📋 Testing Bookings Functionality...');
    
    const bookingsTests = [];
    
    // Navigate to Bookings
    await this.navigateToSection('Bookings');
    await this.takeScreenshot('03-bookings-loaded');
    
    // Test 1: Bookings List
    console.log('  📄 Testing Bookings List...');
    const listTest = await this.page.evaluate(() => {
      const listIndicators = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.includes('booking') || text.includes('charter') || text.includes('reservation');
      });
      
      const tableElements = document.querySelectorAll('table, .list, .grid, [role="table"]');
      const rowElements = document.querySelectorAll('tr, .row, .item, [role="row"]');
      
      return {
        listIndicators: listIndicators.length,
        tableElements: tableElements.length,
        rowElements: rowElements.length,
        hasSearchInput: !!document.querySelector('input[placeholder*="earch"], input[type="search"]')
      };
    });
    
    bookingsTests.push({
      name: 'Bookings List View',
      status: listTest.tableElements > 0 || listTest.rowElements > 5 ? 'PASS' : 'PARTIAL',
      details: listTest
    });
    
    // Test 2: Search Functionality
    console.log('  🔍 Testing Search Functionality...');
    const searchInput = await this.page.$('input[placeholder*="earch"], input[type="search"]');
    let searchTest = { hasSearchInput: false, searchWorking: false };
    
    if (searchInput) {
      searchTest.hasSearchInput = true;
      try {
        await searchInput.type('test search');
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.takeScreenshot('04-bookings-search-test');
        searchTest.searchWorking = true;
      } catch (error) {
        console.log('    ⚠️ Search input not interactive');
      }
    }
    
    bookingsTests.push({
      name: 'Search Functionality',
      status: searchTest.hasSearchInput ? (searchTest.searchWorking ? 'PASS' : 'PARTIAL') : 'FAIL',
      details: searchTest
    });
    
    // Test 3: Filter/Status Tabs
    console.log('  🏷️ Testing Filter/Status Tabs...');
    const filterTest = await this.page.evaluate(() => {
      const filterButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = (btn.textContent || '').toLowerCase();
        return text.includes('all') || text.includes('pending') || text.includes('confirmed') || 
               text.includes('active') || text.includes('completed') || text.includes('filter');
      });
      
      const tabElements = document.querySelectorAll('[role="tab"], .tab, .filter-tab');
      
      return {
        filterButtons: filterButtons.length,
        filterButtonTexts: filterButtons.slice(0, 5).map(btn => btn.textContent.trim()),
        tabElements: tabElements.length
      };
    });
    
    bookingsTests.push({
      name: 'Filter/Status Tabs',
      status: filterTest.filterButtons > 0 || filterTest.tabElements > 0 ? 'PASS' : 'FAIL',
      details: filterTest
    });
    
    // Test 4: Create New Booking
    console.log('  ➕ Testing Create New Booking...');
    const createButtons = await this.page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.toLowerCase().includes('create') ||
        btn.textContent.toLowerCase().includes('new') ||
        btn.textContent.toLowerCase().includes('add')
      );
    });
    
    let createTest = { createButtonsFound: createButtons.length, modalOpened: false };
    
    if (createButtons.length > 0) {
      try {
        await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const createBtn = buttons.find(btn => 
            btn.textContent.toLowerCase().includes('create') ||
            btn.textContent.toLowerCase().includes('new')
          );
          if (createBtn) createBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const modalVisible = await this.page.evaluate(() => {
          const modals = document.querySelectorAll('.modal, [role="dialog"], .dialog');
          return Array.from(modals).some(modal => modal.offsetParent !== null);
        });
        
        createTest.modalOpened = modalVisible;
        await this.takeScreenshot('05-bookings-create-test');
        
      } catch (error) {
        console.log('    ⚠️ Create button not working');
      }
    }
    
    bookingsTests.push({
      name: 'Create New Booking',
      status: createTest.createButtonsFound > 0 ? (createTest.modalOpened ? 'PASS' : 'PARTIAL') : 'FAIL',
      details: createTest
    });
    
    this.results.functionalityTests.bookings = {
      status: bookingsTests.filter(t => t.status === 'PASS').length >= bookingsTests.length * 0.5 ? 'PASS' : 'PARTIAL',
      tests: bookingsTests
    };
  }

  async testSettingsFunctionality() {
    console.log('\n⚙️ Testing Settings Functionality...');
    
    const settingsTests = [];
    
    // Navigate to Settings
    await this.navigateToSection('Settings');
    await this.takeScreenshot('06-settings-loaded');
    
    // Test 1: Settings Tabs
    console.log('  📑 Testing Settings Tabs...');
    const tabsTest = await this.page.evaluate(() => {
      const tabButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = (btn.textContent || '').toLowerCase();
        return text.includes('document') || text.includes('pricing') || text.includes('automation') ||
               text.includes('tab') || text.includes('setting');
      });
      
      const tabElements = document.querySelectorAll('[role="tab"], .tab');
      
      return {
        tabButtons: tabButtons.length,
        tabButtonTexts: tabButtons.map(btn => btn.textContent.trim()),
        tabElements: tabElements.length
      };
    });
    
    settingsTests.push({
      name: 'Settings Tabs',
      status: tabsTest.tabButtons > 0 || tabsTest.tabElements > 0 ? 'PASS' : 'FAIL',
      details: tabsTest
    });
    
    // Test 2: Documents Tab
    console.log('  📄 Testing Documents Tab...');
    let documentsTabClicked = false;
    try {
      documentsTabClicked = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const docsBtn = buttons.find(btn => btn.textContent.toLowerCase().includes('document'));
        if (docsBtn) {
          docsBtn.click();
          return true;
        }
        return false;
      });
      
      if (documentsTabClicked) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.takeScreenshot('07-settings-documents-tab');
      }
    } catch (error) {
      console.log('    ⚠️ Could not click documents tab');
    }
    
    const documentsTest = await this.page.evaluate(() => {
      const uploadElements = document.querySelectorAll('input[type="file"], .upload, .file-upload');
      const docTypes = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.includes('contract') || text.includes('invoice') || text.includes('certificate') ||
               text.includes('insurance') || text.includes('document');
      });
      
      return {
        uploadElements: uploadElements.length,
        documentTypes: docTypes.length,
        documentTexts: docTypes.slice(0, 5).map(el => el.textContent.trim())
      };
    });
    
    settingsTests.push({
      name: 'Documents Tab',
      status: documentsTabClicked && (documentsTest.uploadElements > 0 || documentsTest.documentTypes > 0) ? 'PASS' : 'PARTIAL',
      details: { clicked: documentsTabClicked, ...documentsTest }
    });
    
    // Test 3: Pricing Tab
    console.log('  💰 Testing Pricing Tab...');
    let pricingTabClicked = false;
    try {
      pricingTabClicked = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const pricingBtn = buttons.find(btn => btn.textContent.toLowerCase().includes('pricing'));
        if (pricingBtn) {
          pricingBtn.click();
          return true;
        }
        return false;
      });
      
      if (pricingTabClicked) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.takeScreenshot('08-settings-pricing-tab');
      }
    } catch (error) {
      console.log('    ⚠️ Could not click pricing tab');
    }
    
    const pricingTest = await this.page.evaluate(() => {
      const priceElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.includes('price') || text.includes('rate') || text.includes('$') || 
               text.includes('season') || text.includes('discount');
      });
      
      const tableElements = document.querySelectorAll('table, .pricing-table, .rate-table');
      
      return {
        priceElements: priceElements.length,
        tableElements: tableElements.length,
        priceTexts: priceElements.slice(0, 5).map(el => el.textContent.trim())
      };
    });
    
    settingsTests.push({
      name: 'Pricing Tab',
      status: pricingTabClicked && (pricingTest.priceElements > 0 || pricingTest.tableElements > 0) ? 'PASS' : 'PARTIAL',
      details: { clicked: pricingTabClicked, ...pricingTest }
    });
    
    this.results.functionalityTests.settings = {
      status: settingsTests.filter(t => t.status === 'PASS').length >= 2 ? 'PASS' : 'PARTIAL',
      tests: settingsTests
    };
  }

  async testAdminFunctionality() {
    console.log('\n🔧 Testing Admin Functionality...');
    
    const adminTests = [];
    
    // Navigate to Admin
    await this.navigateToSection('Admin Config');
    await this.takeScreenshot('09-admin-loaded');
    
    // Test 1: Admin Configuration Cards
    console.log('  🎛️ Testing Admin Configuration Cards...');
    const configTest = await this.page.evaluate(() => {
      const configButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = (btn.textContent || '').toLowerCase();
        return text.includes('pricing') || text.includes('yacht') || text.includes('document') ||
               text.includes('config') || text.includes('setting');
      });
      
      const cardElements = document.querySelectorAll('.card, .config-card, .admin-card');
      
      return {
        configButtons: configButtons.length,
        configButtonTexts: configButtons.map(btn => btn.textContent.trim()),
        cardElements: cardElements.length
      };
    });
    
    adminTests.push({
      name: 'Configuration Cards',
      status: configTest.configButtons > 0 || configTest.cardElements > 0 ? 'PASS' : 'FAIL',
      details: configTest
    });
    
    // Test 2: Export/Save Functionality
    console.log('  💾 Testing Export/Save Functionality...');
    const saveTest = await this.page.evaluate(() => {
      const saveButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = (btn.textContent || '').toLowerCase();
        return text.includes('save') || text.includes('export') || text.includes('download');
      });
      
      return {
        saveButtons: saveButtons.length,
        saveButtonTexts: saveButtons.map(btn => btn.textContent.trim())
      };
    });
    
    adminTests.push({
      name: 'Export/Save Functionality',
      status: saveTest.saveButtons > 0 ? 'PASS' : 'FAIL',
      details: saveTest
    });
    
    this.results.functionalityTests.admin = {
      status: adminTests.every(t => t.status === 'PASS') ? 'PASS' : 'PARTIAL',
      tests: adminTests
    };
    
    await this.takeScreenshot('10-admin-tested');
  }

  async generateReport() {
    console.log('\n📊 Generating Functional Deep Dive Report...');
    
    // Calculate overall scores
    const sectionResults = Object.entries(this.results.functionalityTests).map(([section, data]) => ({
      section,
      status: data.status,
      totalTests: data.tests.length,
      passedTests: data.tests.filter(t => t.status === 'PASS').length,
      partialTests: data.tests.filter(t => t.status === 'PARTIAL').length
    }));
    
    const overallStatus = sectionResults.every(s => s.status === 'PASS') ? 'EXCELLENT' :
                         sectionResults.filter(s => s.status === 'PASS').length >= 3 ? 'GOOD' :
                         sectionResults.some(s => s.status === 'PASS') ? 'PARTIAL' : 'NEEDS_WORK';
    
    const report = {
      ...this.results,
      summary: {
        overallStatus,
        sectionsWithFullPass: sectionResults.filter(s => s.status === 'PASS').length,
        sectionsWithPartialPass: sectionResults.filter(s => s.status === 'PARTIAL').length,
        totalScreenshots: this.results.screenshots.length,
        totalErrors: this.results.errors.length,
        sectionResults,
        readyForScaling: overallStatus === 'EXCELLENT' || overallStatus === 'GOOD'
      }
    };
    
    const reportPath = path.join(process.cwd(), 'functional-deep-dive-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 FUNCTIONAL DEEP DIVE TEST REPORT');
    console.log('='.repeat(80));
    console.log(`🎯 Overall Status: ${overallStatus}`);
    console.log(`📊 Sections with Full Pass: ${report.summary.sectionsWithFullPass}/4`);
    console.log(`📊 Sections with Partial Pass: ${report.summary.sectionsWithPartialPass}/4`);
    console.log(`📸 Screenshots: ${this.results.screenshots.length}`);
    console.log(`❌ Console Errors: ${this.results.errors.length}`);
    console.log('='.repeat(80));
    
    sectionResults.forEach(section => {
      const icon = section.status === 'PASS' ? '✅' : section.status === 'PARTIAL' ? '⚠️' : '❌';
      console.log(`${icon} ${section.section}: ${section.passedTests}/${section.totalTests} tests passed`);
    });
    
    console.log('='.repeat(80));
    
    if (report.summary.readyForScaling) {
      console.log('✅ APPLICATION IS READY FOR 15% SCALING CHANGES');
    } else {
      console.log('⚠️ REVIEW FINDINGS BEFORE PROCEEDING WITH SCALING CHANGES');
    }
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    console.log(`📁 Screenshots saved in: test-screenshots/functional-deep-dive/`);
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      
      await this.testDashboardFunctionality();
      await this.testBookingsFunctionality();
      await this.testSettingsFunctionality();
      await this.testAdminFunctionality();
      
      const report = await this.generateReport();
      return report;
      
    } catch (error) {
      console.error('❌ Functional test failed:', error.message);
      this.results.errors.push({
        type: 'test-failure',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return this.results;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the functional test
if (require.main === module) {
  const functionalTest = new FunctionalDeepDiveTest();
  functionalTest.run().then(report => {
    process.exit(report.summary?.readyForScaling ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = FunctionalDeepDiveTest;