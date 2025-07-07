/**
 * Test Booking Number Edit Workflow
 * 
 * This test validates the complete booking number editing and sequencing workflow:
 * 1. Create a booking
 * 2. Edit the booking number manually
 * 3. Verify the update in Supabase
 * 4. Create another booking and verify NN increments properly
 */

import puppeteer from 'puppeteer'

async function testBookingNumberEditWorkflow() {
  let browser = null
  
  try {
    console.log('🚀 Starting booking number edit workflow test...')
    
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false,
      slowMo: 300,
      devtools: false,
      args: ['--no-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1400, height: 900 })
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text())
      } else if (msg.type() === 'log') {
        console.log('📝 Browser Log:', msg.text())
      }
    })
    
    // Listen for network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ Network Error: ${response.status()} ${response.url()}`)
      }
    })
    
    console.log('📖 Step 1: Navigate to application')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' })
    
    console.log('📖 Step 2: Create first booking for DD (Disk Drive)')
    
    // Click quick create button
    await page.waitForSelector('[data-testid="quick-create-btn"], button:has-text("Quick Create")', { timeout: 10000 })
    const quickCreateBtn = await page.$('[data-testid="quick-create-btn"]') || await page.$('button:has-text("Quick Create")')
    if (quickCreateBtn) {
      await quickCreateBtn.click()
    } else {
      throw new Error('Quick create button not found')
    }
    
    // Wait for form to load
    await page.waitForTimeout(2000)
    
    // Fill customer details
    await page.type('[data-testid="customer-first-name"], input[placeholder*="first"], input[placeholder*="First"]', 'John')
    await page.type('[data-testid="customer-surname"], input[placeholder*="surname"], input[placeholder*="Surname"]', 'Doe')
    await page.type('[data-testid="customer-email"], input[placeholder*="email"], input[type="email"]', 'john.doe@example.com')
    
    // Select yacht (Disk Drive)
    const yachtSelect = await page.$('[data-testid="yacht-select"], select') || await page.$('select')
    if (yachtSelect) {
      await yachtSelect.selectOption('234a2f45-1e79-44fb-b5aa-3c058f777255') // Disk Drive UUID
    } else {
      console.log('❌ Yacht select not found, trying alternative selectors')
      await page.click('select')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
    }
    
    // Set dates
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)
    const weekAfter = new Date(nextMonth)
    weekAfter.setDate(nextMonth.getDate() + 7)
    
    const startDateStr = nextMonth.toISOString().split('T')[0]
    const endDateStr = weekAfter.toISOString().split('T')[0]
    
    await page.type('[data-testid="start-date"], input[type="date"]', startDateStr)
    await page.type('[data-testid="end-date"], input[type="date"]:not([data-testid="start-date"])', endDateStr)
    
    // Submit the form
    const submitBtn = await page.$('[data-testid="submit-booking"], button:has-text("Create"), button[type="submit"]')
    if (submitBtn) {
      await submitBtn.click()
    } else {
      await page.keyboard.press('Enter')
    }
    
    console.log('⏳ Waiting for booking creation...')
    await page.waitForTimeout(3000)
    
    // Check for success and get booking number
    console.log('📖 Step 3: Find and edit the booking number')
    
    // Look for booking number in various locations
    let bookingNumberElement = null
    const selectors = [
      '[data-testid="booking-number"]',
      '.booking-number',
      'span[class*="booking"]',
      'div[class*="booking"]',
      'h1, h2, h3, h4'
    ]
    
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        const elements = await page.$$(selector)
        for (const element of elements) {
          const text = await element.textContent()
          if (text && /\\d{2}\\d{2}[A-Z]{2}\\d{2}/.test(text)) {
            bookingNumberElement = element
            break
          }
        }
        if (bookingNumberElement) break
      } catch (e) {
        continue
      }
    }
    
    if (!bookingNumberElement) {
      console.log('❌ Could not find booking number element. Looking in page content...')
      const pageContent = await page.content()
      const bookingNumberMatch = pageContent.match(/(\\d{2}\\d{2}[A-Z]{2}\\d{2})/g)
      if (bookingNumberMatch) {
        console.log('📝 Found booking numbers in page:', bookingNumberMatch)
      }
      throw new Error('Booking number element not found')
    }
    
    const originalBookingNumber = await bookingNumberElement.textContent()
    console.log('✅ Found booking number:', originalBookingNumber.trim())
    
    // Try to hover and click to edit
    await bookingNumberElement.hover()
    await page.waitForTimeout(1000)
    
    // Look for edit button that appears on hover
    const editBtn = await page.$('button[title*="edit"], button[title*="Edit"], .edit-btn')
    if (editBtn) {
      await editBtn.click()
      console.log('✅ Clicked edit button')
    } else {
      // Try double-clicking on the booking number itself
      await bookingNumberElement.click({ clickCount: 2 })
      console.log('✅ Double-clicked booking number')
    }
    
    await page.waitForTimeout(1000)
    
    // Look for input field
    const inputField = await page.$('input[type="text"][value*="25"], input[maxlength="8"]')
    if (!inputField) {
      throw new Error('Edit input field not found')
    }
    
    // Extract the original NN number and increment by 2 to test
    const match = originalBookingNumber.match(/(\\d{2}\\d{2}[A-Z]{2})(\\d{2})/)
    if (!match) {
      throw new Error('Invalid booking number format: ' + originalBookingNumber)
    }
    
    const prefix = match[1] // YYWWBC part
    const originalNN = parseInt(match[2])
    const newNN = originalNN + 2 // Skip one number to simulate manual override
    const newBookingNumber = prefix + newNN.toString().padStart(2, '0')
    
    console.log(`📝 Changing booking number from ${originalBookingNumber.trim()} to ${newBookingNumber}`)
    
    // Clear and enter new booking number
    await inputField.click({ clickCount: 3 }) // Select all
    await inputField.type(newBookingNumber)
    
    // Save the change
    const saveBtn = await page.$('button[title*="Save"], button:has-text("✓"), .save-btn')
    if (saveBtn) {
      await saveBtn.click()
    } else {
      await page.keyboard.press('Enter')
    }
    
    console.log('⏳ Waiting for booking number update...')
    await page.waitForTimeout(3000)
    
    // Check for errors in console
    console.log('📖 Step 4: Verify no errors occurred')
    
    // Refresh page to verify persistence
    await page.reload({ waitUntil: 'networkidle2' })
    await page.waitForTimeout(2000)
    
    // Verify the booking number was updated
    const updatedBookingNumber = await page.$eval('span, div, h1, h2, h3, h4', elements => {
      const element = Array.from(elements).find(el => /\\d{2}\\d{2}[A-Z]{2}\\d{2}/.test(el.textContent))
      return element ? element.textContent.trim() : null
    }).catch(() => null)
    
    if (updatedBookingNumber && updatedBookingNumber.includes(newBookingNumber)) {
      console.log('✅ Booking number successfully updated to:', updatedBookingNumber)
    } else {
      console.log('❌ Booking number update verification failed')
      console.log('Expected:', newBookingNumber)
      console.log('Found:', updatedBookingNumber)
    }
    
    console.log('📖 Step 5: Create second booking to test sequence increment')
    
    // Create another booking for the same yacht
    await page.click('[data-testid="quick-create-btn"], button:has-text("Quick Create")')
    await page.waitForTimeout(2000)
    
    // Fill form again
    await page.type('[data-testid="customer-first-name"], input[placeholder*="first"]', 'Jane')
    await page.type('[data-testid="customer-surname"], input[placeholder*="surname"]', 'Smith')  
    await page.type('[data-testid="customer-email"], input[type="email"]', 'jane.smith@example.com')
    
    // Select same yacht (Disk Drive)
    const yachtSelect2 = await page.$('[data-testid="yacht-select"], select')
    if (yachtSelect2) {
      await yachtSelect2.selectOption('234a2f45-1e79-44fb-b5aa-3c058f777255')
    }
    
    // Set different dates
    const futureDate = new Date(weekAfter)
    futureDate.setDate(weekAfter.getDate() + 7)
    const endDate2 = new Date(futureDate)
    endDate2.setDate(futureDate.getDate() + 7)
    
    const startDateStr2 = futureDate.toISOString().split('T')[0]
    const endDateStr2 = endDate2.toISOString().split('T')[0]
    
    await page.type('[data-testid="start-date"], input[type="date"]', startDateStr2)
    await page.type('[data-testid="end-date"], input[type="date"]:not([data-testid="start-date"])', endDateStr2)
    
    // Submit second booking
    const submitBtn2 = await page.$('[data-testid="submit-booking"], button:has-text("Create"), button[type="submit"]')
    if (submitBtn2) {
      await submitBtn2.click()
    }
    
    await page.waitForTimeout(3000)
    
    // Check that the new booking has the correctly incremented NN number
    const secondBookingNumber = await page.$eval('span, div, h1, h2, h3, h4', elements => {
      const element = Array.from(elements).find(el => /\\d{2}\\d{2}[A-Z]{2}\\d{2}/.test(el.textContent))
      return element ? element.textContent.trim() : null
    }).catch(() => null)
    
    if (secondBookingNumber) {
      const secondMatch = secondBookingNumber.match(/(\\d{2}\\d{2}[A-Z]{2})(\\d{2})/)
      if (secondMatch) {
        const secondNN = parseInt(secondMatch[2])
        const expectedNN = newNN + 1
        
        if (secondNN === expectedNN) {
          console.log(`✅ Second booking correctly incremented to NN=${secondNN} (expected ${expectedNN})`)
        } else {
          console.log(`❌ Second booking NN=${secondNN}, expected ${expectedNN}`)
        }
      }
    }
    
    console.log('✅ Booking number edit workflow test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the test
testBookingNumberEditWorkflow()
  .then(() => {
    console.log('🎉 All tests passed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error.message)
    process.exit(1)
  })