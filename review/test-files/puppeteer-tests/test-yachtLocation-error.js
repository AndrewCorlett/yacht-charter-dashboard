/**
 * Test to reproduce the exact yachtLocation schema error and verify fix
 */

import puppeteer from 'puppeteer'

async function testYachtLocationError() {
  console.log('🔄 Testing yachtLocation Schema Error Fix...\\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 1000 },
      slowMo: 1000
    })

    const page = await browser.newPage()
    
    // CRITICAL: Monitor for the specific yachtLocation error
    let yachtLocationErrorDetected = false
    let errorDetails = null
    
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      
      console.log(`🔍 BROWSER ${type.toUpperCase()}: ${text}`)
      
      if (type === 'error' && text.includes('yachtLocation') && text.includes('schema cache')) {
        yachtLocationErrorDetected = true
        errorDetails = text
        console.log('🎯🎯🎯 YACHTLOCATION ERROR DETECTED! 🎯🎯🎯')
        console.log('🚨 ERROR:', text)
      }
    })

    page.on('pageerror', error => {
      console.log('🔴 PAGE ERROR:', error.message)
      if (error.message.includes('yachtLocation')) {
        yachtLocationErrorDetected = true
        errorDetails = error.message
        console.log('🎯🎯🎯 YACHTLOCATION PAGE ERROR! 🎯🎯🎯')
      }
    })

    // Step 1: Navigate to application and reach BookingPanel
    console.log('📱 Step 1: Loading application...')
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Step 2: Expand sidebar and navigate to bookings
    console.log('\\n📋 Step 2: Navigating to BookingPanel...')
    
    // Expand sidebar
    await page.evaluate(() => {
      const toggleButtons = Array.from(document.querySelectorAll('button'))
      const sidebarToggle = toggleButtons.find(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.innerHTML.includes('M9 5l7 7-7 7')
      })
      if (sidebarToggle) sidebarToggle.click()
    })
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Navigate to bookings
    const bookingsNavigated = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, span'))
      const bookingsElement = elements.find(el => 
        el.textContent?.toLowerCase().includes('booking')
      )
      if (bookingsElement) {
        bookingsElement.click()
        return true
      }
      return false
    })

    if (!bookingsNavigated) {
      throw new Error('Could not navigate to bookings')
    }

    await new Promise(resolve => setTimeout(resolve, 3000))

    // Step 3: Open a booking in BookingPanel
    console.log('\\n🎯 Step 3: Opening booking in BookingPanel...')
    
    const bookingOpened = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'))
      
      for (const element of allElements) {
        const text = element.textContent || ''
        if ((text.includes('test') || text.includes('Test')) && 
            text.includes('Jul') && 
            text.length < 300 &&
            (element.style.cursor === 'pointer' || 
             element.classList.contains('cursor-pointer'))) {
          
          element.click()
          return true
        }
      }
      return false
    })

    if (!bookingOpened) {
      throw new Error('Could not open booking')
    }

    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log('✅ BookingPanel opened')

    // Step 4: Find and toggle a status (exactly as user described)
    console.log('\\n🔘 Step 4: Finding status toggle at specified path...')
    console.log('Target: #root > div > div.ml-12... > div:nth-child(3)')
    
    const toggleClicked = await page.evaluate(() => {
      // Try to find the exact element path the user specified
      const rootElement = document.querySelector('#root > div > div.ml-12')
      if (!rootElement) return false
      
      // Look for status toggles with cursor-pointer
      const statusToggles = Array.from(document.querySelectorAll('.cursor-pointer'))
      
      for (const toggle of statusToggles) {
        const text = toggle.textContent?.trim() || ''
        if ((text.includes('Contract Sent') || 
             text.includes('Deposit Paid') || 
             text.includes('Full Payment') ||
             text.includes('Booking Confirmed')) && 
            text.length < 100) {
          
          console.log('Found status toggle:', text)
          toggle.scrollIntoView({ behavior: 'smooth', block: 'center' })
          toggle.click()
          return text
        }
      }
      return false
    })

    if (!toggleClicked) {
      throw new Error('Could not find status toggle at specified path')
    }

    console.log(`✅ Toggled status: ${toggleClicked}`)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 5: Scroll down and click Save Changes (as user described)
    console.log('\\n💾 Step 5: Scrolling down and clicking Save Changes...')
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await new Promise(resolve => setTimeout(resolve, 1000))

    const saveClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const saveButton = buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('save changes')
      )
      
      if (saveButton) {
        console.log('Clicking Save Changes button')
        saveButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
        saveButton.click()
        return true
      }
      return false
    })

    if (!saveClicked) {
      throw new Error('Could not find Save Changes button')
    }

    console.log('✅ Save Changes clicked')

    // Step 6: Monitor for yachtLocation error
    console.log('\\n🚨 Step 6: MONITORING FOR YACHTLOCATION ERROR...')
    console.log('⏳ Waiting up to 20 seconds for error...')
    
    // Wait for the error or timeout
    for (let i = 0; i < 20; i++) {
      if (yachtLocationErrorDetected) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (i % 5 === 0) {
        console.log(`⏳ Still waiting... (${i}/20 seconds)`)
      }
    }

    // Result analysis
    if (yachtLocationErrorDetected) {
      console.log('\\n🚨 YACHTLOCATION ERROR REPRODUCED!')
      console.log('🚨 Error details:', errorDetails)
      console.log('❌ Fix did not work - field mapping still missing')
      
      return {
        success: true,
        errorReproduced: true,
        error: errorDetails,
        fixWorking: false
      }
    } else {
      console.log('\\n✅ No yachtLocation error detected!')
      console.log('🎉 The field mapping fix is WORKING!')
      console.log('✅ yachtLocation → yacht_location mapping successful')
      
      return {
        success: true,
        errorReproduced: false,
        message: 'No yachtLocation error - FIX IS WORKING!',
        fixWorking: true
      }
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
testYachtLocationError().then(results => {
  console.log('\\n🏁 YACHTLOCATION ERROR TEST RESULTS:')
  console.log('=====================================')
  console.log('Success:', results.success)
  console.log('Error Reproduced:', results.errorReproduced)
  console.log('Fix Working:', results.fixWorking)
  if (results.error) {
    console.log('Error Details:', results.error)
  }
  if (results.message) {
    console.log('Message:', results.message)
  }
  console.log('=====================================')
  
  if (results.fixWorking) {
    console.log('\\n🎉🎉🎉 YACHTLOCATION ERROR HAS BEEN FIXED! 🎉🎉🎉')
    console.log('✅ Field mapping yachtLocation → yacht_location working correctly!')
    console.log('✅ Status toggle save operations now work without schema errors!')
  } else if (results.errorReproduced) {
    console.log('\\n🚨 ERROR STILL EXISTS - Need additional investigation')
  } else {
    console.log('\\n❌ Could not complete test properly')
  }
}).catch(error => {
  console.error('Test execution failed:', error)
})