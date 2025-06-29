const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

async function testFileUploadIntegration() {
  console.log('🎯 Testing File Upload Integration with Supabase Storage')
  console.log('=' .repeat(60))

  let browser, page
  
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    page = await browser.newPage()
    
    // Navigate to application
    console.log('\n📍 Navigating to application...')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
    
    // Take initial screenshot
    await page.screenshot({ path: 'file-upload-test-01-initial.png' })
    
    // Navigate to bookings section
    console.log('\n📋 Navigating to bookings section...')
    
    // Try clicking on sidebar bookings icon
    try {
      await page.click('[title="Bookings"], [aria-label*="Bookings"]', { timeout: 5000 })
    } catch {
      // Alternative: click on left sidebar area where bookings icon should be
      await page.click('body')
      await page.mouse.click(20, 95) // Approximate position of bookings icon
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    await page.screenshot({ path: 'file-upload-test-02-bookings.png' })
    
    // Look for booking rows and click on first one
    console.log('\n🔍 Looking for bookings...')
    
    // Try to find and click on a booking row
    const bookingRowClicked = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr, [data-booking-id], .booking-row')
      for (let row of rows) {
        if (row.textContent.includes('BK-CURRENT-001') || 
            row.textContent.includes('BK-TEST-001') ||
            row.textContent.includes('Spectre') ||
            row.textContent.includes('Alrisha')) {
          row.click()
          return true
        }
      }
      return false
    })
    
    if (!bookingRowClicked) {
      console.log('⚠️  No booking rows found, trying alternative approach...')
      
      // Try dispatching custom navigation event
      await page.evaluate(() => {
        const booking = {
          id: 'BK-CURRENT-001',
          customer_name: 'Jane Smith',
          yacht_name: 'Spectre'
        }
        
        const event = new CustomEvent('navigateToBooking', {
          detail: { booking, section: 'bookings' }
        })
        window.dispatchEvent(event)
      })
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    await page.screenshot({ path: 'file-upload-test-03-booking-panel.png' })
    
    // Look for file upload component
    console.log('\n📁 Looking for file upload component...')
    
    const fileUploadExists = await page.evaluate(() => {
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const uploadAreas = document.querySelectorAll('[data-testid="file-input"], .file-upload, [class*="upload"]')
      const dragDropAreas = document.querySelectorAll('[ondrop], [ondragover]')
      
      return {
        fileInputs: fileInputs.length,
        uploadAreas: uploadAreas.length,
        dragDropAreas: dragDropAreas.length,
        total: fileInputs.length + uploadAreas.length + dragDropAreas.length
      }
    })
    
    console.log('File upload elements found:', fileUploadExists)
    
    if (fileUploadExists.total > 0) {
      console.log('✅ File upload component found!')
      
      // Create a test PDF file
      console.log('\n📄 Creating test PDF file...')
      const testPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 50
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test Crew Experience Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000015 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000213 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
320
%%EOF`
      
      const testFilePath = '/tmp/test_crew_experience.pdf'
      fs.writeFileSync(testFilePath, testPdfContent)
      
      // Test file upload
      try {
        const fileInput = await page.$('input[type="file"]')
        if (fileInput) {
          console.log('\n⬆️  Testing file upload...')
          await fileInput.uploadFile(testFilePath)
          
          await new Promise(resolve => setTimeout(resolve, 2000))
          await page.screenshot({ path: 'file-upload-test-04-file-uploaded.png' })
          
          // Check if file info appears
          const fileDisplayed = await page.evaluate(() => {
            const fileNames = document.querySelectorAll('*')
            for (let el of fileNames) {
              if (el.textContent && el.textContent.includes('test_crew_experience.pdf')) {
                return true
              }
            }
            return false
          })
          
          if (fileDisplayed) {
            console.log('✅ File upload successful - file name displayed!')
          } else {
            console.log('⚠️  File uploaded but not visually confirmed')
          }
          
          // Test save functionality
          console.log('\n💾 Testing save functionality...')
          const saveButton = await page.$('button:contains("Save"), button:contains("Update"), [type="submit"]')
          if (saveButton) {
            await saveButton.click()
            await new Promise(resolve => setTimeout(resolve, 3000))
            await page.screenshot({ path: 'file-upload-test-05-after-save.png' })
            console.log('✅ Save button clicked')
          }
          
        } else {
          console.log('❌ File input not accessible')
        }
      } catch (uploadError) {
        console.error('❌ File upload failed:', uploadError.message)
      }
      
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
      
    } else {
      console.log('❌ No file upload components found on page')
      
      // Debug: show current page content
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.textContent.substring(0, 200),
          url: window.location.href
        }
      })
      console.log('Current page:', pageContent)
    }
    
    await page.screenshot({ path: 'file-upload-test-06-final.png' })
    
    console.log('\n✅ File upload integration test completed!')
    console.log('📷 Screenshots saved with prefix: file-upload-test-')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (page) {
      await page.screenshot({ path: 'file-upload-test-error.png' })
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the test
testFileUploadIntegration().catch(console.error)