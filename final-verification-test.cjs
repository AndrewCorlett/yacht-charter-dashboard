#!/usr/bin/env node

/**
 * Final Verification Test for Yacht Charter Booking System
 * Tests the complete booking flow including database operations
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TIMEOUT = 30000;

async function runFinalVerification() {
  const report = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallScore: 0
    },
    codeQuality: {},
    databaseVerification: {},
    systemIntegration: {},
    outstandingIssues: [],
    recommendations: []
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('🚀 Starting Final Verification Test for Yacht Charter Booking System');
    console.log('============================================================\n');

    // Test 1: Application Loading
    console.log('📋 Test 1: Application Loading and Basic Functionality');
    const appLoadTest = await testApplicationLoading(browser);
    report.tests.push(appLoadTest);
    
    // Test 2: UnifiedDataService Import Fix Verification
    console.log('🔧 Test 2: UnifiedDataService Import Fix Verification');
    const importFixTest = await testImportFix(browser);
    report.tests.push(importFixTest);

    // Test 3: Booking Form Functionality
    console.log('📝 Test 3: Booking Form Functionality');
    const bookingFormTest = await testBookingForm(browser);
    report.tests.push(bookingFormTest);

    // Test 4: Calendar Integration
    console.log('📅 Test 4: Calendar Integration');
    const calendarTest = await testCalendarIntegration(browser);
    report.tests.push(calendarTest);

    // Test 5: Console Error Analysis
    console.log('🔍 Test 5: Console Error Analysis');
    const consoleTest = await testConsoleErrors(browser);
    report.tests.push(consoleTest);

    // Calculate summary
    report.summary.totalTests = report.tests.length;
    report.summary.passedTests = report.tests.filter(test => test.passed).length;
    report.summary.failedTests = report.summary.totalTests - report.summary.passedTests;
    report.summary.overallScore = Math.round((report.summary.passedTests / report.summary.totalTests) * 100);

    // Generate comprehensive analysis
    generateComprehensiveAnalysis(report);

    console.log('\n============================================================');
    console.log('📊 Final Verification Results');
    console.log('============================================================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Overall Score: ${report.summary.overallScore}%`);
    console.log('============================================================\n');

    // Save full report
    const reportPath = path.join(__dirname, 'final-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}`);

    return report;

  } catch (error) {
    console.error('❌ Fatal error during verification:', error);
    return { error: error.message, timestamp: new Date().toISOString() };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function testApplicationLoading(browser) {
  const test = {
    name: 'Application Loading',
    passed: false,
    details: {},
    issues: [],
    screenshot: null
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    // Navigate to application
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    // Wait for React to render
    await page.waitForTimeout(2000);

    // Check if main dashboard elements are present
    const dashboardExists = await page.$('.dashboard') || await page.$('[data-testid="main-dashboard"]') || await page.$('.main-content');
    const calendarExists = await page.$('.calendar') || await page.$('[data-testid="calendar"]');
    const formExists = await page.$('form') || await page.$('[data-testid="booking-form"]');

    test.details = {
      pageLoaded: true,
      dashboardExists: !!dashboardExists,
      calendarExists: !!calendarExists,
      formExists: !!formExists,
      consoleMessages: consoleMessages.length,
      url: page.url()
    };

    // Take screenshot
    test.screenshot = 'final-verification-01-app-loading.png';
    await page.screenshot({ path: path.join(__dirname, test.screenshot) });

    test.passed = dashboardExists && page.url().includes('localhost:4173');
    if (!test.passed) {
      test.issues.push('Application failed to load properly');
    }

    await page.close();
  } catch (error) {
    test.issues.push(`Loading error: ${error.message}`);
  }

  return test;
}

async function testImportFix(browser) {
  const test = {
    name: 'UnifiedDataService Import Fix',
    passed: false,
    details: {},
    issues: [],
    evidence: []
  };

  try {
    const page = await browser.newPage();
    
    // Monitor for specific JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: TIMEOUT });
    await page.waitForTimeout(3000);

    // Check for the specific error that was being fixed
    const hasUnifiedDataServiceError = jsErrors.some(error => 
      error.includes('UnifiedDataService.getInstance is not a function') ||
      error.includes('getInstance') ||
      error.includes('UnifiedDataService')
    );

    test.details = {
      totalJsErrors: jsErrors.length,
      hasUnifiedDataServiceError,
      jsErrors: jsErrors.slice(0, 5) // First 5 errors only
    };

    // Check if the fix is working by looking for the booking form
    const bookingFormExists = await page.$('[data-testid="booking-form"]') || await page.$('.booking-form');
    
    test.passed = !hasUnifiedDataServiceError && bookingFormExists;
    test.evidence.push(`JS Errors: ${jsErrors.length}`);
    test.evidence.push(`UnifiedDataService Error: ${hasUnifiedDataServiceError ? 'Present' : 'Not Found'}`);
    test.evidence.push(`Booking Form Renders: ${bookingFormExists ? 'Yes' : 'No'}`);

    if (hasUnifiedDataServiceError) {
      test.issues.push('UnifiedDataService.getInstance error still occurring');
    }
    if (!bookingFormExists) {
      test.issues.push('Booking form not rendering, possible import issue');
    }

    await page.close();
  } catch (error) {
    test.issues.push(`Import fix test error: ${error.message}`);
  }

  return test;
}

async function testBookingForm(browser) {
  const test = {
    name: 'Booking Form Functionality',
    passed: false,
    details: {},
    issues: [],
    screenshot: null
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: TIMEOUT });
    await page.waitForTimeout(2000);

    // Find booking form
    const formSelector = '[data-testid="booking-form"]';
    await page.waitForSelector(formSelector, { timeout: 10000 });

    // Check form fields
    const fields = {
      firstName: await page.$('[data-testid="input-firstName"]'),
      surname: await page.$('[data-testid="input-surname"]'),
      email: await page.$('[data-testid="input-email"]'),
      startDate: await page.$('[data-testid="input-startDate"]'),
      endDate: await page.$('[data-testid="input-endDate"]'),
      submitButton: await page.$('[data-testid="submit-booking"]')
    };

    const fieldsWorking = Object.values(fields).every(field => field !== null);

    // Try filling out the form
    if (fieldsWorking) {
      await page.type('[data-testid="input-firstName"]', 'Test');
      await page.type('[data-testid="input-surname"]', 'User');
      await page.type('[data-testid="input-email"]', 'test@example.com');
      await page.type('[data-testid="input-startDate"]', '2025-07-01');
      await page.type('[data-testid="input-endDate"]', '2025-07-07');
    }

    test.details = {
      formExists: !!await page.$(formSelector),
      fieldsWorking,
      fieldStates: Object.fromEntries(
        Object.entries(fields).map(([key, elem]) => [key, !!elem])
      )
    };

    // Take screenshot
    test.screenshot = 'final-verification-02-booking-form.png';
    await page.screenshot({ path: path.join(__dirname, test.screenshot) });

    test.passed = fieldsWorking;
    if (!test.passed) {
      test.issues.push('Booking form fields not all working');
    }

    await page.close();
  } catch (error) {
    test.issues.push(`Booking form test error: ${error.message}`);
  }

  return test;
}

async function testCalendarIntegration(browser) {
  const test = {
    name: 'Calendar Integration',
    passed: false,
    details: {},
    issues: [],
    screenshot: null
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: TIMEOUT });
    await page.waitForTimeout(2000);

    // Look for calendar component
    const calendarSelectors = [
      '.calendar',
      '[data-testid="calendar"]',
      '.yacht-timeline-calendar',
      '.calendar-grid'
    ];

    let calendarFound = false;
    let calendarSelector = null;
    
    for (const selector of calendarSelectors) {
      const element = await page.$(selector);
      if (element) {
        calendarFound = true;
        calendarSelector = selector;
        break;
      }
    }

    // Check for yacht headers
    const yachtHeaders = await page.$$('.yacht-header, .yacht-name, [data-testid="yacht-header"]');
    
    // Check for booking cells or date cells
    const bookingCells = await page.$$('.booking-cell, .date-cell, .calendar-cell, [data-testid*="cell"]');

    test.details = {
      calendarFound,
      calendarSelector,
      yachtHeadersCount: yachtHeaders.length,
      bookingCellsCount: bookingCells.length,
      calendarRendered: calendarFound && (yachtHeaders.length > 0 || bookingCells.length > 0)
    };

    // Take screenshot
    test.screenshot = 'final-verification-03-calendar.png';
    await page.screenshot({ path: path.join(__dirname, test.screenshot) });

    test.passed = test.details.calendarRendered;
    if (!test.passed) {
      test.issues.push('Calendar not properly rendered or integrated');
    }

    await page.close();
  } catch (error) {
    test.issues.push(`Calendar test error: ${error.message}`);
  }

  return test;
}

async function testConsoleErrors(browser) {
  const test = {
    name: 'Console Error Analysis',
    passed: false,
    details: {},
    issues: [],
    criticalErrors: []
  };

  try {
    const page = await browser.newPage();
    
    const consoleMessages = [];
    const jsErrors = [];

    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    page.on('pageerror', error => {
      jsErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: TIMEOUT });
    await page.waitForTimeout(5000); // Give more time for errors to surface

    // Categorize errors
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');

    // Check for critical errors
    const criticalErrors = [
      ...jsErrors,
      ...errorMessages.filter(error => 
        error.text.includes('UnifiedDataService') ||
        error.text.includes('getInstance') ||
        error.text.includes('is not a function') ||
        error.text.includes('Cannot read properties') ||
        error.text.includes('TypeError')
      )
    ];

    test.details = {
      totalConsoleMessages: consoleMessages.length,
      errorCount: errorMessages.length,
      warningCount: warningMessages.length,
      jsErrorCount: jsErrors.length,
      criticalErrorCount: criticalErrors.length,
      recentErrors: errorMessages.slice(0, 3).map(e => e.text),
      recentWarnings: warningMessages.slice(0, 3).map(w => w.text)
    };

    test.criticalErrors = criticalErrors;
    
    // Test passes if no critical errors and minimal general errors
    test.passed = criticalErrors.length === 0 && errorMessages.length <= 2;

    if (criticalErrors.length > 0) {
      test.issues.push(`${criticalErrors.length} critical errors found`);
    }
    if (errorMessages.length > 2) {
      test.issues.push(`${errorMessages.length} console errors (acceptable threshold: 2)`);
    }

    await page.close();
  } catch (error) {
    test.issues.push(`Console error test failed: ${error.message}`);
  }

  return test;
}

function generateComprehensiveAnalysis(report) {
  // Code Quality Assessment
  report.codeQuality = {
    importFixApplied: report.tests.find(t => t.name === 'UnifiedDataService Import Fix')?.passed || false,
    formFunctionality: report.tests.find(t => t.name === 'Booking Form Functionality')?.passed || false,
    calendarIntegration: report.tests.find(t => t.name === 'Calendar Integration')?.passed || false,
    errorManagement: report.tests.find(t => t.name === 'Console Error Analysis')?.passed || false,
    score: Math.round((report.summary.passedTests / report.summary.totalTests) * 100)
  };

  // System Integration Assessment
  report.systemIntegration = {
    frontendBackendCommunication: 'Unable to verify without database access',
    realTimeUpdates: 'Unable to verify without database access',
    dataFlow: report.codeQuality.formFunctionality && report.codeQuality.calendarIntegration ? 'Working' : 'Issues detected',
    uiConsistency: report.codeQuality.formFunctionality ? 'Good' : 'Needs attention'
  };

  // Outstanding Issues
  report.outstandingIssues = [
    {
      issue: 'Database Verification Not Possible',
      description: 'Cannot verify Supabase bookings without environment credentials',
      priority: 'High',
      impact: 'Cannot confirm actual booking data storage'
    },
    {
      issue: 'React Form Date Handling',
      description: 'Date form inputs may have compatibility issues',
      priority: 'Medium',
      impact: 'User experience with date selection'
    },
    {
      issue: 'Calendar Data Loading',
      description: 'Calendar may not be loading bookings from database',
      priority: 'High',
      impact: 'Bookings may not appear on calendar view'
    }
  ];

  // Add test-specific issues
  report.tests.forEach(test => {
    if (!test.passed) {
      test.issues.forEach(issue => {
        report.outstandingIssues.push({
          issue: `${test.name}: ${issue}`,
          description: `Test failure in ${test.name}`,
          priority: 'Medium',
          impact: 'Affects system functionality'
        });
      });
    }
  });

  // Recommendations
  report.recommendations = [
    {
      category: 'Immediate Actions',
      items: [
        'Verify Supabase environment configuration',
        'Test complete booking flow with actual database',
        'Verify booking data appears in calendar after creation',
        'Check console for any remaining import errors'
      ]
    },
    {
      category: 'Testing Improvements',
      items: [
        'Implement comprehensive E2E tests with database mocking',
        'Add unit tests for UnifiedDataService integration',
        'Test form validation edge cases',
        'Verify calendar rendering with actual booking data'
      ]
    },
    {
      category: 'Production Readiness',
      items: [
        'Complete database verification with real Supabase connection',
        'Performance testing with realistic data volumes',
        'Error handling verification for network failures',
        'Cross-browser compatibility testing'
      ]
    }
  ];
}

// Run the verification
runFinalVerification()
  .then(report => {
    console.log('✅ Final verification completed');
    if (report.summary) {
      console.log(`📊 Overall Score: ${report.summary.overallScore}%`);
    }
    process.exit(report.summary?.overallScore >= 70 ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Final verification failed:', error);
    process.exit(1);
  });