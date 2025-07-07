/**
 * Quick Enhanced Dashboard Test
 * 
 * Simple test to verify the enhanced dashboard functionality
 */

const puppeteer = require('puppeteer')

async function quickTest() {
  console.log('🚀 Starting Quick Enhanced Dashboard Test...')
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  })
  
  const page = await browser.newPage()
  
  try {
    // Navigate to the dashboard
    console.log('📍 Navigating to dashboard...')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 })
    
    // Take initial screenshot
    await page.screenshot({ path: 'quick-enhanced-test.png', fullPage: true })
    console.log('📸 Screenshot saved: quick-enhanced-test.png')
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check for main dashboard elements
    const sitrepTitle = await page.$eval('h2', el => el?.textContent).catch(() => null)
    console.log('📊 SitRep title:', sitrepTitle)
    
    // Check for calendar
    const calendarExists = await page.$('.calendar-grid-border').catch(() => null)
    console.log('🗓️ Calendar exists:', !!calendarExists)
    
    // Check for booking cells
    const bookingCells = await page.$$('[data-testid="booking-cell"]')
    console.log('📅 Booking cells found:', bookingCells.length)
    
    // Check page content
    const pageContent = await page.content()
    const hasReactApp = pageContent.includes('root')
    console.log('⚛️ React app container found:', hasReactApp)
    
    // Check console for errors
    const logs = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text())
      }
    })
    
    // Wait for any console errors
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (logs.length > 0) {
      console.log('❌ Console errors found:')
      logs.forEach(log => console.log('   ', log))
    } else {
      console.log('✅ No console errors')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await browser.close()
  }
}

quickTest().catch(console.error)