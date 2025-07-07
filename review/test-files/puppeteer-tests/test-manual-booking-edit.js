/**
 * Manual Booking Edit Test
 * Opens browser for manual testing of booking number editing
 */

import puppeteer from 'puppeteer'

async function testManualBookingEdit() {
  let browser = null
  
  try {
    console.log('🚀 Starting manual booking edit test...')
    console.log('📝 This test will open the browser for manual verification')
    
    browser = await puppeteer.launch({ 
      headless: false,
      slowMo: 200,
      devtools: true,
      args: ['--no-sandbox', '--disable-web-security']
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1400, height: 900 })
    
    // Enable console logging with better formatting
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      
      if (type === 'error') {
        console.log('🔥 Browser Error:', text)
      } else if (text.includes('tripType')) {
        console.log('🔍 TripType Reference:', text)
      } else if (text.includes('booking')) {
        console.log('📋 Booking Related:', text)
      }
    })
    
    // Monitor network responses for errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`🌐 Network Error: ${response.status()} ${response.url()}`)
      }
    })
    
    console.log('📖 Step 1: Navigate to application')
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('📖 Step 2: Inject test helper script')
    
    // Inject helper script to make testing easier
    await page.evaluate(() => {
      window.testHelpers = {
        findBookingNumbers: () => {
          const elements = Array.from(document.querySelectorAll('*'))
          return elements
            .map(el => el.textContent || '')
            .filter(text => /\\b\\d{2}\\d{2}[A-Z]{2}\\d{2}\\b/.test(text))
            .map(text => text.match(/\\b\\d{2}\\d{2}[A-Z]{2}\\d{2}\\b/)[0])
        },
        
        findBookingElements: () => {
          const elements = Array.from(document.querySelectorAll('*'))
          return elements.filter(el => {
            const text = el.textContent || ''
            return /\\b\\d{2}\\d{2}[A-Z]{2}\\d{2}\\b/.test(text) && 
                   !el.querySelector('*') // leaf element
          })
        },
        
        clickBookingNumber: (bookingNumber) => {
          const elements = window.testHelpers.findBookingElements()
          const element = elements.find(el => el.textContent.includes(bookingNumber))
          if (element) {
            element.click()
            return true
          }
          return false
        }
      }
    })
    
    // Find booking numbers
    const bookingNumbers = await page.evaluate(() => window.testHelpers.findBookingNumbers())
    console.log('📝 Found booking numbers:', bookingNumbers)
    
    if (bookingNumbers.length === 0) {
      console.log('❌ No booking numbers found on the page')
      console.log('📝 Page title:', await page.title())
      console.log('📝 Page URL:', page.url())
      
      // Wait for manual navigation if needed
      console.log('⏳ Waiting 60 seconds for manual navigation to booking management...')
      await new Promise(resolve => setTimeout(resolve, 60000))
      
      // Try again
      const newBookingNumbers = await page.evaluate(() => window.testHelpers.findBookingNumbers())
      console.log('📝 Found booking numbers after wait:', newBookingNumbers)
    }
    
    console.log(`
📋 MANUAL TEST INSTRUCTIONS:
=========================

1. Make sure you can see booking numbers on the screen
2. Look for booking number "2527CM05" (which we just updated)
3. Try to edit this booking number:
   - Hover over the booking number
   - Look for an edit button (pencil icon)
   - Click to edit
   - Change the number to "2527CM06"
   - Save the change

4. Watch the browser console for any errors
5. Verify the booking number updates successfully
6. Check that no "tripType" errors appear

Browser will stay open for 5 minutes for manual testing...
Press Ctrl+C when done.
`)
    
    // Keep browser open for manual testing
    await new Promise(resolve => setTimeout(resolve, 300000)) // 5 minutes
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message)
  } finally {
    console.log('🔄 Closing browser...')
    if (browser) {
      await browser.close()
    }
  }
}

// Run the test
testManualBookingEdit()
  .then(() => {
    console.log('🎉 Manual test session completed!')
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message)
    process.exit(1)
  })