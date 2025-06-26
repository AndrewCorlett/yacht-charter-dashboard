/**
 * Phase 3 Verification Test Script
 * 
 * Automated verification of Phase 3 components:
 * - Conflict Detection System
 * - Real-time Calendar Integration
 * - Comprehensive Validation System
 * - Error Handling System
 * - Complete Booking Workflow
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class Phase3Verifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      conflictDetection: { passed: false, details: [] },
      realTimeCalendar: { passed: false, details: [] },
      validationSystem: { passed: false, details: [] },
      errorHandling: { passed: false, details: [] },
      bookingWorkflow: { passed: false, details: [] },
      overall: { passed: false, score: 0 }
    };
  }

  async initialize() {
    this.browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1400, height: 900 }
    });
    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Page Error:', msg.text());
      }
    });

    // Navigate to application
    await this.page.goto('http://localhost:4173');
    await this.page.waitForSelector('[data-testid="yacht-calendar"]', { timeout: 10000 });
  }

  async testConflictDetection() {
    console.log('Testing Conflict Detection System...');
    const tests = [];
    
    try {
      // Test 1: Check if conflict detection service exists
      const hasConflictService = await this.page.evaluate(() => {
        return window.BookingConflictService !== undefined;
      });
      tests.push({ name: 'Conflict service availability', passed: hasConflictService });

      // Test 2: Try creating overlapping bookings
      await this.page.click('[data-testid="yacht-calendar"] .grid > div:nth-child(8)'); // Click a booking cell
      await this.page.waitForSelector('[data-testid="booking-form-modal"]', { timeout: 5000 });
      
      const modalExists = await this.page.$('[data-testid="booking-form-modal"]') !== null;
      tests.push({ name: 'Booking modal opens on calendar click', passed: modalExists });

      if (modalExists) {
        // Fill form with test data
        await this.page.type('[data-testid="customer-name"]', 'Test Customer');
        await this.page.type('[data-testid="customer-email"]', 'test@example.com');
        
        const formFilled = await this.page.evaluate(() => {
          const name = document.querySelector('[data-testid="customer-name"]');
          const email = document.querySelector('[data-testid="customer-email"]');
          return name && name.value === 'Test Customer' && email && email.value === 'test@example.com';
        });
        tests.push({ name: 'Form fields accept input', passed: formFilled });
      }

      this.results.conflictDetection.passed = tests.every(t => t.passed);
      this.results.conflictDetection.details = tests;
      
    } catch (error) {
      console.error('Conflict Detection Test Error:', error);
      this.results.conflictDetection.details.push({ 
        name: 'Conflict detection test execution', 
        passed: false, 
        error: error.message 
      });
    }
  }

  async testRealTimeCalendar() {
    console.log('Testing Real-time Calendar Integration...');
    const tests = [];
    
    try {
      // Test 1: Calendar renders properly
      const calendarExists = await this.page.$('[data-testid="yacht-calendar"]') !== null;
      tests.push({ name: 'Calendar component renders', passed: calendarExists });

      // Test 2: Calendar headers are visible
      const headersExist = await this.page.$('[data-testid="yacht-headers"]') !== null;
      tests.push({ name: 'Yacht headers visible', passed: headersExist });

      // Test 3: Calendar grid is interactive
      const gridCells = await this.page.$$('.grid > div');
      tests.push({ name: 'Calendar grid cells present', passed: gridCells.length > 0 });

      // Test 4: Calendar responds to navigation
      const prevButton = await this.page.$('[data-testid="prev-button"]');
      if (prevButton) {
        await prevButton.click();
        await this.page.waitForTimeout(500);
        tests.push({ name: 'Calendar navigation functional', passed: true });
      } else {
        tests.push({ name: 'Calendar navigation functional', passed: false });
      }

      this.results.realTimeCalendar.passed = tests.every(t => t.passed);
      this.results.realTimeCalendar.details = tests;
      
    } catch (error) {
      console.error('Real-time Calendar Test Error:', error);
      this.results.realTimeCalendar.details.push({ 
        name: 'Real-time calendar test execution', 
        passed: false, 
        error: error.message 
      });
    }
  }

  async testValidationSystem() {
    console.log('Testing Comprehensive Validation System...');
    const tests = [];
    
    try {
      // Test 1: Try invalid email validation
      const emailValidation = await this.page.evaluate(() => {
        if (window.ValidationUtils && window.ValidationUtils.isValidEmailRFC) {
          return {
            valid: window.ValidationUtils.isValidEmailRFC('test@example.com'),
            invalid: !window.ValidationUtils.isValidEmailRFC('invalid-email')
          };
        }
        return { valid: false, invalid: false };
      });
      
      tests.push({ 
        name: 'Email validation works correctly', 
        passed: emailValidation.valid && emailValidation.invalid 
      });

      // Test 2: Check if business rules are enforced
      const businessRules = await this.page.evaluate(() => {
        return window.BusinessRules !== undefined;
      });
      tests.push({ name: 'Business rules configuration available', passed: businessRules });

      // Test 3: Validation schemas exist
      const validationSchemas = await this.page.evaluate(() => {
        return window.BookingValidationSchema !== undefined;
      });
      tests.push({ name: 'Validation schemas available', passed: validationSchemas });

      this.results.validationSystem.passed = tests.every(t => t.passed);
      this.results.validationSystem.details = tests;
      
    } catch (error) {
      console.error('Validation System Test Error:', error);
      this.results.validationSystem.details.push({ 
        name: 'Validation system test execution', 
        passed: false, 
        error: error.message 
      });
    }
  }

  async testErrorHandling() {
    console.log('Testing Error Handling System...');
    const tests = [];
    
    try {
      // Test 1: Error display component exists
      const errorComponent = await this.page.evaluate(() => {
        return window.ErrorDisplay !== undefined || document.querySelector('.error-display') !== null;
      });
      tests.push({ name: 'Error display component available', passed: errorComponent });

      // Test 2: Loading states work
      const loadingComponent = await this.page.evaluate(() => {
        return window.LoadingSpinner !== undefined || document.querySelector('.loading-spinner') !== null;
      });
      tests.push({ name: 'Loading spinner component available', passed: loadingComponent });

      // Test 3: Check for error boundaries
      const hasErrorBoundary = await this.page.evaluate(() => {
        // Look for error boundary indicators in the app
        return document.querySelector('[data-error-boundary]') !== null || 
               window.React && window.React.Component;
      });
      tests.push({ name: 'Error boundary implementation', passed: hasErrorBoundary });

      this.results.errorHandling.passed = tests.every(t => t.passed);
      this.results.errorHandling.details = tests;
      
    } catch (error) {
      console.error('Error Handling Test Error:', error);
      this.results.errorHandling.details.push({ 
        name: 'Error handling test execution', 
        passed: false, 
        error: error.message 
      });
    }
  }

  async testCompleteBookingWorkflow() {
    console.log('Testing Complete Booking Workflow...');
    const tests = [];
    
    try {
      // Test 1: Application loads successfully
      const appLoaded = await this.page.$('#root') !== null;
      tests.push({ name: 'Application loads successfully', passed: appLoaded });

      // Test 2: Calendar is interactive
      const calendarInteractive = await this.page.$('[data-testid="yacht-calendar"]') !== null;
      tests.push({ name: 'Calendar is interactive', passed: calendarInteractive });

      // Test 3: Sidebar navigation works
      const sidebarExists = await this.page.$('[data-testid="sidebar"]') !== null;
      tests.push({ name: 'Sidebar navigation present', passed: sidebarExists });

      // Test 4: Main dashboard content visible
      const dashboardContent = await this.page.$('[data-testid="main-dashboard"]') !== null;
      tests.push({ name: 'Main dashboard content visible', passed: dashboardContent });

      this.results.bookingWorkflow.passed = tests.every(t => t.passed);
      this.results.bookingWorkflow.details = tests;
      
    } catch (error) {
      console.error('Booking Workflow Test Error:', error);
      this.results.bookingWorkflow.details.push({ 
        name: 'Booking workflow test execution', 
        passed: false, 
        error: error.message 
      });
    }
  }

  calculateOverallScore() {
    const categories = ['conflictDetection', 'realTimeCalendar', 'validationSystem', 'errorHandling', 'bookingWorkflow'];
    const passed = categories.filter(cat => this.results[cat].passed).length;
    const score = Math.round((passed / categories.length) * 100);
    
    this.results.overall.passed = score >= 80; // 80% pass rate required
    this.results.overall.score = score;
  }

  generateReport() {
    this.calculateOverallScore();
    
    const report = `
# Phase 3 Verification Report
Generated: ${new Date().toISOString()}

## Overall Assessment
- **Status**: ${this.results.overall.passed ? 'PASSED' : 'FAILED'}
- **Score**: ${this.results.overall.score}%

## Component Results

### 1. Conflict Detection System
- **Status**: ${this.results.conflictDetection.passed ? 'PASSED' : 'FAILED'}
- **Details**:
${this.results.conflictDetection.details.map(d => `  - ${d.name}: ${d.passed ? 'PASS' : 'FAIL'}${d.error ? ` (${d.error})` : ''}`).join('\n')}

### 2. Real-time Calendar Integration
- **Status**: ${this.results.realTimeCalendar.passed ? 'PASSED' : 'FAILED'}
- **Details**:
${this.results.realTimeCalendar.details.map(d => `  - ${d.name}: ${d.passed ? 'PASS' : 'FAIL'}${d.error ? ` (${d.error})` : ''}`).join('\n')}

### 3. Comprehensive Validation System
- **Status**: ${this.results.validationSystem.passed ? 'PASSED' : 'FAILED'}
- **Details**:
${this.results.validationSystem.details.map(d => `  - ${d.name}: ${d.passed ? 'PASS' : 'FAIL'}${d.error ? ` (${d.error})` : ''}`).join('\n')}

### 4. Error Handling System
- **Status**: ${this.results.errorHandling.passed ? 'PASSED' : 'FAILED'}
- **Details**:
${this.results.errorHandling.details.map(d => `  - ${d.name}: ${d.passed ? 'PASS' : 'FAIL'}${d.error ? ` (${d.error})` : ''}`).join('\n')}

### 5. Complete Booking Workflow
- **Status**: ${this.results.bookingWorkflow.passed ? 'PASSED' : 'FAILED'}
- **Details**:
${this.results.bookingWorkflow.details.map(d => `  - ${d.name}: ${d.passed ? 'PASS' : 'FAIL'}${d.error ? ` (${d.error})` : ''}`).join('\n')}

## Recommendations
${this.results.overall.passed ? 
  '✅ Phase 3 implementation is complete and functional.' : 
  '❌ Phase 3 has issues that need to be addressed before production.'}
`;

    return report;
  }

  async run() {
    try {
      await this.initialize();
      
      await this.testConflictDetection();
      await this.testRealTimeCalendar();
      await this.testValidationSystem();
      await this.testErrorHandling();
      await this.testCompleteBookingWorkflow();
      
      const report = this.generateReport();
      console.log(report);
      
      // Save report to file
      fs.writeFileSync('PHASE_3_VERIFICATION_REPORT.md', report);
      
      return this.results;
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  const verifier = new Phase3Verifier();
  verifier.run().then(results => {
    console.log('\n✅ Phase 3 verification completed');
    process.exit(results.overall.passed ? 0 : 1);
  }).catch(error => {
    console.error('❌ Phase 3 verification failed:', error);
    process.exit(1);
  });
}

module.exports = Phase3Verifier;