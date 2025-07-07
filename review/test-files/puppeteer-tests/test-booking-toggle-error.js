/**
 * Test script to reproduce the booking toggle error
 * This will navigate to a booking, toggle contract sent, and attempt to save
 */

import puppeteer from 'puppeteer'

async function testBookingToggleError() {
  console.log('🔄 Testing Booking Toggle Error - BEFORE FIXES...\n')

  let browser
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      slowMo: 300 // Slow down for visibility
    })

    const page = await browser.newPage()
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type()
      if (type === 'error' || type === 'warn') {
        console.log(`🔍 BROWSER ${type.toUpperCase()}:`, msg.text())
      }
    })

    // Enable error logging
    page.on('pageerror', error => {
      console.log('🚨 PAGE ERROR:', error.message)
    })

    page.on('requestfailed', request => {
      console.log('🔴 REQUEST FAILED:', request.url(), request.failure().errorText)
    })

    // Navigate to the application
    console.log('📱 Navigating to yacht charter dashboard...')
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' })
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000))

    console.log('✅ Application loaded successfully')

    // Look for any existing bookings to click on
    console.log('\n📋 Step 1: Looking for existing bookings...')
    
    // Try different selectors for booking cards/rows
    const bookingSelectors = [
      '.booking-card',
      '.booking-row', 
      '[data-testid="booking-card"]',
      '.calendar-booking',
      '.booking-item',
      '.MuiCard-root', // Material UI cards
      '.bg-gray-800', // Tailwind cards
      'div[role="button"]', // Generic clickable divs
      '.cursor-pointer'
    ]

    let bookingElement = null
    for (const selector of bookingSelectors) {
      try {
        bookingElement = await page.$(selector)
        if (bookingElement) {
          console.log(`✅ Found booking element with selector: ${selector}`)
          break
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!bookingElement) {
      // Try to find any clickable element that might be a booking
      console.log('ℹ️ Trying to find any clickable elements...')
      const clickableElements = await page.$$('div, button, a')
      console.log(`Found ${clickableElements.length} potential clickable elements`)
      
      // Look for text that suggests it's a booking
      for (const element of clickableElements.slice(0, 20)) { // Check first 20
        const text = await page.evaluate(el => el.textContent, element)
        if (text && (text.includes('booking') || text.includes('charter') || text.includes('yacht') || 
                    text.match(/\d{4}-\d{2}-\d{2}/) || text.includes('confirmed') || text.includes('pending'))) {
          console.log(`📝 Found potential booking: "${text.substring(0, 100)}..."`)
          bookingElement = element
          break
        }
      }
    }

    if (!bookingElement) {
      console.log('❌ No booking found to test with. Let me check the page structure...')
      
      // Get page title and some content
      const title = await page.title()
      const bodyText = await page.evaluate(() => document.body.textContent.substring(0, 500))
      
      console.log('Page title:', title)
      console.log('Page content preview:', bodyText)
      
      // Try to navigate to booking management or calendar
      console.log('\n🔍 Trying to navigate to booking management...')
      
      const navSelectors = [
        'a[href*="booking"]',
        'button:has-text("Booking")',
        'nav a',
        '.nav-link',
        '.navigation'
      ]
      
      for (const selector of navSelectors) {
        try {
          const navElement = await page.$(selector)
          if (navElement) {
            console.log(`Found navigation element: ${selector}`)
            await navElement.click()
            await new Promise(resolve => setTimeout(resolve, 2000))
            break
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Check again for bookings after navigation
      bookingElement = await page.$('.booking-card, .booking-row, [data-testid="booking-card"]')
    }

    if (!bookingElement) {
      throw new Error('No booking found to test with. Please ensure there are existing bookings in the system.')
    }

    // Click on the booking to open it
    console.log('\n📋 Step 2: Clicking on booking to open details...')
    await bookingElement.click()
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Look for the "Contract Sent" toggle
    console.log('\n📋 Step 3: Looking for Contract Sent toggle...')
    
    const toggleSelectors = [
      'input[type="checkbox"]', // Generic checkbox
      '.toggle',
      '.switch',
      '[data-testid="contract-sent"]',
      'label:has-text("Contract Sent")',
      'input[name*="contract"]',
      'input[name*="contractSent"]'
    ]

    let contractToggle = null
    for (const selector of toggleSelectors) {
      try {
        const toggles = await page.$$(selector)
        for (const toggle of toggles) {
          // Check if this toggle is related to contract sent
          const labelText = await page.evaluate(el => {
            const label = el.closest('label') || el.parentElement?.querySelector('label') || 
                         el.nextElementSibling || el.previousElementSibling
            return label ? label.textContent : el.name || el.id || ''
          }, toggle)
          
          if (labelText.toLowerCase().includes('contract') && labelText.toLowerCase().includes('sent')) {
            console.log(`✅ Found Contract Sent toggle: "${labelText}"`)
            contractToggle = toggle
            break
          }
        }
        if (contractToggle) break
      } catch (e) {
        // Continue
      }
    }

    if (!contractToggle) {
      console.log('❌ Contract Sent toggle not found. Let me list all checkboxes...')
      const allCheckboxes = await page.$$('input[type="checkbox"]')
      console.log(`Found ${allCheckboxes.length} checkboxes total`)
      
      for (let i = 0; i < Math.min(allCheckboxes.length, 10); i++) {
        const checkbox = allCheckboxes[i]
        const info = await page.evaluate(el => ({
          name: el.name,
          id: el.id,
          checked: el.checked,
          parentText: el.parentElement?.textContent?.substring(0, 50)
        }), checkbox)
        console.log(`Checkbox ${i + 1}:`, info)
      }
      
      // Use the first checkbox as a test
      if (allCheckboxes.length > 0) {
        contractToggle = allCheckboxes[0]
        console.log('ℹ️ Using first checkbox for testing purposes')
      }
    }

    if (!contractToggle) {
      throw new Error('No toggle found to test with')
    }

    // Get initial state
    const initialState = await page.evaluate(el => el.checked, contractToggle)
    console.log(`📋 Step 4: Current toggle state: ${initialState}`)

    // Toggle the checkbox
    console.log('\n📋 Step 5: Toggling Contract Sent from', initialState, 'to', !initialState)
    await contractToggle.click()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verify the toggle changed
    const newState = await page.evaluate(el => el.checked, contractToggle)
    console.log('✅ Toggle state changed to:', newState)

    // Look for the Save button
    console.log('\n📋 Step 6: Looking for Save button...')
    
    const saveSelectors = [
      'button:has-text("Save")',
      'button[type="submit"]',
      '.save-button',
      '[data-testid="save-button"]',
      'button:has-text("Save Changes")',
      'input[type="submit"]'
    ]

    let saveButton = null
    for (const selector of saveSelectors) {
      try {
        saveButton = await page.$(selector)
        if (saveButton) {
          const buttonText = await page.evaluate(el => el.textContent, saveButton)
          console.log(`✅ Found save button: "${buttonText}"`)
          break
        }
      } catch (e) {
        // Continue
      }
    }

    if (!saveButton) {
      console.log('❌ Save button not found. Let me list all buttons...')
      const allButtons = await page.$$('button')
      console.log(`Found ${allButtons.length} buttons total`)
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const button = allButtons[i]
        const buttonText = await page.evaluate(el => el.textContent?.trim(), button)
        console.log(`Button ${i + 1}: "${buttonText}"`)
        
        if (buttonText && (buttonText.toLowerCase().includes('save') || 
                          buttonText.toLowerCase().includes('update') ||
                          buttonText.toLowerCase().includes('submit'))) {
          saveButton = button
          console.log(`ℹ️ Using button: "${buttonText}" for testing`)
          break
        }
      }
    }

    if (!saveButton) {
      throw new Error('No save button found')
    }

    // Scroll to save button to ensure it's visible
    await page.evaluate(el => el.scrollIntoView(), saveButton)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Listen for console errors before clicking save
    console.log('\n📋 Step 7: Clicking Save and monitoring for errors...')
    
    const errorPromise = new Promise((resolve) => {
      const errorHandler = (msg) => {
        if (msg.type() === 'error' && msg.text().includes('charterCost')) {
          resolve(msg.text())
        }
      }
      page.on('console', errorHandler)
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(null), 10000)
    })

    // Click save
    await saveButton.click()
    
    // Wait for either an error or timeout
    const error = await errorPromise
    
    if (error) {
      console.log('🚨 ERROR CAPTURED:', error)
      return {
        success: false,
        error: error,
        message: 'Toggle error reproduced successfully'
      }
    } else {
      console.log('⚠️ No charterCost error detected. Let me check for other errors...')
      
      // Wait a bit more and check console
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      return {
        success: true,
        message: 'No error detected - may already be fixed or different issue'
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
testBookingToggleError().then(results => {
  console.log('\n📋 Test Results:', results)
}).catch(error => {
  console.error('Test execution failed:', error)
})