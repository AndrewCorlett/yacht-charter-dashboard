/**
 * Test script with correct navigation flow: Sidebar -> Bookings -> BookingsList -> BookingPanel
 */

import puppeteer from 'puppeteer'

async function testCorrectNavigation() {
  console.log('🔄 Testing Correct Navigation Flow...\\n')

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
      } else if (type === 'log' && (text.includes('BookingPanel') || text.includes('booking'))) {
        console.log(`📋 BOOKING LOG: ${text}`)
      }
    })

    page.on('pageerror', error => {
      console.log('🔴 PAGE ERROR:', error.message)
    })

    // Step 1: Load dashboard
    console.log('📱 Step 1: Loading dashboard...')
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 4000))
    console.log('✅ Dashboard loaded')

    // Step 2: Click "Bookings" in the sidebar
    console.log('\\n📋 Step 2: Clicking Bookings in sidebar...')
    
    const bookingsButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase().trim() || ''
        if (text === 'bookings' || text.includes('booking')) {
          return button
        }
      }
      
      // Try to find by SVG icon (clipboard icon for bookings)
      const svgs = Array.from(document.querySelectorAll('svg'))
      for (const svg of svgs) {
        const path = svg.querySelector('path[d*="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"]')
        if (path) {
          return svg.closest('button')
        }
      }
      
      return null
    })
    
    if (!bookingsButton) {
      console.log('❌ Could not find bookings button')
      throw new Error('Bookings button not found')
    }
    
    console.log('✅ Found bookings button, clicking...')
    await bookingsButton.click()
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log('✅ Clicked bookings navigation')

    // Step 3: Wait for BookingsList to load and find bookings
    console.log('\\n📋 Step 3: Waiting for BookingsList to load...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Look for booking rows in the table/list
    console.log('🔍 Looking for booking rows...')
    
    const bookingRows = await page.evaluate(() => {
      // Look for table rows or list items that contain booking data
      const rows = Array.from(document.querySelectorAll('tr, .booking-row, [data-booking-id], .cursor-pointer'))
      
      return rows.map((row, index) => ({
        index,
        text: row.textContent?.trim().substring(0, 100) || '',
        hasBookingData: row.textContent?.includes('test') || row.textContent?.includes('Test') || row.textContent?.includes('Jul'),
        isClickable: row.style.cursor === 'pointer' || row.onclick !== null || row.classList.contains('cursor-pointer'),
        tagName: row.tagName
      })).filter(item => item.hasBookingData && item.text.length > 10)
    })

    console.log(`Found ${bookingRows.length} potential booking rows:`)
    bookingRows.forEach((row, i) => {
      console.log(`  ${i + 1}. [${row.tagName}] "${row.text}" (clickable: ${row.isClickable})`)
    })

    if (bookingRows.length === 0) {
      console.log('❌ No booking rows found in BookingsList')
      
      // Debug: show page content
      const pageContent = await page.evaluate(() => document.body.innerText)
      console.log('📄 Current page content preview:')
      console.log(pageContent.substring(0, 800) + '...')
      
      throw new Error('No booking rows found')
    }

    // Step 4: Click on the first booking row
    console.log('\\n🎯 Step 4: Clicking on first booking row...')
    
    const firstBookingRow = await page.evaluateHandle(() => {
      const rows = Array.from(document.querySelectorAll('tr, .booking-row, [data-booking-id], .cursor-pointer'))
      const bookingRows = rows.filter(row => 
        (row.textContent?.includes('test') || row.textContent?.includes('Test') || row.textContent?.includes('Jul')) &&
        row.textContent?.trim().length > 10
      )
      return bookingRows[0] || null
    })

    if (!firstBookingRow) {
      throw new Error('Could not find first booking row element')
    }

    console.log('✅ Found first booking row, clicking...')
    await firstBookingRow.click()
    await new Promise(resolve => setTimeout(resolve, 4000))
    console.log('✅ Clicked booking row')

    // Step 5: Wait for BookingPanel to load and look for status toggles
    console.log('\\n🔘 Step 5: Looking for status toggles in BookingPanel...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const checkboxes = await page.$$('input[type="checkbox"]')
    console.log(`Found ${checkboxes.length} checkboxes`)

    if (checkboxes.length === 0) {
      console.log('⚠️ No checkboxes found, checking if BookingPanel loaded...')
      
      const pageContent = await page.evaluate(() => document.body.innerText)
      const hasBookingPanel = pageContent.includes('Contract Sent') || 
                             pageContent.includes('Deposit Paid') || 
                             pageContent.includes('Booking Confirmed') ||
                             pageContent.includes('Update') ||
                             pageContent.includes('Delete')
      
      console.log(`BookingPanel indicators found: ${hasBookingPanel}`)
      
      if (!hasBookingPanel) {
        console.log('❌ BookingPanel does not appear to have loaded')
        console.log('📄 Current page content:')
        console.log(pageContent.substring(0, 500) + '...')
        throw new Error('BookingPanel not loaded')
      } else {
        console.log('✅ BookingPanel appears to have loaded, but no checkboxes visible yet')
        console.log('⏳ Waiting longer for checkboxes to load...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Try again to find checkboxes
        const delayedCheckboxes = await page.$$('input[type="checkbox"]')
        console.log(`After delay, found ${delayedCheckboxes.length} checkboxes`)
        
        if (delayedCheckboxes.length > 0) {
          checkboxes.push(...delayedCheckboxes)
        }
      }
    }

    // Step 6: Analyze and test checkboxes
    if (checkboxes.length > 0) {
      console.log('\\n📋 Step 6: Analyzing status toggles...')
      
      const statusToggleInfo = []
      
      for (let i = 0; i < checkboxes.length; i++) {
        const checkbox = checkboxes[i]
        const info = await page.evaluate(el => {
          const label = el.closest('label') || el.parentElement
          const labelText = label?.textContent?.trim() || ''
          
          return {
            index: i,
            checked: el.checked,
            name: el.name || '',
            id: el.id || '',
            labelText: labelText.substring(0, 100),
            isStatusToggle: labelText.toLowerCase().includes('contract') || 
                           labelText.toLowerCase().includes('deposit') ||
                           labelText.toLowerCase().includes('paid') ||
                           labelText.toLowerCase().includes('sent') ||
                           labelText.toLowerCase().includes('confirmed') ||
                           labelText.toLowerCase().includes('invoice') ||
                           labelText.toLowerCase().includes('receipt')
          }
        }, checkbox)
        
        console.log(`  Checkbox ${i + 1}: "${info.labelText}" (Status: ${info.isStatusToggle})`)
        
        if (info.isStatusToggle) {
          statusToggleInfo.push({ checkbox, info })
        }
      }

      // Find the best status toggle to test (preferably Contract Sent)
      let targetToggle = statusToggleInfo.find(toggle => 
        toggle.info.labelText.toLowerCase().includes('contract') && 
        toggle.info.labelText.toLowerCase().includes('sent')
      )
      
      if (!targetToggle && statusToggleInfo.length > 0) {
        targetToggle = statusToggleInfo[0] // Use first available status toggle
      }

      if (targetToggle) {
        console.log(`\\n🎯 Step 7: Testing toggle: "${targetToggle.info.labelText}"`)
        console.log(`Current state: ${targetToggle.info.checked}`)
        
        // Scroll to the toggle
        await page.evaluate(el => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, targetToggle.checkbox)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Toggle the checkbox
        console.log(`Toggling from ${targetToggle.info.checked} to ${!targetToggle.info.checked}`)
        await targetToggle.checkbox.click()
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const newState = await page.evaluate(el => el.checked, targetToggle.checkbox)
        console.log(`✅ Toggle changed to: ${newState}`)

        // Step 8: Find and click save button
        console.log('\\n💾 Step 8: Finding save button...')
        
        const saveButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'))
          
          for (const button of buttons) {
            const text = button.textContent?.toLowerCase().trim() || ''
            if (text.includes('save') || text.includes('update')) {
              return button
            }
          }
          return null
        })

        if (!saveButton) {
          console.log('❌ No save button found')
          
          // List all buttons for debugging
          const allButtons = await page.$$eval('button', buttons => 
            buttons.map(b => b.textContent?.trim()).filter(text => text)
          )
          console.log('Available buttons:', allButtons)
          
          throw new Error('Save button not found')
        }

        console.log('✅ Found save button')

        // Step 9: Monitor for charterCost error and click save
        console.log('\\n🚨 Step 9: FINAL TEST - Clicking save and monitoring for charterCost error...')
        
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
          setTimeout(() => resolve(null), 30000) // Wait up to 30 seconds
        })

        // Scroll to save button and click
        await page.evaluate(el => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, saveButton)
        await new Promise(resolve => setTimeout(resolve, 1000))

        console.log('🔥 CLICKING SAVE BUTTON NOW...')
        await saveButton.click()

        // Wait for error or timeout
        const result = await errorPromise

        if (errorDetected) {
          console.log('\\n🎉🎉🎉 SUCCESS! CHARTERCOST ERROR REPRODUCED! 🎉🎉🎉')
          console.log('🚨 Error details:', errorDetails)
          console.log('🎯 Toggle tested:', targetToggle.info.labelText)
          
          return {
            success: true,
            errorReproduced: true,
            error: errorDetails,
            toggleTested: targetToggle.info.labelText,
            navigationFlow: 'Sidebar -> Bookings -> BookingsList -> BookingPanel -> Save'
          }
        } else {
          console.log('\\n🤔 No charterCost error detected after 30 seconds')
          console.log('✅ This suggests the error has been fixed!')
          
          return {
            success: true,
            errorReproduced: false,
            message: 'No charterCost error detected - fix appears to be working!',
            toggleTested: targetToggle.info.labelText,
            navigationFlow: 'Sidebar -> Bookings -> BookingsList -> BookingPanel -> Save'
          }
        }
      } else {
        console.log('❌ No status toggles found')
        return {
          success: false,
          error: 'No status toggles found in BookingPanel'
        }
      }
    } else {
      console.log('❌ No checkboxes found after extended wait')
      
      // Debug: Try to find form elements or any interactive elements
      const formElements = await page.$$eval('input, button, select', elements => 
        elements.map(el => ({
          tag: el.tagName,
          type: el.type,
          name: el.name || '',
          id: el.id || '',
          value: el.value || '',
          textContent: el.textContent?.trim() || ''
        })).filter(el => el.name || el.id || el.textContent)
      )
      
      console.log('\\n🔍 All form elements found:')
      formElements.forEach((el, i) => {
        console.log(`  ${i + 1}. [${el.tag}] type="${el.type}" name="${el.name}" id="${el.id}" text="${el.textContent}"`)
      })
      
      return {
        success: false,
        error: 'No checkboxes found - BookingPanel may not have rendered properly',
        foundElements: formElements.length
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
testCorrectNavigation().then(results => {
  console.log('\\n🏁 COMPREHENSIVE NAVIGATION TEST RESULTS:')
  console.log('============================================')
  console.log('Success:', results.success)
  console.log('Error Reproduced:', results.errorReproduced)
  if (results.error) {
    console.log('Error:', results.error)
  }
  if (results.toggleTested) {
    console.log('Toggle Tested:', results.toggleTested)
  }
  if (results.navigationFlow) {
    console.log('Navigation Flow:', results.navigationFlow)
  }
  console.log('============================================')
  
  if (results.errorReproduced) {
    console.log('\\n🚨 ERROR CONFIRMED! Implementing fix now...')
  } else if (results.success && !results.errorReproduced) {
    console.log('\\n✅ NO ERROR DETECTED - Fix appears to be working correctly!')
  } else {
    console.log('\\n❌ Could not complete test - investigating navigation issues')
  }
}).catch(error => {
  console.error('Test execution failed:', error)
})