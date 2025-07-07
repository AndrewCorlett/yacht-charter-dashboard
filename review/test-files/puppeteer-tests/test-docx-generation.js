/**
 * Test script for DOCX template generation with docxtemplater
 */

import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import fs from 'fs'
import path from 'path'

async function testDocxGeneration() {
  console.log('🧪 Testing DOCX Template Generation')
  console.log('=' .repeat(50))
  
  try {
    // Mock booking data
    const mockData = {
      // Document info
      document_type: 'Remaining Balance Invoice',
      document_number: 'BAL-BK-2025-001-20250629',
      document_date: '29/06/2025',
      
      // Customer info
      customer_name: 'Emma Johnson',
      customer_first_name: 'Emma',
      customer_surname: 'Johnson',
      customer_email: 'emma.johnson@email.com',
      customer_phone: '+44 7234 567890',
      customer_street: '45 Coastal Drive',
      customer_city: 'Brighton',
      customer_postcode: 'BN1 3XY',
      customer_country: 'United Kingdom',
      customer_full_address: '45 Coastal Drive, Brighton, BN1 3XY, United Kingdom',
      
      // Yacht info
      booking_number: 'BK-2025-001',
      yacht_name: 'Sea Breeze',
      yacht_type: 'Sailboat 35ft',
      yacht_location: 'Brighton Marina',
      charter_type: 'bareboat',
      
      // Charter dates
      start_date: '10/08/2025',
      end_date: '17/08/2025',
      charter_duration: '7',
      port_of_departure: 'Brighton Marina',
      port_of_arrival: 'Brighton Marina',
      
      // Financial info
      total_amount: '3000.00',
      deposit_amount: '600.00',
      amount_due: '2400.00',
      previous_payments: '600.00',
      remaining_balance: '2400.00',
      deposit_status: 'PAID',
      payment_status: 'pending',
      payment_terms: 'Payment due 30 days before charter commencement date',
      balance_due_date: '11/07/2025',
      
      // Owner info
      owner_name: 'SeaScape Yacht Charter Ltd',
      owner_email: 'bookings@seascapeyachtcharter.com',
      owner_phone: '+44 1273 456789',
      owner_address: 'Marina Business Centre, Brighton Marina Village, Brighton, BN2 5UF, United Kingdom',
      
      // Additional formatted fields
      customer_full_name: 'Emma Johnson',
      customer_address_full: '45 Coastal Drive, Brighton, BN1 3XY, United Kingdom',
      yacht_full_description: 'Sea Breeze (Sailboat 35ft)',
      charter_date_range: '10/08/2025 to 17/08/2025',
      charter_duration_days: '7 days',
      deposit_status_text: 'Paid',
      payment_status_text: 'pending'
    }
    
    console.log('📋 Test data prepared')
    console.log('Customer:', mockData.customer_name)
    console.log('Amount Due:', `£${mockData.amount_due}`)
    console.log('')
    
    // Test 1: Create a simple template
    console.log('🎯 Test 1: Creating simple DOCX from template string...')
    
    // Create a simple template content
    const simpleTemplate = `
Dear {customer_name},

This is your invoice for booking {booking_number}.

Yacht: {yacht_name} ({yacht_type})
Charter Dates: {start_date} to {end_date}
Duration: {charter_duration} days

Financial Summary:
- Total Amount: {total_amount}
- Deposit Paid: {deposit_amount}
- Amount Due: {amount_due}

Payment Status: {deposit_status_text}
Due Date: {balance_due_date}

Thank you for choosing {owner_name}.

Contact: {owner_email}
`
    
    // For this test, we'll just show the output
    console.log('📄 Template output would be:')
    console.log('-'.repeat(40))
    
    // Replace placeholders manually for display
    let output = simpleTemplate
    Object.entries(mockData).forEach(([key, value]) => {
      output = output.replace(new RegExp(`{${key}}`, 'g'), value)
    })
    console.log(output)
    console.log('-'.repeat(40))
    
    console.log('✅ Simple template test completed')
    console.log('')
    
    // Test 2: Test with actual DOCX file
    console.log('🎯 Test 2: Testing with actual DOCX template...')
    
    const templatesDir = '../Templates'
    const templatePath = path.join(templatesDir, 'Blank Remaining Balance invoice - Template.docx')
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template file not found:', templatePath)
      console.log('⚠️  To use DOCX templates, update your template with placeholders like:')
      console.log('   {customer_name}, {booking_number}, {amount_due}, etc.')
    } else {
      console.log('📂 Found template:', templatePath)
      
      try {
        // Read the template
        const content = fs.readFileSync(templatePath, 'binary')
        const zip = new PizZip(content)
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: { start: '{', end: '}' }
        })
        
        // Add currency symbols to amounts
        const templateData = {
          ...mockData,
          total_amount: `£${mockData.total_amount}`,
          deposit_amount: `£${mockData.deposit_amount}`,
          amount_due: `£${mockData.amount_due}`,
          previous_payments: `£${mockData.previous_payments}`,
          remaining_balance: `£${mockData.remaining_balance}`
        }
        
        // Set data
        doc.setData(templateData)
        
        // Render
        doc.render()
        
        // Generate output
        const buffer = doc.getZip().generate({
          type: 'nodebuffer',
          compression: 'DEFLATE'
        })
        
        // Save result
        const outputPath = './test-docx-generated.docx'
        fs.writeFileSync(outputPath, buffer)
        
        console.log('✅ DOCX generated successfully!')
        console.log('📁 Saved to:', outputPath)
        console.log('📏 File size:', (buffer.length / 1024).toFixed(2), 'KB')
        
      } catch (error) {
        console.log('⚠️  Template processing note:', error.message)
        if (error.properties && error.properties.errors) {
          console.log('📋 Template placeholders found:')
          error.properties.errors.forEach(err => {
            if (err.properties && err.properties.property) {
              console.log(`   - {${err.properties.property}}`)
            }
          })
        }
      }
    }
    
    console.log('')
    console.log('📚 DOCX Template Placeholder Guide:')
    console.log('=' .repeat(50))
    console.log('Update your Word template with these placeholders:')
    console.log('')
    console.log('CUSTOMER INFORMATION:')
    console.log('  {customer_name} - Full name')
    console.log('  {customer_email} - Email address')
    console.log('  {customer_phone} - Phone number')
    console.log('  {customer_full_address} - Complete address')
    console.log('')
    console.log('BOOKING DETAILS:')
    console.log('  {booking_number} - Booking reference')
    console.log('  {yacht_name} - Yacht name')
    console.log('  {yacht_type} - Yacht type/description')
    console.log('  {charter_date_range} - Full date range')
    console.log('  {charter_duration_days} - Duration with "days"')
    console.log('')
    console.log('FINANCIAL:')
    console.log('  {total_amount} - Total cost (with £)')
    console.log('  {deposit_amount} - Deposit (with £)')
    console.log('  {amount_due} - Balance due (with £)')
    console.log('  {deposit_status_text} - "Paid" or "Pending"')
    console.log('  {balance_due_date} - Payment due date')
    console.log('')
    console.log('OWNER INFO:')
    console.log('  {owner_name} - Company name')
    console.log('  {owner_email} - Contact email')
    console.log('  {owner_phone} - Contact phone')
    console.log('')
    console.log('🎉 DOCX Testing Complete!')
    console.log('=' .repeat(50))
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testDocxGeneration().catch(console.error)