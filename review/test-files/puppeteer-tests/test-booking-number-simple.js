/**
 * Simple Booking Number Edit Test
 * First let's see what's actually on the page and then create a booking manually
 */

import puppeteer from 'puppeteer'

async function testBookingNumberSimple() {
  let browser = null
  
  try {
    console.log('🚀 Starting simple booking number test...')
    
    browser = await puppeteer.launch({ 
      headless: false,
      slowMo: 500,
      devtools: true,
      args: ['--no-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1400, height: 900 })
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text())
      }
    })
    
    console.log('📖 Step 1: Navigate to application')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' })
    
    console.log('📖 Step 2: Check what buttons are available')
    
    // Wait a bit for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Get all button text content
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({ 
        text: btn.textContent?.trim(), 
        id: btn.id,
        className: btn.className,
        testId: btn.getAttribute('data-testid')
      }))
    )
    
    console.log('📝 Available buttons:', buttons)
    
    // Check for any booking creation options
    const createOptions = buttons.filter(btn => 
      btn.text && (
        btn.text.toLowerCase().includes('create') ||
        btn.text.toLowerCase().includes('new') ||
        btn.text.toLowerCase().includes('booking') ||
        btn.text.toLowerCase().includes('add')
      )
    )
    
    console.log('📝 Create options found:', createOptions)
    
    // Look for specific elements that might allow booking creation
    console.log('📖 Step 3: Look for booking creation interfaces')
    
    // Check if there's a form already visible
    const forms = await page.$$('form')
    console.log('📝 Forms found:', forms.length)
    
    if (forms.length > 0) {
      console.log('📝 Form found, checking inputs...')
      const inputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          placeholder: input.placeholder,
          name: input.name,
          id: input.id
        }))
      )
      console.log('📝 Input fields:', inputs)
    }
    
    // Check for any existing bookings
    console.log('📖 Step 4: Look for existing bookings')
    const pageText = await page.content()
    const bookingNumbers = pageText.match(/\\b\\d{2}\\d{2}[A-Z]{2}\\d{2}\\b/g)
    if (bookingNumbers) {
      console.log('📝 Found booking numbers:', [...new Set(bookingNumbers)])
      
      // Try to click on the first booking number to edit it
      console.log('📖 Step 5: Try to edit existing booking number')
      
      // Look for booking number elements
      const bookingElements = await page.$$('*')
      let bookingNumberElement = null
      
      for (const element of bookingElements) {
        const text = await element.textContent()
        if (text && /\\b\\d{2}\\d{2}[A-Z]{2}\\d{2}\\b/.test(text)) {
          bookingNumberElement = element
          break
        }
      }
      
      if (bookingNumberElement) {
        const bookingNumber = await bookingNumberElement.textContent()
        console.log('✅ Found booking number element:', bookingNumber.trim())
        
        // Try to interact with it
        await bookingNumberElement.hover()
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Look for edit button or try clicking
        try {
          await bookingNumberElement.click()
          console.log('✅ Clicked on booking number')
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Check if an input field appeared
          const inputField = await page.$('input[type="text"]')
          if (inputField) {
            console.log('✅ Input field appeared for editing!')
            
            // Try to edit the booking number
            const originalNumber = bookingNumber.trim()
            const match = originalNumber.match(/(\\d{2}\\d{2}[A-Z]{2})(\\d{2})/)
            if (match) {
              const prefix = match[1]
              const nn = parseInt(match[2])
              const newNumber = prefix + (nn + 1).toString().padStart(2, '0')
              
              console.log(`📝 Changing ${originalNumber} to ${newNumber}`)
              
              await inputField.click({ clickCount: 3 })
              await inputField.type(newNumber)
              
              // Try to save
              await page.keyboard.press('Enter')
              await new Promise(resolve => setTimeout(resolve, 3000))
              
              console.log('✅ Edit attempt completed')
            }
          } else {
            console.log('❌ No input field appeared')
          }
        } catch (error) {
          console.log('❌ Error clicking booking number:', error.message)
        }
      }
    } else {
      console.log('📝 No booking numbers found on page')
    }
    
    console.log('📖 Step 6: Wait for manual inspection')
    console.log('Browser will stay open for 30 seconds for manual inspection...')
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
testBookingNumberSimple()
  .then(() => {
    console.log('🎉 Test completed!')
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message)
  })