/**
 * Final comprehensive test to reproduce the charterCost error
 */

import puppeteer from 'puppeteer'

async function testBookingErrorFinal() {
  console.log('🔄 FINAL TEST: Reproducing charterCost Error...\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 1000 },
      slowMo: 500,
      devtools: false
    })

    const page = await browser.newPage()
    
    // Enable comprehensive logging
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      console.log(`🔍 BROWSER ${type.toUpperCase()}:`, text)
      
      // Check for our target error
      if (type === 'error' && text.includes('charterCost')) {
        console.log('🚨🚨🚨 TARGET ERROR FOUND! 🚨🚨🚨')
        console.log('ERROR:', text)
      }
    })

    page.on('pageerror', error => {
      console.log('🔴 PAGE ERROR:', error.message)
    })

    page.on('requestfailed', request => {
      console.log('🔴 REQUEST FAILED:', request.url(), request.failure().errorText)
    })

    // Navigate to the bookings page
    console.log('📱 Step 1: Loading bookings page...')
    await page.goto('http://localhost:3005/bookings', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 3000))

    console.log('✅ Page loaded:', page.url())

    // Find and click on a booking card using a more reliable method
    console.log('\n📋 Step 2: Finding booking to click on...')
    
    // Get all elements and filter for booking-like content
    const bookingElement = await page.evaluateHandle(() => {
      const allElements = Array.from(document.querySelectorAll('div, article, section'))
      
      for (const element of allElements) {
        const text = element.textContent || ''
        // Look for elements that contain both a name and a date pattern
        if (text.includes('test') && text.match(/\d{4}/) && element.children.length > 0) {
          return element
        }
      }
      
      // Fallback: find any clickable element with booking-like content
      for (const element of allElements) {
        const text = element.textContent || ''
        if ((text.includes('Calico Moon') || text.includes('Test')) && text.length < 200) {
          return element
        }
      }
      
      return null
    })

    if (!bookingElement) {
      throw new Error('No booking element found to click on')
    }

    console.log('✅ Found booking element, clicking...')
    await bookingElement.click()
    await new Promise(resolve => setTimeout(resolve, 4000))

    console.log('📄 URL after click:', page.url())

    // Scroll down to reveal all form fields
    console.log('\n📜 Step 3: Scrolling to reveal all content...')
    
    for (let i = 0; i < 5; i++) {
      await page.evaluate((step) => {
        window.scrollTo(0, (document.body.scrollHeight / 5) * step)
      }, i)
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    // Wait for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Find all checkboxes
    console.log('\n🔘 Step 4: Finding status toggles...')
    
    const checkboxes = await page.$$('input[type="checkbox"]')
    console.log(`Found ${checkboxes.length} checkboxes`)

    if (checkboxes.length === 0) {
      // Try to find toggle switches or other form controls
      const otherToggles = await page.$$('input[type="radio"], button[role="switch"], [role="checkbox"]')
      console.log(`Found ${otherToggles.length} other toggle controls`)
      
      if (otherToggles.length === 0) {
        console.log('❌ No toggle controls found')
        
        // Print page content for debugging
        const content = await page.evaluate(() => document.body.innerText)
        console.log('📄 Current page content:')
        console.log(content.substring(0, 1000) + '...')
        
        throw new Error('No toggle controls found on the page')
      }
    }

    // Test the first available checkbox
    const targetCheckbox = checkboxes[0]
    
    if (targetCheckbox) {
      // Get checkbox context
      const checkboxInfo = await page.evaluate(el => {
        const parent = el.closest('label') || el.parentElement
        return {
          checked: el.checked,
          name: el.name,
          parentText: parent?.textContent?.trim() || '',
          isVisible: el.offsetParent !== null
        }
      }, targetCheckbox)
      
      console.log('📋 Checkbox info:', checkboxInfo)
      
      if (!checkboxInfo.isVisible) {
        console.log('⚠️ Checkbox not visible, scrolling to it...')
        await page.evaluate(el => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, targetCheckbox)
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Toggle the checkbox
      console.log(`\n🔄 Step 5: Toggling checkbox from ${checkboxInfo.checked} to ${!checkboxInfo.checked}`)
      await targetCheckbox.click()
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify toggle worked
      const newState = await page.evaluate(el => el.checked, targetCheckbox)
      console.log(`✅ Checkbox now: ${newState}`)
    }

    // Find save button
    console.log('\n💾 Step 6: Finding save button...')
    
    const saveButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase().trim() || ''
        if (text.includes('save') || text.includes('submit') || text.includes('update')) {
          return button
        }
      }
      
      // Fallback: look for buttons in form context
      const forms = Array.from(document.querySelectorAll('form'))
      for (const form of forms) {
        const formButtons = form.querySelectorAll('button')
        if (formButtons.length > 0) {
          return formButtons[formButtons.length - 1] // Last button in form
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
      
      throw new Error('No save button found')
    }

    console.log('✅ Found save button')

    // Scroll to save button
    await page.evaluate(el => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, saveButton)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Set up error detection
    console.log('\n🚨 Step 7: CLICKING SAVE - Monitoring for charterCost error...')
    
    let errorDetected = false
    let detectedError = null
    
    const errorHandler = (msg) => {
      const text = msg.text()
      console.log(`📡 Console ${msg.type()}: ${text}`)
      
      if (msg.type() === 'error' && text.includes('charterCost')) {
        errorDetected = true
        detectedError = text
        console.log('🎯🎯🎯 CHARTERCCOST ERROR CONFIRMED! 🎯🎯🎯')
      }
    }
    
    page.on('console', errorHandler)

    // Click save and wait
    console.log('🔥 CLICKING SAVE NOW...')
    await saveButton.click()
    
    // Wait and monitor for errors
    console.log('⏳ Waiting 15 seconds for error to appear...')
    await new Promise(resolve => setTimeout(resolve, 15000))

    // Remove error handler
    page.removeListener('console', errorHandler)

    if (errorDetected) {
      console.log('\n🎉🎉🎉 SUCCESS! ERROR REPRODUCED! 🎉🎉🎉')
      console.log('🚨 Error:', detectedError)
      
      return {
        success: true,
        errorReproduced: true,
        error: detectedError,
        step: 'ERROR_REPRODUCED'
      }
    } else {
      console.log('\n🤔 No charterCost error detected...')
      console.log('📋 Possible reasons:')
      console.log('  1. Error has already been fixed')
      console.log('  2. Error occurs in different scenario')
      console.log('  3. Need to test with different data')
      
      return {
        success: true,
        errorReproduced: false,
        message: 'No charterCost error occurred',
        step: 'NO_ERROR_DETECTED'
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return {
      success: false,
      error: error.message,
      step: 'TEST_FAILED'
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the test
testBookingErrorFinal().then(results => {
  console.log('\n🏁 FINAL TEST RESULTS:')
  console.log('===========================')
  console.log('Success:', results.success)
  console.log('Error Reproduced:', results.errorReproduced)
  console.log('Step:', results.step)
  if (results.error) {
    console.log('Error Details:', results.error)
  }
  console.log('===========================')
  
  if (results.errorReproduced) {
    console.log('\n🔧 PROCEEDING WITH FIX IMPLEMENTATION...')
  } else if (results.success) {
    console.log('\n🔍 ERROR NOT REPRODUCED - Checking if fix already works...')
  }
}).catch(error => {
  console.error('Test execution failed:', error)
})