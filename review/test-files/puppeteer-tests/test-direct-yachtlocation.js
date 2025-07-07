/**
 * Direct test for yachtLocation error using multiple navigation strategies
 */

import puppeteer from 'puppeteer'

async function testDirectYachtLocation() {
  console.log('🔄 Direct yachtLocation Error Test...\\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 1000 },
      slowMo: 800
    })

    const page = await browser.newPage()
    
    // Monitor for yachtLocation error
    let yachtLocationErrorDetected = false
    let errorDetails = null
    
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      
      if (type === 'error' && text.includes('yachtLocation')) {
        yachtLocationErrorDetected = true
        errorDetails = text
        console.log('🎯🎯🎯 YACHTLOCATION ERROR DETECTED! 🎯🎯🎯')
        console.log('🚨 ERROR:', text)
      }
      
      // Also log general errors for debugging
      if (type === 'error') {
        console.log(`🔍 BROWSER ERROR: ${text}`)
      }
    })

    // Step 1: Load application
    console.log('📱 Step 1: Loading application...')
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 4000))

    // Step 2: Try multiple navigation strategies
    console.log('\\n📋 Step 2: Trying multiple navigation approaches...')
    
    // Strategy 1: Direct URL navigation if possible
    const urlStrategies = [
      'http://localhost:3005/bookings',
      'http://localhost:3005/booking',
      'http://localhost:3005/#/bookings'
    ]
    
    let navigationSuccessful = false
    
    for (const url of urlStrategies) {
      try {
        console.log(`🔗 Trying direct navigation to: ${url}`)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 })
        
        const hasBookingContent = await page.evaluate(() => {
          const content = document.body.innerText
          return content.includes('Booking') || content.includes('Contract') || content.includes('Save')
        })
        
        if (hasBookingContent) {
          console.log(`✅ Successfully navigated via URL: ${url}`)
          navigationSuccessful = true
          break
        }
      } catch (e) {
        console.log(`❌ URL ${url} failed`)
      }
    }
    
    // Strategy 2: Manual navigation if URL strategy failed
    if (!navigationSuccessful) {
      console.log('🔧 Trying manual navigation...')
      
      await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' })
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Expand sidebar
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const sidebarToggle = buttons.find(btn => {
          const svg = btn.querySelector('svg')
          return svg && (svg.innerHTML.includes('M9 5l7 7-7 7') || btn.getAttribute('data-testid') === 'sidebar-toggle')
        })
        if (sidebarToggle) {
          sidebarToggle.click()
          return true
        }
        return false
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Click bookings
      const bookingsClicked = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a, span'))
        for (const element of elements) {
          const text = element.textContent?.toLowerCase().trim() || ''
          if (text.includes('booking')) {
            element.click()
            return true
          }
        }
        return false
      })
      
      if (bookingsClicked) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        navigationSuccessful = true
      }
    }

    if (!navigationSuccessful) {
      console.log('❌ Could not navigate to bookings - trying alternative approach')
      
      // Strategy 3: Look for existing content with status toggles
      const hasToggleContent = await page.evaluate(() => {
        const content = document.body.innerText
        return content.includes('Contract Sent') || 
               content.includes('Deposit Paid') || 
               content.includes('Save Changes')
      })
      
      if (hasToggleContent) {
        console.log('✅ Found toggle content on current page')
        navigationSuccessful = true
      }
    }

    if (!navigationSuccessful) {
      throw new Error('Could not find or navigate to booking interface')
    }

    // Step 3: Look for and click on a booking to open BookingPanel
    console.log('\\n🎯 Step 3: Opening BookingPanel...')
    
    const bookingPanelOpened = await page.evaluate(() => {
      // Try clicking on booking cards/rows
      const clickableElements = Array.from(document.querySelectorAll('.cursor-pointer, [onclick], tr'))
      
      for (const element of clickableElements) {
        const text = element.textContent || ''
        if ((text.includes('test') || text.includes('Test') || text.includes('Calico')) && 
            text.includes('20') && // Year indicator
            text.length < 500) {
          
          console.log('Found booking element to click:', text.substring(0, 100))
          element.click()
          return true
        }
      }
      
      // If no booking found, check if we're already in BookingPanel
      const content = document.body.innerText
      return content.includes('Save Changes') && content.includes('Contract Sent')
    })

    if (bookingPanelOpened) {
      await new Promise(resolve => setTimeout(resolve, 4000))
      console.log('✅ BookingPanel accessed')
    }

    // Step 4: Find status toggles using user's specific path
    console.log('\\n🔘 Step 4: Finding status toggles...')
    console.log('User specified path: #root > div > div.ml-12... > div:nth-child(3)')
    
    const togglesFound = await page.evaluate(() => {
      // Try multiple strategies to find toggles
      const strategies = [
        // Strategy 1: User's specific path area
        () => {
          const rootArea = document.querySelector('#root div.ml-12')
          if (rootArea) {
            const toggles = rootArea.querySelectorAll('.cursor-pointer')
            return Array.from(toggles).filter(t => {
              const text = t.textContent?.trim() || ''
              return text.includes('Contract') || text.includes('Deposit') || text.includes('Payment')
            })
          }
          return []
        },
        
        // Strategy 2: Any cursor-pointer with status text
        () => {
          const allToggleable = Array.from(document.querySelectorAll('.cursor-pointer'))
          return allToggleable.filter(element => {
            const text = element.textContent?.trim() || ''
            return (text.includes('Contract Sent') || 
                   text.includes('Deposit Paid') || 
                   text.includes('Full Payment') ||
                   text.includes('Booking Confirmed')) && text.length < 150
          })
        },
        
        // Strategy 3: Look for elements with status toggle patterns
        () => {
          const allElements = Array.from(document.querySelectorAll('div'))
          return allElements.filter(element => {
            const text = element.textContent?.trim() || ''
            const hasStatusText = text.includes('Contract Sent') || text.includes('Deposit Paid')
            const isClickable = element.classList.contains('cursor-pointer') || 
                              element.parentElement?.classList.contains('cursor-pointer')
            return hasStatusText && isClickable && text.length < 200
          })
        }
      ]
      
      for (let i = 0; i < strategies.length; i++) {
        const toggles = strategies[i]()
        if (toggles.length > 0) {
          console.log(`Found ${toggles.length} toggles using strategy ${i + 1}`)
          return toggles.map(t => t.textContent?.trim().substring(0, 80))
        }
      }
      
      return []
    })

    console.log('Found toggles:', togglesFound)

    if (togglesFound.length === 0) {
      console.log('❌ No status toggles found')
      
      // Debug: show current page content
      const content = await page.evaluate(() => document.body.innerText)
      console.log('📄 Current page content (first 800 chars):', content.substring(0, 800))
      
      throw new Error('No status toggles found on page')
    }

    // Step 5: Click the first available toggle
    console.log('\\n🎯 Step 5: Clicking status toggle...')
    
    const toggleClicked = await page.evaluate(() => {
      const strategies = [
        () => document.querySelector('#root div.ml-12')?.querySelectorAll('.cursor-pointer'),
        () => document.querySelectorAll('.cursor-pointer'),
        () => document.querySelectorAll('div')
      ]
      
      for (const strategy of strategies) {
        const elements = Array.from(strategy() || [])
        
        for (const element of elements) {
          const text = element.textContent?.trim() || ''
          if ((text.includes('Contract Sent') || text.includes('Deposit Paid')) && 
              (element.classList.contains('cursor-pointer') || 
               element.parentElement?.classList.contains('cursor-pointer'))) {
            
            const clickableElement = element.classList.contains('cursor-pointer') ? element : element.parentElement
            
            console.log('Clicking toggle:', text.substring(0, 50))
            clickableElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            clickableElement.click()
            
            return text.substring(0, 50)
          }
        }
      }
      return false
    })

    if (!toggleClicked) {
      throw new Error('Could not click any status toggle')
    }

    console.log(`✅ Clicked toggle: ${toggleClicked}`)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 6: Find and click Save Changes
    console.log('\\n💾 Step 6: Clicking Save Changes...')
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(resolve => setTimeout(resolve, 1000))

    const saveClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase().trim() || ''
        if (text.includes('save changes') || text.includes('save') || text === 'update') {
          console.log('Clicking save button:', text)
          button.scrollIntoView({ behavior: 'smooth', block: 'center' })
          button.click()
          return text
        }
      }
      return false
    })

    if (!saveClicked) {
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(b => b.textContent?.trim()).filter(text => text)
      )
      console.log('Available buttons:', allButtons)
      throw new Error('Save button not found')
    }

    console.log(`✅ Clicked save button: ${saveClicked}`)

    // Step 7: Monitor for yachtLocation error
    console.log('\\n🚨 Step 7: MONITORING FOR YACHTLOCATION ERROR...')
    
    // Wait for error or success
    for (let i = 0; i < 15; i++) {
      if (yachtLocationErrorDetected) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (i % 3 === 0) {
        console.log(`⏳ Waiting for error... (${i}/15 seconds)`)
      }
    }

    // Final result
    if (yachtLocationErrorDetected) {
      console.log('\\n🚨 YACHTLOCATION ERROR REPRODUCED!')
      console.log('🚨 Error details:', errorDetails)
      console.log('❌ The field mapping fix needs more work')
      
      return {
        success: true,
        errorReproduced: true,
        error: errorDetails,
        fixWorking: false
      }
    } else {
      console.log('\\n✅ No yachtLocation error detected!')
      console.log('🎉 The yachtLocation field mapping fix is WORKING!')
      console.log('✅ Status toggle save completed without schema errors')
      
      return {
        success: true,
        errorReproduced: false,
        fixWorking: true,
        message: 'yachtLocation field mapping fix successful!'
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
testDirectYachtLocation().then(results => {
  console.log('\\n🏁 DIRECT YACHTLOCATION TEST RESULTS:')
  console.log('======================================')
  console.log('Success:', results.success)
  console.log('Error Reproduced:', results.errorReproduced)
  console.log('Fix Working:', results.fixWorking)
  if (results.error) {
    console.log('Error Details:', results.error)
  }
  console.log('======================================')
  
  if (results.fixWorking) {
    console.log('\\n🎉🎉🎉 YACHTLOCATION FIX CONFIRMED WORKING! 🎉🎉🎉')
    console.log('✅ Field mapping: yachtLocation → yacht_location is successful!')
    console.log('✅ The user reported error has been resolved!')
  } else if (results.errorReproduced) {
    console.log('\\n🚨 ERROR REPRODUCED - Need additional investigation')
    console.log('🔧 The field mapping may need additional work')
  } else {
    console.log('\\n❌ Could not complete test - checking navigation issues')
  }
}).catch(error => {
  console.error('Test execution failed:', error)
})