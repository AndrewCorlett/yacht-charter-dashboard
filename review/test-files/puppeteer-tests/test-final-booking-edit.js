/**
 * Final Booking Number Edit Test
 * Test both the booking number editing and verify no schema errors
 */

import puppeteer from 'puppeteer'

async function testBookingEditFinal() {
  let browser = null
  
  try {
    console.log('🚀 Starting final booking number edit test...')
    
    browser = await puppeteer.launch({ 
      headless: false,
      slowMo: 300,
      devtools: true,
      args: ['--no-sandbox', '--disable-web-security']
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1400, height: 900 })
    
    // Track all console messages to catch any errors
    const consoleMessages = []
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      consoleMessages.push({ type, text })
      
      if (type === 'error') {
        console.log('🔥 Browser Error:', text)
      } else if (text.includes('tripType') || text.includes('yacht')) {
        console.log('🔍 Schema Field:', text)
      } else if (text.includes('Supabase error')) {
        console.log('❌ Supabase Error:', text)
      }
    })
    
    // Track network responses for errors
    const networkErrors = []
    page.on('response', response => {
      if (response.status() >= 400) {
        const error = `${response.status()} ${response.url()}`
        networkErrors.push(error)
        console.log('🌐 Network Error:', error)
      }
    })
    
    console.log('📖 Step 1: Navigate to application')
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('📖 Step 2: Try to manually edit booking number')
    
    // Try to execute a simple booking number edit through the browser console
    const editResult = await page.evaluate(async () => {
      try {
        // Find a booking number element
        const bookingElements = Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const text = el.textContent || ''
            return /\b\d{2}\d{2}[A-Z]{2}\d{2}\b/.test(text) && 
                   !el.querySelector('*') // leaf element
          })
        
        if (bookingElements.length === 0) {
          return { success: false, error: 'No booking number elements found' }
        }
        
        // Try to click on the first booking number
        const bookingElement = bookingElements[0]
        const originalNumber = bookingElement.textContent.trim()
        
        // Simulate hover and click
        bookingElement.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
        await new Promise(resolve => setTimeout(resolve, 500))
        
        bookingElement.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Look for input field
        const inputField = document.querySelector('input[type="text"][maxlength="8"], input[value*="25"]')
        if (!inputField) {
          return { success: false, error: 'No input field appeared after clicking' }
        }
        
        // Try to change the booking number
        const match = originalNumber.match(/(\d{2}\d{2}[A-Z]{2})(\d{2})/)
        if (!match) {
          return { success: false, error: 'Could not parse booking number format' }
        }
        
        const prefix = match[1]
        const nn = parseInt(match[2])
        const newNumber = prefix + (nn + 1).toString().padStart(2, '0')
        
        // Clear and enter new number
        inputField.value = ''
        inputField.value = newNumber
        inputField.dispatchEvent(new Event('input', { bubbles: true }))
        
        // Try to save (press Enter)
        inputField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        
        return { 
          success: true, 
          originalNumber, 
          newNumber,
          message: 'Edit attempt completed'
        }
        
      } catch (error) {
        return { success: false, error: error.message }
      }
    })
    
    console.log('📝 Edit result:', editResult)
    
    if (editResult.success) {
      console.log(`✅ Attempted to change ${editResult.originalNumber} to ${editResult.newNumber}`)
      
      // Wait for any async operations to complete
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Check for errors in the console logs
      const errorMessages = consoleMessages.filter(msg => 
        msg.type === 'error' || 
        msg.text.includes('tripType') || 
        msg.text.includes('yacht') ||
        msg.text.includes('column')
      )
      
      console.log('📖 Step 3: Check for schema errors')
      
      if (errorMessages.length === 0) {
        console.log('✅ No schema-related errors found!')
      } else {
        console.log('❌ Found potential schema errors:')
        errorMessages.forEach(msg => {
          console.log(`  - ${msg.type}: ${msg.text}`)
        })
      }
      
      // Check network errors
      if (networkErrors.length === 0) {
        console.log('✅ No network errors!')
      } else {
        console.log('❌ Network errors found:')
        networkErrors.forEach(error => {
          console.log(`  - ${error}`)
        })
      }
      
      // Try to verify the update worked
      console.log('📖 Step 4: Verify booking number update')
      
      const verificationResult = await page.evaluate(() => {
        const bookingElements = Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const text = el.textContent || ''
            return /\b\d{2}\d{2}[A-Z]{2}\d{2}\b/.test(text) && 
                   !el.querySelector('*')
          })
        
        return bookingElements.map(el => el.textContent.trim())
      })
      
      console.log('📝 Current booking numbers on page:', verificationResult)
      
      if (verificationResult.includes(editResult.newNumber)) {
        console.log('✅ Booking number update verified!')
      } else {
        console.log('⚠️  Could not verify booking number update')
      }
      
    } else {
      console.log('❌ Edit attempt failed:', editResult.error)
    }
    
    console.log('📖 Step 5: Wait for manual verification')
    console.log('Browser will stay open for 30 seconds for manual verification...')
    await new Promise(resolve => setTimeout(resolve, 30000))
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the test
testBookingEditFinal()
  .then(() => {
    console.log('🎉 Final booking edit test completed!')
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message)
    process.exit(1)
  })