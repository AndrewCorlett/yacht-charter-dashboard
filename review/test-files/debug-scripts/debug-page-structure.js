/**
 * Debug script to understand the current page structure
 */

import puppeteer from 'puppeteer'

async function debugPageStructure() {
  console.log('🔍 Debugging Page Structure...\n')

  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      slowMo: 500
    })

    const page = await browser.newPage()
    
    // Navigate to the application
    console.log('📱 Navigating to yacht charter dashboard...')
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Get basic page info
    const title = await page.title()
    console.log('📄 Page title:', title)

    // Get navigation structure
    console.log('\n🧭 Navigation structure:')
    const navElements = await page.$$eval('nav a, .nav-link, [role="navigation"] a, header a', elements => 
      elements.map(el => ({ text: el.textContent?.trim(), href: el.href }))
    )
    navElements.forEach((nav, i) => console.log(`  ${i + 1}. "${nav.text}" -> ${nav.href}`))

    // Look for any calendar or booking management links
    console.log('\n📅 Looking for calendar/booking management...')
    
    const potentialBookingNavs = await page.$$eval('a, button', elements => 
      elements.filter(el => {
        const text = el.textContent?.toLowerCase() || ''
        return text.includes('booking') || text.includes('calendar') || text.includes('management')
      }).map(el => ({ 
        text: el.textContent?.trim(), 
        tag: el.tagName, 
        href: el.href || 'no-href',
        id: el.id,
        className: el.className
      }))
    )
    
    potentialBookingNavs.forEach((nav, i) => {
      console.log(`  ${i + 1}. [${nav.tag}] "${nav.text}" (${nav.href})`)
      if (nav.id) console.log(`      ID: ${nav.id}`)
      if (nav.className) console.log(`      Class: ${nav.className}`)
    })

    // Try clicking on booking management if found
    if (potentialBookingNavs.length > 0) {
      console.log('\n🔗 Trying to navigate to booking management...')
      
      const bookingNav = potentialBookingNavs.find(nav => 
        nav.text.toLowerCase().includes('booking') || 
        nav.text.toLowerCase().includes('management')
      ) || potentialBookingNavs[0]
      
      console.log(`Clicking on: "${bookingNav.text}"`)
      
      try {
        if (bookingNav.href && bookingNav.href !== 'no-href') {
          await page.goto(bookingNav.href, { waitUntil: 'networkidle2' })
        } else {
          // Find and click the element
          await page.click(`text="${bookingNav.text}"`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const newUrl = page.url()
        console.log('✅ Navigated to:', newUrl)
        
      } catch (e) {
        console.log('❌ Navigation failed:', e.message)
      }
    }

    // Now check for booking cards/items
    console.log('\n📋 Looking for booking items on current page...')
    
    const bookingItems = await page.$$eval('*', elements => {
      return elements.filter(el => {
        const text = el.textContent?.toLowerCase() || ''
        const classes = el.className?.toLowerCase() || ''
        const id = el.id?.toLowerCase() || ''
        
        return (text.includes('booking') && text.length < 200) ||
               classes.includes('booking') ||
               id.includes('booking') ||
               (text.match(/\d{4}-\d{2}-\d{2}/) && text.length < 100) || // Date patterns
               text.includes('confirmed') ||
               text.includes('tentative') ||
               text.includes('yacht')
      }).slice(0, 10).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 100),
        className: el.className,
        id: el.id
      }))
    })
    
    bookingItems.forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.tag}] "${item.text}"`)
      if (item.id) console.log(`      ID: ${item.id}`)
      if (item.className) console.log(`      Class: ${item.className}`)
    })

    // Try clicking on the first booking item if found
    if (bookingItems.length > 0) {
      console.log('\n🔗 Trying to click on first booking item...')
      
      const firstBooking = bookingItems[0]
      
      try {
        if (firstBooking.id) {
          await page.click(`#${firstBooking.id}`)
        } else if (firstBooking.className) {
          await page.click(`.${firstBooking.className.split(' ')[0]}`)
        } else {
          // Try to click by text content
          await page.click(`text="${firstBooking.text.substring(0, 50)}"`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000))
        console.log('✅ Clicked on booking item')
        
      } catch (e) {
        console.log('❌ Click failed:', e.message)
      }
    }

    // Finally, check for any form inputs/toggles on the current page
    console.log('\n🔘 Checking for form inputs and toggles...')
    
    const formInputs = await page.$$eval('input, button, select, textarea', elements => 
      elements.map(el => ({
        tag: el.tagName,
        type: el.type,
        name: el.name,
        id: el.id,
        className: el.className,
        checked: el.checked,
        value: el.value?.substring(0, 50) || '',
        placeholder: el.placeholder || '',
        text: el.textContent?.trim().substring(0, 50) || ''
      }))
    )
    
    formInputs.forEach((input, i) => {
      console.log(`  ${i + 1}. [${input.tag}] type="${input.type}" name="${input.name}"`)
      if (input.id) console.log(`      ID: ${input.id}`)
      if (input.placeholder) console.log(`      Placeholder: ${input.placeholder}`)
      if (input.text) console.log(`      Text: ${input.text}`)
      if (input.type === 'checkbox') console.log(`      Checked: ${input.checked}`)
    })

    console.log('\n✅ Page structure analysis complete')
    
    return {
      success: true,
      hasBookingNavigation: potentialBookingNavs.length > 0,
      hasBookingItems: bookingItems.length > 0,
      hasFormInputs: formInputs.length > 0,
      checkboxCount: formInputs.filter(i => i.type === 'checkbox').length
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  } finally {
    // Keep browser open for manual inspection
    console.log('\n⏸️ Browser will stay open for 30 seconds for manual inspection...')
    await new Promise(resolve => setTimeout(resolve, 30000))
    
    if (browser) {
      await browser.close()
    }
  }
}

// Run the debug
debugPageStructure().then(results => {
  console.log('\n📋 Debug Results:', results)
}).catch(error => {
  console.error('Debug execution failed:', error)
})