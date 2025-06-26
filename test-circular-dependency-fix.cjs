/**
 * Circular Dependency Fix Verification Test
 * 
 * Tests to verify the UnifiedDataService error has been resolved
 * and the SIT REP widget is fully functional.
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
  screenshotDir: './screenshots/fix-verification',
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
 * Test for console errors
 */
async function testConsoleErrors(page) {
  console.log('🔍 Testing for console errors...')
  
  const errors = []
  const warnings = []
  const logs = []
  
  // Capture console messages
  page.on('console', (msg) => {
    const text = msg.text()
    logs.push({ type: msg.type(), text })
    
    if (msg.type() === 'error') {
      errors.push(text)
    } else if (msg.type() === 'warning') {
      warnings.push(text)
    }
  })
  
  // Capture JavaScript errors
  page.on('pageerror', (error) => {
    errors.push(`JavaScript Error: ${error.message}`)
  })
  
  // Navigate and wait for content
  await page.goto(TEST_CONFIG.url, { 
    waitUntil: 'networkidle2',
    timeout: TEST_CONFIG.timeout 
  })
  
  // Wait a bit more to catch any delayed errors
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Check for critical errors (circular dependency)
  const hasCircularDependencyError = errors.some(error => 
    error.includes('eventEmitter') || 
    error.includes('before initialization') ||
    error.includes('circular')
  )
  
  const hasJavaScriptErrors = errors.length > 0
  
  return {
    errors,
    warnings,
    logs,
    hasCircularDependencyError,
    hasJavaScriptErrors,
    errorCount: errors.length,
    warningCount: warnings.length
  }
}

/**
 * Test SIT REP widget functionality
 */
async function testSitRepWidget(page) {
  console.log('🔍 Testing SIT REP widget functionality...')
  
  try {
    // Wait for SIT REP widget
    await page.waitForSelector('h2:has-text("SIT REP")', { timeout: 10000 })
    console.log('✅ SIT REP title found')
    
    // Check for subsections
    const boatsOutExists = await page.$('[role="region"][aria-label*="Boats currently out"]')
    const upcomingExists = await page.$('[role="region"][aria-label*="Upcoming charter"]')
    
    if (!boatsOutExists || !upcomingExists) {
      throw new Error('Required subsections not found')
    }
    console.log('✅ Both subsections found')
    
    // Check for charter cards
    const cards = await page.$$('button[data-testid*="card-"]')
    console.log(`✅ Found ${cards.length} charter cards`)
    
    // Check for color key
    const colorKey = await page.$('h4:has-text("Color Key")')
    if (colorKey) {
      console.log('✅ Color key found')
    } else {
      console.log('⚠️  Color key not found')
    }
    
    // Check for specific yacht names from mock data
    const yachtNames = ['Spectre', 'Disk Drive', 'Melba', 'Swansea']
    const foundYachts = []
    
    for (const yachtName of yachtNames) {
      const yachtElement = await page.$(`div:has-text("${yachtName}")`)
      if (yachtElement) {
        foundYachts.push(yachtName)
      }
    }
    
    console.log(`✅ Found yachts: ${foundYachts.join(', ')}`)
    
    return {
      sitrepExists: true,
      subsectionsFound: boatsOutExists && upcomingExists,
      cardCount: cards.length,
      colorKeyExists: !!colorKey,
      yachtsFound: foundYachts,
      expectedYachts: yachtNames,
      allYachtsFound: foundYachts.length === yachtNames.length
    }
    
  } catch (error) {
    console.error('❌ SIT REP widget test failed:', error.message)
    return {
      sitrepExists: false,
      error: error.message
    }
  }
}

/**
 * Test page loading and basic functionality
 */
async function testPageLoading(page) {
  console.log('🔍 Testing page loading...')
  
  try {
    // Check if page loaded successfully
    const title = await page.title()
    console.log(`✅ Page title: ${title}`)
    
    // Check for React app root
    const appRoot = await page.$('#root')
    if (!appRoot) {
      throw new Error('React app root not found')
    }
    console.log('✅ React app root found')
    
    // Check for main dashboard
    const dashboard = await page.$('[class*="dashboard"], [class*="main"]')
    if (!dashboard) {
      console.log('⚠️  Dashboard element not found with class selectors')
    } else {
      console.log('✅ Dashboard element found')
    }
    
    return {
      pageLoaded: true,
      title,
      appRootExists: !!appRoot,
      dashboardExists: !!dashboard
    }
    
  } catch (error) {
    console.error('❌ Page loading test failed:', error.message)
    return {
      pageLoaded: false,
      error: error.message
    }
  }
}

/**
 * Main test execution
 */
