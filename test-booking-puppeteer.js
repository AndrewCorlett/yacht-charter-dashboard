/**
 * Puppeteer test to verify booking creation produces YYWWBCNN format
 * This tests the actual browser implementation
 */

import puppeteer from 'puppeteer'

async function testBookingCreationWithPuppeteer() {
  console.log('=== Puppeteer Booking Creation Test ===\n')
  
  let browser = null
  let page = null
  
  try {
    // Launch browser
    console.log('1. Launching browser...')
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for CI, false for debugging
      defaultViewport: { width: 1280, height: 720 }
    })
    
    page = await browser.newPage()
    
    // Enable console logging from the page
    page.on('console', msg => {
      const text = msg.text()
      // Only log important messages to avoid spam
      if (text.includes('Booking') || text.includes('Error') || text.includes('Generated') || text.includes('code')) {
        console.log(`[BROWSER] ${msg.type()}: ${text}`)
      }
    })
    
    // Listen for uncaught exceptions
    page.on('pageerror', error => {
      console.error(`[BROWSER ERROR] ${error.message}`)
    })
    
    console.log('2. Navigating to application...')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
    
    console.log('3. Waiting for application to load...')
    await page.waitForSelector('[data-testid="main-header"], [data-testid="main-dashboard"], nav', { timeout: 10000 })
    
    console.log('4. Looking for booking form...')
    
    // Look for the booking form directly since it's visible on the main dashboard
    const bookingFormSelector = '[data-testid="booking-form"]'
    
    try {
      await page.waitForSelector(bookingFormSelector, { timeout: 5000 })
      console.log('   ✅ Found booking form!')
    } catch (error) {
      console.log('   ❌ Could not find booking form!')
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'debug-no-booking-form.png', fullPage: true })
      console.log('   Saved screenshot: debug-no-booking-form.png')
      
      // Log page content for debugging
      const bodyText = await page.evaluate(() => document.body.innerText)
      console.log('   Page content preview:', bodyText.slice(0, 500) + '...')
      
      throw new Error('Could not find booking creation interface')
    }
    
    console.log('5. Filling out booking form...')
    
    // Fill form fields with the test data
    const formData = {
      yacht: 'zavaria',
      startDate: '2025-07-05',
      endDate: '2025-07-12', 
      firstName: 'John',
      surname: 'TestUser',
      email: 'john.test@example.com',
      phone: '+44 1234 567890',
      addressLine1: '123 Test Street',
      city: 'Test City',
      postcode: 'TC1 2ST'
    }
    
    // Fill yacht dropdown
    console.log('   Filling yacht selection...')
    
    // Wait for yacht dropdown to be populated
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Get available yacht options
    const yachtOptions = await page.$$eval('[name="yacht"] option', 
      options => options.map(opt => ({ value: opt.value, text: opt.textContent }))
    )
    console.log('   Available yacht options:', yachtOptions)
    
    // Try to select zavaria
    const yachtToSelect = yachtOptions.find(opt => 
      opt.value === 'zavaria' || opt.text.toLowerCase().includes('zavaria')
    )
    
    if (yachtToSelect) {
      console.log(`   Selecting yacht: ${yachtToSelect.value} (${yachtToSelect.text})`)
      await page.select('[name="yacht"]', yachtToSelect.value)
    } else {
      console.log('   Zavaria not found, selecting first available yacht')
      const firstYacht = yachtOptions.find(opt => opt.value !== '')
      if (firstYacht) {
        await page.select('[name="yacht"]', firstYacht.value)
        console.log(`   Selected: ${firstYacht.value} (${firstYacht.text})`)
      }
    }
    
    // Fill customer details
    console.log('   Filling customer details...')
    await page.type('[data-testid="input-firstName"]', formData.firstName)
    await page.type('[data-testid="input-surname"]', formData.surname)
    await page.type('[data-testid="input-email"]', formData.email)
    await page.type('[data-testid="input-phone"]', formData.phone)
    
    // Fill address details
    console.log('   Filling address details...')
    await page.type('[name="addressLine1"]', formData.addressLine1)
    await page.type('[name="city"]', formData.city)
    await page.type('[name="postcode"]', formData.postcode)
    
    // Fill dates
    console.log('   Filling dates...')
    
    // Set date values directly with proper React synthetic events
    await page.evaluate((startDate, endDate) => {
      const setDateValue = (input, value) => {
        // Focus the input
        input.focus()
        
        // Set the value
        input.value = value
        
        // Create a synthetic React event with proper target/currentTarget
        const syntheticEvent = {
          target: {
            name: input.name,
            value: value,
            type: input.type,
            checked: input.checked
          },
          currentTarget: input,
          bubbles: true,
          preventDefault: () => {},
          stopPropagation: () => {}
        }
        
        // Get the React event handler from the input's fiber
        const fiberKey = Object.keys(input).find(key => key.startsWith('__reactEventHandlers') || key.startsWith('__reactProps'))
        if (fiberKey && input[fiberKey] && input[fiberKey].onChange) {
          input[fiberKey].onChange(syntheticEvent)
        }
        
        // Also fire native events as backup
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
      
      const startInput = document.querySelector('[data-testid="input-startDate"]')
      const endInput = document.querySelector('[data-testid="input-endDate"]')
      
      if (startInput) {
        setDateValue(startInput, startDate)
      }
      
      if (endInput) {
        setDateValue(endInput, endDate)
      }
    }, formData.startDate, formData.endDate)
    
    // Give React time to update state
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('6. Verifying form data before submission...')
    
    // Get all form field values for debugging
    const formValues = await page.evaluate(() => {
      const getValue = (selector) => {
        const el = document.querySelector(selector)
        return el ? el.value : 'NOT FOUND'
      }
      
      return {
        yacht: getValue('[name="yacht"]'),
        firstName: getValue('[data-testid="input-firstName"]'),
        surname: getValue('[data-testid="input-surname"]'),
        email: getValue('[data-testid="input-email"]'),
        phone: getValue('[data-testid="input-phone"]'),
        addressLine1: getValue('[name="addressLine1"]'),
        city: getValue('[name="city"]'),
        postcode: getValue('[name="postcode"]'),
        startDate: getValue('[data-testid="input-startDate"]'),
        endDate: getValue('[data-testid="input-endDate"]')
      }
    })
    
    console.log('   Form values:', formValues)
    
    console.log('7. Submitting booking form...')
    
    // Click the Quick Create button
    const submitBtn = await page.$('[data-testid="submit-booking"]')
    if (!submitBtn) {
      throw new Error('Could not find Quick Create button')
    }
    
    console.log('   Clicking Quick Create button...')
    await submitBtn.click()
    
    console.log('8. Waiting for booking creation response...')
    
    // Wait for the success modal to appear
    try {
      await page.waitForSelector('[data-testid="booking-number-display"]', { timeout: 30000 })
      console.log('   ✅ Success modal appeared!')
    } catch (error) {
      console.log('   ❌ Success modal did not appear')
      
      // Check for validation errors
      const validationErrors = await page.$$eval('p[data-testid*="error-"]', 
        els => els.map(el => ({ testId: el.getAttribute('data-testid'), text: el.textContent }))
      ).catch(() => [])
      
      if (validationErrors.length > 0) {
        console.log('   Validation errors found:')
        validationErrors.forEach(err => console.log(`     ${err.testId}: ${err.text}`))
      }
      
      // Check for general error messages
      const errorMessages = await page.$$eval('[style*="color: var(--color-ios-red)"]', 
        els => els.map(el => el.textContent)
      ).catch(() => [])
      
      if (errorMessages.length > 0) {
        console.log('   Error messages found:')
        errorMessages.forEach(msg => console.log(`     ${msg}`))
      }
      
      // Check if submit button is still in loading state
      const isSubmitting = await page.$eval('[data-testid="submit-booking"]', 
        el => el.textContent.includes('Creating...')
      ).catch(() => false)
      
      if (isSubmitting) {
        console.log('   Submit button still shows "Creating..." - waiting longer...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // Try again to find the modal
        const modalExists = await page.$('[data-testid="booking-number-display"]')
        if (modalExists) {
          console.log('   ✅ Success modal appeared after additional wait!')
          return
        }
      }
      
      // Log current page content for debugging
      const formContent = await page.$eval('[data-testid="booking-form"]', 
        el => el.innerText
      ).catch(() => 'Form not found')
      
      console.log('   Current form content:', formContent.slice(0, 500) + '...')
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'debug-no-success-modal.png', fullPage: true })
      console.log('   Saved screenshot: debug-no-success-modal.png')
      
      throw new Error('Booking creation failed - no success modal appeared')
    }
    
    console.log('9. Extracting booking code from success modal...')
    
    // Get booking code from the success modal
    const bookingCode = await page.$eval('[data-testid="booking-number-display"]', el => el.textContent.trim())
    
    console.log('\\n=== Booking Code Analysis ===')
    console.log(`Generated booking code: ${bookingCode}`)
    
    // Validate format
    const formatRegex = /^\d{2}\d{2}[A-Z]{2}\d{2}$/
    const isValidFormat = formatRegex.test(bookingCode)
    
    console.log(`Format validation: ${isValidFormat ? '✅ PASS' : '❌ FAIL'}`)
    
    if (isValidFormat) {
      const yy = bookingCode.slice(0, 2)
      const ww = bookingCode.slice(2, 4)
      const bc = bookingCode.slice(4, 6)
      const nn = bookingCode.slice(6, 8)
      
      console.log(`Breakdown: YY=${yy}, WW=${ww}, BC=${bc}, NN=${nn}`)
      
      // Expected for July 5, 2025, Zavaria
      const expectedYear = '25'
      const expectedWeek = '27'
      const expectedBoat = 'ZA'
      
      const yearMatch = yy === expectedYear
      const weekValid = parseInt(ww) >= 20 && parseInt(ww) <= 30 // Reasonable range for July
      const boatMatch = bc === expectedBoat
      const seqValid = parseInt(nn) >= 1
      
      console.log(`Year check: ${yearMatch ? '✅' : '❌'} (${yy})`)
      console.log(`Week check: ${weekValid ? '✅' : '❌'} (${ww})`) 
      console.log(`Boat check: ${boatMatch ? '✅' : '❌'} (${bc})`)
      console.log(`Sequence check: ${seqValid ? '✅' : '❌'} (${nn})`)
      
      if (yearMatch && weekValid && boatMatch && seqValid) {
        console.log('\\n✅ SUCCESS: Booking creation produces correct YYWWBCNN format!')
        return { success: true, bookingCode }
      } else {
        console.log('\\n❌ FAILURE: Booking code components are incorrect')
        return { success: false, bookingCode, error: 'Invalid components' }
      }
    } else {
      console.log('\\n❌ FAILURE: Booking code does not match YYWWBCNN format')
      
      // Check if it's the old BK format
      if (bookingCode.startsWith('BK')) {
        console.log('   This appears to be the old BK format that should be replaced!')
      }
      
      return { success: false, bookingCode, error: 'Invalid format' }
    }
    
  } catch (error) {
    console.error('❌ Puppeteer test failed:', error.message)
    
    if (page) {
      await page.screenshot({ path: 'debug-error.png', fullPage: true })
      console.log('   Saved error screenshot: debug-error.png')
    }
    
    return { success: false, error: error.message }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the test
testBookingCreationWithPuppeteer().then(result => {
  console.log('\\n=== Test Complete ===')
  console.log('Result:', result)
}).catch(error => {
  console.error('Test suite error:', error)
})