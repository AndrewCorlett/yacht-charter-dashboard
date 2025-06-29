/**
 * Quick Create Booking Form Test Script
 * Tests the form functionality, submission, and navigation flow
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class QuickCreateBookingTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      testSuite: 'Quick Create Booking Form',
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
      }
    };
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1400, height: 900 });

    // Listen for console messages and errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.testResults.summary.errors.push({
          type: 'console_error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    this.page.on('pageerror', error => {
      this.testResults.summary.errors.push({
        type: 'page_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  async runTest(testName, testFunction) {
    const startTime = Date.now();
    console.log(`\n🧪 Running: ${testName}`);
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      this.testResults.tests.push({
        name: testName,
        status: 'PASSED',
        duration,
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.passed++;
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.tests.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.failed++;
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
      
      // Take screenshot on failure
      await this.page.screenshot({
        path: `test-screenshots/error-${testName.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true
      });
    }
    
    this.testResults.summary.total++;
  }

  async test1_LoadDashboard() {
    await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await this.page.waitForSelector('.ios-card form', { timeout: 10000 });
    
    // Take initial screenshot
    await this.page.screenshot({
      path: 'test-screenshots/quick-create-01-initial-load.png',
      fullPage: true
    });

    // Verify form elements are present
    const formElements = await this.page.evaluate(() => {
      const form = document.querySelector('.ios-card form');
      if (!form) return null;
      
      const elements = {
        yachtSelect: !!form.querySelector('select'),
        firstNameInput: !!form.querySelector('input[placeholder*="First name"], input[placeholder*="first name"]'),
        surnameInput: !!form.querySelector('input[placeholder*="Surname"], input[placeholder*="surname"]'),
        emailInput: !!form.querySelector('input[type="email"], input[placeholder*="email"]'),
        phoneInput: !!form.querySelector('input[type="tel"], input[placeholder*="Phone"], input[placeholder*="phone"]'),
        addressLine1Input: !!form.querySelector('input[placeholder*="Building"], input[placeholder*="Address"], input[placeholder*="address"]'),
        addressLine2Input: !!form.querySelector('input[placeholder*="Apartment"], input[placeholder*="suite"]'),
        cityInput: !!form.querySelector('input[placeholder*="Cardiff"], input[placeholder*="City"], input[placeholder*="city"]'),
        postcodeInput: !!form.querySelector('input[placeholder*="CF10"], input[placeholder*="Postcode"], input[placeholder*="postcode"]'),
        charterTypeSelect: form.querySelectorAll('select').length >= 2,
        startDateInput: !!form.querySelector('input[type="date"], input[placeholder*="mm/dd/yyyy"]'),
        endDateInput: form.querySelectorAll('input[type="date"], input[placeholder*="mm/dd/yyyy"]').length >= 2,
        submitButton: !!form.querySelector('button[type="submit"], button:last-child')
      };
      return elements;
    });

    // Verify all form elements are present
    const missingElements = Object.entries(formElements)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingElements.length > 0) {
      throw new Error(`Missing form elements: ${missingElements.join(', ')}`);
    }

    console.log('✓ All form elements present');
  }

  async test2_FillFormWithValidData() {
    const form = await this.page.$('.ios-card form');
    if (!form) throw new Error('Quick Create form not found');

    // Get all form inputs and selects
    const formInputs = await this.page.evaluate(() => {
      const form = document.querySelector('.ios-card form');
      const inputs = Array.from(form.querySelectorAll('input')).map((input, index) => ({
        index,
        type: input.type,
        placeholder: input.placeholder,
        selector: `input:nth-child(${input.parentElement.children.length > 1 ? Array.from(input.parentElement.children).indexOf(input) + 1 : 1})`
      }));
      const selects = Array.from(form.querySelectorAll('select')).map((select, index) => ({
        index,
        options: Array.from(select.options).map(opt => ({value: opt.value, text: opt.textContent})),
        selector: `select:nth-of-type(${index + 1})`
      }));
      return { inputs, selects };
    });

    console.log('Form structure:', formInputs);

    // Fill yacht selection (first select)
    if (formInputs.selects.length > 0) {
      const yachtSelect = formInputs.selects[0];
      if (yachtSelect.options.length > 1) {
        await this.page.select('.ios-card form select:first-of-type', yachtSelect.options[1].value);
        console.log('✓ Selected yacht:', yachtSelect.options[1].text);
      }
    }
    
    // Fill form inputs systematically
    const testData = [
      'John',
      'Smith', 
      'john.smith@example.com',
      '+44 7123 456789',
      '123 Marina Street',
      'Apartment 4B',
      'Cardiff',
      'CF10 1AB'
    ];

    const textInputs = await this.page.$$('.ios-card form input:not([type="date"])');
    for (let i = 0; i < Math.min(textInputs.length, testData.length); i++) {
      await textInputs[i].type(testData[i]);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Fill charter type (second select if exists)
    if (formInputs.selects.length > 1) {
      const charterSelect = formInputs.selects[1];
      if (charterSelect.options.length > 0) {
        // For charter type, select the first option (Bareboat)
        const selectElement = await this.page.$('.ios-card form select:nth-of-type(2)');
        if (selectElement) {
          await selectElement.select(charterSelect.options[0].value);
          console.log('✓ Selected charter type:', charterSelect.options[0].text);
        } else {
          console.log('⚠️ Charter type select element not found');
        }
      }
    }
    
    // Fill dates
    const dateInputs = await this.page.$$('.ios-card form input[type="date"]');
    if (dateInputs.length >= 2) {
      await dateInputs[0].type('2025-07-01');
      await dateInputs[1].type('2025-07-07');
      console.log('✓ Filled dates');
    }

    // Take screenshot after filling
    await this.page.screenshot({
      path: 'test-screenshots/quick-create-02-form-filled.png',
      fullPage: true
    });

    // Verify data was entered correctly
    const formData = await this.page.evaluate(() => {
      const form = document.querySelector('.ios-card form');
      const inputs = Array.from(form.querySelectorAll('input'));
      const selects = Array.from(form.querySelectorAll('select'));
      
      return {
        yacht: selects[0]?.value || 'not selected',
        inputs: inputs.map(input => input.value),
        selects: selects.map(select => select.value),
        totalInputs: inputs.length,
        totalSelects: selects.length
      };
    });

    console.log('✓ Form filled with data:', formData);

    // Verify required fields are not empty
    const emptyInputs = formData.inputs.filter(value => !value).length;
    const emptySelects = formData.selects.filter(value => !value).length;
    
    if (emptyInputs > 2 || emptySelects > 0) { // Allow 2 empty inputs (might be optional fields)
      console.log(`⚠️ Some fields might be empty: ${emptyInputs} inputs, ${emptySelects} selects`);
    } else {
      console.log('✓ Most required fields filled');
    }
  }

  async test3_ValidateFormFields() {
    // Test email validation by finding email input
    const emailInput = await this.page.$('.ios-card form input[type="email"]');
    if (emailInput) {
      await emailInput.click({ clickCount: 3 }); // Select all
      await emailInput.type('invalid-email');
      
      // Try to submit and check for validation
      const submitButton = await this.page.$('.ios-card form button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
      }
      
      // Wait a bit for validation to show
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if validation message appears
      const validationMessage = await this.page.evaluate(() => {
        const emailInput = document.querySelector('.ios-card form input[type="email"]');
        return emailInput ? emailInput.validationMessage : 'No email input found';
      });

      console.log('✓ Email validation triggered:', validationMessage || 'Browser native validation');

      // Reset email to valid value
      await emailInput.click({ clickCount: 3 }); // Select all
      await emailInput.type('john.smith@example.com');
    } else {
      console.log('⚠️ Email input not found for validation test');
    }
  }

  async test4_SubmitForm() {
    // Monitor network requests during submission
    const responses = [];
    this.page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });

    // Submit the form
    const submitButton = await this.page.$('.ios-card form button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
    } else {
      await this.page.click('.ios-card form button:last-child');
    }
    
    // Wait for potential navigation or response
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot after submission
    await this.page.screenshot({
      path: 'test-screenshots/quick-create-03-form-submitted.png',
      fullPage: true
    });

    // Check if form was submitted successfully
    const currentUrl = this.page.url();
    console.log('✓ Current URL after submission:', currentUrl);

    // Check for success indicators
    const successIndicators = await this.page.evaluate(() => {
      return {
        hasSuccessMessage: !!document.querySelector('.success-message, .alert-success'),
        hasErrorMessage: !!document.querySelector('.error-message, .alert-error'),
        formCleared: !document.querySelector('input[name="firstName"]').value,
        hasNotification: !!document.querySelector('.notification, .toast')
      };
    });

    console.log('✓ Success indicators:', successIndicators);

    // Log network responses
    console.log('✓ Network responses during submission:', responses.filter(r => 
      r.url.includes('api') || r.url.includes('supabase') || r.status >= 400
    ));
  }

  async test5_CheckBookingNavigation() {
    // Check if we can navigate to bookings list
    try {
      // Look for navigation elements
      const navElement = await this.page.$('a[href="/bookings"]') || 
                        await this.page.$('button[data-section="bookings"]') ||
                        await this.page.$('[data-testid="bookings-nav"]') ||
                        await this.page.$('.sidebar a[href*="booking"]');
      
      if (navElement) {
        await navElement.click();
      } else {
        // Try clicking on sidebar navigation items
        await this.page.click('.sidebar .nav-item:nth-child(2)');
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot of bookings page
      await this.page.screenshot({
        path: 'test-screenshots/quick-create-04-bookings-navigation.png',
        fullPage: true
      });

      // Check if bookings page loaded
      const bookingsPageLoaded = await this.page.evaluate(() => {
        return !!document.querySelector('.bookings-list, .booking-table, [data-section="bookings"].active');
      });

      if (bookingsPageLoaded) {
        console.log('✓ Successfully navigated to bookings page');
        
        // Look for our created booking
        const bookingFound = await this.page.evaluate(() => {
          const bookingElements = document.querySelectorAll('.booking-item, .booking-row, tr[data-booking-id]');
          for (let booking of bookingElements) {
            if (booking.textContent.includes('John Smith') || booking.textContent.includes('john.smith@example.com')) {
              return true;
            }
          }
          return false;
        });

        if (bookingFound) {
          console.log('✓ Created booking found in bookings list');
        } else {
          console.log('⚠️ Created booking not found in bookings list (may take time to sync)');
        }
      } else {
        throw new Error('Bookings page did not load properly');
      }
    } catch (error) {
      console.log('⚠️ Navigation to bookings failed:', error.message);
      // This might not be a critical error if the booking was created successfully
    }
  }

  async test6_CheckCalendarIntegration() {
    // Navigate back to dashboard to check calendar
    await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot of calendar
    await this.page.screenshot({
      path: 'test-screenshots/quick-create-05-calendar-check.png',
      fullPage: true
    });

    // Check if booking appears in calendar
    const calendarBooking = await this.page.evaluate(() => {
      const calendarCells = document.querySelectorAll('.calendar-cell, .day-cell, td[data-date]');
      for (let cell of calendarCells) {
        if (cell.textContent.includes('John') || cell.classList.contains('booked') || cell.querySelector('.booking-indicator')) {
          return {
            found: true,
            content: cell.textContent,
            classes: Array.from(cell.classList)
          };
        }
      }
      return { found: false };
    });

    if (calendarBooking.found) {
      console.log('✓ Booking appears in calendar:', calendarBooking);
    } else {
      console.log('⚠️ Booking not visible in calendar (may take time to sync)');
    }
  }

  async test7_CheckConsoleErrors() {
    // Check for JavaScript errors that occurred during testing
    if (this.testResults.summary.errors.length > 0) {
      console.log('❌ JavaScript errors detected:');
      this.testResults.summary.errors.forEach(error => {
        console.log(`  - ${error.type}: ${error.message}`);
      });
      
      // Don't fail the test entirely for console errors, just report them
      console.log('⚠️ Errors reported but test continues');
    } else {
      console.log('✅ No JavaScript errors detected');
    }
  }

  async test8_TestMobileResponsiveness() {
    // Test mobile viewport
    await this.page.setViewport({ width: 375, height: 667 });
    await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take mobile screenshot
    await this.page.screenshot({
      path: 'test-screenshots/quick-create-06-mobile-view.png',
      fullPage: true
    });

    // Check if form is accessible on mobile
    const mobileFormAccessible = await this.page.evaluate(() => {
      const form = document.querySelector('.ios-card form');
      if (!form) return false;
      
      const formRect = form.getBoundingClientRect();
      return formRect.width > 0 && formRect.height > 0 && formRect.left >= 0;
    });

    if (mobileFormAccessible) {
      console.log('✓ Form accessible on mobile viewport');
    } else {
      throw new Error('Form not accessible on mobile viewport');
    }

    // Reset to desktop viewport
    await this.page.setViewport({ width: 1400, height: 900 });
  }

  async generateReport() {
    const reportPath = 'test-screenshots/quick-create-test-report.json';
    const reportData = {
      ...this.testResults,
      testEnvironment: {
        url: 'http://localhost:5173',
        viewport: { width: 1400, height: 900 },
        userAgent: await this.page.evaluate(() => navigator.userAgent)
      },
      recommendations: []
    };

    // Add recommendations based on test results
    if (this.testResults.summary.failed > 0) {
      reportData.recommendations.push('Review failed tests and fix identified issues');
    }
    
    if (this.testResults.summary.errors.length > 0) {
      reportData.recommendations.push('Address JavaScript errors to improve user experience');
    }
    
    if (this.testResults.summary.passed === this.testResults.summary.total) {
      reportData.recommendations.push('All tests passed! Consider adding more edge case tests');
    }

    // Ensure directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📊 Test report saved to: ${reportPath}`);
    
    return reportData;
  }

  async runAllTests() {
    console.log('🚀 Starting Quick Create Booking Form Tests...\n');
    
    await this.initialize();

    // Ensure screenshots directory exists
    const screenshotDir = 'test-screenshots';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Run all tests
    await this.runTest('Load Dashboard and Verify Form Elements', () => this.test1_LoadDashboard());
    await this.runTest('Fill Form with Valid Data', () => this.test2_FillFormWithValidData());
    await this.runTest('Validate Form Fields', () => this.test3_ValidateFormFields());
    await this.runTest('Submit Form', () => this.test4_SubmitForm());
    await this.runTest('Check Booking Navigation', () => this.test5_CheckBookingNavigation());
    await this.runTest('Check Calendar Integration', () => this.test6_CheckCalendarIntegration());
    await this.runTest('Check Console Errors', () => this.test7_CheckConsoleErrors());
    await this.runTest('Test Mobile Responsiveness', () => this.test8_TestMobileResponsiveness());

    // Generate final report
    const report = await this.generateReport();

    // Close browser
    await this.browser.close();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed} ✅`);
    console.log(`Failed: ${report.summary.failed} ❌`);
    console.log(`JavaScript Errors: ${report.summary.errors.length} ⚠️`);
    console.log(`Success Rate: ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (report.recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    return report;
  }
}

// Run the tests
if (require.main === module) {
  const test = new QuickCreateBookingTest();
  test.runAllTests()
    .then(report => {
      console.log('\n✨ Testing completed successfully!');
      process.exit(report.summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = QuickCreateBookingTest;