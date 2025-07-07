/**
 * Puppeteer test for actual booking creation
 */

import puppeteer from 'puppeteer'

async function testActualBookingCreation() {
  console.log('=== Testing Actual Booking Creation ===\n')
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    slowMo: 500 // Slow down for debugging
  })
  
  const page = await browser.newPage()
  
  try {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 [BROWSER ERROR] ${msg.text()}`)
      } else if (msg.text().includes('booking') || msg.text().includes('code') || msg.text().includes('number')) {
        console.log(`🔵 [BROWSER] ${msg.text()}`)
      }
    })
    
    page.on('pageerror', error => {
      console.error(`💥 [PAGE ERROR] ${error.message}`)
    })
    
    console.log('1. Navigating to application...')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
    
    console.log('2. Waiting for form to load...')
    await page.waitForSelector('form', { timeout: 10000 })
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('3. Looking for yacht selector...')
    
    // Find yacht selector
    const yachtSelector = await page.$('[name="yacht"], select')
    if (!yachtSelector) {
      throw new Error('Could not find yacht selector')
    }
    
    console.log('4. Selecting Zavaria yacht...')
    await page.select('[name="yacht"], select', 'zavaria')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('5. Filling start date...')
    const startDateInput = await page.$('[name="startDate"], input[type="date"]')
    if (startDateInput) {
      await page.focus('[name="startDate"], input[type="date"]')
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('Control')
      await page.keyboard.type('2025-07-05')
    } else {
      console.log('   Could not find start date input')
    }
    
    console.log('6. Filling end date...')
    const endDateInput = await page.$('[name="endDate"], input[type="date"]')
    if (endDateInput) {
      await page.focus('[name="endDate"], input[type="date"]')
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('Control')
      await page.keyboard.type('2025-07-12')
    } else {
      console.log('   Could not find end date input')
    }
    
    console.log('7. Filling customer details...')
    
    // Fill first name
    const firstNameInput = await page.$('[name="firstName"], [name="customer_first_name"], input[placeholder*="First"]')
    if (firstNameInput) {
      await page.focus('[name="firstName"], [name="customer_first_name"], input[placeholder*="First"]')
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('Control')
      await page.keyboard.type('John')
    }
    
    // Fill surname
    const surnameInput = await page.$('[name="surname"], [name="customer_surname"], input[placeholder*="Surname"]')
    if (surnameInput) {
      await page.focus('[name="surname"], [name="customer_surname"], input[placeholder*="Surname"]')
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('Control')
      await page.keyboard.type('TestUser')
    }
    
    // Fill email
    const emailInput = await page.$('[name="email"], [name="customer_email"], input[type="email"]')
    if (emailInput) {
      await page.focus('[name="email"], [name="customer_email"], input[type="email"]')
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('Control')
      await page.keyboard.type('john.testuser@example.com')
    }
    
    console.log('8. Looking for Quick Create button...')
    
    // Look for Quick Create button
    const quickCreateButton = await page.$('button:has-text("Quick Create"), button:contains("Quick Create")')
    if (!quickCreateButton) {
      console.log('   Quick Create button not found, looking for other submit buttons...')
      const submitButtons = await page.$$('button[type="submit"], button:has-text("Create"), button:has-text("Save")')
      if (submitButtons.length > 0) {
        console.log(`   Found ${submitButtons.length} submit button(s)`)
      } else {
        throw new Error('No submit button found')
      }
    }
    
    console.log('9. Taking screenshot before submission...')
    await page.screenshot({ path: 'before-submit.png', fullPage: true })
    
    console.log('10. Clicking Quick Create...')
    
    // Try to find and click the button using different methods
    let buttonClicked = false
    
    // Method 1: Direct text search
    try {
      await page.click('button:has-text("Quick Create")')
      buttonClicked = true
      console.log('   Clicked using text selector')
    } catch (e) {
      console.log('   Text selector failed, trying xpath...')
      
      // Method 2: XPath
      try {
        const [button] = await page.$x('//button[contains(text(), "Quick Create")]')
        if (button) {
          await button.click()
          buttonClicked = true
          console.log('   Clicked using xpath')
        }
      } catch (e2) {
        console.log('   XPath failed, trying manual search...')
        
        // Method 3: Manual search
        const allButtons = await page.$$('button')
        for (const button of allButtons) {
          const text = await page.evaluate(el => el.textContent, button)
          if (text.includes('Quick Create')) {
            await button.click()
            buttonClicked = true
            console.log('   Clicked using manual search')
            break
          }
        }
      }
    }
    
    if (!buttonClicked) {
      throw new Error('Could not click Quick Create button')
    }
    
    console.log('11. Waiting for booking creation...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    console.log('12. Looking for booking code...')
    
    // Take screenshot after submission
    await page.screenshot({ path: 'after-submit.png', fullPage: true })
    
    // Look for booking code in various places
    let bookingCode = null
    
    // Method 1: Look for specific elements
    const codeSelectors = [
      '[data-testid="booking-code"]',
      '.booking-code',
      '.booking-number',
      '[class*="booking-code"]',
      '[class*="booking-number"]'
    ]
    
    for (const selector of codeSelectors) {
      try {
        const element = await page.$(selector)
        if (element) {
          bookingCode = await page.evaluate(el => el.textContent, element)
          console.log(`   Found booking code in ${selector}: ${bookingCode}`)
          break
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Method 2: Search page content for YYWWBCNN pattern
    if (!bookingCode) {
      console.log('   Searching page content for booking code pattern...')
      
      const pageContent = await page.evaluate(() => document.body.innerText)
      const patterns = [
        /\b\d{2}\d{2}[A-Z]{2}\d{2}\b/g,  // YYWWBCNN
        /\bBK\d{9}\b/g,                   // Old BK format
        /\b[A-Z]{2}\d{6,}\b/g             // Any code pattern
      ]
      
      for (const pattern of patterns) {
        const matches = pageContent.match(pattern)
        if (matches && matches.length > 0) {
          // Take the last match (most recent)
          bookingCode = matches[matches.length - 1]
          console.log(`   Found code pattern: ${bookingCode}`)
          break
        }
      }
    }
    
    // Method 3: Check console logs for booking code
    if (!bookingCode) {
      console.log('   No booking code found in UI, checking if creation succeeded...')
      
      // Look for success messages or error messages
      const messages = await page.evaluate(() => {
        const allText = document.body.innerText
        const lines = allText.split('\\n').filter(line => 
          line.includes('booking') || 
          line.includes('created') || 
          line.includes('success') ||
          line.includes('error')
        )
        return lines.slice(0, 10) // Return first 10 relevant lines
      })
      
      console.log('   Page messages:', messages)
    }
    
    if (bookingCode) {
      console.log('\\n=== Booking Code Analysis ===')
      console.log(`Generated: ${bookingCode}`)
      
      // Validate format
      const yywwbcnnPattern = /^\d{2}\d{2}[A-Z]{2}\d{2}$/
      const oldBkPattern = /^BK\d{9}$/
      
      if (yywwbcnnPattern.test(bookingCode)) {
        console.log('✅ SUCCESS: Generated code matches YYWWBCNN format!')
        
        const yy = bookingCode.slice(0, 2)
        const ww = bookingCode.slice(2, 4)
        const bc = bookingCode.slice(4, 6)
        const nn = bookingCode.slice(6, 8)
        
        console.log(`   Breakdown: YY=${yy}, WW=${ww}, BC=${bc}, NN=${nn}`)
        console.log(`   Year: 20${yy}`)
        console.log(`   Week: ${ww}`)
        console.log(`   Yacht: ${bc} (should be ZA for Zavaria)`)
        console.log(`   Sequence: ${nn}`)
        
        // Validate components
        const yearValid = yy === '25'
        const weekValid = parseInt(ww) >= 20 && parseInt(ww) <= 35
        const yachtValid = bc === 'ZA'
        const seqValid = parseInt(nn) >= 1
        
        console.log(`   Year check: ${yearValid ? '✅' : '❌'}`)
        console.log(`   Week check: ${weekValid ? '✅' : '❌'}`)
        console.log(`   Yacht check: ${yachtValid ? '✅' : '❌'}`)
        console.log(`   Sequence check: ${seqValid ? '✅' : '❌'}`)
        
        if (yearValid && weekValid && yachtValid && seqValid) {
          console.log('\\n🎉 PERFECT: All components are correct!')
          return { success: true, bookingCode, format: 'YYWWBCNN' }
        } else {
          console.log('\\n⚠️ PARTIAL: Format is correct but components have issues')
          return { success: false, bookingCode, format: 'YYWWBCNN', issue: 'Invalid components' }
        }
        
      } else if (oldBkPattern.test(bookingCode)) {
        console.log('❌ FAILURE: Still using old BK format!')
        console.log('   This indicates the new booking code generation is not being used')
        return { success: false, bookingCode, format: 'BK', issue: 'Old format still in use' }
        
      } else {
        console.log('❌ FAILURE: Unknown booking code format')
        console.log(`   Pattern: ${bookingCode}`)
        return { success: false, bookingCode, format: 'unknown', issue: 'Unrecognized format' }
      }
      
    } else {
      console.log('❌ FAILURE: No booking code found')
      console.log('   This could mean:')
      console.log('   1. Booking creation failed')
      console.log('   2. Booking code is not displayed in UI')
      console.log('   3. Form submission did not work')
      
      return { success: false, error: 'No booking code found' }
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`)
    await page.screenshot({ path: 'test-error.png', fullPage: true })
    return { success: false, error: error.message }
    
  } finally {
    console.log('\\nClosing browser...')
    await browser.close()
  }
}

// Run the test
testActualBookingCreation().then(result => {
  console.log('\\n=== Final Result ===')
  console.log(JSON.stringify(result, null, 2))
  
  if (result.success) {
    console.log('\\n✅ Booking creation test PASSED!')
    console.log('The YYWWBCNN booking code format is working correctly.')
  } else {
    console.log('\\n❌ Booking creation test FAILED!')
    console.log('The booking code format needs to be fixed.')
  }
}).catch(error => {
  console.error('Test suite error:', error)
})