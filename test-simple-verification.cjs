/**
 * Simple Console Error Verification
 * 
 * Basic test to verify the circular dependency error is fixed
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

async function runSimpleTest() {
  console.log('🚀 Testing for circular dependency fix...')
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  })
  
  const page = await browser.newPage()
  
  const errors = []
  
  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  page.on('pageerror', (error) => {
    errors.push(`JavaScript Error: ${error.message}`)
  })
  
  try {
    // Navigate to page
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })
    
    // Wait for any errors to surface
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Check for circular dependency errors specifically
    const circularErrors = errors.filter(error => 
      error.includes('eventEmitter') || 
      error.includes('before initialization') ||
      error.includes('circular')
    )
    
    // Take screenshot
    await page.screenshot({ 
      path: './screenshots/simple-test.png', 
      fullPage: true 
    })
    
    console.log('\n📊 RESULTS:')
    console.log(`Total errors: ${errors.length}`)
    console.log(`Circular dependency errors: ${circularErrors.length}`)
    
    if (circularErrors.length === 0) {
      console.log('✅ SUCCESS: No circular dependency errors found!')
    } else {
      console.log('❌ FAILED: Circular dependency errors still exist:')
      circularErrors.forEach(error => console.log(`   - ${error}`))
    }
    
    if (errors.length > 0) {
      console.log('\nOther errors (may be unrelated):')
      errors.filter(e => !circularErrors.includes(e)).forEach(error => 
        console.log(`   - ${error}`)
      )
    }
    
    // Try to find SIT REP with different selector
    try {
      const sitrepElement = await page.$('h2')
      if (sitrepElement) {
        const text = await page.evaluate(el => el.textContent, sitrepElement)
        console.log(`\n✅ Found h2 element with text: "${text}"`)
      }
    } catch (e) {
      console.log('\n⚠️  Could not find SIT REP element')
    }
    
    return circularErrors.length === 0
    
  } catch (error) {
    console.error('Test failed:', error)
    return false
  } finally {
    await browser.close()
  }
}

// Run the test
runSimpleTest()
  .then(success => {
    console.log(`\n🏁 Test completed: ${success ? 'SUCCESS' : 'FAILED'}`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error)
    process.exit(1)
  })