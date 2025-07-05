/**
 * Simple PDF generation test without Supabase dependencies
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

async function testSimplePdfGeneration() {
  console.log('🧪 Testing Simple PDF Generation')
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
      customer_full_address: '45 Coastal Drive, Brighton, BN1 3XY, United Kingdom',
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
      balance_due_date: '11/07/2025',
      owner_name: 'SeaScape Yacht Charter Ltd',
      owner_email: 'bookings@seascapeyachtcharter.com',
      owner_phone: '+44 1273 456789',
      owner_address: 'Marina Business Centre, Brighton Marina Village, Brighton, BN2 5UF, United Kingdom'
    }
    
    console.log('📋 Creating PDF with booking data...')
    console.log('Customer:', data.customer_name)
    console.log('Amount Due:', `£${data.amount_due}`)
    console.log('')
    
    // Create PDF document
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
    const { width, height } = page.getSize()
    
    // Load fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    let yPosition = height - 50
    const leftMargin = 50
    const lineHeight = 20
    
    // Header
    page.drawText('SEASCAPE YACHT CHARTER', {
      x: leftMargin,
      y: yPosition,
      size: 18,
      font: fontBold,
      color: rgb(0, 0, 0.5)
    })
    yPosition -= 30
    
    page.drawText(data.document_type.toUpperCase(), {
      x: leftMargin,
      y: yPosition,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0)
    })
    yPosition -= 40
    
    // Document details
    page.drawText(`Document Number: ${data.document_number}`, {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: fontRegular
    })
    yPosition -= lineHeight
    
    page.drawText(`Date: ${data.document_date}`, {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: fontRegular
    })
    yPosition -= 30
    
    // Customer information
    page.drawText('BILL TO:', {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: fontBold
    })
    yPosition -= lineHeight
    
    const customerLines = [
      data.customer_name,
      data.customer_email,
      data.customer_phone,
      data.customer_full_address
    ]
    
    for (const line of customerLines) {
      page.drawText(line, {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: fontRegular
      })
      yPosition -= lineHeight
    }
    yPosition -= 20
    
    // Yacht charter details
    page.drawText('YACHT CHARTER DETAILS:', {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: fontBold
    })
    yPosition -= lineHeight
    
    const charterLines = [
      `Booking Reference: ${data.booking_number}`,
      `Yacht: ${data.yacht_name} (${data.yacht_type})`,
      `Base Location: ${data.yacht_location}`,
      `Charter Type: ${data.charter_type}`,
      `Charter Dates: ${data.start_date} to ${data.end_date}`,
      `Duration: ${data.charter_duration} days`,
      `Departure Port: ${data.port_of_departure}`,
      `Arrival Port: ${data.port_of_arrival}`
    ]
    
    for (const line of charterLines) {
      page.drawText(line, {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: fontRegular
      })
      yPosition -= lineHeight
    }
    yPosition -= 20
    
    // Financial summary
    page.drawText('FINANCIAL SUMMARY:', {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: fontBold
    })
    yPosition -= lineHeight
    
    const financialLines = [
      `Total Charter Amount: £${data.total_amount}`,
      `Deposit Amount: £${data.deposit_amount}`,
      `Previous Payments: £${data.previous_payments}`,
      '-------------------------------------------',
      `AMOUNT DUE: £${data.amount_due}`
    ]
    
    for (const line of financialLines) {
      const font = line.includes('AMOUNT DUE') ? fontBold : fontRegular
      const size = line.includes('AMOUNT DUE') ? 14 : 11
      
      page.drawText(line, {
        x: leftMargin,
        y: yPosition,
        size: size,
        font: font,
        color: line.includes('AMOUNT DUE') ? rgb(0, 0, 0.7) : rgb(0, 0, 0)
      })
      yPosition -= lineHeight
    }
    yPosition -= 20
    
    // Payment information
    page.drawText(`Deposit Status: ${data.deposit_status}`, {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: fontRegular
    })
    yPosition -= lineHeight
    
    page.drawText(`Payment Terms: ${data.payment_terms}`, {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: fontRegular
    })
    yPosition -= lineHeight
    
    page.drawText(`Balance Due Date: ${data.balance_due_date}`, {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: fontRegular
    })
    yPosition -= 30
    
    // Owner information
    page.drawText('REMIT TO:', {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: fontBold
    })
    yPosition -= lineHeight
    
    const ownerLines = [
      data.owner_name,
      data.owner_email,
      data.owner_phone,
      data.owner_address
    ]
    
    for (const line of ownerLines) {
      page.drawText(line, {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: fontRegular
      })
      yPosition -= lineHeight
    }
    yPosition -= 30
    
    // Footer
    page.drawText('Thank you for choosing SeaScape Yacht Charter.', {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3)
    })
    yPosition -= lineHeight
    
    page.drawText('We look forward to providing you with an excellent charter experience.', {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3)
    })
    
    // Generate PDF
    const pdfBytes = await pdfDoc.save()
    
    // Save the file
    const outputPath = './test-balance-invoice-generated.pdf'
    fs.writeFileSync(outputPath, pdfBytes)
    
    console.log('✅ PDF generated successfully!')
    console.log('📁 Saved to:', outputPath)
    console.log('📏 File size:', (pdfBytes.length / 1024).toFixed(2), 'KB')
    console.log('')
    
    // Test template reading
    console.log('🔍 Testing template file reading...')
    const templatesDir = '../Templates'
    const templateFiles = [
      'Blank Remaining Balance invoice - Template.pdf',
      'Remaining Balance invoice - Template.pdf'
    ]
    
    for (const filename of templateFiles) {
      const filepath = path.join(templatesDir, filename)
      if (fs.existsSync(filepath)) {
        console.log(`✅ Found template: ${filename}`)
        
        // Try to read the template and check for form fields
        try {
          const templateBuffer = fs.readFileSync(filepath)
          const templateDoc = await PDFDocument.load(templateBuffer)
          const form = templateDoc.getForm()
          const fields = form.getFields()
          
          console.log(`   📝 Form fields in ${filename}:`, fields.length)
          if (fields.length > 0) {
            fields.forEach(field => {
              console.log(`      - ${field.getName()} (${field.constructor.name})`)
            })
          } else {
            console.log(`      - No form fields found (will create new page)`)
          }
        } catch (error) {
          console.log(`   ❌ Error reading template: ${error.message}`)
        }
      } else {
        console.log(`❌ Template not found: ${filename}`)
      }
    }
    
    console.log('')
    console.log('🎉 PDF Generation Test Complete!')
    console.log('=' .repeat(50))
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSimplePdfGeneration().catch(console.error)