/**
 * Debug Dashboard Test
 * 
 * Check for JavaScript errors and component loading issues
 */

const puppeteer = require('puppeteer')

async function debugTest() {
  console.log('🔍 Starting Debug Dashboard Test...')
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  })
  
  const page = await browser.newPage()
  
  // Collect console logs
  const logs = []
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    })
  })
  
  // Collect page errors
  const errors = []
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  })
  
  try {
    console.log('📍 Navigating to dashboard...')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 })
    
    // Wait for React to load
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Check if React app mounted
    const reactRoot = await page.$('#root')
    console.log('⚛️ React root element found:', !!reactRoot)
    
    if (reactRoot) {
      const rootContent = await reactRoot.evaluate(el => el.innerHTML)
      console.log('📝 Root content length:', rootContent.length)
      console.log('📝 Root has content:', rootContent.length > 0)
    }
    
    // Check for CSS
    const stylesheets = await page.$$eval('link[rel="stylesheet"], style', elements => 
      elements.map(el => el.href || 'inline style').filter(Boolean)
    )
    console.log('🎨 Stylesheets loaded:', stylesheets.length)
    
    // Check for JavaScript files
    const scripts = await page.$$eval('script[src]', elements => 
      elements.map(el => el.src).filter(Boolean)
    )
    console.log('📜 Scripts loaded:', scripts.length)
    
    // Try to find specific components
    const components = {
      'SitRep': await page.$('h2').catch(() => null),
      'Calendar': await page.$('.calendar-grid-border').catch(() => null),
      'BookingCell': await page.$('[data-testid="booking-cell"]').catch(() => null),
      'Sidebar': await page.$('.ml-12').catch(() => null)
    }
    
    console.log('\n🧩 Component Detection:')
    Object.entries(components).forEach(([name, element]) => {
      console.log(`   ${element ? '✅' : '❌'} ${name}`)
    })
    
    // Print console logs
    console.log('\n📋 Console Logs:')
    logs.forEach(log => {
      const icon = log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : 'ℹ️'
      console.log(`   ${icon} [${log.type}] ${log.text}`)
    })
    
    // Print page errors
    if (errors.length > 0) {
      console.log('\n💥 Page Errors:')
      errors.forEach(error => {
        console.log(`   ❌ ${error.message}`)
        if (error.stack) {
          console.log(`      ${error.stack.split('\n')[0]}`)
        }
      })
    } else {
      console.log('\n✅ No page errors detected')
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'debug-dashboard.png', fullPage: true })
    console.log('\n📸 Debug screenshot saved: debug-dashboard.png')
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message)
  } finally {
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser kept open for manual inspection. Close manually when done.')
    // await browser.close()
  }
}

debugTest().catch(console.error)