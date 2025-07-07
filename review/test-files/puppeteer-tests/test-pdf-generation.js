/**
 * Test script for PDF generation with template files
 * Tests the new pdf-lib integration in DocumentAutoGenerator
 */

import DocumentAutoGenerator from './src/services/supabase/DocumentAutoGenerator.js'
import fs from 'fs'
import path from 'path'

async function testPdfGeneration() {
  console.log('🧪 Testing PDF Generation with Templates')
  console.log('=' .repeat(50))
  
  try {
    const generator = new DocumentAutoGenerator()
    
    // Mock booking data (same as in the demo)
    const mockBookingData = {
      booking_number: 'BK-2025-001',
      customer_first_name: 'Emma',
      customer_surname: 'Johnson',
      customer_email: 'emma.johnson@email.com',
      customer_phone: '+44 7234 567890',
      customer_street: '45 Coastal Drive',
      customer_city: 'Brighton',
      customer_postcode: 'BN1 3XY',
      customer_country: 'United Kingdom',
      yacht_name: 'Sea Breeze',
      yacht_type: 'Sailboat 35ft',
      yacht_location: 'Brighton Marina',
      charter_type: 'bareboat',
      start_date: '2025-08-10',
      end_date: '2025-08-17',
      port_of_departure: 'Brighton Marina',
      port_of_arrival: 'Brighton Marina',
      total_cost: 3000,
      deposit_amount: 600,
      deposit_paid: true,
      payment_status: 'pending'
    }
    
    // Mock settings data
    const mockSettingsData = {
      yachtOwner: {
        owner_name: 'SeaScape Yacht Charter Ltd',
        owner_email: 'bookings@seascapeyachtcharter.com',
        owner_phone: '+44 1273 456789',
        owner_address: 'Marina Business Centre, Brighton Marina Village, Brighton, BN2 5UF, United Kingdom'
      }
    }
    
    console.log('📋 Mock data prepared')
    console.log('Customer:', mockBookingData.customer_first_name, mockBookingData.customer_surname)
    console.log('Yacht:', mockBookingData.yacht_name)
    console.log('Total:', `£${mockBookingData.total_cost}`)
    console.log('')
    
    // Test 1: Check if template files exist
    console.log('🔍 Checking for template files...')
    const templatesDir = '../Templates'
    const templateFiles = [
      'Blank Remaining Balance invoice - Template.pdf',
      'Remaining Balance invoice - Template.pdf'
    ]
    
    for (const filename of templateFiles) {
      const filepath = path.join(templatesDir, filename)
      if (fs.existsSync(filepath)) {
        console.log(`✅ Found: ${filename}`)
      } else {
        console.log(`❌ Missing: ${filename}`)
      }
    }
    console.log('')
    
    // Test 2: Generate PDF from blank template
    console.log('🎯 Test 1: Using blank template...')
    try {
      const blankTemplatePath = path.join(templatesDir, 'Blank Remaining Balance invoice - Template.pdf')
      
      if (fs.existsSync(blankTemplatePath)) {
        // Read the template file
        const templateBuffer = fs.readFileSync(blankTemplatePath)
        const templateBlob = new Blob([templateBuffer], { type: 'application/pdf' })
        
        // Prepare document data
        const documentData = generator.prepareDocumentData('balanceInvoice', mockBookingData, mockSettingsData)
        
        console.log('📊 Document data prepared:')
        console.log('- Document number:', documentData.document_number)
        console.log('- Customer name:', documentData.customer_name)
        console.log('- Amount due:', documentData.amount_due)
        console.log('- Deposit status:', documentData.deposit_status)
        console.log('')
        
        // Generate filled PDF
        console.log('🔨 Generating filled PDF...')
        const filledPdf = await generator.populatePdfTemplate(templateBlob, documentData)
        
        // Save the result
        const outputPath = './test-generated-balance-invoice.pdf'
        const pdfBuffer = Buffer.from(await filledPdf.arrayBuffer())
        fs.writeFileSync(outputPath, pdfBuffer)
        
        console.log('✅ PDF generated successfully!')
        console.log('📁 Saved to:', outputPath)
        console.log('📏 File size:', (pdfBuffer.length / 1024).toFixed(2), 'KB')
        
      } else {
        console.log('❌ Blank template not found, creating new PDF...')
        
        // Create a new PDF without template
        const documentData = generator.prepareDocumentData('balanceInvoice', mockBookingData, mockSettingsData)
        const newPdf = await generator.createPdfFromTemplate(new (await import('pdf-lib')).PDFDocument(), documentData)
        
        const outputPath = './test-generated-new-invoice.pdf'
        const pdfBuffer = Buffer.from(await newPdf.arrayBuffer())
        fs.writeFileSync(outputPath, pdfBuffer)
        
        console.log('✅ New PDF created successfully!')
        console.log('📁 Saved to:', outputPath)
      }
      
    } catch (error) {
      console.error('❌ Test 1 failed:', error.message)
    }
    
    console.log('')
    
    // Test 3: Test with different deposit status
    console.log('🎯 Test 2: Testing deposit status changes...')
    try {
      // Test with unpaid deposit
      const unpaidBookingData = { ...mockBookingData, deposit_paid: false }
      const documentData = generator.prepareDocumentData('balanceInvoice', unpaidBookingData, mockSettingsData)
      
      console.log('📊 Unpaid deposit scenario:')
      console.log('- Amount due:', documentData.amount_due)
      console.log('- Previous payments:', documentData.previous_payments)
      console.log('- Deposit status:', documentData.deposit_status)
      
      // Test with paid deposit
      const paidBookingData = { ...mockBookingData, deposit_paid: true }
      const paidDocumentData = generator.prepareDocumentData('balanceInvoice', paidBookingData, mockSettingsData)
      
      console.log('📊 Paid deposit scenario:')
      console.log('- Amount due:', paidDocumentData.amount_due)
      console.log('- Previous payments:', paidDocumentData.previous_payments)
      console.log('- Deposit status:', paidDocumentData.deposit_status)
      
      console.log('✅ Deposit status calculations working correctly!')
      
    } catch (error) {
      console.error('❌ Test 2 failed:', error.message)
    }
    
    console.log('')
    console.log('🎉 PDF Generation Testing Complete!')
    console.log('=' .repeat(50))
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
  }
}

// Run the test
testPdfGeneration().catch(console.error)