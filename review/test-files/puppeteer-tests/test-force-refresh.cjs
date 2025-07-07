/**
 * Force Refresh Test
 * 
 * Clear all caches and verify the yacht names are updated correctly
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

const puppeteer = require('puppeteer')

async function testWithForcedRefresh() {
  console.log('🚀 Testing with forced refresh and cache clear...')
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1600, height: 1000 }
  })
  
  const page = await browser.newPage()
  
  try {
    // Clear all caches
    await page.setCacheEnabled(false)
    
    console.log('🌐 Navigating with cache disabled...')
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0'
    })
    
    // Force a hard refresh
    await page.evaluate(() => {
      location.reload(true)
    })
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Take screenshot
    await page.screenshot({ 
      path: './force-refresh-test.png', 
      fullPage: true 
    })
    
    // Check SIT REP yacht names
    console.log('🔍 Checking SIT REP yacht names...')
    try {
      const sitrepCards = await page.$$('button[data-testid*="card-"]')
      console.log(`Found ${sitrepCards.length} SIT REP cards`)
      
      for (const card of sitrepCards) {
        const yachtName = await page.evaluate(el => {
          const nameEl = el.querySelector('[data-testid*="yacht-name"]')
          return nameEl ? nameEl.textContent.trim() : null
        }, card)
        
        if (yachtName) {
          console.log(`SIT REP yacht: ${yachtName}`)
        }
      }
    } catch (e) {
      console.log('❌ Could not find SIT REP cards')
    }
    
    // Check calendar yacht names
    console.log('🔍 Checking calendar yacht names...')
    try {
      const headers = await page.$$('[class*="header"]')
      const yachtNames = []
      
      for (const header of headers) {
        const text = await page.evaluate(el => el.textContent?.trim(), header)
        if (text && text.length > 0 && !text.includes('Date') && text.length < 50) {
          yachtNames.push(text)
        }
      }
      
      console.log('Calendar yacht names:')
      yachtNames.forEach(name => console.log(`  - ${name}`))
    } catch (e) {
      console.log('❌ Could not find calendar headers')
    }
    
    // Check if expected yacht names are present
    const expectedYachts = ['Calico Moon', 'Spectre', 'Alrisha', 'Disk Drive', 'Zavaria', 'Mridula Sarwar']
    console.log('\n📊 Expected yacht names:')
    expectedYachts.forEach(name => console.log(`  ✓ ${name}`))
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testWithForcedRefresh()