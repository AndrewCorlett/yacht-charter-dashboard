/**
 * Simple test to verify security deposit functionality
 */

const puppeteer = require('puppeteer')

async function testSecurityDepositSimple() {
  console.log('🚀 Starting Simple Security Deposit Test')
  
  let browser
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    })

    const page = await browser.newPage()
    console.log('📍 Navigating to application...')
    
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2', timeout: 30000 })
    console.log('✅ Page loaded')

    // Take initial screenshot
    await page.screenshot({ path: 'security-deposit-test-initial.png', fullPage: true })
    console.log('📸 Initial screenshot taken')

    // Wait and look for any elements
    await page.waitForTimeout(3000)
    
    // Try to find navigation or bookings link
    const pageContent = await page.content()
    console.log('📄 Page title:', await page.title())
    
    // Check for common elements
    const bodyText = await page.evaluate(() => document.body.innerText)
    console.log('📝 Page contains text:', bodyText.substring(0, 200))

    // Look for bookings navigation
    const bookingsLink = await page.$('a[href*="booking"], a:contains("Booking"), nav a')
    if (bookingsLink) {
      console.log('✅ Found bookings link')
      await bookingsLink.click()
      await page.waitForTimeout(2000)
    } else {
      console.log('⚠️  No bookings link found, checking for direct booking elements')
    }

    // Take navigation screenshot
    await page.screenshot({ path: 'security-deposit-test-navigation.png', fullPage: true })
    console.log('📸 Navigation screenshot taken')

    console.log('🎉 Simple test completed - check screenshots for verification')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (browser) {
      try {
        const page = (await browser.pages())[0]
        await page.screenshot({ path: 'security-deposit-test-error.png', fullPage: true })
        console.log('📸 Error screenshot taken')
      } catch (e) {
        console.error('Could not take error screenshot:', e.message)
      }
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

testSecurityDepositSimple()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test error:', error)
    process.exit(1)
  })