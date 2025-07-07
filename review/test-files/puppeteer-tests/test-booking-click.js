/**
 * Test script to click on a booking and find the toggles
 */

import puppeteer from 'puppeteer'

async function testBookingClick() {
  console.log('🔄 Testing Booking Click and Toggle...\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      slowMo: 500
    })

    const page = await browser.newPage()
    
    // Enable console and error logging
    page.on('console', msg => {
      const type = msg.type()
      if (type === 'error' || type === 'warn') {
        console.log(`🔍 BROWSER ${type.toUpperCase()}:`, msg.text())
      }
    })

    page.on('pageerror', error => {
      console.log('🔴 PAGE ERROR:', error.message)
    })

    // Navigate to the bookings page
    console.log('📱 Loading bookings page...')
    await page.goto('http://localhost:3005/bookings', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('📄 Current URL:', page.url())

    // Look for booking cards/items to click on
    console.log('\n🔍 Looking for booking cards...')
    
    // Try different selectors for booking cards
    const cardSelectors = [
      'div:has-text("Test 1")',
      'div:has-text("Calico Moon")',
      'div:has-text("Jul")', // Date pattern
      '.booking-card',
      '.booking-item',
      '[role="button"]',
      '.cursor-pointer'
    ]

    let bookingCard = null
    
    for (const selector of cardSelectors) {
      try {
        const cards = await page.$$(selector)
        if (cards.length > 0) {
          // Find a card that looks like a booking
          for (const card of cards) {
            const text = await page.evaluate(el => el.textContent, card)
            if (text && (text.includes('Test') || text.includes('Calico Moon') || text.includes('Jul'))) {
              console.log(`✅ Found booking card: "${text.substring(0, 100)}..."`)
              bookingCard = card
              break
            }
          }
          if (bookingCard) break
        }
      } catch (e) {
        // Continue
      }
    }

    if (!bookingCard) {
      // Try clicking on any element that contains booking-like text
      console.log('🔍 Trying to find booking by text content...')
      
      const allElements = await page.$$('div, article, section')
      for (const element of allElements.slice(0, 50)) {
        const text = await page.evaluate(el => el.textContent, element)
        if (text && text.includes('Test 1') && text.includes('Jul')) {
          console.log(`✅ Found booking element: "${text.substring(0, 100)}..."`)
          bookingCard = element
          break
        }
      }
    }

    if (!bookingCard) {
      throw new Error('No booking card found to click on')
    }

    // Click on the booking card
    console.log('\n📋 Clicking on booking card...')
    await bookingCard.click()
    await new Promise(resolve => setTimeout(resolve, 3000))

    console.log('📄 New URL after click:', page.url())

    // Now look for checkboxes/toggles on the booking details page
    console.log('\n🔘 Looking for toggles on booking details page...')
    
    const checkboxes = await page.$$('input[type="checkbox"]')
    console.log(`Found ${checkboxes.length} checkboxes`)

    if (checkboxes.length === 0) {
      // Maybe the page hasn't loaded yet, wait a bit more
      console.log('⏳ No checkboxes found, waiting for page to load...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      const newCheckboxes = await page.$$('input[type="checkbox"]')
      console.log(`Found ${newCheckboxes.length} checkboxes after waiting`)
      
      if (newCheckboxes.length > 0) {
        checkboxes.push(...newCheckboxes)
      }
    }

    if (checkboxes.length > 0) {
      console.log('\n📋 Analyzing checkboxes...')
      
      // Get info about each checkbox
      for (let i = 0; i < checkboxes.length; i++) {
        const checkbox = checkboxes[i]
        const info = await page.evaluate(el => {
          const label = el.closest('label') || 
                       el.parentElement?.querySelector('label') || 
                       el.nextElementSibling || 
                       el.previousElementSibling
          
          return {
            checked: el.checked,
            name: el.name,
            id: el.id,
            labelText: label?.textContent?.trim() || '',
            parentText: el.parentElement?.textContent?.trim().substring(0, 100) || ''
          }
        }, checkbox)
        
        console.log(`  Checkbox ${i + 1}:`, info)
      }

      // Find the contract sent checkbox
      let contractSentCheckbox = null
      for (const checkbox of checkboxes) {
        const info = await page.evaluate(el => {
          const label = el.closest('label') || 
                       el.parentElement?.querySelector('label') || 
                       el.nextElementSibling || 
                       el.previousElementSibling
          return label?.textContent?.toLowerCase() || el.name?.toLowerCase() || ''
        }, checkbox)
        
        if (info.includes('contract') && info.includes('sent')) {
          contractSentCheckbox = checkbox
          console.log(`✅ Found Contract Sent checkbox`)
          break
        }
      }

      // If no specific contract sent checkbox, use the first one for testing
      if (!contractSentCheckbox && checkboxes.length > 0) {
        contractSentCheckbox = checkboxes[0]
        console.log('ℹ️ Using first checkbox for testing')
      }

      if (contractSentCheckbox) {
        // Get initial state
        const initialState = await page.evaluate(el => el.checked, contractSentCheckbox)
        console.log(`\n📋 Toggling checkbox from ${initialState} to ${!initialState}`)
        
        // Toggle the checkbox
        await contractSentCheckbox.click()
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify state changed
        const newState = await page.evaluate(el => el.checked, contractSentCheckbox)
        console.log(`✅ Checkbox state changed to: ${newState}`)

        // Look for save button
        console.log('\n💾 Looking for save button...')
        
        const saveButtons = await page.$$('button')
        let saveButton = null
        
        for (const button of saveButtons) {
          const text = await page.evaluate(el => el.textContent?.toLowerCase().trim(), button)
          if (text && (text.includes('save') || text.includes('submit') || text.includes('update'))) {
            console.log(`✅ Found save button: "${text}"`)
            saveButton = button
            break
          }
        }

        if (saveButton) {
          console.log('\n🎯 TESTING SAVE - Listening for charterCost error...')
          
          // Set up error listener
          let errorCaught = null
          const errorPromise = new Promise((resolve) => {
            const handler = (msg) => {
              if (msg.type() === 'error' && msg.text().includes('charterCost')) {
                errorCaught = msg.text()
                resolve(msg.text())
              }
            }
            page.on('console', handler)
            setTimeout(() => resolve(null), 15000) // Wait up to 15 seconds
          })
          
          // Click save
          await saveButton.click()
          
          // Wait for error or timeout
          const error = await errorPromise
          
          if (error) {
            console.log('🚨 SUCCESS! ERROR REPRODUCED:', error)
            return {
              success: true,
              errorReproduced: true,
              error: error,
              nextStep: 'Fix the charterCost field mapping issue'
            }
          } else {
            console.log('⚠️ No charterCost error detected in 15 seconds')
            
            // Check if any other errors occurred
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            return {
              success: true,
              errorReproduced: false,
              message: 'Save completed without charterCost error - may already be fixed'
            }
          }
        } else {
          console.log('❌ No save button found')
          return {
            success: false,
            error: 'No save button found'
          }
        }
      } else {
        console.log('❌ No checkbox found to test')
        return {
          success: false,
          error: 'No checkbox found'
        }
      }
    } else {
      console.log('❌ No checkboxes found on booking details page')
      
      // Log page content for debugging
      const pageContent = await page.evaluate(() => document.body.innerText)
      console.log('📄 Page content:', pageContent.substring(0, 500) + '...')
      
      return {
        success: false,
        error: 'No checkboxes found on booking details page'
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
testBookingClick().then(results => {
  console.log('\n📋 Test Results:', results)
  
  if (results.errorReproduced) {
    console.log('\n🎯 ERROR REPRODUCED! Now proceeding with fixes...')
  } else {
    console.log('\n⚠️ Error not reproduced. Checking if already fixed...')
  }
}).catch(error => {
  console.error('Test execution failed:', error)
})