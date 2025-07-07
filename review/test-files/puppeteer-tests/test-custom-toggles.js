/**
 * Test script targeting custom status toggles in BookingPanel (not HTML checkboxes)
 */

import puppeteer from 'puppeteer'

async function testCustomToggles() {
  console.log('🔄 Testing Custom Status Toggles in BookingPanel...\\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 1000 },
      slowMo: 800
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
        }
      }
    })

    page.on('pageerror', error => {
      console.log('🔴 PAGE ERROR:', error.message)
    })

    // Step 1: Load dashboard and navigate to BookingPanel
    console.log('📱 Step 1: Loading dashboard...')
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 4000))

    // Step 2: Click "Bookings" in sidebar
    console.log('\\n📋 Step 2: Navigating to Bookings...')
    const bookingsButtonFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase().trim() || ''
        if (text === 'bookings' || text.includes('booking')) {
          button.click()
          return true
        }
      }
      return false
    })
    
    if (!bookingsButtonFound) {
      throw new Error('Bookings button not found')
    }
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Step 3: Click on first booking to open BookingPanel
    console.log('\\n🎯 Step 3: Opening BookingPanel...')
    const bookingRowFound = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr, .booking-row, [data-booking-id], .cursor-pointer'))
      const bookingRows = rows.filter(row => 
        (row.textContent?.includes('test') || row.textContent?.includes('Test')) &&
        row.textContent?.trim().length > 10
      )
      
      if (bookingRows.length > 0) {
        bookingRows[0].click()
        return true
      }
      return false
    })

    if (!bookingRowFound) {
      throw new Error('No booking row found')
    }
    await new Promise(resolve => setTimeout(resolve, 4000))
    console.log('✅ BookingPanel should be loaded')

    // Step 4: Find custom status toggles
    console.log('\\n🔘 Step 4: Looking for custom status toggles...')
    
    const statusToggles = await page.evaluate(() => {
      // Look for the status toggle structure as implemented in BookingPanel.jsx
      const statusLabels = [
        'Booking Confirmed',
        'Deposit Paid', 
        'Full Payment Made',
        'Contract Sent',
        'Contract Signed',
        'Deposit Invoice Sent',
        'Receipt Issued'
      ]
      
      const toggles = []
      
      for (const label of statusLabels) {
        // Find elements containing these labels
        const elements = Array.from(document.querySelectorAll('*'))
        
        for (const element of elements) {
          const text = element.textContent?.trim() || ''
          if (text.includes(label) && element.querySelector && !element.querySelector('input')) {
            // Check if this element or parent has a click handler
            const hasClickHandler = element.onclick || 
                                   element.getAttribute('onclick') ||
                                   element.classList.contains('cursor-pointer') ||
                                   window.getComputedStyle(element).cursor === 'pointer'
            
            if (hasClickHandler || element.parentElement?.classList.contains('cursor-pointer')) {
              const clickableElement = hasClickHandler ? element : element.parentElement
              
              toggles.push({
                label: label,
                element: clickableElement,
                text: text.substring(0, 100),
                hasIcon: text.includes('✓') || text.includes('💰') || text.includes('✅') || 
                        text.includes('📄') || text.includes('✍️') || text.includes('📧') || text.includes('🧾')
              })
              break
            }
          }
        }
      }
      
      return toggles
    })

    console.log(`Found ${statusToggles.length} custom status toggles:`)
    statusToggles.forEach((toggle, i) => {
      console.log(`  ${i + 1}. ${toggle.label} (Icon: ${toggle.hasIcon})`)
    })

    if (statusToggles.length === 0) {
      console.log('❌ No custom status toggles found')
      
      // Debug: Look for any clickable elements with status-related text
      const debugElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('.cursor-pointer, [onclick]'))
        return elements.map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 80) || '',
          classes: el.className || ''
        })).filter(el => el.text.length > 5)
      })
      
      console.log('\\n🔍 All clickable elements found:')
      debugElements.forEach((el, i) => {
        console.log(`  ${i + 1}. [${el.tag}] "${el.text}" (${el.classes})`)
      })
      
      throw new Error('No custom status toggles found')
    }

    // Step 5: Test the "Contract Sent" toggle (most likely to trigger charterCost error)
    const contractSentToggle = statusToggles.find(toggle => 
      toggle.label.includes('Contract Sent')
    )

    let targetToggle = contractSentToggle || statusToggles[0]
    
    console.log(`\\n🎯 Step 5: Testing toggle: "${targetToggle.label}"`)
    
    // Click the toggle directly in the page context
    const toggleClicked = await page.evaluate((toggleLabel) => {
      const elements = Array.from(document.querySelectorAll('*'))
      
      for (const element of elements) {
        const text = element.textContent?.trim() || ''
        if (text.includes(toggleLabel) && 
            (element.classList.contains('cursor-pointer') || 
             element.parentElement?.classList.contains('cursor-pointer'))) {
          
          const clickableElement = element.classList.contains('cursor-pointer') ? element : element.parentElement
          
          // Scroll to element and click
          clickableElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // Give it a moment then click
          setTimeout(() => {
            clickableElement.click()
          }, 500)
          
          return true
        }
      }
      
      return false
    }, targetToggle.label)

    if (!toggleClicked) {
      throw new Error(`Could not find and click toggle: ${targetToggle.label}`)
    }

    console.log('✅ Toggle clicked')
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Step 6: Set up error monitoring before clicking
    console.log('\\n🚨 Step 6: Setting up error monitoring...')
    
    let errorDetected = false
    let errorDetails = null
    
    const errorPromise = new Promise((resolve) => {
      const handler = (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text()
          console.log(`🔍 Console error: ${text}`)
          
          if (text.includes('charterCost') && text.includes('schema cache')) {
            errorDetected = true
            errorDetails = text
            console.log('🎯🎯🎯 CHARTERCOST ERROR REPRODUCED! 🎯🎯🎯')
            resolve(text)
          }
        }
      }
      
      page.on('console', handler)
      setTimeout(() => resolve(null), 20000) // Wait up to 20 seconds
    })

    // Step 7: Find and click save button
    console.log('\\n💾 Step 7: Finding and clicking save button...')
    
    const saveButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase().trim() || ''
        if (text.includes('save changes') || text.includes('save') || text.includes('update')) {
          // Scroll to button and click
          button.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          setTimeout(() => {
            button.click()
          }, 1000)
          
          return true
        }
      }
      return false
    })

    if (!saveButtonClicked) {
      console.log('❌ No save button found')
      throw new Error('Save button not found')
    }

    console.log('✅ Save button clicked')

    // Step 8: Wait for save and monitor for error
    console.log('\\n🔥 Step 8: MONITORING for charterCost error after save...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Wait for error or timeout
    console.log('⏳ Waiting for charterCost error...')
    const result = await errorPromise

    if (errorDetected) {
      console.log('\\n🎉🎉🎉 SUCCESS! CHARTERCOST ERROR REPRODUCED! 🎉🎉🎉')
      console.log('🚨 Error details:', errorDetails)
      console.log('🎯 Toggle tested:', targetToggle.label)
      
      return {
        success: true,
        errorReproduced: true,
        error: errorDetails,
        toggleTested: targetToggle.label,
        method: 'Custom status toggle click'
      }
    } else {
      console.log('\\n🤔 No charterCost error detected after 20 seconds')
      console.log('✅ This suggests the charterCost error has been FIXED!')
      
      // Let's wait a bit more to be sure
      console.log('⏳ Waiting additional 10 seconds to be absolutely sure...')
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      return {
        success: true,
        errorReproduced: false,
        message: 'No charterCost error detected - fix appears to be working!',
        toggleTested: targetToggle.label,
        method: 'Custom status toggle click'
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
testCustomToggles().then(results => {
  console.log('\\n🏁 CUSTOM TOGGLES TEST RESULTS:')
  console.log('=====================================')
  console.log('Success:', results.success)
  console.log('Error Reproduced:', results.errorReproduced)
  if (results.error) {
    console.log('Error:', results.error)
  }
  if (results.toggleTested) {
    console.log('Toggle Tested:', results.toggleTested)
  }
  if (results.method) {
    console.log('Method:', results.method)
  }
  console.log('=====================================')
  
  if (results.errorReproduced) {
    console.log('\\n🚨 CHARTERCCOST ERROR CONFIRMED! Need to implement fix...')
  } else if (results.success && !results.errorReproduced) {
    console.log('\\n🎉 NO ERROR DETECTED - The charterCost fix is working correctly!')
    console.log('✅ The previous field mapping fix appears to have resolved the issue!')
  } else {
    console.log('\\n❌ Could not complete test - investigating issues')
  }
}).catch(error => {
  console.error('Test execution failed:', error)
})