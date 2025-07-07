#!/usr/bin/env node

/**
 * Comprehensive Pre-Scaling Test Suite
 * 
 * This test suite thoroughly validates all functionality of the yacht charter dashboard
 * before implementing the 15% scaling changes.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ComprehensiveTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      testResults: {},
      screenshots: [],
      consoleErrors: [],
      performanceMetrics: {},
      criticalIssues: [],
      recommendations: []
    };
    this.screenshotCounter = 1;
  }

  async initialize() {
    console.log('🚀 Starting Comprehensive Pre-Scaling Test Suite...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Monitor console errors
    this.page.on('console', (message) => {
      if (message.type() === 'error') {
        this.results.consoleErrors.push({
          timestamp: new Date().toISOString(),
          text: message.text(),
          location: message.location()
        });
      }
    });

    // Monitor performance
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      request.continue();
    });

    await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  }

  async takeScreenshot(description, selector = null) {
    const filename = `${String(this.screenshotCounter).padStart(2, '0')}-${description.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    const filepath = path.join(process.cwd(), 'test-screenshots', 'comprehensive-pre-scaling', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (selector) {
      const element = await this.page.$(selector);
      if (element) {
        await element.screenshot({ path: filepath });
      }
    } else {
      await this.page.screenshot({ path: filepath, fullPage: true });
    }
    
    this.results.screenshots.push({
      description,
      filename,
      timestamp: new Date().toISOString()
    });
    
    this.screenshotCounter++;
    console.log(`📸 Screenshot taken: ${description}`);
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`⚠️  Element not found: ${selector}`);
      return false;
    }
  }

  async testApplicationStartup() {
    console.log('\n1️⃣ Testing Application Startup & Navigation...');
    
    const startTime = Date.now();
    
    try {
      // Check if page loads
      await this.page.waitForSelector('body', { timeout: 15000 });
      
      // Take initial screenshot
      await this.takeScreenshot('initial-application-load');
      
      // Check for critical elements
      const criticalElements = [
        '[data-testid="sidebar"]',
        '[data-testid="main-content"]',
        '.sidebar',
        'main'
      ];
      
      let foundCriticalElement = false;
      for (const selector of criticalElements) {
        if (await this.waitForElement(selector, 2000)) {
          foundCriticalElement = true;
          break;
        }
      }
      
      const loadTime = Date.now() - startTime;
      this.results.performanceMetrics.initialLoad = `${loadTime}ms`;
      
      this.results.testResults.applicationStartup = {
        status: foundCriticalElement ? 'PASS' : 'FAIL',
        loadTime: `${loadTime}ms`,
        criticalElementsFound: foundCriticalElement,
        details: foundCriticalElement ? 'Application loaded successfully' : 'Critical elements not found'
      };
      
      if (!foundCriticalElement) {
        this.results.criticalIssues.push('Application failed to load critical UI elements');
      }
      
      console.log(`✅ Application startup: ${foundCriticalElement ? 'PASS' : 'FAIL'} (${loadTime}ms)`);
      
    } catch (error) {
      this.results.testResults.applicationStartup = {
        status: 'FAIL',
        error: error.message,
        details: 'Application failed to load'
      };
      this.results.criticalIssues.push(`Application startup failed: ${error.message}`);
      console.log(`❌ Application startup: FAIL - ${error.message}`);
    }
  }

  async testNavigation() {
    console.log('\n2️⃣ Testing Navigation Between Sections...');
    
    try {
      // First expand the sidebar to make navigation visible
      await this.page.click('[data-testid="sidebar-toggle"]');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const navigationTests = [
        { name: 'Dashboard', selector: 'button', targetText: 'Dashboard' },
        { name: 'Bookings', selector: 'button', targetText: 'Bookings' },
        { name: 'Settings', selector: 'button', targetText: 'Settings' },
        { name: 'Admin', selector: 'button', targetText: 'Admin Config' }
      ];
      
      const navigationResults = {};
      
      for (const nav of navigationTests) {
        try {
          // Try to find and click navigation element
          let clicked = false;
          
          // Use evaluate to find button by text content
          try {
            const button = await this.page.evaluate((targetText) => {
              const buttons = Array.from(document.querySelectorAll('button'));
              return buttons.find(btn => btn.textContent.includes(targetText));
            }, nav.targetText);
            
            if (button) {
              await this.page.evaluate((targetText) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => b.textContent.includes(targetText));
                if (btn) btn.click();
              }, nav.targetText);
              clicked = true;
            }
          } catch (e) {
            console.log(`Failed to click ${nav.name} button:`, e.message);
          }
          
          if (clicked) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.takeScreenshot(`navigation-${nav.name.toLowerCase()}`);
            
            navigationResults[nav.name] = {
              status: 'PASS',
              details: 'Navigation successful'
            };
            console.log(`✅ ${nav.name} navigation: PASS`);
          } else {
            navigationResults[nav.name] = {
              status: 'FAIL',
              details: 'Navigation element not found'
            };
            console.log(`⚠️  ${nav.name} navigation: Element not found`);
          }
          
        } catch (error) {
          navigationResults[nav.name] = {
            status: 'FAIL',
            error: error.message
          };
          console.log(`❌ ${nav.name} navigation: FAIL - ${error.message}`);
        }
      }
      
      this.results.testResults.navigation = navigationResults;
      
    } catch (error) {
      this.results.testResults.navigation = {
        status: 'FAIL',
        error: error.message
      };
      console.log(`❌ Navigation testing failed: ${error.message}`);
    }
  }

  async testSettingsSystem() {
    console.log('\n3️⃣ Testing Settings System...');
    
    try {
      // Navigate to Settings
      await this.navigateToSection('settings');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.takeScreenshot('settings-initial-view');
      
      const settingsTests = {
        documentsTab: await this.testSettingsTab('Documents', ['document-upload', 'file-upload', 'upload']),
        pricingTab: await this.testSettingsTab('Pricing', ['pricing-table', 'price', 'season']),
        automationTab: await this.testSettingsTab('Automation', ['automation', 'coming-soon'])
      };
      
      this.results.testResults.settingsSystem = settingsTests;
      
      const allPassed = Object.values(settingsTests).every(test => test.status === 'PASS');
      console.log(`${allPassed ? '✅' : '⚠️'} Settings system: ${allPassed ? 'PASS' : 'PARTIAL'}`);
      
    } catch (error) {
      this.results.testResults.settingsSystem = {
        status: 'FAIL',
        error: error.message
      };
      console.log(`❌ Settings system test failed: ${error.message}`);
    }
  }

  async testSettingsTab(tabName, expectedElements) {
    try {
      // Try to click the tab
      const tabSelectors = [
        `button:contains("${tabName}")`,
        `[data-tab="${tabName.toLowerCase()}"]`,
        `.tab:contains("${tabName}")`,
        `[role="tab"]:contains("${tabName}")`
      ];
      
      const tabClicked = await this.page.evaluate((tabName) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const tab = buttons.find(btn => btn.textContent.includes(tabName));
        if (tab) {
          tab.click();
          return true;
        }
        return false;
      }, tabName);
      
      if (!tabClicked) {
        return {
          status: 'FAIL',
          details: `${tabName} tab not found`
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.takeScreenshot(`settings-${tabName.toLowerCase()}-tab`);
      
      // Check for expected elements
      let elementsFound = 0;
      for (const element of expectedElements) {
        const found = await this.page.$(`[data-testid*="${element}"], .${element}, #${element}`) !== null;
        if (found) elementsFound++;
      }
      
      return {
        status: elementsFound > 0 ? 'PASS' : 'FAIL',
        elementsFound: `${elementsFound}/${expectedElements.length}`,
        details: `${tabName} tab loaded with ${elementsFound} expected elements`
      };
      
    } catch (error) {
      return {
        status: 'FAIL',
        error: error.message
      };
    }
  }

  async testBookingSystem() {
    console.log('\n4️⃣ Testing Booking System...');
    
    try {
      // Navigate to Bookings
      await this.navigateToSection('bookings');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.takeScreenshot('bookings-list-view');
      
      const bookingTests = {
        listView: await this.testBookingsList(),
        quickCreate: await this.testQuickCreateWidget(),
        bookingForm: await this.testBookingForm(),
        statusToggle: await this.testStatusToggling()
      };
      
      this.results.testResults.bookingSystem = bookingTests;
      
      const allPassed = Object.values(bookingTests).every(test => test.status === 'PASS');
      console.log(`${allPassed ? '✅' : '⚠️'} Booking system: ${allPassed ? 'PASS' : 'PARTIAL'}`);
      
    } catch (error) {
      this.results.testResults.bookingSystem = {
        status: 'FAIL',
        error: error.message
      };
      console.log(`❌ Booking system test failed: ${error.message}`);
    }
  }

  async testBookingsList() {
    try {
      // Look for booking list elements
      const listSelectors = [
        '.booking-list',
        '[data-testid="bookings-list"]',
        '.bookings-container',
        '.booking-item'
      ];
      
      let listFound = false;
      for (const selector of listSelectors) {
        if (await this.page.$(selector)) {
          listFound = true;
          break;
        }
      }
      
      return {
        status: listFound ? 'PASS' : 'FAIL',
        details: listFound ? 'Bookings list found' : 'Bookings list not found'
      };
    } catch (error) {
      return { status: 'FAIL', error: error.message };
    }
  }

  async testQuickCreateWidget() {
    try {
      // Look for quick create elements
      const quickCreateSelectors = [
        '.quick-create',
        '[data-testid="quick-create"]',
        'button:contains("Create")',
        '.create-booking'
      ];
      
      let quickCreateFound = false;
      for (const selector of quickCreateSelectors) {
        try {
          if (selector.includes('contains')) {
            const found = await this.page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              return buttons.some(btn => btn.textContent.includes('Create'));
            });
            if (found) {
              quickCreateFound = true;
              break;
            }
          } else {
            if (await this.page.$(selector)) {
              quickCreateFound = true;
              break;
            }
          }
        } catch (e) {
          // Continue
        }
      }
      
      return {
        status: quickCreateFound ? 'PASS' : 'FAIL',
        details: quickCreateFound ? 'Quick create widget found' : 'Quick create widget not found'
      };
    } catch (error) {
      return { status: 'FAIL', error: error.message };
    }
  }

  async testBookingForm() {
    try {
      // Try to open booking form
      const createClicked = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createBtn = buttons.find(btn => btn.textContent.includes('Create'));
        if (createBtn) {
          createBtn.click();
          return true;
        }
        return false;
      });
      
      if (createClicked) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.takeScreenshot('booking-form-opened');
        
        // Look for form fields
        const formSelectors = [
          'input[type="text"]',
          'input[type="date"]',
          'select',
          'textarea'
        ];
        
        let fieldsFound = 0;
        for (const selector of formSelectors) {
          const fields = await this.page.$$(selector);
          fieldsFound += fields.length;
        }
        
        return {
          status: fieldsFound > 0 ? 'PASS' : 'FAIL',
          fieldsFound,
          details: `Found ${fieldsFound} form fields`
        };
      }
      
      return {
        status: 'FAIL',
        details: 'Create button not found'
      };
    } catch (error) {
      return { status: 'FAIL', error: error.message };
    }
  }

  async testStatusToggling() {
    try {
      // Look for status elements
      const statusSelectors = [
        '.status',
        '[data-status]',
        '.booking-status',
        '.status-badge'
      ];
      
      let statusElementsFound = false;
      for (const selector of statusSelectors) {
        const elements = await this.page.$$(selector);
        if (elements.length > 0) {
          statusElementsFound = true;
          break;
        }
      }
      
      return {
        status: statusElementsFound ? 'PASS' : 'FAIL',
        details: statusElementsFound ? 'Status elements found' : 'Status elements not found'
      };
    } catch (error) {
      return { status: 'FAIL', error: error.message };
    }
  }

  async testDashboard() {
    console.log('\n5️⃣ Testing Dashboard Functionality...');
    
    try {
      await this.navigateToSection('dashboard');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.takeScreenshot('dashboard-main-view');
      
      const dashboardTests = {
        sitrepSection: await this.testSitRepSection(),
        calendarView: await this.testCalendarView(),
        widgets: await this.testWidgetLayout()
      };
      
      this.results.testResults.dashboard = dashboardTests;
      
      const allPassed = Object.values(dashboardTests).every(test => test.status === 'PASS');
      console.log(`${allPassed ? '✅' : '⚠️'} Dashboard: ${allPassed ? 'PASS' : 'PARTIAL'}`);
      
    } catch (error) {
      this.results.testResults.dashboard = {
        status: 'FAIL',
        error: error.message
      };
      console.log(`❌ Dashboard test failed: ${error.message}`);
    }
  }

  async testSitRepSection() {
    try {
      const sitrepSelectors = [
        '.sitrep',
        '[data-testid="sitrep"]',
        '.dashboard-sitrep',
        '.situation-report'
      ];
      
      let sitrepFound = false;
      for (const selector of sitrepSelectors) {
        if (await this.page.$(selector)) {
          sitrepFound = true;
          break;
        }
      }
      
      return {
        status: sitrepFound ? 'PASS' : 'FAIL',
        details: sitrepFound ? 'SitRep section found' : 'SitRep section not found'
      };
    } catch (error) {
      return { status: 'FAIL', error: error.message };
    }
  }

  async testCalendarView() {
    try {
      const calendarSelectors = [
        '.calendar',
        '[data-testid="calendar"]',
        '.yacht-timeline',
        '.timeline-calendar'
      ];
      
      let calendarFound = false;
      for (const selector of calendarSelectors) {
        if (await this.page.$(selector)) {
          calendarFound = true;
          await this.takeScreenshot('calendar-view');
          break;
        }
      }
      
      return {
        status: calendarFound ? 'PASS' : 'FAIL',
        details: calendarFound ? 'Calendar view found' : 'Calendar view not found'
      };
    } catch (error) {
      return { status: 'FAIL', error: error.message };
    }
  }

  async testWidgetLayout() {
    try {
      const widgets = await this.page.$$('.widget, .dashboard-widget, [data-widget]');
      
      return {
        status: widgets.length > 0 ? 'PASS' : 'FAIL',
        widgetCount: widgets.length,
        details: `Found ${widgets.length} widgets`
      };
    } catch (error) {
      return { status: 'FAIL', error: error.message };
    }
  }

  async testAdminConfiguration() {
    console.log('\n6️⃣ Testing Admin Configuration...');
    
    try {
      await this.navigateToSection('admin');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.takeScreenshot('admin-configuration');
      
      const adminElements = await this.page.$$('.admin, [data-section="admin"], .admin-config');
      
      this.results.testResults.adminConfiguration = {
        status: adminElements.length > 0 ? 'PASS' : 'FAIL',
        elementsFound: adminElements.length,
        details: adminElements.length > 0 ? 'Admin section accessible' : 'Admin section not found'
      };
      
      console.log(`${adminElements.length > 0 ? '✅' : '❌'} Admin configuration: ${adminElements.length > 0 ? 'PASS' : 'FAIL'}`);
      
    } catch (error) {
      this.results.testResults.adminConfiguration = {
        status: 'FAIL',
        error: error.message
      };
      console.log(`❌ Admin configuration test failed: ${error.message}`);
    }
  }

  async testResponsiveDesign() {
    console.log('\n7️⃣ Testing Responsive Design...');
    
    const viewports = [
      { name: 'Desktop', width: 1400, height: 900 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    const responsiveResults = {};
    
    for (const viewport of viewports) {
      try {
        await this.page.setViewport(viewport);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
        
        // Check for overflow
        const hasOverflow = await this.page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        responsiveResults[viewport.name] = {
          status: !hasOverflow ? 'PASS' : 'FAIL',
          hasOverflow,
          dimensions: `${viewport.width}x${viewport.height}`,
          details: hasOverflow ? 'Horizontal overflow detected' : 'No overflow issues'
        };
        
        console.log(`${!hasOverflow ? '✅' : '⚠️'} ${viewport.name} (${viewport.width}x${viewport.height}): ${!hasOverflow ? 'PASS' : 'OVERFLOW'}`);
        
      } catch (error) {
        responsiveResults[viewport.name] = {
          status: 'FAIL',
          error: error.message
        };
        console.log(`❌ ${viewport.name} test failed: ${error.message}`);
      }
    }
    
    // Reset to desktop
    await this.page.setViewport({ width: 1400, height: 900 });
    
    this.results.testResults.responsiveDesign = responsiveResults;
  }

  async testPerformanceAndErrors() {
    console.log('\n8️⃣ Testing Performance & Error Monitoring...');
    
    try {
      // Get performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const perf = window.performance;
        const navigation = perf.getEntriesByType('navigation')[0];
        
        return {
          loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 'N/A',
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 'N/A',
          firstPaint: perf.getEntriesByName('first-paint')[0]?.startTime || 'N/A',
          firstContentfulPaint: perf.getEntriesByName('first-contentful-paint')[0]?.startTime || 'N/A'
        };
      });
      
      this.results.performanceMetrics = {
        ...this.results.performanceMetrics,
        ...performanceMetrics
      };
      
      // Check for broken images
      const brokenImages = await this.page.evaluate(() => {
        const images = Array.from(document.images);
        return images.filter(img => !img.complete || img.naturalHeight === 0).length;
      });
      
      // Memory usage estimation
      const memoryInfo = await this.page.evaluate(() => {
        return window.performance.memory ? {
          usedJSHeapSize: window.performance.memory.usedJSHeapSize,
          totalJSHeapSize: window.performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
        } : null;
      });
      
      this.results.testResults.performanceAndErrors = {
        status: this.results.consoleErrors.length === 0 && brokenImages === 0 ? 'PASS' : 'FAIL',
        consoleErrors: this.results.consoleErrors.length,
        brokenImages,
        memoryInfo,
        details: `${this.results.consoleErrors.length} console errors, ${brokenImages} broken images`
      };
      
      console.log(`${this.results.consoleErrors.length === 0 && brokenImages === 0 ? '✅' : '⚠️'} Performance & Errors: ${this.results.consoleErrors.length} errors, ${brokenImages} broken images`);
      
    } catch (error) {
      this.results.testResults.performanceAndErrors = {
        status: 'FAIL',
        error: error.message
      };
      console.log(`❌ Performance test failed: ${error.message}`);
    }
  }

  async navigateToSection(section) {
    // Expand sidebar first if not already expanded
    try {
      const sidebar = await this.page.$('[data-testid="sidebar"]');
      if (sidebar) {
        const width = await sidebar.evaluate(el => el.offsetWidth);
        if (width <= 50) { // Sidebar is collapsed
          await this.page.click('[data-testid="sidebar-toggle"]');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (e) {
      // Continue anyway
    }
    
    // Map sections to their display text
    const sectionMap = {
      'dashboard': 'Dashboard',
      'bookings': 'Bookings', 
      'settings': 'Settings',
      'admin': 'Admin Config'
    };
    
    const targetText = sectionMap[section] || section;
    
    try {
      const clicked = await this.page.evaluate((targetText) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.includes(targetText));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      }, targetText);
      
      if (clicked) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
    } catch (error) {
      console.log(`⚠️ Could not navigate to ${section} section:`, error.message);
    }
    
    return false;
  }

  async generateRecommendations() {
    console.log('\n9️⃣ Generating Recommendations...');
    
    // Analyze results and generate recommendations
    const recommendations = [];
    
    if (this.results.consoleErrors.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Errors',
        issue: `${this.results.consoleErrors.length} console errors detected`,
        recommendation: 'Review and fix console errors before scaling changes'
      });
    }
    
    if (this.results.testResults.applicationStartup?.status === 'FAIL') {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Startup',
        issue: 'Application failed to start properly',
        recommendation: 'Fix critical startup issues before proceeding with scaling'
      });
    }
    
    const failedTests = Object.entries(this.results.testResults)
      .filter(([key, result]) => {
        if (typeof result === 'object' && result.status) {
          return result.status === 'FAIL';
        }
        return false;
      });
    
    if (failedTests.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Functionality',
        issue: `${failedTests.length} test categories failed`,
        recommendation: 'Address failed functionality tests to ensure stability'
      });
    }
    
    const loadTime = parseInt(this.results.performanceMetrics.initialLoad);
    if (loadTime > 3000) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        issue: `Slow initial load time: ${this.results.performanceMetrics.initialLoad}`,
        recommendation: 'Optimize initial load performance before scaling changes'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'INFO',
        category: 'Status',
        issue: 'No critical issues detected',
        recommendation: 'Application appears ready for scaling changes'
      });
    }
    
    this.results.recommendations = recommendations;
    
    recommendations.forEach(rec => {
      const icon = rec.priority === 'CRITICAL' ? '🚨' : rec.priority === 'HIGH' ? '⚠️' : rec.priority === 'MEDIUM' ? '💡' : 'ℹ️';
      console.log(`${icon} ${rec.priority}: ${rec.issue}`);
      console.log(`   → ${rec.recommendation}`);
    });
  }

  async generateReport() {
    console.log('\n📊 Generating Comprehensive Test Report...');
    
    // Calculate overall status
    const totalTests = Object.keys(this.results.testResults).length;
    const passedTests = Object.values(this.results.testResults).filter(result => {
      if (typeof result === 'object' && result.status) {
        return result.status === 'PASS';
      }
      return false;
    }).length;
    
    const overallStatus = this.results.criticalIssues.length === 0 && passedTests === totalTests ? 'READY' : 
                         this.results.criticalIssues.length > 0 ? 'NOT_READY' : 'PARTIALLY_READY';
    
    const report = {
      ...this.results,
      summary: {
        overallStatus,
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        criticalIssues: this.results.criticalIssues.length,
        readyForScaling: overallStatus === 'READY'
      }
    };
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'comprehensive-pre-scaling-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 COMPREHENSIVE PRE-SCALING TEST REPORT');
    console.log('='.repeat(80));
    console.log(`🎯 Overall Status: ${overallStatus}`);
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    console.log(`🚨 Critical Issues: ${this.results.criticalIssues.length}`);
    console.log(`⚠️ Console Errors: ${this.results.consoleErrors.length}`);
    console.log(`⏱️ Load Time: ${this.results.performanceMetrics.initialLoad || 'N/A'}`);
    console.log(`📸 Screenshots: ${this.results.screenshots.length} captured`);
    console.log('='.repeat(80));
    
    if (overallStatus === 'READY') {
      console.log('✅ APPLICATION IS READY FOR 15% SCALING CHANGES');
    } else {
      console.log('⚠️ REVIEW ISSUES BEFORE PROCEEDING WITH SCALING CHANGES');
    }
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    console.log(`📁 Screenshots saved in: test-screenshots/comprehensive-pre-scaling/`);
    
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
      
      await this.testApplicationStartup();
      await this.testNavigation();
      await this.testSettingsSystem();
      await this.testBookingSystem();
      await this.testDashboard();
      await this.testAdminConfiguration();
      await this.testResponsiveDesign();
      await this.testPerformanceAndErrors();
      await this.generateRecommendations();
      
      const report = await this.generateReport();
      return report;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.results.criticalIssues.push(`Test suite failure: ${error.message}`);
      return this.results;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite();
  testSuite.run().then(report => {
    process.exit(report.summary?.readyForScaling ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestSuite;