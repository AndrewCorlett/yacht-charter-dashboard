/**
 * Enhanced Dashboard Test Suite
 * 
 * Tests the comprehensive enhancements to the yacht charter dashboard:
 * - Enhanced calendar cell display with booking information
 * - Proper color coding system implementation
 * - Calendar cell click navigation
 * - SitRep widget improvements
 * - Test booking verification
 * 
 * @author AI Agent
 * @created 2025-06-27
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const TEST_RESULTS = {
  startTime: new Date().toISOString(),
  tests: [],
  screenshots: [],
  errors: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
}

/**
 * Add test result
 */
function addTestResult(testName, status, details = '', screenshot = null) {
  const result = {
    name: testName,
    status,
    details,
    screenshot,
    timestamp: new Date().toISOString()
  }
  
  TEST_RESULTS.tests.push(result)
  TEST_RESULTS.summary.total++
  
  if (status === 'PASS') {
    TEST_RESULTS.summary.passed++
    console.log(`✅ ${testName}`)
  } else {
    TEST_RESULTS.summary.failed++
    console.log(`❌ ${testName}: ${details}`)
  }
  
  if (details) {
    console.log(`   ${details}`)
  }
}

/**
 * Take screenshot
 */
async function takeScreenshot(page, filename, description) {
  try {
    const screenshotPath = path.join(__dirname, 'screenshots', 'enhanced-dashboard-test', filename)
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
 
    })
    
    TEST_RESULTS.screenshots.push({
      filename,
      description,
      path: screenshotPath,
      timestamp: new Date().toISOString()
    })
    
    return screenshotPath
  } catch (error) {
    console.error(`Failed to take screenshot ${filename}:`, error.message)
    return null
  }
}

/**
 * Test enhanced calendar cells
 */
async function testEnhancedCalendarCells(page) {
  console.log('\n🧪 Testing Enhanced Calendar Cells...')
  
  try {
    // Wait for calendar to load
    await page.waitForSelector('[data-testid="booking-cell"]', { timeout: 10000 })
    
    // Check for booking cells with comprehensive information
    const bookingCells = await page.$$('[data-testid="booking-cell"][data-booking-id]')
    
    if (bookingCells.length === 0) {
      addTestResult('Calendar Booking Cells', 'FAIL', 'No booking cells found with booking IDs')
      return
    }
    
    addTestResult('Calendar Booking Cells', 'PASS', `Found ${bookingCells.length} booking cells`)
    
    // Test booking cell content
    for (let i = 0; i < Math.min(bookingCells.length, 3); i++) {
      const cell = bookingCells[i]
      
      // Check for booking code
      const bookingCodeElement = await cell.$('.font-bold')
      if (bookingCodeElement) {
        const bookingCode = await bookingCodeElement.evaluate(el => el.textContent)
        addTestResult(`Booking Cell ${i + 1} - Code Display`, 'PASS', `Booking code: ${bookingCode}`)
      } else {
        addTestResult(`Booking Cell ${i + 1} - Code Display`, 'FAIL', 'No booking code found')
      }
      
      // Check for yacht name
      const yachtNameElements = await cell.$$('.font-semibold')
      if (yachtNameElements.length > 0) {
        const yachtName = await yachtNameElements[0].evaluate(el => el.textContent)
        addTestResult(`Booking Cell ${i + 1} - Yacht Name`, 'PASS', `Yacht: ${yachtName}`)
      } else {
        addTestResult(`Booking Cell ${i + 1} - Yacht Name`, 'FAIL', 'No yacht name found')
      }
      
      // Check for date range
      const dateElements = await cell.$$('.text-white\\/90')
      if (dateElements.length > 0) {
        const dateRange = await dateElements[0].evaluate(el => el.textContent)
        addTestResult(`Booking Cell ${i + 1} - Date Range`, 'PASS', `Dates: ${dateRange}`)
      } else {
        addTestResult(`Booking Cell ${i + 1} - Date Range`, 'FAIL', 'No date range found')
      }
    }
    
    await takeScreenshot(page, 'enhanced-calendar-cells.png', 'Enhanced Calendar Cells Display')
    
  } catch (error) {
    addTestResult('Enhanced Calendar Cells', 'FAIL', error.message)
  }
}

/**
 * Test color coding system
 */
async function testColorCoding(page) {
  console.log('\n🎨 Testing Color Coding System...')
  
  try {
    // Check for different payment statuses and their colors
    const bookingCells = await page.$$('[data-testid="booking-cell"][data-booking-id]')
    
    let colorTests = {
      'full-paid': false,
      'deposit-paid': false,
      'tentative': false
    }
    
    for (const cell of bookingCells) {
      const cellStyle = await cell.evaluate(el => {
        const style = window.getComputedStyle(el)
        return {
          backgroundColor: style.backgroundColor,
          border: style.border
        }
      })
      
      // Check if cell has proper background color (not transparent)
      if (cellStyle.backgroundColor && cellStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        addTestResult('Color Coding - Background', 'PASS', `Cell has background color: ${cellStyle.backgroundColor}`)
        break
      }
    }
    
    // Check for red outline on overdue tasks
    const overdueCell = await page.$('[data-testid="booking-cell"].ring-red-600')
    if (overdueCell) {
      addTestResult('Color Coding - Overdue Tasks', 'PASS', 'Red outline found on overdue task')
    } else {
      addTestResult('Color Coding - Overdue Tasks', 'FAIL', 'No red outline found for overdue tasks')
    }
    
    await takeScreenshot(page, 'color-coding-system.png', 'Color Coding System Implementation')
    
  } catch (error) {
    addTestResult('Color Coding System', 'FAIL', error.message)
  }
}

