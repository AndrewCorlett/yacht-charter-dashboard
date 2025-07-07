/**
 * Document Auto-Generator Service
 * Handles automatic population of form templates with booking and settings data
 * Generates filled documents by merging booking data with blank templates
 */

import { supabase } from './supabaseClient.js'
import formsTemplateService from './FormsTemplateService.js'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

class DocumentAutoGenerator {
  constructor() {
    this.placeholderPattern = /\{\{([^}]+)\}\}/g // Pattern for {{placeholder}} syntax
  }

  /**
   * Generate auto-populated document from template
   * @param {string} templateType - Type of template (balanceInvoice, depositInvoice, etc.)
   * @param {Object} bookingData - Complete booking information
   * @param {Object} settingsData - Yacht owner and pricing information
   * @returns {Promise<Blob>} Generated filled document
   */
  async generateDocument(templateType, bookingData, settingsData) {
    try {
      console.log(`[DocumentAutoGenerator] Starting ${templateType} generation for booking ${bookingData.booking_number}`)

      // Get the template file
      const templates = await formsTemplateService.listTemplates()
      const template = templates[templateType]
      
      if (!template) {
        throw new Error(`No template found for type: ${templateType}`)
      }

      // Download the blank template
      const templateBlob = await formsTemplateService.downloadTemplate(template.filePath)
      
      // Prepare data for population
      const populationData = this.prepareDocumentData(templateType, bookingData, settingsData)
      
      // Generate filled document based on template type
      let filledDocument
      if (template.type === 'application/pdf') {
        filledDocument = await this.populatePdfTemplate(templateBlob, populationData)
      } else if (template.type.includes('wordprocessingml') || template.type.includes('msword')) {
        filledDocument = await this.populateWordTemplate(templateBlob, populationData)
      } else {
        throw new Error(`Unsupported template format: ${template.type}`)
      }

      // Update document generation timestamp
      await this.updateDocumentTimestamp(bookingData.id, templateType)

      console.log(`[DocumentAutoGenerator] Successfully generated ${templateType} document`)
      return filledDocument

    } catch (error) {
      console.error(`[DocumentAutoGenerator] Error generating ${templateType}:`, error)
      throw error
    }
  }

  /**
   * Prepare all data needed for document population
   * @param {string} templateType - Type of template being generated
   * @param {Object} bookingData - Booking information
   * @param {Object} settingsData - Settings and configuration data
   * @returns {Object} Prepared data object with all placeholders
   */
  prepareDocumentData(templateType, bookingData, settingsData) {
    console.log('[DocumentAutoGenerator] Raw booking data received:', bookingData)
    console.log('[DocumentAutoGenerator] Raw settings data received:', settingsData)
    
    const currentDate = new Date()
    
    // Calculate amounts based on template type and payment status
    const amounts = this.calculateAmounts(templateType, bookingData)
    
    // Common data structure for all document types
    const documentData = {
      // === DOCUMENT METADATA ===
      document_type: templateType,
      document_date: currentDate.toLocaleDateString('en-GB'),
      document_number: this.generateDocumentNumber(templateType, bookingData.booking_number),
      
      // === CUSTOMER INFORMATION ===
      customer_name: `${bookingData.customer_first_name || 'Unknown'} ${bookingData.customer_surname || 'Customer'}`,
      customer_first_name: bookingData.customer_first_name || 'Unknown',
      customer_surname: bookingData.customer_surname || 'Customer',
      customer_email: bookingData.customer_email || 'No email provided',
      customer_phone: bookingData.customer_phone || 'No phone provided',
      
      // Customer Address
      customer_address_line1: bookingData.customer_street || '',
      customer_address_line2: '', // Can be added to schema later
      customer_city: bookingData.customer_city || '',
      customer_postcode: bookingData.customer_postcode || '',
      customer_country: bookingData.customer_country || 'United Kingdom',
      customer_full_address: this.formatAddress(bookingData),
      
      // === YACHT INFORMATION ===
      yacht_name: bookingData.yacht_name || settingsData.yachtDetails?.name || 'Yacht name not specified',
      yacht_type: settingsData.yachtDetails?.yacht_type || bookingData.yacht_type || 'Type not specified',
      yacht_location: bookingData.yacht_location || 'Location not specified',
      max_pob: settingsData.yachtDetails?.max_pob || 'Not specified',
      
      // === CHARTER DETAILS ===
      booking_number: bookingData.booking_number || 'TEMP-BOOKING',
      charter_type: bookingData.charter_type || 'bareboat',
      start_date: bookingData.start_date ? new Date(bookingData.start_date).toLocaleDateString('en-GB') : 'Date TBD',
      end_date: bookingData.end_date ? new Date(bookingData.end_date).toLocaleDateString('en-GB') : 'Date TBD',
      charter_duration: this.calculateCharterDuration(bookingData.start_date, bookingData.end_date),
      port_of_departure: bookingData.port_of_departure || 'To be confirmed',
      port_of_arrival: bookingData.port_of_arrival || 'To be confirmed',
      
      // === FINANCIAL INFORMATION ===
      ...amounts, // Spread calculated amounts
      currency: 'GBP', // Default currency
      
      // === YACHT OWNER INFORMATION ===
      owner_name: settingsData.yachtOwner?.owner_name || 'SeaScape Yacht Charter',
      owner_email: settingsData.yachtOwner?.owner_email || 'info@seascapeyachtcharter.com',
      owner_phone: settingsData.yachtOwner?.owner_phone || 'Contact for details',
      owner_address: this.formatOwnerAddress(settingsData.yachtOwner),
      owner_address_line1: settingsData.yachtOwner?.owner_address_line1 || '',
      owner_address_line2: settingsData.yachtOwner?.owner_address_line2 || '',
      owner_city: settingsData.yachtOwner?.owner_city || '',
      owner_postcode: settingsData.yachtOwner?.owner_postcode || '',
      owner_country: settingsData.yachtOwner?.owner_country || 'United Kingdom',
      
      // === PAYMENT INFORMATION ===
      deposit_paid: bookingData.deposit_paid,
      payment_status: bookingData.payment_status,
      balance_due_date: this.calculateBalanceDueDate(bookingData.start_date),
      
      // === DOCUMENT SPECIFIC INFORMATION ===
      is_final_invoice: templateType === 'balanceInvoice',
      is_deposit_invoice: templateType === 'depositInvoice',
      payment_terms: this.getPaymentTerms(templateType),
      
      // === COMPANY INFORMATION ===
      company_name: 'SeaScape Yacht Charter',
      company_registration: 'Registration details available on request',
      company_vat: 'VAT details available on request'
    }

    console.log(`[DocumentAutoGenerator] Prepared document data for ${templateType}:`, documentData)
    return documentData
  }

  /**
   * Calculate amounts based on template type and payment status
   * Uses booking's saved charter costs instead of pricing configuration
   * @param {string} templateType - Type of template
   * @param {Object} bookingData - Booking data
   * @returns {Object} Calculated amounts
   */
  calculateAmounts(templateType, bookingData) {
    console.log('[DocumentAutoGenerator] Calculating amounts from booking data:', bookingData)
    
    // Use saved charter costs from booking data
    const totalAmount = parseFloat(bookingData.total_amount) || 0
    const depositAmount = parseFloat(bookingData.deposit_amount) || 0
    const securityDeposit = parseFloat(bookingData.security_deposit) || 0
    const depositPaid = bookingData.deposit_paid || false

    console.log('[DocumentAutoGenerator] Using amounts:', {
      totalAmount,
      depositAmount,
      securityDeposit,
      depositPaid
    })

    if (templateType === 'balanceInvoice') {
      // For balance invoice: show remaining amount if deposit paid, otherwise full amount
      const amountDue = depositPaid ? (totalAmount - depositAmount) : totalAmount
      
      return {
        total_amount: totalAmount.toFixed(2),
        deposit_amount: depositAmount.toFixed(2),
        security_deposit: securityDeposit.toFixed(2),
        amount_due: amountDue.toFixed(2),
        previous_payments: depositPaid ? depositAmount.toFixed(2) : '0.00',
        remaining_balance: amountDue.toFixed(2),
        deposit_status: depositPaid ? 'PAID' : 'PENDING'
      }
    } else if (templateType === 'depositInvoice') {
      // For deposit invoice: show deposit amount due
      return {
        total_amount: totalAmount.toFixed(2),
        deposit_amount: depositAmount.toFixed(2),
        security_deposit: securityDeposit.toFixed(2),
        amount_due: depositAmount.toFixed(2),
        remaining_balance: (totalAmount - depositAmount).toFixed(2)
      }
    }

    // Default amounts for other document types
    return {
      total_amount: totalAmount.toFixed(2),
      deposit_amount: depositAmount.toFixed(2),
      security_deposit: securityDeposit.toFixed(2),
      amount_due: totalAmount.toFixed(2)
    }
  }

  /**
   * Populate PDF template with data using pdf-lib
   * @param {Blob} templateBlob - PDF template blob
   * @param {Object} data - Data to populate
   * @returns {Promise<Blob>} Filled PDF
   */
  async populatePdfTemplate(templateBlob, data) {
    try {
      console.log('[DocumentAutoGenerator] Starting PDF population with pdf-lib')
      console.log('[DocumentAutoGenerator] Data to populate:', data)
      
      // Convert blob to array buffer
      const templateArrayBuffer = await templateBlob.arrayBuffer()
      
      // Load the template PDF
      const pdfDoc = await PDFDocument.load(templateArrayBuffer)
      
      // Get the form fields
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      
      console.log('[DocumentAutoGenerator] Available form fields:', fields.map(f => f.getName()))
      
      // If no form fields, overlay data on existing template pages
      if (fields.length === 0) {
        console.log('[DocumentAutoGenerator] No form fields found, overlaying data on template')
        return await this.overlayDataOnTemplate(pdfDoc, data)
      }
      
      // Fill out the form fields
      await this.fillPdfFormFields(form, data)
      
      // Generate the filled PDF
      const pdfBytes = await pdfDoc.save()
      
      console.log('[DocumentAutoGenerator] PDF populated successfully')
      return new Blob([pdfBytes], { type: 'application/pdf' })
      
    } catch (error) {
      console.error('[DocumentAutoGenerator] Error populating PDF:', error)
      
      // Fallback to creating new PDF with data
      try {
        const pdfDoc = await PDFDocument.create()
        const filledPdf = await this.createPdfFromTemplate(pdfDoc, data)
        console.log('[DocumentAutoGenerator] Created fallback PDF')
        return filledPdf
      } catch (fallbackError) {
        console.error('[DocumentAutoGenerator] Fallback PDF creation failed:', fallbackError)
        throw new Error(`PDF population failed: ${error.message}`)
      }
    }
  }

  /**
   * Fill PDF form fields with booking data
   * @param {PDFForm} form - PDF form object
   * @param {Object} data - Booking data
   */
  async fillPdfFormFields(form, data) {
    const fieldMappings = {
      // Customer information
      'customer_name': data.customer_name,
      'customer_first_name': data.customer_first_name,
      'customer_surname': data.customer_surname,
      'customer_email': data.customer_email,
      'customer_phone': data.customer_phone,
      'customer_address': data.customer_full_address,
      'customer_street': data.customer_address_line1,
      'customer_city': data.customer_city,
      'customer_postcode': data.customer_postcode,
      'customer_country': data.customer_country,
      
      // Document information
      'document_number': data.document_number,
      'document_date': data.document_date,
      'invoice_number': data.document_number,
      'invoice_date': data.document_date,
      'date': data.document_date,
      
      // Yacht information
      'yacht_name': data.yacht_name,
      'yacht_type': data.yacht_type,
      'yacht_location': data.yacht_location,
      
      // Charter details
      'booking_number': data.booking_number,
      'booking_reference': data.booking_number,
      'charter_type': data.charter_type,
      'start_date': data.start_date,
      'end_date': data.end_date,
      'charter_duration': data.charter_duration,
      'port_departure': data.port_of_departure,
      'port_arrival': data.port_of_arrival,
      
      // Financial information
      'total_amount': `£${data.total_amount}`,
      'deposit_amount': `£${data.deposit_amount}`,
      'security_deposit': `£${data.security_deposit}`,
      'amount_due': `£${data.amount_due}`,
      'previous_payments': data.previous_payments ? `£${data.previous_payments}` : '£0.00',
      'remaining_balance': data.remaining_balance ? `£${data.remaining_balance}` : '£0.00',
      'deposit_status': data.deposit_status,
      'payment_status': data.payment_status,
      'balance_due_date': data.balance_due_date,
      'payment_terms': data.payment_terms,
      
      // Owner information
      'owner_name': data.owner_name,
      'owner_email': data.owner_email,
      'owner_phone': data.owner_phone,
      'owner_address': data.owner_address,
      
      // Common variations
      'name': data.customer_name,
      'email': data.customer_email,
      'phone': data.customer_phone,
      'address': data.customer_full_address,
      'yacht': data.yacht_name,
      'booking': data.booking_number,
      'total': `£${data.total_amount}`,
      'deposit': `£${data.deposit_amount}`,
      'due': `£${data.amount_due}`,
      'balance': data.remaining_balance ? `£${data.remaining_balance}` : '£0.00'
    }
    
    // Fill each field
    for (const [fieldName, value] of Object.entries(fieldMappings)) {
      try {
        const field = form.getField(fieldName)
        if (field) {
          if (field.constructor.name === 'PDFTextField') {
            field.setText(String(value || ''))
          } else if (field.constructor.name === 'PDFCheckBox') {
            field.check(Boolean(value))
          }
          console.log(`[DocumentAutoGenerator] Filled field '${fieldName}' with '${value}'`)
        }
      } catch {
        // Field doesn't exist or couldn't be filled - this is normal
        console.log(`[DocumentAutoGenerator] Field '${fieldName}' not found or couldn't be filled`)
      }
    }
  }

  /**
   * Overlay booking data on existing template pages
   * @param {PDFDocument} pdfDoc - PDF document with template
   * @param {Object} data - Booking data
   * @returns {Promise<Blob>} Generated PDF with overlaid data
   */
  async overlayDataOnTemplate(pdfDoc, data) {
    try {
      console.log('[DocumentAutoGenerator] Overlaying data on template pages')
      
      // Get the first page (assuming template is on first page)
      const pages = pdfDoc.getPages()
      if (pages.length === 0) {
        throw new Error('Template PDF has no pages')
      }
      
      const page = pages[0]
      const { width, height } = page.getSize()
      
      console.log(`[DocumentAutoGenerator] Template page size: ${width} x ${height}`)
      
      // Load fonts
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      
      // Define common positions for balance invoice template
      // These coordinates are approximate and may need adjustment based on your template
      const overlayPositions = {
        // Document header area
        document_number: { x: 400, y: height - 120, size: 10 },
        document_date: { x: 400, y: height - 140, size: 10 },
        
        // Customer information (usually in upper left)
        customer_name: { x: 80, y: height - 200, size: 11, font: fontBold },
        customer_email: { x: 80, y: height - 220, size: 10 },
        customer_phone: { x: 80, y: height - 240, size: 10 },
        customer_address_line1: { x: 80, y: height - 260, size: 10 },
        customer_city_postcode: { x: 80, y: height - 280, size: 10 },
        
        // Yacht details (middle section)
        booking_number: { x: 80, y: height - 340, size: 10 },
        yacht_name: { x: 200, y: height - 340, size: 10 },
        yacht_type: { x: 350, y: height - 340, size: 10 },
        charter_dates: { x: 80, y: height - 360, size: 10 },
        charter_duration: { x: 300, y: height - 360, size: 10 },
        
        // Financial information (lower section)
        total_amount: { x: 400, y: height - 450, size: 11, font: fontBold },
        deposit_amount: { x: 400, y: height - 470, size: 10 },
        previous_payments: { x: 400, y: height - 490, size: 10 },
        amount_due: { x: 400, y: height - 520, size: 14, font: fontBold, color: rgb(0, 0, 0.7) },
        
        // Status and terms
        deposit_status: { x: 80, y: height - 550, size: 10 },
        balance_due_date: { x: 80, y: height - 570, size: 10 },
        payment_terms: { x: 80, y: height - 590, size: 9 }
      }
      
      // Overlay the data
      const overlayData = {
        document_number: data.document_number,
        document_date: data.document_date,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        customer_address_line1: data.customer_address_line1 || data.customer_street,
        customer_city_postcode: `${data.customer_city}, ${data.customer_postcode}`,
        booking_number: data.booking_number,
        yacht_name: data.yacht_name,
        yacht_type: data.yacht_type,
        charter_dates: `${data.start_date} to ${data.end_date}`,
        charter_duration: `${data.charter_duration} days`,
        total_amount: `£${data.total_amount}`,
        deposit_amount: `£${data.deposit_amount}`,
        previous_payments: data.previous_payments ? `£${data.previous_payments}` : '£0.00',
        amount_due: `£${data.amount_due}`,
        deposit_status: data.deposit_status,
        balance_due_date: data.balance_due_date,
        payment_terms: data.payment_terms
      }
      
      // Draw each piece of data at its designated position
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
          
          console.log(`[DocumentAutoGenerator] Overlaid ${key}: ${value} at (${pos.x}, ${pos.y})`)
        }
      }
      
      // Generate the filled PDF
      const pdfBytes = await pdfDoc.save()
      console.log('[DocumentAutoGenerator] Template overlay completed successfully')
      return new Blob([pdfBytes], { type: 'application/pdf' })
      
    } catch (error) {
      console.error('[DocumentAutoGenerator] Error overlaying data on template:', error)
      throw error
    }
  }

  /**
   * Create a new PDF document with the booking data
   * @param {PDFDocument} pdfDoc - PDF document
   * @param {Object} data - Booking data
   * @returns {Promise<Blob>} Generated PDF
   */
  async createPdfFromTemplate(pdfDoc, data) {
    try {
      // Add a new page
      const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
      const { height } = page.getSize()
      
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
      ].filter(line => line && line.trim())
      
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
        data.previous_payments ? `Previous Payments: £${data.previous_payments}` : null,
        '-------------------------------------------',
        `AMOUNT DUE: £${data.amount_due}`
      ].filter(line => line !== null)
      
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
      if (data.deposit_status) {
        page.drawText(`Deposit Status: ${data.deposit_status}`, {
          x: leftMargin,
          y: yPosition,
          size: 11,
          font: fontRegular
        })
        yPosition -= lineHeight
      }
      
      if (data.payment_terms) {
        page.drawText(`Payment Terms: ${data.payment_terms}`, {
          x: leftMargin,
          y: yPosition,
          size: 11,
          font: fontRegular
        })
        yPosition -= lineHeight
      }
      
      if (data.balance_due_date) {
        page.drawText(`Balance Due Date: ${data.balance_due_date}`, {
          x: leftMargin,
          y: yPosition,
          size: 11,
          font: fontRegular
        })
        yPosition -= lineHeight
      }
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
      ].filter(line => line && line.trim())
      
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
      return new Blob([pdfBytes], { type: 'application/pdf' })
      
    } catch (error) {
      console.error('[DocumentAutoGenerator] Error creating PDF from template:', error)
      throw error
    }
  }

  /**
   * Populate Word template with data using docxtemplater
   * @param {Blob} templateBlob - Word template blob
   * @param {Object} data - Data to populate
   * @returns {Promise<Blob>} Filled Word document
   */
  async populateWordTemplate(templateBlob, data) {
    try {
      console.log('[DocumentAutoGenerator] Starting DOCX template population with docxtemplater')
      console.log('[DocumentAutoGenerator] Data fields available:', Object.keys(data))
      
      // Convert blob to array buffer
      const templateArrayBuffer = await templateBlob.arrayBuffer()
      console.log('[DocumentAutoGenerator] Template blob size:', templateBlob.size, 'bytes')
      console.log('[DocumentAutoGenerator] Template array buffer size:', templateArrayBuffer.byteLength, 'bytes')
      
      // Load the docx file as binary content
      const zip = new PizZip(templateArrayBuffer, { binary: true })
      console.log('[DocumentAutoGenerator] PizZip loaded successfully')
      
      // Create docxtemplater instance with data
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{',
          end: '}'
        }
      })
      
      // Prepare data for template
      // Ensure all currency values include the £ symbol
      const templateData = {
        ...data,
        // Override currency fields to ensure £ symbol is included
        total_amount: `£${data.total_amount}`,
        deposit_amount: `£${data.deposit_amount}`,
        amount_due: `£${data.amount_due}`,
        previous_payments: data.previous_payments ? `£${data.previous_payments}` : '£0.00',
        remaining_balance: data.remaining_balance ? `£${data.remaining_balance}` : '£0.00',
        
        // === EXACT TEMPLATE PLACEHOLDER MAPPINGS ===
        // Current date placeholders
        'Current date': data.document_date,
        'current date': data.document_date,
        current_date: data.document_date,
        
        // Yacht information placeholders
        yacht_type: data.yacht_type,
        name: data.yacht_name,
        max_pob: data.max_pob,
        
        // Customer placeholders (exact matches to your template)
        customer_first_name: data.customer_first_name,
        'customer surname': data.customer_surname,
        customer_surname: data.customer_surname,
        customer_street: data.customer_address_line1 || data.customer_street,
        customer_city: data.customer_city,
        customer_postcode: data.customer_postcode,
        customer_country: data.customer_country,
        
        // Owner placeholders (exact matches to your template)
        owner_name: data.owner_name,
        owner_address_line1: data.owner_address_line1,
        ' owner_address_line2': data.owner_address_line2,
        owner_address_line2: data.owner_address_line2,
        owner_city: data.owner_city,
        owner_postcode: data.owner_postcode,
        owner_country: data.owner_country,
        
        // Date placeholders
        'start _date': data.start_date,
        start_date: data.start_date,
        'end _date': data.end_date,
        end_date: data.end_date,
        
        // Financial placeholders (exact matches to your template)
        charter_fee: `£${data.total_amount}`,
        'outstanding _balance': `£${data.amount_due}`,
        outstanding_balance: `£${data.amount_due}`,
        'security _deposit': `£${data.security_deposit}`,
        booking_number: data.booking_number,
        'receipt _date': data.document_date,
        receipt_date: data.document_date,
        
        // Add some convenient combined fields
        customer_full_name: data.customer_name,
        customer_address_full: data.customer_full_address,
        yacht_full_description: `${data.yacht_name} (${data.yacht_type})`,
        charter_date_range: `${data.start_date} to ${data.end_date}`,
        charter_duration_days: `${data.charter_duration} days`,
        
        // Add formatted versions
        document_date_formatted: data.document_date,
        balance_due_date_formatted: data.balance_due_date,
        
        // Owner information formatted
        owner_contact: `${data.owner_email} | ${data.owner_phone}`,
        
        // Status fields
        deposit_status_text: data.deposit_status === 'PAID' ? 'Paid' : 'Pending',
        payment_status_text: data.payment_status
      }
      
      console.log('[DocumentAutoGenerator] Setting template data with fields:', Object.keys(templateData).length)
      console.log('[DocumentAutoGenerator] Template data values:')
      Object.entries(templateData).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          console.warn(`  ⚠️  ${key}: ${value} (MISSING VALUE)`)
        } else {
          console.log(`  ✓ ${key}: ${value}`)
        }
      })
      
      // Set data and render the document
      doc.setData(templateData)
      doc.render()
      
      // Get the generated document as array buffer (browser-compatible)
      const buffer = doc.getZip().generate({
        type: 'arraybuffer',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        },
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      console.log('[DocumentAutoGenerator] DOCX template populated successfully')
      console.log('[DocumentAutoGenerator] Generated buffer size:', buffer.byteLength, 'bytes')
      console.log('[DocumentAutoGenerator] Buffer type:', typeof buffer)
      console.log('[DocumentAutoGenerator] Buffer constructor:', buffer.constructor.name)
      
      // Validate buffer before creating blob
      if (!buffer || buffer.byteLength === 0) {
        throw new Error('Generated buffer is empty or invalid')
      }
      
      // Return as blob with correct MIME type
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
      
      console.log('[DocumentAutoGenerator] Created blob size:', blob.size, 'bytes')
      console.log('[DocumentAutoGenerator] Blob type:', blob.type)
      
      return blob
      
    } catch (error) {
      console.error('[DocumentAutoGenerator] Error populating DOCX template:', error)
      
      // If template has syntax errors, provide helpful message
      if (error.properties && error.properties.errors) {
        console.error('[DocumentAutoGenerator] Template errors:')
        error.properties.errors.forEach(err => {
          console.error(`  - ${err.message}`)
          console.error(`    Property: ${err.properties.property}`)
          console.error(`    Scope: ${err.properties.scope}`)
        })
      }
      
      throw new Error(`DOCX template population failed: ${error.message}`)
    }
  }

  /**
   * Update document generation timestamp in database
   * @param {string} bookingId - Booking ID
   * @param {string} templateType - Template type
   */
  async updateDocumentTimestamp(bookingId, templateType) {
    // Map template types to correct database column names
    const templateTypeMapping = {
      'balanceInvoice': 'balance_invoice',
      'depositInvoice': 'deposit_invoice',
      'depositReceipt': 'deposit_receipt',
      'contract': 'contract',
      'initialTerms': 'initial_terms',
      'handoverNotes': 'handover_notes'
    }
    
    const dbColumnName = templateTypeMapping[templateType] || templateType.toLowerCase()
    const timestampField = `${dbColumnName}_generated_at`
    const updateData = {
      [timestampField]: new Date().toISOString()
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (error) {
        console.error(`[DocumentAutoGenerator] Error updating timestamp:`, error)
      } else {
        console.log(`[DocumentAutoGenerator] Updated ${timestampField} for booking ${bookingId}`)
      }
    } catch (error) {
      console.error(`[DocumentAutoGenerator] Database update error:`, error)
    }
  }

  /**
   * Generate document number based on type and booking
   * @param {string} templateType - Template type
   * @param {string} bookingNumber - Booking number
   * @returns {string} Document number
   */
  generateDocumentNumber(templateType, bookingNumber) {
    const prefix = templateType === 'balanceInvoice' ? 'BAL' : 
                   templateType === 'depositInvoice' ? 'DEP' : 'DOC'
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return `${prefix}-${bookingNumber}-${timestamp}`
  }

  /**
   * Format customer address
   * @param {Object} bookingData - Booking data
   * @returns {string} Formatted address
   */
  formatAddress(bookingData) {
    const parts = [
      bookingData.customer_street,
      bookingData.customer_city,
      bookingData.customer_postcode,
      bookingData.customer_country
    ].filter(part => part && part.trim() !== '')
    
    return parts.length > 0 ? parts.join(', ') : 'Address not provided'
  }

  /**
   * Format yacht owner address
   * @param {Object} ownerData - Owner data
   * @returns {string} Formatted owner address
   */
  formatOwnerAddress(ownerData) {
    if (!ownerData) return 'Address available on request'
    
    const parts = [
      ownerData.owner_address_line1,
      ownerData.owner_address_line2,
      ownerData.owner_city,
      ownerData.owner_postcode,
      ownerData.owner_country
    ].filter(part => part && part.trim() !== '')
    
    return parts.length > 0 ? parts.join(', ') : 'Address available on request'
  }

  /**
   * Calculate charter duration in days
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {number} Duration in days
   */
  calculateCharterDuration(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  /**
   * Calculate balance due date (typically 30 days before charter start)
   * @param {string} startDate - Charter start date
   * @returns {string} Balance due date
   */
  calculateBalanceDueDate(startDate) {
    const start = new Date(startDate)
    const dueDate = new Date(start)
    dueDate.setDate(start.getDate() - 30) // 30 days before charter
    return dueDate.toLocaleDateString('en-GB')
  }

  /**
   * Get payment terms based on document type
   * @param {string} templateType - Template type
   * @returns {string} Payment terms
   */
  getPaymentTerms(templateType) {
    if (templateType === 'balanceInvoice') {
      return 'Payment due 30 days before charter commencement date'
    } else if (templateType === 'depositInvoice') {
      return 'Deposit payment due within 7 days of booking confirmation'
    }
    return 'Payment terms as per charter agreement'
  }

  /**
   * Get yacht owner details from settings
   * @param {string} yachtId - Yacht ID
   * @returns {Promise<Object>} Owner details
   */
  async getYachtOwnerDetails(yachtId) {
    try {
      console.log('[DocumentAutoGenerator] Fetching yacht owner details for yacht:', yachtId)
      
      const { data, error } = await supabase
        .from('yacht_owner_details')
        .select('*')
        .eq('yacht_id', yachtId)
        .single()

      if (error) {
        console.warn('[DocumentAutoGenerator] No owner details found for yacht:', yachtId, error)
        // Return default owner details if none found
        return {
          owner_name: 'Yacht Owner',
          owner_email: 'owner@seascape.com',
          owner_phone: '+44 1234 567890',
          owner_address_line1: 'Yacht Marina',
          owner_address_line2: '',
          owner_city: 'Coastal City',
          owner_postcode: '',
          owner_country: 'United Kingdom'
        }
      }

      console.log('[DocumentAutoGenerator] Found owner details:', data)
      return data
    } catch (error) {
      console.error('[DocumentAutoGenerator] Error fetching owner details:', error)
      // Return default owner details on error
      return {
        owner_name: 'Yacht Owner',
        owner_email: 'owner@seascape.com',
        owner_phone: '+44 1234 567890',
        owner_address_line1: 'Yacht Marina',
        owner_address_line2: '',
        owner_city: 'Coastal City',
        owner_postcode: '',
        owner_country: 'United Kingdom'
      }
    }
  }

  /**
   * Get pricing information for yacht
   * @param {string} yachtId - Yacht ID
   * @returns {Promise<Object>} Pricing details
   */
  async getYachtPricing(yachtId) {
    try {
      const { data, error } = await supabase
        .from('yacht_charter_costs')
        .select('*')
        .eq('yacht_id', yachtId)

      if (error) {
        console.warn('[DocumentAutoGenerator] No pricing details found for yacht:', yachtId)
        return null
      }

      return data
    } catch (error) {
      console.error('[DocumentAutoGenerator] Error fetching pricing details:', error)
      return null
    }
  }

  /**
   * Get yacht details from yachts table
   * @param {string} yachtId - Yacht ID
   * @returns {Promise<Object>} Yacht details
   */
  async getYachtDetails(yachtId) {
    try {
      console.log('[DocumentAutoGenerator] Fetching yacht details for yacht:', yachtId)
      
      const { data, error } = await supabase
        .from('yachts')
        .select('yacht_type, max_pob, name')
        .eq('id', yachtId)
        .single()

      if (error) {
        console.warn('[DocumentAutoGenerator] No yacht details found for yacht:', yachtId, error)
        return {
          yacht_type: 'Type unknown',
          max_pob: null,
          name: 'Unknown'
        }
      }

      console.log('[DocumentAutoGenerator] Found yacht details:', data)
      return data
    } catch (error) {
      console.error('[DocumentAutoGenerator] Error fetching yacht details:', error)
      return {
        yacht_type: 'Type unknown',
        max_pob: null,
        name: 'Unknown'
      }
    }
  }

  /**
   * Get complete settings data for document generation
   * @param {string} yachtId - Yacht ID
   * @returns {Promise<Object>} Complete settings data
   */
  async getSettingsData(yachtId) {
    const [yachtOwner, pricing, yachtDetails] = await Promise.all([
      this.getYachtOwnerDetails(yachtId),
      this.getYachtPricing(yachtId),
      this.getYachtDetails(yachtId)
    ])

    return {
      yachtOwner,
      pricing,
      yachtDetails
    }
  }
}

// Create singleton instance
const documentAutoGenerator = new DocumentAutoGenerator()

export default documentAutoGenerator
export { DocumentAutoGenerator }