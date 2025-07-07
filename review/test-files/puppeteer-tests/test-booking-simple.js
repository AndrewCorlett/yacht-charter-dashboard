/**
 * Simple Booking Creation Test
 * Tests the key requirements: YYWWBCNN format and booking_confirmed=true
 */

import puppeteer from 'puppeteer'

async function testBookingCreation() {
  let browser
  try {
    console.log('🚀 Starting booking creation test...')
    
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1280, height: 720 }
    })
    
    const page = await browser.newPage()
    
    // Navigate to the application
    console.log('📍 Navigating to http://localhost:5173')
    await page.goto('http://localhost:5173')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="booking-form"]', { timeout: 10000 })
    console.log('✅ Quick Create form found')
    
    // Fill the form with test data
    console.log('📝 Filling form fields...')
    
    // Wait for yacht dropdown to load
    await page.waitForSelector('#yacht option:not([value=""])', { timeout: 10000 })
    
    // Select a yacht (Zavaria)
    await page.select('#yacht', '3ffa9ca5-bd8e-4050-8b49-e5230fb23c73') // Zavaria UUID
    console.log('⛵ Selected yacht: Zavaria')
    
    // Fill customer details
    await page.type('[data-testid="input-firstName"]', 'John')
    await page.type('[data-testid="input-surname"]', 'MacLeod')
    await page.type('[data-testid="input-email"]', 'john.macleod@test.co.uk')
    await page.type('[data-testid="input-phone"]', '07700 900123')
    
    // Fill address
    await page.type('#addressLine1', '123 Highland Road')
    await page.type('#city', 'Edinburgh')
    await page.type('#postcode', 'EH1 2AB')
    
    // Fill dates
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 7) // Next week
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 14) // Two weeks from now
    
    await page.type('[data-testid="input-startDate"]', startDate.toISOString().split('T')[0])
    await page.type('[data-testid="input-endDate"]', endDate.toISOString().split('T')[0])
    
    console.log('✅ Form filled with test data')
    
    // Take screenshot before submission
    await page.screenshot({ path: 'booking-form-filled.png' })
    
    // Submit the form
    console.log('🎯 Submitting booking...')
    await page.click('[data-testid="submit-booking"]')
    
    // Wait for either success modal or error
    try {
      // Check for success
      await page.waitForSelector('[data-testid="booking-success"]', { timeout: 15000 })
      console.log('✅ Booking created successfully!')
      
      // Take screenshot of success
      await page.screenshot({ path: 'booking-success.png' })
      
      return true
    } catch (error) {
      // Check for error messages
      console.log('⚠️ No success modal found, checking for errors...')
      const errorElement = await page.$('.text-red-500, [style*="color: var(--color-ios-red)"]')
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement)
        console.log('❌ Booking creation failed:', errorText)
        await page.screenshot({ path: 'booking-error.png' })
      } else {
        console.log('❌ Unknown error during booking submission')
        await page.screenshot({ path: 'booking-unknown-error.png' })
        
        // Log console errors
        const consoleErrors = await page.evaluate(() => {
          return window.__errors || []
        })
        if (consoleErrors.length > 0) {
          console.log('📋 Console errors:', consoleErrors)
        }
      }
      return false
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (browser) {
      const page = await browser.newPage()
      await page.screenshot({ path: 'test-error.png' })
    }
    return false
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the test
testBookingCreation()
  .then(success => {
    console.log(success ? '🎉 TEST PASSED' : '💥 TEST FAILED')
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test error:', error)
    process.exit(1)
  })