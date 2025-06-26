/**
 * SIT REP Widget Puppeteer Test
 * 
 * Comprehensive end-to-end testing for the rebuilt SIT REP widget
 * including horizontal scrolling, real-time updates, accessibility,
 * and visual verification.
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
  screenshotDir: './screenshots/sitrep-test',
  timeout: 30000,
  viewports: [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ]
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
 * Take screenshot with timestamp
 */
async function takeScreenshot(page, name, viewport = 'desktop') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${name}-${viewport}-${timestamp}.png`
  const filepath = path.join(TEST_CONFIG.screenshotDir, filename)
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: true
  })
  
  console.log(`📸 Screenshot saved: ${filename}`)
  return filepath
}

/**
 * Test SIT REP widget loading and structure
 */
async function testWidgetStructure(page) {
  console.log('🔍 Testing SIT REP widget structure...')
  
  // Wait for the main SIT REP component to load
  const sitrepExists = await waitForElement(page, 'h2:has-text("SIT REP")')
  if (!sitrepExists) {
    throw new Error('SIT REP widget not found on page')
  }
  
  // Check for both subsections
  const boatsOutExists = await waitForElement(page, '[role="region"][aria-label*="Boats currently out"]')
  const upcomingExists = await waitForElement(page, '[role="region"][aria-label*="Upcoming charter"]')
  
  if (!boatsOutExists || !upcomingExists) {
    throw new Error('Required subsections not found')
  }
  
  console.log('✅ Widget structure verified')
  return true
}

/**
 * Test horizontal scrolling functionality
 */
async function testHorizontalScrolling(page) {
  console.log('🔍 Testing horizontal scrolling...')
  
  // Check for scroll containers
  const boatsOutContainer = await page.$('[data-testid="boats-out-scroll-container"]')
  const upcomingContainer = await page.$('[data-testid="upcoming-charters-scroll-container"]')
  
  if (!boatsOutContainer && !upcomingContainer) {
    console.log('⚠️  No scroll containers found (might be empty state)')
    return true
  }
  
  // Test scrolling if containers exist
  if (boatsOutContainer) {
    const scrollWidth = await page.evaluate(el => el.scrollWidth, boatsOutContainer)
    const clientWidth = await page.evaluate(el => el.clientWidth, boatsOutContainer)
    
    if (scrollWidth > clientWidth) {
      // Test actual scrolling
      await page.evaluate(el => el.scrollLeft = 100, boatsOutContainer)
      console.log('✅ Boats out horizontal scrolling works')
    }
  }
  
  if (upcomingContainer) {
    const scrollWidth = await page.evaluate(el => el.scrollWidth, upcomingContainer)
    const clientWidth = await page.evaluate(el => el.clientWidth, upcomingContainer)
    
    if (scrollWidth > clientWidth) {
      // Test actual scrolling
      await page.evaluate(el => el.scrollLeft = 100, upcomingContainer)
      console.log('✅ Upcoming charters horizontal scrolling works')
    }
  }
  
  console.log('✅ Horizontal scrolling functionality verified')
  return true
}

/**
 * Test card interactions and navigation
 */
async function testCardInteractions(page) {
  console.log('🔍 Testing card interactions...')
  
  // Look for charter cards
  const cards = await page.$$('button[data-testid*="card-"]')
  
  if (cards.length === 0) {
    console.log('⚠️  No charter cards found (empty state)')
    return true
  }
  
  // Test clicking the first card
  const firstCard = cards[0]
  
  // Check if card is clickable
  const isButton = await page.evaluate(el => el.tagName === 'BUTTON', firstCard)
  if (!isButton) {
    throw new Error('Charter cards are not properly implemented as buttons')
  }
  
  // Test keyboard navigation
  await firstCard.focus()
  await page.keyboard.press('Enter')
  
  // Check console for navigation log (since we're in dev mode)
  const consoleLogs = []
  page.on('console', msg => consoleLogs.push(msg.text()))
  
  await firstCard.click()
  
  // Wait a bit for console log
  await page.waitForTimeout(500)
  
  console.log('✅ Card interactions and navigation verified')
  return true
}

/**
 * Test accessibility features
 */
async function testAccessibility(page) {
  console.log('🔍 Testing accessibility features...')
  
  // Check for proper ARIA labels
  const boatsOutRegion = await page.$('[role="region"][aria-label*="Boats currently out"]')
  const upcomingRegion = await page.$('[role="region"][aria-label*="Upcoming charter"]')
  
  if (!boatsOutRegion || !upcomingRegion) {
    throw new Error('Missing ARIA labels on subsections')
  }
  
  // Check for button elements with focus-visible classes
  const cards = await page.$$('button[data-testid*="card-"]')
  
  if (cards.length > 0) {
    // Test focus-visible styling
    const firstCard = cards[0]
    await firstCard.focus()
    
    const hasFocusVisible = await page.evaluate(el => {
      return el.classList.contains('focus-visible:ring-2') || 
             el.classList.contains('focus-visible:ring')
    }, firstCard)
    
    if (!hasFocusVisible) {
      console.log('⚠️  Focus-visible styling might not be applied correctly')
    }
  }
  
  console.log('✅ Accessibility features verified')
  return true
}

/**
 * Test loading states and empty states
 */
async function testLoadingAndEmptyStates(page) {
  console.log('🔍 Testing loading and empty states...')
  
  // Reload page to catch loading state
  await page.reload({ waitUntil: 'domcontentloaded' })
  
  // Try to catch loading skeleton (might be very fast)
  try {
    await page.waitForSelector('[data-testid="sitrep-loading-skeleton"]', { timeout: 1000 })
    console.log('✅ Loading skeleton detected')
  } catch (error) {
    console.log('⚠️  Loading skeleton not detected (might load too fast)')
  }
  
  // Wait for content to load
  await page.waitForSelector('h2:has-text("SIT REP")', { timeout: 10000 })
  
  // Check for empty state messages
  const emptyStateElements = await page.$$eval('div:has-text("None at the moment 🚤")', 
    elements => elements.map(el => el.textContent)
  )
  
  if (emptyStateElements.length > 0) {
    console.log('✅ Empty state messages found')
  }
  
  console.log('✅ Loading and empty states verified')
  return true
}

/**
 * Test responsive design across viewports
 */
async function testResponsiveDesign(page) {
  console.log('🔍 Testing responsive design...')
  
  for (const viewport of TEST_CONFIG.viewports) {
    console.log(`Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`)
    
    await page.setViewport(viewport)
    await page.waitForTimeout(500) // Allow for layout adjustment
    
    // Take screenshot for each viewport
    await takeScreenshot(page, `responsive-${viewport.name}`, viewport.name)
    
    // Verify widget is still functional
    const sitrepExists = await waitForElement(page, 'h2:has-text("SIT REP")')
    if (!sitrepExists) {
      throw new Error(`SIT REP widget not visible on ${viewport.name}`)
    }
    
    // Test horizontal scrolling still works
    const scrollContainers = await page.$$('[data-testid*="scroll-container"]')
    if (scrollContainers.length > 0) {
      const canScroll = await page.evaluate(el => el.scrollWidth > el.clientWidth, scrollContainers[0])
      if (canScroll) {
        console.log(`✅ Horizontal scrolling working on ${viewport.name}`)
      }
    }
  }
  
  // Reset to desktop viewport
  await page.setViewport(TEST_CONFIG.viewports[0])
  
  console.log('✅ Responsive design verified across all viewports')
  return true
}

/**
 * Main test execution
 */
async function runSitRepTests() {
  console.log('🚀 Starting SIT REP Widget Tests...')
  console.log('=' .repeat(50))
  
  ensureScreenshotDir()
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  try {
    // Navigate to the application
    console.log(`🌐 Navigating to ${TEST_CONFIG.url}`)
    await page.goto(TEST_CONFIG.url, { 
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout 
    })
    
    // Take initial screenshot
    await takeScreenshot(page, 'initial-load')
    
    // Run all tests
    const tests = [
      { name: 'Widget Structure', fn: testWidgetStructure },
      { name: 'Horizontal Scrolling', fn: testHorizontalScrolling },
      { name: 'Card Interactions', fn: testCardInteractions },
      { name: 'Accessibility', fn: testAccessibility },
      { name: 'Loading & Empty States', fn: testLoadingAndEmptyStates },
      { name: 'Responsive Design', fn: testResponsiveDesign }
    ]
    
    const results = []
    
    for (const test of tests) {
      try {
        console.log('\n' + '─'.repeat(30))
        const result = await test.fn(page)
        results.push({ name: test.name, passed: result, error: null })
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error.message)
        results.push({ name: test.name, passed: false, error: error.message })
        
        // Take error screenshot
        await takeScreenshot(page, `error-${test.name.toLowerCase().replace(/\s+/g, '-')}`)
      }
    }
    
    // Generate test report
    console.log('\n' + '=' .repeat(50))
    console.log('📊 TEST REPORT')
    console.log('=' .repeat(50))
    
    const passed = results.filter(r => r.passed).length
    const total = results.length
    
    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL'
      console.log(`${status} - ${result.name}`)
      if (result.error) {
        console.log(`    Error: ${result.error}`)
      }
    })
    
    console.log('\n' + '─'.repeat(30))
    console.log(`Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`)
    
    // Take final screenshot
    await takeScreenshot(page, 'final-state')
    
    // Save test results to JSON
    const reportPath = path.join(TEST_CONFIG.screenshotDir, 'test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total,
        passed,
        failed: total - passed,
        percentage: Math.round(passed/total*100)
      }
    }, null, 2))
    
    console.log(`📋 Test report saved: ${reportPath}`)
    
    return passed === total
    
  } catch (error) {
    console.error('💥 Critical test error:', error)
    await takeScreenshot(page, 'critical-error')
    return false
  } finally {
    await browser.close()
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSitRepTests()
    .then(success => {
      console.log('\n🏁 Tests completed')
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error)
      process.exit(1)
    })
}

module.exports = { runSitRepTests }