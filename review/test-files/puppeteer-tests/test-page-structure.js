/**
 * Quick test to see what's on the page
 */

import puppeteer from 'puppeteer'

async function testPageStructure() {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
    
    // Wait a bit for everything to load
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Get page structure
    const structure = await page.evaluate(() => {
      // Get main structural elements
      const elements = []
      
      // Check for common elements
      const selectors = [
        'nav', 'header', 'main', '.app', '#app', '#root', 
        '[class*="nav"]', '[class*="header"]', '[class*="sidebar"]',
        'button', 'a[href]', 'form'
      ]
      
      for (const selector of selectors) {
        const found = document.querySelectorAll(selector)
        if (found.length > 0) {
          elements.push(`${selector}: ${found.length} found`)
          
          // Get some sample text content
          for (let i = 0; i < Math.min(3, found.length); i++) {
            const text = found[i].textContent.trim().slice(0, 100)
            if (text) {
              elements.push(`  - "${text}"`)
            }
          }
        }
      }
      
      return elements
    })
    
    console.log('Page structure:')
    structure.forEach(item => console.log(item))
    
    // Get all interactive elements
    const interactive = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim())
      const links = Array.from(document.querySelectorAll('a[href]')).map(a => `${a.textContent.trim()} -> ${a.href}`)
      
      return { buttons, links }
    })
    
    console.log('\\nButtons:', interactive.buttons)
    console.log('\\nLinks:', interactive.links)
    
    // Take screenshot
    await page.screenshot({ path: 'page-structure.png', fullPage: true })
    console.log('\\nScreenshot saved: page-structure.png')
    
    // Check for booking-related elements
    const bookingElements = await page.evaluate(() => {
      const bookingSelectors = [
        '[href*="booking"]', '[href*="calendar"]',
        'button:contains("Add")', 'button:contains("Create")',
        '[class*="booking"]', '[class*="calendar"]',
        'form'
      ]
      
      const found = []
      for (const selector of bookingSelectors) {
        try {
          const elements = document.querySelectorAll(selector)
          if (elements.length > 0) {
            found.push(`${selector}: ${elements.length}`)
          }
        } catch (e) {
          // Ignore invalid selectors
        }
      }
      
      return found
    })
    
    console.log('\\nBooking-related elements:', bookingElements)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await browser.close()
  }
}

testPageStructure()