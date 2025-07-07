/**
 * Complete booking test - fill all required fields
 */

import puppeteer from 'puppeteer'

async function testCompleteBooking() {
  console.log('=== Complete Booking Test ===\n')
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    slowMo: 200
  })
  
  const page = await browser.newPage()
  
  try {
    // Listen for relevant console logs
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('booking') || text.includes('code') || text.includes('generated') || 
          text.includes('BK') || text.includes('ZA') || text.includes('Created') ||
          text.includes('UnifiedDataService') || text.includes('BookingService')) {
        console.log(`🔵 [BROWSER] ${text}`)
      }
    })
    
    console.log('1. Loading application...')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('2. Filling required form fields...')
    
    // Fill yacht
    await page.select('select[name="yacht"]', 'zavaria')
    console.log('   ✓ Selected yacht: zavaria')
    
    // Fill first name
    await page.click('input[name="firstName"]')
    await page.type('input[name="firstName"]', 'John')
    console.log('   ✓ Filled first name')
    
    // Fill surname  
    await page.click('input[name="surname"]')
    await page.type('input[name="surname"]', 'TestUser')
    console.log('   ✓ Filled surname')
    
    // Fill email
    await page.click('input[name="email"]')
    await page.type('input[name="email"]', 'john.test@example.com')
    console.log('   ✓ Filled email')
    
    // Fill phone
    await page.click('input[name="phone"]')
    await page.type('input[name="phone"]', '+44 1234 567890')
    console.log('   ✓ Filled phone')
    
    // Fill address line 1
    await page.click('input[name="addressLine1"]')
    await page.type('input[name="addressLine1"]', '123 Test Street')
    console.log('   ✓ Filled address')
    
    // Fill city
    await page.click('input[name="city"]')
    await page.type('input[name="city"]', 'Test City')
    console.log('   ✓ Filled city')
    
    // Fill postcode
    await page.click('input[name="postcode"]')
    await page.type('input[name="postcode"]', 'TC1 2ST')
    console.log('   ✓ Filled postcode')
    
    // Fill start date
    await page.click('input[name="startDate"]')
    await page.type('input[name="startDate"]', '2025-07-05')
    console.log('   ✓ Filled start date')
    
    // Fill end date
    await page.click('input[name="endDate"]')
    await page.type('input[name="endDate"]', '2025-07-12')
    console.log('   ✓ Filled end date')
    
    console.log('3. Taking screenshot before submission...')
    await page.screenshot({ path: 'before-submit-complete.png', fullPage: true })
    
    console.log('4. Clicking Quick Create...')
    
    // Find and click Quick Create button
    const buttons = await page.$$('button')
    let clicked = false
    
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button)
      if (text.includes('Quick Create')) {
        await button.click()
        clicked = true
        console.log('   ✓ Clicked Quick Create button')
        break
      }
    }
    
    if (!clicked) {
      throw new Error('Could not find Quick Create button')
    }
    
    console.log('5. Waiting for booking creation...')
    await new Promise(resolve => setTimeout(resolve, 8000))
    
    console.log('6. Taking screenshot after submission...')
    await page.screenshot({ path: 'after-submit-complete.png', fullPage: true })
    
    console.log('7. Searching for booking codes...')
    
    // Search for booking codes in page content
    const bookingCodes = await page.evaluate(() => {
      const text = document.body.innerText
      
      // Look for different patterns
      const patterns = [
        /\b\d{2}\d{2}[A-Z]{2}\d{2}\b/g,  // YYWWBCNN format
        /\bBK\d{9}\b/g,                   // Old BK format  
        /\b[A-Z0-9]{8}\b/g                // Any 8-character code
      ]
      
      const found = []
      for (const pattern of patterns) {
        const matches = text.match(pattern)
        if (matches) {
          found.push(...matches)
        }
      }
      
      return [...new Set(found)] // Remove duplicates
    })
    
    console.log('   Found codes:', bookingCodes)
    
    // Also check for success/error messages
    const messages = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      const lines = text.split('\\n')
      return lines.filter(line => 
        line.includes('success') || 
        line.includes('created') || 
        line.includes('error') ||
        line.includes('failed') ||
        (line.length < 100 && (line.includes('booking') || line.includes('code')))
      ).slice(0, 10)
    })
    
    console.log('   Messages:', messages)
    
    if (bookingCodes.length > 0) {
      const latestCode = bookingCodes[bookingCodes.length - 1]
      console.log(`\\n🎉 BOOKING CODE FOUND: ${latestCode}`)
      
      // Analyze the format
      const yywwbcnnPattern = /^\d{2}\d{2}[A-Z]{2}\d{2}$/
      const oldBkPattern = /^BK\d{9}$/
      
      if (yywwbcnnPattern.test(latestCode)) {
        console.log('✅ SUCCESS: Uses YYWWBCNN format!')
        
        const yy = latestCode.slice(0, 2)
        const ww = latestCode.slice(2, 4)
        const bc = latestCode.slice(4, 6)
        const nn = latestCode.slice(6, 8)
        
        console.log(`   Breakdown:`)
        console.log(`   - Year: 20${yy} (${yy === '25' ? '✅' : '❌'})`)
        console.log(`   - Week: ${ww} (${parseInt(ww) >= 20 && parseInt(ww) <= 35 ? '✅' : '❌'})`)
        console.log(`   - Yacht: ${bc} (${bc === 'ZA' ? '✅ Zavaria' : '❌ Expected ZA'})`)
        console.log(`   - Sequence: ${nn} (${parseInt(nn) >= 1 ? '✅' : '❌'})`)
        
        const allValid = yy === '25' && parseInt(ww) >= 20 && parseInt(ww) <= 35 && bc === 'ZA' && parseInt(nn) >= 1
        
        if (allValid) {
          console.log('\\n🎉 PERFECT: All components are correct!')
          
          // Test second booking for gap-filling
          console.log('\\n8. Testing second booking for same yacht...')
          
          // Reset form and create another booking
          const resetButton = await page.$('button:has-text("Reset")')
          if (resetButton) {
            await resetButton.click()
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Fill form again quickly
            await page.select('select[name="yacht"]', 'zavaria')
            await page.type('input[name="firstName"]', 'Jane')
            await page.type('input[name="surname"]', 'TestUser2')
            await page.type('input[name="email"]', 'jane.test@example.com')
            await page.type('input[name="phone"]', '+44 1234 567891')
            await page.type('input[name="addressLine1"]', '124 Test Street')
            await page.type('input[name="city"]', 'Test City')
            await page.type('input[name="postcode"]', 'TC1 2ST')
            await page.type('input[name="startDate"]', '2025-07-06')
            await page.type('input[name="endDate"]', '2025-07-13')
            
            // Click Quick Create again
            const secondButtons = await page.$$('button')
            for (const button of secondButtons) {
              const text = await page.evaluate(el => el.textContent, button)
              if (text.includes('Quick Create')) {
                await button.click()
                break
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000))
            
            // Check for second booking code
            const secondCodes = await page.evaluate(() => {
              const text = document.body.innerText
              const pattern = /\b\d{2}\d{2}[A-Z]{2}\d{2}\b/g
              const matches = text.match(pattern)
              return matches ? [...new Set(matches)] : []
            })
            
            const newCodes = secondCodes.filter(code => !bookingCodes.includes(code))
            if (newCodes.length > 0) {
              const secondCode = newCodes[0]
              console.log(`   Second booking code: ${secondCode}`)
              
              const firstSeq = parseInt(latestCode.slice(6, 8))
              const secondSeq = parseInt(secondCode.slice(6, 8))
              
              if (secondSeq === firstSeq + 1) {
                console.log('   ✅ Sequential numbering works!')
              } else {
                console.log(`   ⚠️ Sequential numbering: expected ${firstSeq + 1}, got ${secondSeq}`)
              }
            }
          }
          
          return { 
            success: true, 
            code: latestCode, 
            format: 'YYWWBCNN',
            components: { yy, ww, bc, nn },
            secondCode: newCodes[0] || null
          }
        } else {
          return { 
            success: false, 
            code: latestCode, 
            format: 'YYWWBCNN', 
            issue: 'Invalid components',
            components: { yy, ww, bc, nn }
          }
        }
        
      } else if (oldBkPattern.test(latestCode)) {
        console.log('❌ FAILURE: Still using old BK format!')
        return { success: false, code: latestCode, format: 'BK', issue: 'Old format still in use' }
        
      } else {
        console.log('❌ UNKNOWN: Unrecognized booking code format')
        return { success: false, code: latestCode, format: 'unknown', issue: 'Unknown format' }
      }
      
    } else {
      console.log('\\n❌ NO BOOKING CODE FOUND')
      return { success: false, error: 'No booking code found', messages }
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`)
    await page.screenshot({ path: 'complete-test-error.png', fullPage: true })
    return { success: false, error: error.message }
    
  } finally {
    await browser.close()
  }
}

// Run test
testCompleteBooking().then(result => {
  console.log('\\n=== FINAL RESULT ===')
  console.log(JSON.stringify(result, null, 2))
  
  if (result.success) {
    console.log('\\n🎉 BOOKING CREATION TEST PASSED!')
    console.log('✅ YYWWBCNN format is working correctly')
  } else {
    console.log('\\n❌ BOOKING CREATION TEST FAILED!')
    console.log('⚠️ Booking code format needs to be fixed')
  }
}).catch(error => {
  console.error('Test suite error:', error)
})