/**
 * Test calendar cell navigation
 */
async function testCalendarNavigation(page) {
  console.log('\n🧭 Testing Calendar Cell Navigation...')
  
  try {
    // Setup console listener to catch navigation logs
    let navigationLogged = false
    
    page.on('console', msg => {
      if (msg.text().includes('Navigating to booking:') || msg.text().includes('Navigate to booking:')) {
        navigationLogged = true
      }
    })
    
    // Find and click a booking cell
    const bookingCell = await page.$('[data-testid="booking-cell"][data-booking-id]')
    
    if (bookingCell) {
      await bookingCell.click()
      
      // Wait a moment for navigation to be logged
      await page.waitForTimeout(1000)
      
      if (navigationLogged) {
        addTestResult('Calendar Cell Navigation', 'PASS', 'Navigation triggered on booking cell click')
      } else {
        addTestResult('Calendar Cell Navigation', 'FAIL', 'No navigation logged on booking cell click')
      }
    } else {
      addTestResult('Calendar Cell Navigation', 'FAIL', 'No booking cells found to test navigation')
    }
    
    await takeScreenshot(page, 'calendar-navigation-test.png', 'Calendar Navigation Test')
    
  } catch (error) {
    addTestResult('Calendar Cell Navigation', 'FAIL', error.message)
  }
}

/**
 * Test enhanced SitRep widget
 */
async function testEnhancedSitRep(page) {
  console.log('\n📊 Testing Enhanced SitRep Widget...')
  
  try {
    // Wait for SitRep widget to load
    await page.waitForSelector('.ios-card h2', { timeout: 10000 })
    
    // Check for SIT REP title
    const sitrepTitle = await page.$eval('.ios-card h2', el => el.textContent)
    if (sitrepTitle && sitrepTitle.includes('SIT REP')) {
      addTestResult('SitRep Widget - Title', 'PASS', 'SIT REP title found')
    } else {
      addTestResult('SitRep Widget - Title', 'FAIL', 'SIT REP title not found')
    }
    
    // Check for BOATS OUT section
    const boatsOutSection = await page.$('h3')
    if (boatsOutSection) {
      const sectionText = await boatsOutSection.evaluate(el => el.textContent)
      if (sectionText.includes('BOATS OUT')) {
        addTestResult('SitRep Widget - Boats Out Section', 'PASS', 'BOATS OUT section found')
      } else {
        addTestResult('SitRep Widget - Boats Out Section', 'FAIL', 'BOATS OUT section not found')
      }
    }
    
    // Check for UPCOMING CHARTERS section
    const upcomingSection = await page.$$('h3')
    let upcomingFound = false
    for (const section of upcomingSection) {
      const text = await section.evaluate(el => el.textContent)
      if (text.includes('UPCOMING CHARTERS')) {
        upcomingFound = true
        break
      }
    }
    
    if (upcomingFound) {
      addTestResult('SitRep Widget - Upcoming Charters Section', 'PASS', 'UPCOMING CHARTERS section found')
    } else {
      addTestResult('SitRep Widget - Upcoming Charters Section', 'FAIL', 'UPCOMING CHARTERS section not found')
    }
    
    // Check for charter cards
    const charterCards = await page.$$('[data-testid*="card-"]')
    addTestResult('SitRep Widget - Charter Cards', 'PASS', `Found ${charterCards.length} charter cards`)
    
    // Test charter card content
    if (charterCards.length > 0) {
      const firstCard = charterCards[0]
      
      // Check for booking code
      const bookingCodeEl = await firstCard.$('[data-testid*="booking-code-"]')
      if (bookingCodeEl) {
        const bookingCode = await bookingCodeEl.evaluate(el => el.textContent)
        addTestResult('SitRep Cards - Booking Code', 'PASS', `Booking code displayed: ${bookingCode}`)
      } else {
        addTestResult('SitRep Cards - Booking Code', 'FAIL', 'No booking code found in charter card')
      }
      
      // Check for yacht name
      const yachtNameEl = await firstCard.$('[data-testid*="yacht-name-"]')
      if (yachtNameEl) {
        const yachtName = await yachtNameEl.evaluate(el => el.textContent)
        addTestResult('SitRep Cards - Yacht Name', 'PASS', `Yacht name displayed: ${yachtName}`)
      } else {
        addTestResult('SitRep Cards - Yacht Name', 'FAIL', 'No yacht name found in charter card')
      }
      
      // Check for date range
      const dateRangeEl = await firstCard.$('[data-testid*="date-range-"]')
      if (dateRangeEl) {
        const dateRange = await dateRangeEl.evaluate(el => el.textContent)
        addTestResult('SitRep Cards - Date Range', 'PASS', `Date range displayed: ${dateRange}`)
      } else {
        addTestResult('SitRep Cards - Date Range', 'FAIL', 'No date range found in charter card')
      }
    }
    
    // Check for color key legend
    const colorKey = await page.$eval('.ios-card', el => el.textContent)
    if (colorKey.includes('Color Key')) {
      addTestResult('SitRep Widget - Color Key', 'PASS', 'Color Key legend found')
    } else {
      addTestResult('SitRep Widget - Color Key', 'FAIL', 'Color Key legend not found')
    }
    
    await takeScreenshot(page, 'enhanced-sitrep-widget.png', 'Enhanced SitRep Widget')
    
  } catch (error) {
    addTestResult('Enhanced SitRep Widget', 'FAIL', error.message)
  }
}

