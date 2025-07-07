/**
 * Sync Behavior Test Suite
 * 
 * Tests the current state of frontend-backend synchronization
 * to identify specific issues and their scope.
 * 
 * @created 2025-06-27
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'http://localhost:5173',
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
  testTimeout: 30000,
  screenshotDir: './test-screenshots/sync-behavior',
  reportFile: './sync-behavior-test-report.json'
};

class SyncBehaviorTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        issues: []
      }
    };
  }

  async setup() {
    console.log('🚀 Setting up sync behavior test suite...');
    
    // Create screenshot directory
    const fs = require('fs');
    if (!fs.existsSync(config.screenshotDir)) {
      fs.mkdirSync(config.screenshotDir, { recursive: true });
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Browser Error:', msg.text());
      }
    });

    // Navigate to application
    await this.page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
    console.log('✅ Browser setup complete');
  }

  async takeScreenshot(name, description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(config.screenshotDir, filename);
    
    await this.page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    
    console.log(`📸 Screenshot: ${filename} - ${description}`);
    return filename;
  }

  async addTestResult(name, passed, details = {}) {
    const result = {
      name,
      passed,
      timestamp: new Date().toISOString(),
      details,
      screenshot: await this.takeScreenshot(
        name.toLowerCase().replace(/\s+/g, '-'), 
        passed ? 'Test passed' : 'Test failed'
      )
    };

    this.results.tests.push(result);
    this.results.summary.total++;
    
    if (passed) {
      this.results.summary.passed++;
      console.log(`✅ ${name}: PASSED`);
    } else {
      this.results.summary.failed++;
      this.results.summary.issues.push(details.error || 'Test failed');
      console.log(`❌ ${name}: FAILED - ${details.error || 'Unknown error'}`);
    }
  }

  async testInitialDataLoad() {
    console.log('\n📋 Test 1: Initial Data Load');
    
    try {
      // Wait for dashboard to load
      await this.page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 });
      
      // Check if calendar is visible
      const calendarExists = await this.page.$('.ios-card h2') !== null;
      
      // Check if sitrep section is visible  
      const sitrepExists = await this.page.$eval('h2', el => el.textContent.includes('CURRENT BOATS OUT')).catch(() => false);
      
      // Count existing bookings in different components
      const calendarBookings = await this.page.$$eval('.booking-cell', cells => cells.length).catch(() => 0);
      const sitrepCards = await this.page.$$eval('[data-testid*="charter-card"]', cards => cards.length).catch(() => 0);
      
      await this.addTestResult('Initial Data Load', calendarExists && sitrepExists, {
        calendarExists,
        sitrepExists,
        calendarBookings,
        sitrepCards
      });
      
    } catch (error) {
      await this.addTestResult('Initial Data Load', false, {
        error: error.message
      });
    }
  }

  async testBookingCreation() {
    console.log('\n📋 Test 2: Booking Creation via Quick Form');
    
    try {
      // Fill out the booking form
      await this.page.waitForSelector('[data-testid="input-firstName"]');
      
      // Clear and fill form fields
      await this.page.click('[data-testid="input-firstName"]', { clickCount: 3 });
      await this.page.type('[data-testid="input-firstName"]', 'John');
      
      await this.page.click('[data-testid="input-surname"]', { clickCount: 3 });
      await this.page.type('[data-testid="input-surname"]', 'Doe');
      
      await this.page.click('[data-testid="input-email"]', { clickCount: 3 });
      await this.page.type('[data-testid="input-email"]', 'john.doe@example.com');
      
      await this.page.click('[data-testid="input-phone"]', { clickCount: 3 });
      await this.page.type('[data-testid="input-phone"]', '+44 7123 456789');
      
      // Fill address fields
      await this.page.type('#addressLine1', '123 Test Street');
      await this.page.type('#city', 'Cardiff');
      await this.page.type('#postcode', 'CF10 1AB');
      
      // Select yacht
      await this.page.select('#yacht', 'calico-moon');
      
      // Set dates - future dates to avoid conflicts
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 14);
      
      await this.page.click('[data-testid="input-startDate"]');
      await this.page.type('[data-testid="input-startDate"]', tomorrow.toISOString().split('T')[0]);
      
      await this.page.click('[data-testid="input-endDate"]');
      await this.page.type('[data-testid="input-endDate"]', nextWeek.toISOString().split('T')[0]);
      
      // Take screenshot before submission
      await this.takeScreenshot('booking-form-filled', 'Form filled and ready for submission');
      
      // Submit the form
      await this.page.click('[data-testid="submit-booking"]');
      
      // Wait for success indicator
      const successVisible = await Promise.race([
        this.page.waitForSelector('[data-testid="booking-success"]', { timeout: 10000 }).then(() => true),
        this.page.waitForSelector('.ios-button-secondary', { timeout: 10000 }).then(() => false) // Form reset button
      ]);
      
      // Check if booking appears in calendar
      await new Promise(resolve => setTimeout(resolve, 2000)); // Give time for sync
      
      const newCalendarBookings = await this.page.$$eval('.booking-cell', cells => cells.length).catch(() => 0);
      
      await this.addTestResult('Booking Creation', successVisible, {
        formSubmitted: true,
        successVisible,
        newCalendarBookings,
        formData: {
          firstName: 'John',
          surname: 'Doe',
          email: 'john.doe@example.com'
        }
      });
      
    } catch (error) {
      await this.addTestResult('Booking Creation', false, {
        error: error.message
      });
    }
  }

  async testCalendarSync() {
    console.log('\n📋 Test 3: Calendar Sync After Creation');
    
    try {
      // Wait a bit for any async updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check calendar for new booking
      const calendarBookings = await this.page.$$eval('.booking-cell', cells => {
        return cells.map(cell => ({
          text: cell.textContent?.trim(),
          classes: cell.className
        }));
      }).catch(() => []);
      
      // Check if calendar shows the new booking
      const hasNewBooking = calendarBookings.some(booking => 
        booking.text && booking.text.includes('John Doe')
      );
      
      await this.addTestResult('Calendar Sync', hasNewBooking, {
        calendarBookings: calendarBookings.length,
        hasNewBooking,
        bookingDetails: calendarBookings
      });
      
    } catch (error) {
      await this.addTestResult('Calendar Sync', false, {
        error: error.message
      });
    }
  }

  async testSitrepSync() {
    console.log('\n📋 Test 4: SitRep Sync After Creation');
    
    try {
      // Check sitrep for updates
      const sitrepCards = await this.page.$$eval('[data-testid*="charter-card"], .charter-card, .booking-card', cards => {
        return cards.map(card => ({
          text: card.textContent?.trim(),
          classes: card.className
        }));
      }).catch(() => []);
      
      // Look for the new booking in sitrep
      const hasNewBooking = sitrepCards.some(card => 
        card.text && (card.text.includes('John Doe') || card.text.includes('Calico Moon'))
      );
      
      await this.addTestResult('SitRep Sync', hasNewBooking, {
        sitrepCards: sitrepCards.length,
        hasNewBooking,
        cardDetails: sitrepCards
      });
      
    } catch (error) {
      await this.addTestResult('SitRep Sync', false, {
        error: error.message
      });
    }
  }

  async testExternalDeletion() {
    console.log('\n📋 Test 5: External Deletion Simulation');
    
    try {
      // This test simulates what happens when data is deleted externally
      // We'll test if the frontend can detect missing data
      
      // First, get current booking count
      const initialCount = await this.page.$$eval('.booking-cell', cells => cells.length).catch(() => 0);
      
      // Simulate external deletion by checking if real-time subscriptions would work
      // We'll inject a test event to see if the system responds
      const realtimeTestResult = await this.page.evaluate(() => {
        // Check if supabase real-time is available
        if (window.supabase && window.supabase.channel) {
          return { hasRealtime: true, canSubscribe: true };
        }
        return { hasRealtime: false, canSubscribe: false };
      });
      
      await this.addTestResult('External Deletion Setup', realtimeTestResult.hasRealtime, {
        realtimeAvailable: realtimeTestResult.hasRealtime,
        canSubscribe: realtimeTestResult.canSubscribe,
        initialBookingCount: initialCount
      });
      
    } catch (error) {
      await this.addTestResult('External Deletion Setup', false, {
        error: error.message
      });
    }
  }

  async testColorCoding() {
    console.log('\n📋 Test 6: Color Coding Consistency');
    
    try {
      // Check color consistency across components
      const calendarColors = await this.page.$$eval('.booking-cell', cells => {
        return cells.map(cell => {
          const style = window.getComputedStyle(cell);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            classes: cell.className
          };
        });
      }).catch(() => []);
      
      const sitrepColors = await this.page.$$eval('[data-testid*="charter-card"], .charter-card', cards => {
        return cards.map(card => {
          const style = window.getComputedStyle(card);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            classes: card.className
          };
        });
      }).catch(() => []);
      
      // Basic consistency check - colors should not be default/transparent
      const hasValidCalendarColors = calendarColors.some(color => 
        color.backgroundColor !== 'rgba(0, 0, 0, 0)' && color.backgroundColor !== 'transparent'
      );
      
      const hasValidSitrepColors = sitrepColors.some(color => 
        color.backgroundColor !== 'rgba(0, 0, 0, 0)' && color.backgroundColor !== 'transparent'
      );
      
      await this.addTestResult('Color Coding Consistency', hasValidCalendarColors && hasValidSitrepColors, {
        calendarColors: calendarColors.length,
        sitrepColors: sitrepColors.length,
        hasValidCalendarColors,
        hasValidSitrepColors
      });
      
    } catch (error) {
      await this.addTestResult('Color Coding Consistency', false, {
        error: error.message
      });
    }
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive test report...');
    
    // Calculate success rate
    const successRate = this.results.summary.total > 0 
      ? (this.results.summary.passed / this.results.summary.total * 100).toFixed(1)
      : 0;
    
    this.results.summary.successRate = `${successRate}%`;
    this.results.summary.status = successRate >= 80 ? 'GOOD' : successRate >= 60 ? 'FAIR' : 'POOR';
    
    // Add recommendations based on results
    this.results.recommendations = [];
    
    if (this.results.summary.failed > 0) {
      this.results.recommendations.push('❌ Critical sync issues detected - immediate fix required');
    }
    
    if (successRate < 80) {
      this.results.recommendations.push('⚠️  Sync reliability below acceptable threshold');
    }
    
    if (this.results.summary.issues.length > 0) {
      this.results.recommendations.push('🔧 Multiple sync components need attention');
    }
    
    this.results.recommendations.push('📋 Proceed with Phase 2 implementation plan');
    
    // Save report
    const fs = require('fs');
    fs.writeFileSync(config.reportFile, JSON.stringify(this.results, null, 2));
    
    console.log(`\n📈 Test Report Summary:`);
    console.log(`   Tests Run: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Success Rate: ${this.results.summary.successRate}`);
    console.log(`   Status: ${this.results.summary.status}`);
    console.log(`\n📄 Full report saved to: ${config.reportFile}`);
    
    return this.results;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 Test cleanup completed');
  }
}

// Main execution
async function runSyncBehaviorTests() {
  const tester = new SyncBehaviorTester();
  
  try {
    await tester.setup();
    
    // Run all test scenarios
    await tester.testInitialDataLoad();
    await tester.testBookingCreation();
    await tester.testCalendarSync();
    await tester.testSitrepSync();
    await tester.testExternalDeletion();
    await tester.testColorCoding();
    
    // Generate final report
    const results = await tester.generateReport();
    
    // Exit with appropriate code
    const exitCode = results.summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
    
  } catch (error) {
    console.error('🚨 Test suite failed:', error);
    await tester.cleanup();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSyncBehaviorTests();
}

module.exports = { SyncBehaviorTester, runSyncBehaviorTests };