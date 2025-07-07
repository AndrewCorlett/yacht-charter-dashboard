/**
 * Test script to scroll through full booking page and find toggles
 */

import puppeteer from 'puppeteer'

async function testFullBookingPage() {
  console.log('🔄 Testing Full Booking Page with Scrolling...\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      slowMo: 300
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

    // Click on first booking
    console.log('\n📋 Clicking on first booking...')
    const bookingCard = await page.$('div:has-text("test 2")')
    if (bookingCard) {
      await bookingCard.click()
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    console.log('📄 Current URL:', page.url())

    // Scroll down slowly to load all content
    console.log('\n📜 Scrolling down to load all content...')
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 4)
    })
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 3/4)
    })
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Get full page content
    console.log('\n📄 Full page content:')
    const fullContent = await page.evaluate(() => document.body.innerText)
    console.log(fullContent)

    // Now look for checkboxes after scrolling
    console.log('\n🔘 Looking for checkboxes after scrolling...')
    
    const checkboxes = await page.$$('input[type="checkbox"]')
    console.log(`Found ${checkboxes.length} checkboxes`)

    if (checkboxes.length > 0) {
      console.log('\n📋 Analyzing all checkboxes:')
      
      for (let i = 0; i < checkboxes.length; i++) {
        const checkbox = checkboxes[i]
        const info = await page.evaluate(el => {
          // Get surrounding text to understand what this checkbox is for
          const parent = el.closest('label') || el.parentElement
          const siblings = parent ? Array.from(parent.querySelectorAll('*')).map(e => e.textContent?.trim()) : []
          
          return {
            index: i,
            checked: el.checked,
            name: el.name || '',
            id: el.id || '',
            className: el.className || '',
            parentText: parent?.textContent?.trim().substring(0, 150) || '',
            nearbyText: siblings.join(' ').substring(0, 100)
          }
        }, checkbox)
        
        console.log(`  Checkbox ${i + 1}:`)
        console.log(`    Checked: ${info.checked}`)
        console.log(`    Name: "${info.name}"`)
        console.log(`    ID: "${info.id}"`)
        console.log(`    Parent text: "${info.parentText}"`)
        console.log('')
      }

      // Find a checkbox that looks like a status toggle
      let statusCheckbox = null
      let statusCheckboxType = ''
      
      for (let i = 0; i < checkboxes.length; i++) {
        const checkbox = checkboxes[i]
        const context = await page.evaluate(el => {
          const parent = el.parentElement
          const text = parent?.textContent?.toLowerCase() || ''
          return {
            hasContract: text.includes('contract'),
            hasDeposit: text.includes('deposit'),
            hasConfirmed: text.includes('confirmed'),
            hasSent: text.includes('sent'),
            hasPaid: text.includes('paid'),
            text: text.substring(0, 100)
          }
        }, checkbox)
        
        if (context.hasContract && context.hasSent) {
          statusCheckbox = checkbox
          statusCheckboxType = 'Contract Sent'
          break
        } else if (context.hasDeposit && context.hasPaid) {
          statusCheckbox = checkbox
          statusCheckboxType = 'Deposit Paid'
          break
        } else if (context.hasConfirmed) {
          statusCheckbox = checkbox
          statusCheckboxType = 'Booking Confirmed'
          break
        }
      }

      // If no specific status checkbox found, use the first one
      if (!statusCheckbox && checkboxes.length > 0) {
        statusCheckbox = checkboxes[0]
        statusCheckboxType = 'First Available'
        console.log('ℹ️ Using first available checkbox for testing')
      }

      if (statusCheckbox) {
        console.log(`\n🎯 Testing ${statusCheckboxType} checkbox...`)
        
        // Get initial state
        const initialState = await page.evaluate(el => el.checked, statusCheckbox)
        console.log(`Current state: ${initialState}`)
        
        // Scroll to the checkbox to ensure it's visible
        await page.evaluate(el => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, statusCheckbox)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Toggle the checkbox
        console.log(`Toggling from ${initialState} to ${!initialState}`)
        await statusCheckbox.click()
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify state changed
        const newState = await page.evaluate(el => el.checked, statusCheckbox)
        console.log(`✅ New state: ${newState}`)

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
          // Scroll to save button
          await page.evaluate(el => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, saveButton)
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          console.log('\n🚨 CRITICAL TEST: Clicking save and listening for charterCost error...')
          
          // Set up comprehensive error listener
          let errorCaught = null
          const errorPromise = new Promise((resolve) => {
            const handler = (msg) => {
              const text = msg.text()
              console.log(`🔍 Console ${msg.type()}: ${text}`)
              
              if (msg.type() === 'error' && text.includes('charterCost')) {
                errorCaught = text
                console.log('🎯 CHARTERCCOST ERROR DETECTED!')
                resolve(text)
              }
            }
            page.on('console', handler)
            
            // Also listen for network failures
            page.on('requestfailed', req => {
              console.log(`🔴 Request failed: ${req.url()} - ${req.failure().errorText}`)
            })
            
            setTimeout(() => resolve(null), 20000) // Wait up to 20 seconds
          })
          
          // Click save
          console.log('🔥 CLICKING SAVE BUTTON NOW...')
          await saveButton.click()
          
          // Wait for error or timeout
          const error = await errorPromise
          
          if (error) {
            console.log('\n🎉 SUCCESS! ERROR REPRODUCED!')
            console.log('🚨 Error message:', error)
            return {
              success: true,
              errorReproduced: true,
              error: error,
              checkboxType: statusCheckboxType,
              nextStep: 'Implement fix for charterCost field mapping'
            }
          } else {
            console.log('\n⚠️ No charterCost error detected after 20 seconds')
            console.log('ℹ️ This could mean:')
            console.log('  1. The error has already been fixed')
            console.log('  2. The error occurs in a different context')
            console.log('  3. Different field is causing the issue')
            
            return {
              success: true,
              errorReproduced: false,
              message: 'Save operation completed without charterCost error',
              checkboxType: statusCheckboxType
            }
          }
        } else {
          console.log('❌ No save button found')
          
          // List all buttons for debugging
          console.log('\n🔍 All buttons on page:')
          const allButtons = await page.$$eval('button', buttons => 
            buttons.map(b => b.textContent?.trim()).filter(text => text)
          )
          allButtons.forEach((btn, i) => console.log(`  ${i + 1}. "${btn}"`))
          
          return {
            success: false,
            error: 'No save button found',
            foundButtons: allButtons
          }
        }
      } else {
        console.log('❌ No suitable checkbox found for testing')
        return {
          success: false,
          error: 'No suitable checkbox found'
        }
      }
    } else {
      console.log('❌ Still no checkboxes found after scrolling')
      
      // Check if this is the right page
      const currentUrl = page.url()
      const pageTitle = await page.title()
      console.log(`📄 Current URL: ${currentUrl}`)
      console.log(`📄 Page title: ${pageTitle}`)
      
      return {
        success: false,
        error: 'No checkboxes found on booking page',
        url: currentUrl,
        title: pageTitle
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
testFullBookingPage().then(results => {
  console.log('\n📋 FINAL TEST RESULTS:', results)
  
  if (results.errorReproduced) {
    console.log('\n🚨 ERROR SUCCESSFULLY REPRODUCED!')
    console.log('🔧 Proceeding with implementation of fixes...')
  } else if (results.success && !results.errorReproduced) {
    console.log('\n✅ No error found - may already be fixed or different issue')
    console.log('🔍 Need to investigate further or confirm fix is working')
  } else {
    console.log('\n❌ Test failed - could not complete error reproduction')
  }
}).catch(error => {
  console.error('Test execution failed:', error)
})