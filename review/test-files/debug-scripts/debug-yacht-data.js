/**
 * Debug yacht data to understand UUID mappings
 */

import puppeteer from 'puppeteer'

async function debugYachtData() {
  console.log('=== Debugging Yacht Data ===\n')
  
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('1. Extracting yacht selector options...')
    
    // Get yacht selector options with values and text
    const yachtOptions = await page.evaluate(() => {
      const yachtSelect = document.querySelector('select[name="yacht"]')
      if (!yachtSelect) return null
      
      const options = Array.from(yachtSelect.options)
      return options.map(option => ({
        value: option.value,
        text: option.textContent.trim(),
        selected: option.selected
      }))
    })
    
    if (yachtOptions) {
      console.log('   Yacht options found:')
      yachtOptions.forEach((option, index) => {
        console.log(`   ${index + 1}. Value: "${option.value}" → Text: "${option.text}"`)
      })
    } else {
      console.log('   No yacht selector found')
    }
    
    console.log('\n2. Testing yacht selection...')
    
    // Test selecting different yachts to see what values are sent
    const testYachts = ['zavaria', 'calico-moon', 'spectre', 'alrisha', 'disk-drive']
    
    for (const yachtName of testYachts) {
      try {
        // Find option that contains this yacht name
        const matchingOption = yachtOptions?.find(option => 
          option.text.toLowerCase().includes(yachtName.replace('-', ' ')) ||
          option.value.toLowerCase() === yachtName
        )
        
        if (matchingOption) {
          console.log(`   ${yachtName} → UUID: ${matchingOption.value}`)
        } else {
          console.log(`   ${yachtName} → Not found`)
        }
      } catch (e) {
        console.log(`   ${yachtName} → Error: ${e.message}`)
      }
    }
    
    console.log('\n3. Checking existing booking data...')
    
    // Look for any existing yacht data on the page
    const existingYachtData = await page.evaluate(() => {
      // Look for yacht information in existing bookings
      const yachtInfo = []
      
      // Check SIT REP section for yacht names
      const sitRepItems = document.querySelectorAll('[class*="charter"], [class*="booking"]')
      sitRepItems.forEach(item => {
        const text = item.textContent
        const yachtNames = ['Zavaria', 'Calico Moon', 'Spectre', 'Alrisha', 'Disk Drive']
        yachtNames.forEach(name => {
          if (text.includes(name)) {
            yachtInfo.push({ yacht: name, element: item.className, text: text.slice(0, 100) })
          }
        })
      })
      
      return yachtInfo
    })
    
    console.log('   Existing yacht references:')
    existingYachtData.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.yacht} found in: ${item.text}`)
    })
    
    console.log('\n4. Attempting to submit form to capture error...')
    
    // Try to submit with a yacht selection to capture the exact error
    if (yachtOptions && yachtOptions.length > 1) {
      const firstYacht = yachtOptions[1] // Skip the "Select a yacht" option
      
      console.log(`   Selecting yacht: ${firstYacht.text} (${firstYacht.value})`)
      
      await page.select('select[name="yacht"]', firstYacht.value)
      
      // Fill minimal required fields
      await page.type('input[name="firstName"]', 'Test')
      await page.type('input[name="surname"]', 'User')
      await page.type('input[name="email"]', 'test@example.com')
      await page.type('input[name="phone"]', '+44 1234567890')
      await page.type('input[name="addressLine1"]', '123 Test St')
      await page.type('input[name="city"]', 'Test City')
      await page.type('input[name="postcode"]', 'TC1 2ST')
      await page.type('input[name="startDate"]', '2025-07-05')
      await page.type('input[name="endDate"]', '2025-07-12')
      
      // Listen for console errors
      let errorCaught = null
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('Unknown yacht ID')) {
          errorCaught = msg.text()
        }
      })
      
      // Try to submit
      const quickCreateButton = await page.$('button:has-text("Quick Create")')
      if (quickCreateButton) {
        await quickCreateButton.click()
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        if (errorCaught) {
          console.log(`   Error captured: ${errorCaught}`)
          
          // Parse the error to extract UUID and valid names
          const uuidMatch = errorCaught.match(/Unknown yacht ID: ([a-f0-9-]+)/)
          const validNamesMatch = errorCaught.match(/Valid yacht IDs: (.+)/)
          
          if (uuidMatch && validNamesMatch) {
            console.log(`   Failed UUID: ${uuidMatch[1]}`)
            console.log(`   Valid names: ${validNamesMatch[1]}`)
            
            return {
              failedUUID: uuidMatch[1],
              validNames: validNamesMatch[1].split(', '),
              selectedYacht: firstYacht
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error)
  } finally {
    await browser.close()
  }
}

debugYachtData().then(result => {
  if (result) {
    console.log('\n=== UUID Mapping Analysis ===')
    console.log(`Selected yacht text: "${result.selectedYacht.text}"`)
    console.log(`Selected yacht UUID: ${result.selectedYacht.value}`)
    console.log(`Failed UUID: ${result.failedUUID}`)
    console.log(`Valid yacht names: ${result.validNames.join(', ')}`)
    
    console.log('\n=== Recommended Fix ===')
    console.log('Create UUID-to-name mapping in BookingService:')
    console.log(`"${result.failedUUID}": "${result.selectedYacht.text.toLowerCase().replace(/\s+/g, '-')}"`)
  }
}).catch(error => {
  console.error('Test failed:', error)
})