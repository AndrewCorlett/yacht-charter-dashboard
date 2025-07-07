/**
 * Test template overlay functionality
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

async function testTemplateOverlay() {
  console.log('🧪 Testing Template Overlay Functionality')
  console.log('=' .repeat(50))
  
  try {
    // Mock data
    const data = {
      document_type: 'Remaining Balance Invoice',
      document_number: 'BAL-BK-2025-001-20250629',
      document_date: '29/06/2025',
      customer_name: 'Emma Johnson',
      customer_email: 'emma.johnson@email.com',
      customer_phone: '+44 7234 567890',
      customer_street: '45 Coastal Drive',
      customer_city: 'Brighton',
      customer_postcode: 'BN1 3XY',
      customer_country: 'United Kingdom',
      booking_number: 'BK-2025-001',
      yacht_name: 'Sea Breeze',
      yacht_type: 'Sailboat 35ft',
      yacht_location: 'Brighton Marina',
      charter_type: 'bareboat',
      start_date: '10/08/2025',
      end_date: '17/08/2025',
      charter_duration: '7',
      port_of_departure: 'Brighton Marina',
      port_of_arrival: 'Brighton Marina',
      total_amount: '3000.00',
      deposit_amount: '600.00',
      amount_due: '2400.00',
      previous_payments: '600.00',
      deposit_status: 'PAID',
      payment_terms: 'Payment due 30 days before charter commencement date',
      balance_due_date: '11/07/2025'
    }
    
    console.log('📋 Testing with mock booking data')
    console.log('Customer:', data.customer_name)
    console.log('Amount Due:', `£${data.amount_due}`)
    console.log('')
    
    // Test with actual template file
    const templatesDir = '../Templates'
    const templatePath = path.join(templatesDir, 'Blank Remaining Balance invoice - Template.pdf')
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template file not found:', templatePath)
      return
    }
    
    console.log('📂 Loading template:', templatePath)
    
    // Read the template
    const templateBuffer = fs.readFileSync(templatePath)
    const pdfDoc = await PDFDocument.load(templateBuffer)
    
    const pages = pdfDoc.getPages()
    console.log('📄 Template pages:', pages.length)
    
    if (pages.length === 0) {
      console.log('❌ Template has no pages')
      return
    }
    
    const page = pages[0]
    const { width, height } = page.getSize()
    console.log('📐 Page size:', `${width} x ${height}`)
    
    // Load fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Define overlay positions (you may need to adjust these based on your template)
    const overlayPositions = {
      // Document header area (top right)
      document_number: { x: 400, y: height - 120, size: 10 },
      document_date: { x: 400, y: height - 140, size: 10 },
      
      // Customer information (upper left area)
      customer_name: { x: 80, y: height - 200, size: 11, font: fontBold },
      customer_email: { x: 80, y: height - 220, size: 10 },
      customer_phone: { x: 80, y: height - 240, size: 10 },
      customer_address: { x: 80, y: height - 260, size: 10 },
      
      // Booking details (middle area)
      booking_number: { x: 80, y: height - 340, size: 10 },
      yacht_name: { x: 250, y: height - 340, size: 10 },
      charter_dates: { x: 80, y: height - 360, size: 10 },
      
      // Financial section (lower right)
      total_amount: { x: 400, y: height - 450, size: 11 },
      deposit_amount: { x: 400, y: height - 470, size: 10 },
      previous_payments: { x: 400, y: height - 490, size: 10 },
      amount_due: { x: 400, y: height - 520, size: 14, font: fontBold, color: rgb(0, 0, 0.7) },
      
      // Status information
      deposit_status: { x: 80, y: height - 550, size: 10 },
      balance_due_date: { x: 80, y: height - 570, size: 10 }
    }
    
    // Prepare overlay data
    const overlayData = {
      document_number: data.document_number,
      document_date: data.document_date,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      customer_address: `${data.customer_street}, ${data.customer_city}, ${data.customer_postcode}`,
      booking_number: data.booking_number,
      yacht_name: `${data.yacht_name} (${data.yacht_type})`,
      charter_dates: `${data.start_date} to ${data.end_date} (${data.charter_duration} days)`,
      total_amount: `£${data.total_amount}`,
      deposit_amount: `£${data.deposit_amount}`,
      previous_payments: `£${data.previous_payments}`,
      amount_due: `£${data.amount_due}`,
      deposit_status: `Deposit Status: ${data.deposit_status}`,
      balance_due_date: `Due Date: ${data.balance_due_date}`
    }
    
    console.log('🎯 Overlaying data on template...')
    
    // Overlay each piece of data
    let overlaidCount = 0
    for (const [key, value] of Object.entries(overlayData)) {
      if (value && overlayPositions[key]) {
        const pos = overlayPositions[key]
        
        page.drawText(String(value), {
          x: pos.x,
          y: pos.y,
          size: pos.size || 10,
          font: pos.font || fontRegular,
          color: pos.color || rgb(0, 0, 0)
        })
        
        console.log(`   ✓ ${key}: "${value}" at (${pos.x}, ${pos.y})`)
        overlaidCount++
      }
    }
    
    console.log(`📊 Overlaid ${overlaidCount} data fields`)
    
    // Save the result
    const pdfBytes = await pdfDoc.save()
    const outputPath = './test-template-overlay-result.pdf'
    fs.writeFileSync(outputPath, pdfBytes)
    
    console.log('')
    console.log('✅ Template overlay completed!')
    console.log('📁 Result saved to:', outputPath)
    console.log('📏 File size:', (pdfBytes.length / 1024).toFixed(2), 'KB')
    
    console.log('')
    console.log('🔧 COORDINATE ADJUSTMENT GUIDE:')
    console.log('If the text appears in wrong positions:')
    console.log('1. Open the generated PDF and note where text should be moved')
    console.log('2. Adjust the x,y coordinates in overlayPositions object')
    console.log('3. X coordinates: left (smaller) → right (larger)')
    console.log('4. Y coordinates: bottom (smaller) → top (larger)')
    console.log('5. PDF coordinate system: (0,0) is bottom-left corner')
    
    console.log('')
    console.log('🎉 Template Overlay Test Complete!')
    console.log('=' .repeat(50))
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testTemplateOverlay().catch(console.error)