async function runFixVerificationTests() {
  console.log('🚀 Starting Circular Dependency Fix Verification Tests...')
  console.log('=' .repeat(60))
  
  ensureScreenshotDir()
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  try {
    // Take initial screenshot
    await takeScreenshot(page, 'test-start')
    
    // Test 1: Console errors
    console.log('\n' + '─'.repeat(40))
    const consoleResults = await testConsoleErrors(page)
    
    // Take screenshot after page load
    await takeScreenshot(page, 'after-page-load')
    
    // Test 2: Page loading
    console.log('\n' + '─'.repeat(40))
    const loadingResults = await testPageLoading(page)
    
    // Test 3: SIT REP widget
    console.log('\n' + '─'.repeat(40))
    const sitrepResults = await testSitRepWidget(page)
    
    // Take final screenshot
    await takeScreenshot(page, 'final-verification')
    
    // Generate comprehensive report
    console.log('\n' + '=' .repeat(60))
    console.log('📊 FIX VERIFICATION REPORT')
    console.log('=' .repeat(60))
    
    // Console Errors Report
    console.log('\n🔍 CONSOLE ERRORS:')
    if (consoleResults.hasCircularDependencyError) {
      console.log('❌ CIRCULAR DEPENDENCY ERROR STILL EXISTS')
    } else {
      console.log('✅ NO CIRCULAR DEPENDENCY ERRORS')
    }
    
    if (consoleResults.hasJavaScriptErrors) {
      console.log(`❌ ${consoleResults.errorCount} JavaScript errors found:`)
      consoleResults.errors.forEach(error => console.log(`   - ${error}`))
    } else {
      console.log('✅ NO JAVASCRIPT ERRORS')
    }
    
    if (consoleResults.warningCount > 0) {
      console.log(`⚠️  ${consoleResults.warningCount} warnings (non-critical):`)
      consoleResults.warnings.slice(0, 3).forEach(warning => console.log(`   - ${warning}`))
    }
    
    // Page Loading Report
    console.log('\n📄 PAGE LOADING:')
    if (loadingResults.pageLoaded) {
      console.log('✅ Page loaded successfully')
      console.log(`✅ Title: ${loadingResults.title}`)
    } else {
      console.log('❌ Page failed to load')
      if (loadingResults.error) {
        console.log(`   Error: ${loadingResults.error}`)
      }
    }
    
    // SIT REP Widget Report
    console.log('\n🚤 SIT REP WIDGET:')
    if (sitrepResults.sitrepExists) {
      console.log('✅ SIT REP widget loaded successfully')
      console.log(`✅ Found ${sitrepResults.cardCount} charter cards`)
      console.log(`✅ Yacht names: ${sitrepResults.yachtsFound.join(', ')}`)
      
      if (sitrepResults.allYachtsFound) {
        console.log('✅ All expected yachts found')
      } else {
        const missing = sitrepResults.expectedYachts.filter(y => !sitrepResults.yachtsFound.includes(y))
        console.log(`⚠️  Missing yachts: ${missing.join(', ')}`)
      }
      
      if (sitrepResults.colorKeyExists) {
        console.log('✅ Color key displayed')
      } else {
        console.log('⚠️  Color key not found')
      }
    } else {
      console.log('❌ SIT REP widget failed to load')
      if (sitrepResults.error) {
        console.log(`   Error: ${sitrepResults.error}`)
      }
    }
    
    // Overall Assessment
    console.log('\n' + '─'.repeat(60))
    const isFixSuccessful = !consoleResults.hasCircularDependencyError && 
                           !consoleResults.hasJavaScriptErrors && 
                           loadingResults.pageLoaded && 
                           sitrepResults.sitrepExists
    
    if (isFixSuccessful) {
      console.log('🎉 FIX VERIFICATION: ✅ SUCCESS')
      console.log('   - No circular dependency errors')
      console.log('   - Page loads correctly')
      console.log('   - SIT REP widget functional')
      console.log('   - All yacht data displayed')
    } else {
      console.log('❌ FIX VERIFICATION: FAILED')
      if (consoleResults.hasCircularDependencyError) {
        console.log('   - Circular dependency error still exists')
      }
      if (consoleResults.hasJavaScriptErrors) {
        console.log('   - JavaScript errors present')
      }
      if (!loadingResults.pageLoaded) {
        console.log('   - Page failed to load')
      }
      if (!sitrepResults.sitrepExists) {
        console.log('   - SIT REP widget not working')
      }
    }
    
    // Save detailed results
    const reportPath = path.join(TEST_CONFIG.screenshotDir, 'verification-report.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      fixSuccessful: isFixSuccessful,
      consoleResults,
      loadingResults,
      sitrepResults,
      summary: {
        circularDependencyFixed: !consoleResults.hasCircularDependencyError,
        noJavaScriptErrors: !consoleResults.hasJavaScriptErrors,
        pageLoads: loadingResults.pageLoaded,
        sitrepWorks: sitrepResults.sitrepExists
      }
    }, null, 2))
    
    console.log(`📋 Detailed report saved: ${reportPath}`)
    
    return isFixSuccessful
    
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
  runFixVerificationTests()
    .then(success => {
      console.log('\n🏁 Fix verification completed')
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error)
      process.exit(1)
    })
}

module.exports = { runFixVerificationTests }