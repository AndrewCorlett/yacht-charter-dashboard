/**
 * Calendar Investigation Test
 * 
 * Comprehensive Puppeteer test to investigate what went wrong with the calendar
 * after the yacht data synchronization changes.
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

// Test configuration
const TEST_CONFIG = {
  url: 'http://localhost:5173',
  screenshotDir: './screenshots/calendar-investigation',
  timeout: 30000
}

/**
 * Ensure screenshot directory exists
 */
function ensureScreenshotDir() {
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true })
  }
}

/**
 * Take screenshot with timestamp
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${name}-${timestamp}.png`
  const filepath = path.join(TEST_CONFIG.screenshotDir, filename)
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: true
  })
  
  console.log(`📸 Screenshot saved: ${filename}`)
  return filepath
}

/**
 * Wait for element with timeout
 */
async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout })
    return true
  } catch (error) {
    console.error(`Element not found: ${selector}`)
    return false
  }
}

/**
 * Investigate calendar structure and content
 */
async function investigateCalendar(page) {
  console.log('🔍 Investigating calendar structure...')
  
  const results = {
    calendarExists: false,
    yachtHeaders: [],
    dateHeaders: [],
    calendarCells: 0,
    errors: [],
    warnings: [],
    calendarStructure: null
  }
  
  try {
    // Look for calendar component
    const calendarSelectors = [
      '[data-testid="yacht-timeline-calendar"]',
      '.calendar',
      '[class*="calendar"]',
      '[class*="Calendar"]',
      'div:has(> div > div[class*="grid"])',
      'table'
    ]
    
    let calendarElement = null
    let foundSelector = null
    
    for (const selector of calendarSelectors) {
      try {
        calendarElement = await page.$(selector)
        if (calendarElement) {
          foundSelector = selector
          results.calendarExists = true
          console.log(`✅ Found calendar with selector: ${selector}`)
          break
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    if (!calendarElement) {
      console.log('❌ Calendar component not found with any selector')
      
      // Take screenshot of what we have
      await takeScreenshot(page, 'no-calendar-found')
      
      // Look for any grid-like structures
      const gridElements = await page.$$('div[class*="grid"], table, [role="grid"]')
      console.log(`Found ${gridElements.length} grid-like elements`)
      
      if (gridElements.length > 0) {
        for (let i = 0; i < gridElements.length; i++) {
          const text = await page.evaluate(el => el.textContent, gridElements[i])
          console.log(`Grid ${i + 1}: ${text.substring(0, 100)}...`)
        }
      }
      
      return results
    }
    
    // Investigate yacht headers
    console.log('🔍 Looking for yacht headers...')
    
    const headerSelectors = [
      'th',
      '[class*="header"]',
      '[class*="Header"]',
      'div:first-child > div',
      '.yacht-header',
      '[data-yacht]'
    ]
    
    for (const selector of headerSelectors) {
      try {
        const headers = await page.$$(selector)
        if (headers.length > 0) {
          console.log(`Found ${headers.length} elements with selector: ${selector}`)
          
          for (let i = 0; i < Math.min(headers.length, 10); i++) {
            const text = await page.evaluate(el => el.textContent?.trim(), headers[i])
            if (text && text.length > 0) {
              results.yachtHeaders.push(text)
              console.log(`  Header ${i + 1}: "${text}"`)
            }
          }
          
          if (results.yachtHeaders.length > 0) break
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    // Look for date information
    console.log('🔍 Looking for date headers...')
    
    const dateSelectors = [
      'time',
      '[datetime]',
      '.date',
      '[class*="date"]',
      '[class*="Date"]'
    ]
    
    for (const selector of dateSelectors) {
      try {
        const dates = await page.$$(selector)
        if (dates.length > 0) {
          console.log(`Found ${dates.length} date elements with selector: ${selector}`)
          
          for (let i = 0; i < Math.min(dates.length, 5); i++) {
            const text = await page.evaluate(el => el.textContent?.trim(), dates[i])
            if (text && text.length > 0) {
              results.dateHeaders.push(text)
              console.log(`  Date ${i + 1}: "${text}"`)
            }
          }
          
          if (results.dateHeaders.length > 0) break
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    // Count calendar cells
    const cellSelectors = [
      'td',
      '.cell',
      '[class*="cell"]',
      '[class*="Cell"]',
      '[data-date]',
      '[role="gridcell"]'
    ]
    
    for (const selector of cellSelectors) {
      try {
        const cells = await page.$$(selector)
        if (cells.length > 0) {
          results.calendarCells = cells.length
          console.log(`Found ${cells.length} calendar cells with selector: ${selector}`)
          break
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    // Get overall calendar structure
    if (calendarElement) {
      results.calendarStructure = await page.evaluate(el => {
        return {
          tagName: el.tagName,
          className: el.className,
          children: el.children.length,
          textContent: el.textContent?.substring(0, 200) + '...'
        }
      }, calendarElement)
    }
    
  } catch (error) {
    console.error('❌ Error investigating calendar:', error.message)
    results.errors.push(error.message)
  }
  
  return results
}

/**
 * Check for console errors and warnings
 */
async function checkConsoleIssues(page) {
  console.log('🔍 Monitoring console for errors...')
  
  const issues = {
    errors: [],
    warnings: [],
    logs: []
  }
  
  // Capture console messages
  page.on('console', (msg) => {
    const text = msg.text()
    const type = msg.type()
    
    issues.logs.push({ type, text })
    
    if (type === 'error') {
      issues.errors.push(text)
      console.log(`❌ Console Error: ${text}`)
    } else if (type === 'warning') {
      issues.warnings.push(text)
      console.log(`⚠️  Console Warning: ${text}`)
    }
  })
  
  // Capture JavaScript errors
  page.on('pageerror', (error) => {
    issues.errors.push(`JavaScript Error: ${error.message}`)
    console.log(`❌ JavaScript Error: ${error.message}`)
  })
  
  return issues
}

/**
 * Compare SIT REP vs Calendar data
 */
async function compareSitRepAndCalendar(page) {
  console.log('🔍 Comparing SIT REP and Calendar data...')
  
  const comparison = {
    sitrepYachts: [],
    calendarYachts: [],
    matches: [],
    mismatches: []
  }
  
  try {
    // Get SIT REP yacht names
    const sitrepCards = await page.$$('button[data-testid*="card-"]')
    console.log(`Found ${sitrepCards.length} SIT REP cards`)
    
    for (const card of sitrepCards) {
      const yachtName = await page.evaluate(el => {
        const nameEl = el.querySelector('[data-testid*="yacht-name"]')
        return nameEl ? nameEl.textContent.trim() : null
      }, card)
      
      if (yachtName) {
        comparison.sitrepYachts.push(yachtName)
        console.log(`SIT REP yacht: ${yachtName}`)
      }
    }
    
    // Get Calendar yacht names (from previous investigation results)
    // This will be filled by the calendar investigation
    
  } catch (error) {
    console.error('❌ Error comparing components:', error.message)
  }
  
  return comparison
}

/**
 * Main investigation function
 */
async function investigateCalendarIssues() {
  console.log('🚀 Starting Calendar Investigation...')
  console.log('=' .repeat(60))
  
  ensureScreenshotDir()
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1600, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  try {
    // Set up console monitoring
    const consoleIssues = await checkConsoleIssues(page)
    
    // Navigate to the application
    console.log(`🌐 Navigating to ${TEST_CONFIG.url}`)
    await page.goto(TEST_CONFIG.url, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout 
    })
    
    // Take initial screenshot
    await takeScreenshot(page, 'initial-page-load')
    
    // Wait for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Take screenshot after loading
    await takeScreenshot(page, 'after-loading')
    
    // Investigate calendar
    console.log('\n' + '─'.repeat(40))
    const calendarResults = await investigateCalendar(page)
    
    // Compare components
    console.log('\n' + '─'.repeat(40))
    const comparison = await compareSitRepAndCalendar(page)
    
    // Take final detailed screenshot
    await takeScreenshot(page, 'final-investigation')
    
    // Generate comprehensive report
    console.log('\n' + '=' .repeat(60))
    console.log('📊 CALENDAR INVESTIGATION REPORT')
    console.log('=' .repeat(60))
    
    // Calendar Status
    console.log('\n📅 CALENDAR STATUS:')
    if (calendarResults.calendarExists) {
      console.log('✅ Calendar component found')
      console.log(`   Structure: ${calendarResults.calendarStructure?.tagName} with class "${calendarResults.calendarStructure?.className}"`)
      console.log(`   Children: ${calendarResults.calendarStructure?.children}`)
    } else {
      console.log('❌ Calendar component NOT FOUND')
    }
    
    // Yacht Headers
    console.log('\n🚤 YACHT HEADERS:')
    if (calendarResults.yachtHeaders.length > 0) {
      console.log(`Found ${calendarResults.yachtHeaders.length} yacht headers:`)
      calendarResults.yachtHeaders.forEach((header, i) => {
        console.log(`   ${i + 1}. "${header}"`)
      })
    } else {
      console.log('❌ No yacht headers found')
    }
    
    // Date Headers
    console.log('\n📅 DATE HEADERS:')
    if (calendarResults.dateHeaders.length > 0) {
      console.log(`Found ${calendarResults.dateHeaders.length} date headers:`)
      calendarResults.dateHeaders.forEach((header, i) => {
        console.log(`   ${i + 1}. "${header}"`)
      })
    } else {
      console.log('❌ No date headers found')
    }
    
    // Calendar Cells
    console.log('\n🔢 CALENDAR CELLS:')
    console.log(`Found ${calendarResults.calendarCells} calendar cells`)
    
    // Console Issues
    console.log('\n⚠️  CONSOLE ISSUES:')
    console.log(`Errors: ${consoleIssues.errors.length}`)
    console.log(`Warnings: ${consoleIssues.warnings.length}`)
    
    if (consoleIssues.errors.length > 0) {
      console.log('Recent errors:')
      consoleIssues.errors.slice(-3).forEach(error => {
        console.log(`   - ${error}`)
      })
    }
    
    // SIT REP Comparison
    console.log('\n🔄 SIT REP COMPARISON:')
    console.log(`SIT REP yachts found: ${comparison.sitrepYachts.length}`)
    comparison.sitrepYachts.forEach(yacht => {
      console.log(`   - ${yacht}`)
    })
    
    // Overall Assessment
    console.log('\n' + '─'.repeat(60))
    const isCalendarWorking = calendarResults.calendarExists && 
                             calendarResults.yachtHeaders.length > 0 && 
                             calendarResults.calendarCells > 0
    
    if (isCalendarWorking) {
      console.log('✅ CALENDAR STATUS: Working')
    } else {
      console.log('❌ CALENDAR STATUS: Broken/Not Working')
      
      console.log('\n🔧 ISSUES IDENTIFIED:')
      if (!calendarResults.calendarExists) {
        console.log('   - Calendar component not rendering')
      }
      if (calendarResults.yachtHeaders.length === 0) {
        console.log('   - No yacht headers visible')
      }
      if (calendarResults.calendarCells === 0) {
        console.log('   - No calendar cells found')
      }
      if (consoleIssues.errors.length > 0) {
        console.log('   - JavaScript errors present')
      }
    }
    
    // Save detailed results
    const reportPath = path.join(TEST_CONFIG.screenshotDir, 'investigation-report.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      calendarWorking: isCalendarWorking,
      calendarResults,
      consoleIssues,
      comparison,
      summary: {
        calendarExists: calendarResults.calendarExists,
        yachtHeadersFound: calendarResults.yachtHeaders.length,
        calendarCellsFound: calendarResults.calendarCells,
        errorsPresent: consoleIssues.errors.length > 0
      }
    }, null, 2))
    
    console.log(`📋 Detailed report saved: ${reportPath}`)
    
    return isCalendarWorking
    
  } catch (error) {
    console.error('💥 Critical investigation error:', error)
    await takeScreenshot(page, 'critical-error')
    return false
  } finally {
    await browser.close()
  }
}

// Run investigation if this file is executed directly
if (require.main === module) {
  investigateCalendarIssues()
    .then(success => {
      console.log('\n🏁 Investigation completed')
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Investigation execution failed:', error)
      process.exit(1)
    })
}

module.exports = { investigateCalendarIssues }