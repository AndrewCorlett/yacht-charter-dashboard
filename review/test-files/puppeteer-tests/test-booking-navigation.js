/**
 * Test script to properly navigate to booking details page with status toggles
 */

import puppeteer from 'puppeteer'

async function testBookingNavigation() {
  console.log('🔄 Testing Booking Navigation to BookingPanel...\\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 1000 },
      slowMo: 500
    })

    const page = await browser.newPage()
    
    // Enable comprehensive console logging
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      
      if (type === 'error') {
        console.log(`🚨 BROWSER ERROR: ${text}`)
        
        // Check for the target charterCost error
        if (text.includes('charterCost') && text.includes('schema cache')) {
          console.log('🎯🎯🎯 CHARTERCOST ERROR DETECTED! 🎯🎯🎯')
          console.log('Full error:', text)
        }
      } else if (type === 'log' && text.includes('BookingPanel')) {
        console.log(`📋 BOOKING PANEL LOG: ${text}`)
      }
    })

    page.on('pageerror', error => {
      console.log('🔴 PAGE ERROR:', error.message)
    })

    // Navigate to the dashboard
    console.log('📱 Step 1: Loading dashboard...')
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 4000))

    console.log('✅ Dashboard loaded:', page.url())

    // First, try to access booking details through calendar navigation
    console.log('\\n📅 Step 2: Trying calendar navigation...')
    
    // Look for booking cells in the calendar
    const bookingCells = await page.$$('.booking-cell, [data-booking-id], .calendar-booking')
    console.log(`Found ${bookingCells.length} potential booking cells`)

    // If calendar method doesn't work, try the bookings list approach
    if (bookingCells.length === 0) {
      console.log('\\n📋 Step 3: Trying bookings list navigation...')
      
      // Click on "Bookings" in sidebar to go to bookings list
      const bookingsNavButton = await page.evaluateHandle(() => {
        // Look for navigation buttons/links
        const elements = Array.from(document.querySelectorAll('button, a, [role="button"]'))
        
        for (const element of elements) {
          const text = element.textContent?.toLowerCase().trim() || ''
          if (text === 'bookings' || text.includes('booking')) {
            return element
          }
        }
        return null
      })

      if (bookingsNavButton) {
        console.log('✅ Found bookings navigation, clicking...')
        await bookingsNavButton.click()
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    // Now try to find and click on a booking to trigger navigation
    console.log('\\n🔍 Step 4: Looking for clickable booking elements...')
    
    const bookingElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div, tr, [data-booking-id]'))
      
      return elements.map((el, index) => ({
        index,
        text: el.textContent?.trim().substring(0, 100) || '',
        clickable: el.onclick !== null || el.addEventListener || el.style.cursor === 'pointer',
        hasBookingText: el.textContent?.includes('test') || el.textContent?.includes('Test'),
        className: el.className || '',
        tagName: el.tagName
      })).filter(item => 
        item.hasBookingText && 
        item.text.length > 20 && 
        item.text.length < 200
      )
    })

    console.log('\\n📋 Found potential booking elements:')
    bookingElements.forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.tagName}] "${item.text}"`)
    })

    if (bookingElements.length > 0) {
      // Click on the first booking element
      console.log('\\n🎯 Step 5: Clicking on first booking element...')
      
      const firstBookingElement = await page.evaluateHandle((index) => {
        const elements = Array.from(document.querySelectorAll('div, tr, [data-booking-id]'))
        const targetElements = elements.filter(el => 
          (el.textContent?.includes('test') || el.textContent?.includes('Test')) &&
          el.textContent?.trim().length > 20 && 
          el.textContent?.trim().length < 200
        )
        return targetElements[index] || null
      }, 0)

      if (firstBookingElement) {
        await firstBookingElement.click()
        await new Promise(resolve => setTimeout(resolve, 4000))
        console.log('✅ Clicked on booking element')
      }
    }

    // Alternative: Try to programmatically trigger navigation event
    console.log('\\n🔧 Step 6: Trying programmatic navigation...')
    
    const navigationSuccess = await page.evaluate(() => {
      try {
        // Try to find a booking ID from the page
        const bookingElements = Array.from(document.querySelectorAll('[data-booking-id]'))
        let bookingId = null
        
        if (bookingElements.length > 0) {
          bookingId = bookingElements[0].dataset.bookingId
        } else {
          // Try to extract from text content
          const textElements = Array.from(document.querySelectorAll('*'))
          for (const el of textElements) {
            const text = el.textContent || ''
            if (text.includes('test') && text.includes('Jul')) {
              // For testing purposes, we'll use a known booking ID
              bookingId = 'test-booking-1'
              break
            }
          }
        }
        
        if (bookingId) {
          console.log('Triggering navigation event for booking:', bookingId)
          
          // Dispatch the navigation event as per the MainDashboard.jsx listener
          const navigationEvent = new CustomEvent('navigateToBooking', {
            detail: {
              booking: { id: bookingId },
              section: 'bookings'
            }
          })
          window.dispatchEvent(navigationEvent)
          
          return true
        }
        
        return false
      } catch (error) {
        console.log('Navigation event error:', error.message)
        return false
      }
    })

    if (navigationSuccess) {
      console.log('✅ Navigation event dispatched')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    // Now look for the BookingPanel with status toggles
    console.log('\\n🔘 Step 7: Searching for status toggles in BookingPanel...')
    
    // Wait for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000))

    const checkboxes = await page.$$('input[type="checkbox"]')
    console.log(`Found ${checkboxes.length} checkboxes`)

    if (checkboxes.length > 0) {
      console.log('\\n📋 Analyzing checkboxes for status toggles...')
      
      const statusCheckboxes = []
      
      for (let i = 0; i < checkboxes.length; i++) {
        const checkbox = checkboxes[i]
        const info = await page.evaluate(el => {
          const parent = el.closest('label') || el.parentElement
          const parentText = parent?.textContent?.trim() || ''
          
          return {
            index: i,
            checked: el.checked,
            name: el.name || '',
            id: el.id || '',
            parentText: parentText.substring(0, 100),
            isStatusToggle: parentText.toLowerCase().includes('contract') || 
                           parentText.toLowerCase().includes('deposit') ||
                           parentText.toLowerCase().includes('paid') ||
                           parentText.toLowerCase().includes('sent') ||
                           parentText.toLowerCase().includes('confirmed')
          }
        }, checkbox)
        
        console.log(`  Checkbox ${i + 1}: ${info.parentText} (Status: ${info.isStatusToggle})`)
        
        if (info.isStatusToggle) {
          statusCheckboxes.push({ checkbox, info })
        }
      }

      // Test the first status checkbox we find
      if (statusCheckboxes.length > 0) {
        const { checkbox, info } = statusCheckboxes[0]
        
        console.log(`\\n🎯 Step 8: Testing status toggle: "${info.parentText}"`)
        console.log(`Current state: ${info.checked}`)
        
        // Scroll to checkbox
        await page.evaluate(el => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, checkbox)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Toggle the checkbox
        console.log(`Toggling from ${info.checked} to ${!info.checked}`)
        await checkbox.click()
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const newState = await page.evaluate(el => el.checked, checkbox)
        console.log(`✅ Checkbox toggled to: ${newState}`)

        // Look for save button
        console.log('\\n💾 Step 9: Finding save button...')
        
        const saveButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'))
          
          for (const button of buttons) {
            const text = button.textContent?.toLowerCase().trim() || ''
            if (text.includes('save') || text.includes('update') || text.includes('submit')) {
              return button
            }
          }
          return null
        })

        if (saveButton) {
          console.log('✅ Found save button')
          
          // Set up error monitoring
          console.log('\\n🚨 Step 10: CLICKING SAVE - Monitoring for charterCost error...')
          
          let errorDetected = false
          let errorDetails = null
          
          const errorPromise = new Promise((resolve) => {
            const handler = (msg) => {
              if (msg.type() === 'error') {
                const text = msg.text()
                console.log(`🔍 Error detected: ${text}`)
                
                if (text.includes('charterCost') && text.includes('schema cache')) {
                  errorDetected = true
                  errorDetails = text
                  console.log('🎯🎯🎯 CHARTERCOST ERROR FOUND! 🎯🎯🎯')
                  resolve(text)
                }
              }
            }
            
            page.on('console', handler)
            setTimeout(() => resolve(null), 25000) // Wait up to 25 seconds
          })

          // Scroll to save button and click
          await page.evaluate(el => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, saveButton)
          await new Promise(resolve => setTimeout(resolve, 1000))

          console.log('🔥 CLICKING SAVE BUTTON...')
          await saveButton.click()

          // Wait for error or timeout
          const result = await errorPromise

          if (errorDetected) {
            console.log('\\n🎉🎉🎉 SUCCESS! CHARTERCOST ERROR REPRODUCED! 🎉🎉🎉')
            console.log('Error details:', errorDetails)
            
            return {
              success: true,
              errorReproduced: true,
              error: errorDetails,
              toggleTested: info.parentText
            }
          } else {
            console.log('\\n🤔 No charterCost error detected after 25 seconds')
            console.log('This might mean the error has already been fixed')
            
            return {
              success: true,
              errorReproduced: false,
              message: 'No charterCost error detected - possibly already fixed',
              toggleTested: info.parentText
            }
          }
        } else {
          console.log('❌ No save button found')
          return {
            success: false,
            error: 'No save button found in BookingPanel'
          }
        }
      } else {
        console.log('❌ No status toggles found')
        return {
          success: false,
          error: 'No status toggles found'
        }
      }
    } else {
      console.log('❌ No checkboxes found - BookingPanel may not have loaded')
      
      // Debug: check page content
      const pageContent = await page.evaluate(() => document.body.innerText)
      console.log('📄 Current page content preview:')
      console.log(pageContent.substring(0, 500) + '...')
      
      return {
        success: false,
        error: 'No checkboxes found - BookingPanel not loaded'
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
testBookingNavigation().then(results => {
  console.log('\\n🏁 BOOKING NAVIGATION TEST RESULTS:')
  console.log('========================================')
  console.log('Success:', results.success)
  console.log('Error Reproduced:', results.errorReproduced)
  if (results.error) {
    console.log('Error:', results.error)
  }
  if (results.toggleTested) {
    console.log('Toggle Tested:', results.toggleTested)
  }
  console.log('========================================')
  
  if (results.errorReproduced) {
    console.log('\\n🚨 CHARTERCCOST ERROR CONFIRMED! Ready to implement fixes...')
  } else if (results.success) {
    console.log('\\n🔍 No error detected - investigating if fix is already working...')
  }
}).catch(error => {
  console.error('Test execution failed:', error)
})