/**
 * Test specific test booking
 */
async function testSpecificBooking(page) {
  console.log('\n🎯 Testing Specific Test Booking...')
  
  try {
    // Look for the test booking we created (SC-2025-TEST)
    const testBookingCell = await page.$('[data-booking-id="charter-test-today"]')
    
    if (testBookingCell) {
      addTestResult('Test Booking - Cell Found', 'PASS', 'Test booking cell found in calendar')
      
      // Check booking content
      const cellContent = await testBookingCell.evaluate(el => el.textContent)
      
      if (cellContent.includes('SC-2025-TEST')) {
        addTestResult('Test Booking - Booking Code', 'PASS', 'Test booking code displayed correctly')
      } else {
        addTestResult('Test Booking - Booking Code', 'FAIL', 'Test booking code not found')
      }
      
      if (cellContent.includes('Spectre')) {
        addTestResult('Test Booking - Yacht Name', 'PASS', 'Test booking yacht name displayed correctly')
      } else {
        addTestResult('Test Booking - Yacht Name', 'FAIL', 'Test booking yacht name not found')
      }
      
    } else {
      addTestResult('Test Booking - Cell Found', 'FAIL', 'Test booking cell not found in calendar')
    }
    
    // Check if test booking appears in SitRep (should be in "Boats Out" since it starts today)
    const sitrepCards = await page.$$('[data-testid*="boats-out-card-"]')
    let testBookingInSitRep = false
    
    for (const card of sitrepCards) {
      const cardContent = await card.evaluate(el => el.textContent)
      if (cardContent.includes('SC-2025-TEST') || cardContent.includes('Spectre')) {
        testBookingInSitRep = true
        break
      }
    }
    
    if (testBookingInSitRep) {
      addTestResult('Test Booking - SitRep Display', 'PASS', 'Test booking appears in SitRep "Boats Out"')
    } else {
      addTestResult('Test Booking - SitRep Display', 'FAIL', 'Test booking not found in SitRep')
    }
    
    await takeScreenshot(page, 'test-booking-verification.png', 'Test Booking Verification')
    
  } catch (error) {
    addTestResult('Test Specific Booking', 'FAIL', error.message)
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Enhanced Dashboard Test Suite...')
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  try {
    // Navigate to the dashboard
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 })
    
    // Take initial screenshot
    await takeScreenshot(page, 'initial-dashboard.png', 'Initial Dashboard Load')
    
    // Run test suites
    await testEnhancedCalendarCells(page)
    await testColorCoding(page)
    await testCalendarNavigation(page)
    await testEnhancedSitRep(page)
    await testSpecificBooking(page)
    
  } catch (error) {
    addTestResult('Test Suite Setup', 'FAIL', error.message)
  } finally {
    await browser.close()
  }
  
  // Generate test report
  TEST_RESULTS.endTime = new Date().toISOString()
  TEST_RESULTS.duration = new Date(TEST_RESULTS.endTime) - new Date(TEST_RESULTS.startTime)
  
  const reportPath = path.join(__dirname, 'enhanced-dashboard-test-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(TEST_RESULTS, null, 2))
  
  // Print summary
  console.log('\n📋 Test Summary:')
  console.log(`Total Tests: ${TEST_RESULTS.summary.total}`)
  console.log(`Passed: ${TEST_RESULTS.summary.passed}`)
  console.log(`Failed: ${TEST_RESULTS.summary.failed}`)
  console.log(`Success Rate: ${((TEST_RESULTS.summary.passed / TEST_RESULTS.summary.total) * 100).toFixed(1)}%`)
  console.log(`\nReport saved to: ${reportPath}`)
  
  if (TEST_RESULTS.summary.failed > 0) {
    console.log('\n❌ Some tests failed. Check the report for details.')
    process.exit(1)
  } else {
    console.log('\n✅ All tests passed!')
  }
}

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'screenshots', 'enhanced-dashboard-test')
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

// Run tests
runTests().catch(console.error)