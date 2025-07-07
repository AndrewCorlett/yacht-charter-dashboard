/**
 * Simple script to test booking toggle directly
 */

import puppeteer from 'puppeteer'

async function simpleBookingTest() {
  console.log('🔄 Simple Booking Toggle Test...\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      slowMo: 1000
    })

    const page = await browser.newPage()
    
    // Enable console logging to catch errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 BROWSER ERROR:', msg.text())
      }
    })

    page.on('pageerror', error => {
      console.log('🔴 PAGE ERROR:', error.message)
    })

    // Navigate to the application
    console.log('📱 Loading application...')
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('📄 Current URL:', page.url())
    console.log('📄 Page title:', await page.title())

    // Get all text on the page to understand what's there
    const pageText = await page.evaluate(() => document.body.innerText)
    console.log('📄 Page contains:', pageText.substring(0, 300) + '...')

    // Look for any links/buttons that might lead to bookings
    console.log('\n🔍 Looking for navigation...')
    
    const allLinks = await page.$$eval('a, button', elements => 
      elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
    )
    
    console.log('Available navigation options:')
    allLinks.slice(0, 20).forEach((link, i) => console.log(`  ${i + 1}. "${link}"`))

    // Try to find a way to a booking form or management page
    const bookingKeywords = ['booking', 'calendar', 'management', 'create', 'new']
    
    for (const keyword of bookingKeywords) {
      try {
        console.log(`\n🔍 Trying to click on element containing "${keyword}"...`)
        
        // Try different ways to find and click elements
        const element = await page.$(`*:has-text("${keyword}")`) || 
                        await page.$(`[aria-label*="${keyword}" i]`) ||
                        await page.$(`[title*="${keyword}" i]`)
        
        if (element) {
          console.log(`✅ Found element with "${keyword}"`)
          await element.click()
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          console.log('📄 New URL:', page.url())
          break
        }
      } catch (e) {
        console.log(`❌ No element found with "${keyword}"`)
      }
    }

    // Alternative: try URL navigation directly
    const potentialUrls = [
      'http://localhost:3005/bookings',
      'http://localhost:3005/booking',
      'http://localhost:3005/calendar',
      'http://localhost:3005/management'
    ]

    for (const url of potentialUrls) {
      try {
        console.log(`\n🔗 Trying direct navigation to ${url}...`)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 })
        
        const pageContent = await page.evaluate(() => document.body.innerText)
        if (!pageContent.includes('404') && !pageContent.includes('Not Found')) {
          console.log(`✅ Successfully loaded ${url}`)
          console.log('📄 Page content:', pageContent.substring(0, 200) + '...')
          break
        }
      } catch (e) {
        console.log(`❌ Failed to load ${url}`)
      }
    }

    // Now look for checkboxes
    console.log('\n🔘 Looking for checkboxes...')
    
    const checkboxes = await page.$$('input[type="checkbox"]')
    console.log(`Found ${checkboxes.length} checkboxes`)

    if (checkboxes.length > 0) {
      console.log('\n📋 Testing first checkbox...')
      
      const checkbox = checkboxes[0]
      
      // Get checkbox info
      const checkboxInfo = await page.evaluate(el => ({
        checked: el.checked,
        name: el.name,
        id: el.id,
        parentText: el.parentElement?.textContent?.trim().substring(0, 100)
      }), checkbox)
      
      console.log('Checkbox info:', checkboxInfo)
      
      // Toggle the checkbox
      const initialState = checkboxInfo.checked
      console.log(`Toggling from ${initialState} to ${!initialState}`)
      
      await checkbox.click()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Look for save button
      console.log('\n💾 Looking for save button...')
      
      const saveButtons = await page.$$('button')
      let saveButton = null
      
      for (const button of saveButtons) {
        const text = await page.evaluate(el => el.textContent?.toLowerCase(), button)
        if (text && (text.includes('save') || text.includes('submit'))) {
          saveButton = button
          break
        }
      }
      
      if (saveButton) {
        console.log('✅ Found save button, clicking...')
        
        // Listen for the specific error
        let errorCaught = false
        const errorPromise = new Promise((resolve) => {
          const handler = (msg) => {
            if (msg.type() === 'error' && msg.text().includes('charterCost')) {
              errorCaught = true
              resolve(msg.text())
            }
          }
          page.on('console', handler)
          setTimeout(() => resolve(null), 10000)
        })
        
        await saveButton.click()
        
        const error = await errorPromise
        
        if (error) {
          console.log('🎯 ERROR REPRODUCED:', error)
          return {
            success: true,
            errorReproduced: true,
            error: error
          }
        } else {
          console.log('⚠️ No charterCost error detected')
          return {
            success: true,
            errorReproduced: false,
            message: 'No error found - may already be fixed'
          }
        }
      } else {
        console.log('❌ No save button found')
      }
    } else {
      console.log('❌ No checkboxes found on current page')
    }

    return {
      success: true,
      errorReproduced: false,
      message: 'Test completed but no error reproduced'
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the test
simpleBookingTest().then(results => {
  console.log('\n📋 Test Results:', results)
}).catch(error => {
  console.error('Test execution failed:', error)
})