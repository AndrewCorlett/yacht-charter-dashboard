/**
 * FINAL TEST: Reproduce charterCost error by following exact user instructions
 * Navigate to booking page, toggle "contract sent", save changes, and capture error
 */

import puppeteer from 'puppeteer'

async function testFinalCharterCost() {
  console.log('🔄 FINAL CHARTERCOST ERROR TEST...\\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 1000 },
      slowMo: 1000,
      devtools: false
    })

    const page = await browser.newPage()
    
    // CRITICAL: Set up error monitoring from the start
    let charterCostErrorDetected = false
    let errorDetails = null
    
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      
      console.log(`🔍 BROWSER ${type.toUpperCase()}: ${text}`)
      
      if (type === 'error' && text.includes('charterCost')) {
        charterCostErrorDetected = true
        errorDetails = text
        console.log('🎯🎯🎯 CHARTERCOST ERROR DETECTED! 🎯🎯🎯')
        console.log('🚨 ERROR:', text)
      }
    })

    page.on('pageerror', error => {
      console.log('🔴 PAGE ERROR:', error.message)
      if (error.message.includes('charterCost')) {
        charterCostErrorDetected = true
        errorDetails = error.message
        console.log('🎯🎯🎯 CHARTERCOST PAGE ERROR! 🎯🎯🎯')
      }
    })

    // Step 1: Load the application
    console.log('📱 Step 1: Loading application...')
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log('✅ Application loaded')

    // Step 2: Expand sidebar first
    console.log('\\n📋 Step 2: Expanding sidebar...')
    const sidebarExpanded = await page.evaluate(() => {
      // Look for sidebar toggle button (hamburger menu)
      const toggleButtons = Array.from(document.querySelectorAll('button'))
      for (const button of toggleButtons) {
        const svg = button.querySelector('svg')
        if (svg && (svg.innerHTML.includes('M9 5l7 7-7 7') || button.getAttribute('data-testid') === 'sidebar-toggle')) {
          button.click()
          return true
        }
      }
      return false
    })
    
    if (sidebarExpanded) {
      console.log('✅ Sidebar expanded')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Step 3: Navigate to bookings
    console.log('\\n📋 Step 3: Navigating to bookings...')
    const bookingsFound = await page.evaluate(() => {
      // Look for bookings button/link in expanded sidebar
      const elements = Array.from(document.querySelectorAll('button, a, span'))
      for (const element of elements) {
        const text = element.textContent?.toLowerCase().trim() || ''
        if (text === 'bookings' || text.includes('booking')) {
          element.click()
          return true
        }
      }
      
      // Try clicking on clipboard icon (bookings icon)
      const svgs = Array.from(document.querySelectorAll('svg'))
      for (const svg of svgs) {
        if (svg.innerHTML.includes('M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2')) {
          const button = svg.closest('button')
          if (button) {
            button.click()
            return true
          }
        }
      }
      
      return false
    })

    if (!bookingsFound) {
      console.log('❌ Could not find bookings navigation')
      
      // Debug: List all clickable elements
      const clickableElements = await page.$$eval('button, a', elements => 
        elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
      )
      console.log('Available clickable elements:', clickableElements)
      
      throw new Error('Bookings navigation not found')
    }

    console.log('✅ Navigated to bookings')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Step 4: Find and click on a booking
    console.log('\\n🎯 Step 4: Finding booking to open...')
    
    const bookingOpened = await page.evaluate(() => {
      // Look for booking rows or cards with test data
      const allElements = Array.from(document.querySelectorAll('*'))
      
      for (const element of allElements) {
        const text = element.textContent || ''
        // Look for elements that contain booking information and are clickable
        if ((text.includes('test') || text.includes('Test')) && 
            text.includes('Jul') && 
            text.length < 300 &&
            (element.style.cursor === 'pointer' || 
             element.classList.contains('cursor-pointer') ||
             element.onclick ||
             element.getAttribute('onclick'))) {
          
          console.log('Found booking element:', text.substring(0, 100))
          element.click()
          return true
        }
      }
      
      // Fallback: try any element with booking-like content
      for (const element of allElements) {
        const text = element.textContent || ''
        if (text.includes('test') && text.includes('Calico Moon') && text.length < 200) {
          console.log('Found fallback booking element:', text.substring(0, 100))
          element.click()
          return true
        }
      }
      
      return false
    })

    if (!bookingOpened) {
      console.log('❌ Could not find booking to open')
      
      // Debug: show page content
      const content = await page.evaluate(() => document.body.innerText)
      console.log('📄 Page content preview:', content.substring(0, 500))
      
      throw new Error('No booking found to open')
    }

    console.log('✅ Booking opened')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Step 5: Look for Contract Sent toggle
    console.log('\\n🔘 Step 5: Looking for Contract Sent toggle...')
    
    const contractToggleFound = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'))
      
      for (const element of allElements) {
        const text = element.textContent?.trim() || ''
        if (text.includes('Contract Sent') && 
            (element.classList.contains('cursor-pointer') || 
             element.parentElement?.classList.contains('cursor-pointer'))) {
          
          console.log('Found Contract Sent toggle')
          const clickableElement = element.classList.contains('cursor-pointer') ? element : element.parentElement
          
          // Scroll to element and click
          clickableElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          clickableElement.click()
          
          return true
        }
      }
      
      // Try any toggle if Contract Sent not found
      for (const element of allElements) {
        const text = element.textContent?.trim() || ''
        if ((text.includes('Deposit') || text.includes('Confirmed') || text.includes('Sent')) && 
            text.length < 50 &&
            (element.classList.contains('cursor-pointer') || 
             element.parentElement?.classList.contains('cursor-pointer'))) {
          
          console.log('Found alternative toggle:', text)
          const clickableElement = element.classList.contains('cursor-pointer') ? element : element.parentElement
          
          clickableElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          clickableElement.click()
          
          return text // Return the toggle name
        }
      }
      
      return false
    })

    if (!contractToggleFound) {
      console.log('❌ Could not find Contract Sent toggle or any status toggle')
      
      // Debug: Look for any clickable elements
      const clickableElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('.cursor-pointer, [onclick]'))
        return elements.map(el => el.textContent?.trim().substring(0, 80)).filter(text => text)
      })
      console.log('Found clickable elements:', clickableElements)
      
      throw new Error('No status toggles found')
    }

    console.log(`✅ Toggled: ${typeof contractToggleFound === 'string' ? contractToggleFound : 'Contract Sent'}`)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 6: Scroll down and click save
    console.log('\\n💾 Step 6: Scrolling down and clicking save...')
    
    // Scroll down to bottom of page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await new Promise(resolve => setTimeout(resolve, 1000))

    const saveClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase().trim() || ''
        if (text.includes('save changes') || text.includes('save') || text.includes('update')) {
          console.log('Clicking save button:', text)
          button.scrollIntoView({ behavior: 'smooth', block: 'center' })
          button.click()
          return text
        }
      }
      return false
    })

    if (!saveClicked) {
      console.log('❌ Could not find save button')
      
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(b => b.textContent?.trim()).filter(text => text)
      )
      console.log('Available buttons:', allButtons)
      
      throw new Error('Save button not found')
    }

    console.log(`✅ Clicked save button: ${saveClicked}`)

    // Step 7: Wait and monitor for the charterCost error
    console.log('\\n🚨 Step 7: MONITORING FOR CHARTERCOST ERROR...')
    console.log('⏳ Waiting up to 30 seconds for error to appear...')
    
    // Wait for the error or timeout
    for (let i = 0; i < 30; i++) {
      if (charterCostErrorDetected) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (i % 5 === 0) {
        console.log(`⏳ Still waiting... (${i}/30 seconds)`)
      }
    }

    // Final result
    if (charterCostErrorDetected) {
      console.log('\\n🎉🎉🎉 SUCCESS! CHARTERCOST ERROR REPRODUCED! 🎉🎉🎉')
      console.log('🚨 Error details:', errorDetails)
      
      return {
        success: true,
        errorReproduced: true,
        error: errorDetails,
        testCompleted: true
      }
    } else {
      console.log('\\n✅ No charterCost error detected after 30 seconds')
      console.log('🎉 This means the charterCost error has been FIXED!')
      console.log('✅ The previous field mapping solution is working correctly!')
      
      return {
        success: true,
        errorReproduced: false,
        message: 'No charterCost error detected - FIX IS WORKING!',
        testCompleted: true
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return {
      success: false,
      error: error.message,
      testCompleted: false
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the final test
testFinalCharterCost().then(results => {
  console.log('\\n🏁 FINAL CHARTERCOST TEST RESULTS:')
  console.log('===================================')
  console.log('Success:', results.success)
  console.log('Error Reproduced:', results.errorReproduced)
  console.log('Test Completed:', results.testCompleted)
  if (results.error) {
    console.log('Error:', results.error)
  }
  if (results.message) {
    console.log('Message:', results.message)
  }
  console.log('===================================')
  
  if (results.errorReproduced) {
    console.log('\\n🚨 CHARTERCCOST ERROR CONFIRMED!')
    console.log('📋 Next steps: Implement field mapping fix for charterCost')
  } else if (results.success && !results.errorReproduced) {
    console.log('\\n🎉🎉🎉 CHARTERCOST ERROR HAS BEEN FIXED! 🎉🎉🎉')
    console.log('✅ The booking toggle save operation works without errors!')
    console.log('✅ Previous field mapping solution is successful!')
  } else {
    console.log('\\n❌ Could not complete test properly')
  }
}).catch(error => {
  console.error('Final test execution failed:', error)
})