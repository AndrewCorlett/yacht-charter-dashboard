/**
 * Test script that directly navigates to a booking details page
 */

import puppeteer from 'puppeteer'

async function testDirectBooking() {
  console.log('🔄 Testing Direct Booking Navigation...\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 1000 },
      slowMo: 300
    })

    const page = await browser.newPage()
    
    // Enable comprehensive console logging
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      
      if (type === 'error') {
        console.log(`🚨 BROWSER ERROR: ${text}`)
        
        // Check for the target error
        if (text.includes('charterCost') && text.includes('schema cache')) {
          console.log('🎯🎯🎯 TARGET ERROR DETECTED! 🎯🎯🎯')
          console.log('Full error:', text)
        }
      } else if (type === 'warn') {
        console.log(`⚠️ BROWSER WARN: ${text}`)
      } else if (type === 'log' && text.includes('error')) {
        console.log(`📝 BROWSER LOG: ${text}`)
      }
    })

    page.on('pageerror', error => {
      console.log('🔴 PAGE ERROR:', error.message)
    })

    // First, get all available bookings to find a valid booking ID
    console.log('📱 Step 1: Getting booking list...')
    await page.goto('http://localhost:3005/bookings', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Extract booking IDs from the page
    console.log('🔍 Step 2: Finding booking IDs...')
    
    const bookingIds = await page.evaluate(() => {
      // Look for data attributes, URLs, or other identifiers
      const links = Array.from(document.querySelectorAll('a[href*="booking"]'))
      const ids = links.map(link => {
        const href = link.href
        const match = href.match(/booking[s]?\/([a-f0-9-]+)/i)
        return match ? match[1] : null
      }).filter(id => id)
      
      // Also check for any booking data in the DOM
      const bookingElements = Array.from(document.querySelectorAll('[data-booking-id], [data-id]'))
      const dataIds = bookingElements.map(el => el.dataset.bookingId || el.dataset.id).filter(id => id)
      
      return [...ids, ...dataIds]
    })

    console.log('Found booking IDs:', bookingIds)

    // Try different URL patterns to access booking details
    const urlPatterns = [
      'http://localhost:3005/booking/',
      'http://localhost:3005/bookings/',
      'http://localhost:3005/booking-details/',
      'http://localhost:3005/manage/booking/'
    ]

    let bookingDetailsFound = false
    let workingUrl = null

    // If we found specific booking IDs, try them
    if (bookingIds.length > 0) {
      const testBookingId = bookingIds[0]
      console.log(`\n🔗 Step 3: Trying to access booking details for ID: ${testBookingId}`)
      
      for (const pattern of urlPatterns) {
        const testUrl = pattern + testBookingId
        console.log(`Testing URL: ${testUrl}`)
        
        try {
          await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 10000 })
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const pageContent = await page.evaluate(() => document.body.innerText)
          
          // Check if this looks like a booking details page
          if (pageContent.includes('Booking Number') || 
              pageContent.includes('Charter Cost') ||
              pageContent.includes('Contract Sent') ||
              pageContent.includes('Status')) {
            
            console.log(`✅ Found booking details at: ${testUrl}`)
            workingUrl = testUrl
            bookingDetailsFound = true
            break
          }
        } catch (e) {
          console.log(`❌ Failed to load: ${testUrl}`)
        }
      }
    }

    // If no specific booking ID worked, try to create a new booking or find another way
    if (!bookingDetailsFound) {
      console.log('\n🔍 Step 4: Trying Quick Create to get to booking form...')
      
      await page.goto('http://localhost:3005/bookings', { waitUntil: 'networkidle2' })
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Try to click Quick Create button
      const quickCreateButton = await page.$('button:has-text("Quick Create"), button:has-text("✅ Quick Create")')
      
      if (quickCreateButton) {
        console.log('✅ Found Quick Create button, clicking...')
        await quickCreateButton.click()
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        workingUrl = page.url()
        bookingDetailsFound = true
      }
    }

    if (!bookingDetailsFound) {
      console.log('❌ Could not find or access booking details page')
      
      // Try one more approach: check for existing open booking panels
      const content = await page.evaluate(() => document.body.innerText)
      console.log('Current page content preview:', content.substring(0, 500))
      
      throw new Error('Could not access booking details page')
    }

    console.log(`📄 Current URL: ${workingUrl}`)
    console.log('✅ Successfully accessed booking details page')

    // Now look for form fields and checkboxes
    console.log('\n🔘 Step 5: Searching for form controls...')
    
    // Scroll to reveal all content
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    for (let i = 1; i <= 10; i++) {
      await page.evaluate((step) => {
        window.scrollTo(0, (document.body.scrollHeight / 10) * step)
      }, i)
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Look for checkboxes
    const checkboxes = await page.$$('input[type="checkbox"]')
    console.log(`Found ${checkboxes.length} checkboxes`)

    // Look for any inputs with status-related names
    const statusInputs = await page.$$('input[name*="contract"], input[name*="deposit"], input[name*="confirmed"], input[name*="sent"], input[name*="paid"]')
    console.log(`Found ${statusInputs.length} status-related inputs`)

    // List all form inputs
    const allInputs = await page.$$eval('input, select, textarea, button', elements => 
      elements.map(el => ({
        tag: el.tagName,
        type: el.type,
        name: el.name || '',
        id: el.id || '',
        value: el.value || '',
        checked: el.checked,
        textContent: el.textContent?.trim() || '',
        className: el.className || ''
      })).filter(input => 
        input.name || 
        input.id || 
        input.textContent ||
        input.type === 'checkbox' ||
        input.type === 'submit' ||
        input.textContent.toLowerCase().includes('save')
      )
    )

    console.log('\n📋 All form inputs found:')
    allInputs.forEach((input, i) => {
      console.log(`  ${i + 1}. [${input.tag}] type="${input.type}" name="${input.name}" id="${input.id}"`)
      if (input.textContent) console.log(`      Text: "${input.textContent}"`)
      if (input.type === 'checkbox') console.log(`      Checked: ${input.checked}`)
    })

    // Find a checkbox to test
    let testCheckbox = null
    
    if (checkboxes.length > 0) {
      testCheckbox = checkboxes[0]
      console.log('\n✅ Using first checkbox for testing')
    } else if (statusInputs.length > 0) {
      testCheckbox = statusInputs[0]
      console.log('\n✅ Using first status input for testing')
    }

    if (testCheckbox) {
      console.log('\n🔄 Step 6: Testing checkbox toggle...')
      
      // Get checkbox details
      const checkboxDetails = await page.evaluate(el => ({
        checked: el.checked,
        name: el.name,
        id: el.id,
        parentText: el.parentElement?.textContent?.trim().substring(0, 100)
      }), testCheckbox)
      
      console.log('Checkbox details:', checkboxDetails)
      
      // Scroll to checkbox
      await page.evaluate(el => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, testCheckbox)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Toggle checkbox
      console.log(`Toggling from ${checkboxDetails.checked} to ${!checkboxDetails.checked}`)
      await testCheckbox.click()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newState = await page.evaluate(el => el.checked, testCheckbox)
      console.log(`✅ Checkbox now: ${newState}`)
    }

    // Find save button
    console.log('\n💾 Step 7: Looking for save button...')
    
    const saveButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase().trim() || ''
        if (text.includes('save') || text.includes('submit') || text.includes('update') || text.includes('create')) {
          return button
        }
      }
      
      return null
    })

    if (!saveButton) {
      console.log('❌ No save button found')
      throw new Error('No save button found')
    }

    console.log('✅ Found save button')

    // Set up error monitoring
    console.log('\n🚨 Step 8: MONITORING FOR CHARTERCOST ERROR...')
    
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
      setTimeout(() => resolve(null), 20000) // 20 second timeout
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
      console.log('\n🎉🎉🎉 SUCCESS! CHARTERCOST ERROR REPRODUCED! 🎉🎉🎉')
      console.log('Error details:', errorDetails)
      
      return {
        success: true,
        errorReproduced: true,
        error: errorDetails,
        url: workingUrl
      }
    } else {
      console.log('\n🤔 No charterCost error detected after 20 seconds')
      console.log('This suggests the error may already be fixed')
      
      return {
        success: true,
        errorReproduced: false,
        message: 'No charterCost error detected - possibly already fixed',
        url: workingUrl
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
testDirectBooking().then(results => {
  console.log('\n🏁 COMPREHENSIVE TEST RESULTS:')
  console.log('===============================')
  console.log(JSON.stringify(results, null, 2))
  console.log('===============================')
  
  if (results.errorReproduced) {
    console.log('\n🚨 ERROR CONFIRMED! Implementing fixes now...')
  } else if (results.success) {
    console.log('\n✅ No error detected - fix may already be working!')
  }
}).catch(error => {
  console.error('Test execution failed:', error)
})