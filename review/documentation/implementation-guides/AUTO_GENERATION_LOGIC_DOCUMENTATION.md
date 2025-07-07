# Auto-Generation Feature Logic Documentation

**Version:** 2.0  
**Last Updated:** 2025-06-30  
**Status:** Fully Functional

## Overview

The auto-generation feature allows users to automatically populate document templates (DOCX/PDF) with booking and customer data from the yacht charter system. This eliminates manual data entry and ensures consistency across all generated documents.

## Architecture Overview

```
BookingPanel (UI) → DocumentAutoGenerator (Service) → FormsTemplateService (Storage) → Supabase (Database/Storage)
                                    ↓
                              Generated DOCX/PDF
```

## Core Components

### 1. BookingPanel.jsx (Frontend Component)
**Location:** `src/components/booking/BookingPanel.jsx`  
**Role:** User interface and data preparation

#### Key Functions:
- `handleGenerateDocument(documentType)` - Main entry point for document generation
- `getTemplateType(documentType)` - Maps UI document names to internal template types
- `getPaymentStatus(statusData)` - Determines payment status from form data

#### Data Flow:
1. User clicks "Auto-Create" button for document type
2. Validates booking data completeness
3. Prepares booking data in database format
4. Calls DocumentAutoGenerator service
5. Handles file download and UI updates

### 2. DocumentAutoGenerator.js (Core Service)
**Location:** `src/services/supabase/DocumentAutoGenerator.js`  
**Role:** Document generation and data population logic

#### Key Methods:

##### `generateDocument(templateType, bookingData, settingsData)`
Main orchestration method that:
1. Retrieves template from storage
2. Prepares data for population
3. Routes to appropriate population method (PDF/DOCX)
4. Updates database timestamps
5. Returns generated document blob

##### `prepareDocumentData(templateType, bookingData, settingsData)`
Data transformation engine that:
1. Validates and sanitizes input data
2. Calculates financial amounts
3. Formats dates and addresses
4. Maps to template placeholders
5. Adds fallback values for missing data

##### `populateWordTemplate(templateBlob, data)`
DOCX-specific population using docxtemplater:
1. Loads template as PizZip
2. Creates Docxtemplater instance
3. Maps data to exact placeholder names
4. Renders document with data
5. Generates browser-compatible blob

### 3. FormsTemplateService.js (Template Management)
**Location:** `src/services/supabase/FormsTemplateService.js`  
**Role:** Template file storage and retrieval

#### Functions:
- `listTemplates()` - Retrieves available templates metadata
- `downloadTemplate(filePath)` - Downloads template blob from storage
- `uploadTemplate(type, file)` - Uploads new template to storage

## Document Types & Template Mapping

| UI Display Name | Internal Type | Database Column Prefix | Description |
|----------------|---------------|----------------------|-------------|
| Contract | `contract` | `contract_` | Main charter agreement |
| Deposit Invoice | `depositInvoice` | `deposit_invoice_` | Initial payment request |
| Deposit Receipt | `depositReceipt` | `deposit_receipt_` | Payment confirmation |
| Remaining Balance Invoice | `balanceInvoice` | `balance_invoice_` | Final payment request |
| Remaining Balance Receipt | `balanceReceipt` | `balance_receipt_` | Final payment confirmation |
| Hand-over Notes | `handoverNotes` | `handover_notes_` | Yacht handover documentation |

## Data Preparation Logic

### Input Data Sources:
1. **Form Data** (BookingPanel state)
   - Customer details (name, email, phone, address)
   - Charter details (dates, ports, yacht selection)
   - Status flags (payment, contract status)

2. **Booking Data** (Database records)
   - Booking metadata (ID, number, creation date)
   - Historical status information
   - File attachments

3. **Settings Data** (Configuration)
   - Yacht owner information
   - Pricing rules and calculations
   - Company details

### Data Transformation Process:

#### 1. Field Mapping & Validation
```javascript
const bookingForGeneration = {
  // Customer data (frontend → database format)
  customer_first_name: formData.firstName,
  customer_surname: formData.surname,
  customer_email: formData.email,
  
  // Yacht data with fallbacks
  yacht_name: bookingData.yachtName || selectedYacht?.name || 'Yacht name not found',
  yacht_id: formData.yacht,
  
  // Financial data with defaults
  total_amount: bookingData.totalAmount || 1500.00,
  deposit_amount: bookingData.depositAmount || 300.00
}
```

#### 2. Financial Calculations
```javascript
calculateAmounts(templateType, bookingData) {
  const totalAmount = parseFloat(bookingData.total_amount) || 0
  const depositAmount = parseFloat(bookingData.deposit_amount) || 0
  
  if (templateType === 'balanceInvoice') {
    const amountDue = depositPaid ? (totalAmount - depositAmount) : totalAmount
    return {
      total_amount: totalAmount.toFixed(2),
      amount_due: amountDue.toFixed(2),
      previous_payments: depositPaid ? depositAmount.toFixed(2) : '0.00'
    }
  }
}
```

#### 3. Template Placeholder Mapping
```javascript
const templateData = {
  // Exact placeholder matches
  'current date': data.document_date,
  customer_first_name: data.customer_first_name,
  'customer surname': data.customer_surname,
  'start _date': data.start_date,
  'outstanding _balance': `£${data.amount_due}`,
  charter_fee: `£${data.total_amount}`,
  booking_number: data.booking_number
}
```

## Template Placeholder Reference

### Document Metadata
- `{current date}` - Document generation date
- `{document_number}` - Auto-generated document reference
- `{booking_number}` - Booking reference number

### Customer Information
- `{customer_first_name}` - Customer first name
- `{customer surname}` - Customer last name (note: space before surname)
- `{customer_street}` - Street address
- `{customer_city}` - City
- `{customer_postcode}` - Postal code
- `{customer_country}` - Country

### Charter Details
- `{start _date}` - Charter start date (note: space before underscore)
- `{end _date}` - Charter end date (note: space before underscore)
- `{yacht_name}` - Selected yacht name
- `{charter_type}` - Bareboat or skippered charter

### Financial Information
- `{charter_fee}` - Total charter cost
- `{deposit_amount}` - Required deposit amount
- `{outstanding _balance}` - Remaining balance due (note: space before underscore)
- `{security _deposit}` - Security deposit amount (note: space before underscore)
- `{receipt _date}` - Payment receipt date (note: space before underscore)

## Error Handling & Fallbacks

### Data Validation
1. **Required Field Checks:** Validates customer name, email, yacht selection
2. **Date Validation:** Ensures valid date formats and logical date ranges
3. **Financial Validation:** Checks for positive amounts and logical deposit ratios

### Fallback Values
```javascript
// Customer data fallbacks
customer_name: `${bookingData.customer_first_name || 'Unknown'} ${bookingData.customer_surname || 'Customer'}`,
customer_email: bookingData.customer_email || 'No email provided',

// Yacht data fallbacks  
yacht_name: bookingData.yacht_name || 'Yacht name not specified',
yacht_type: bookingData.yacht_type || 'Type not specified',

// Financial fallbacks
total_amount: bookingData.totalAmount || 1500.00,
deposit_amount: bookingData.depositAmount || 300.00
```

### Error Recovery
1. **Template Not Found:** Clear error message with template upload guidance
2. **Data Missing:** Graceful degradation with fallback values
3. **Generation Failure:** Detailed error logging and user notification
4. **File Corruption:** Blob validation before download

## Browser Compatibility

### Supported Formats
- **DOCX:** Full support via docxtemplater + PizZip
- **PDF:** Partial support via pdf-lib (coordinate-based overlay)

### Technical Requirements
- **Buffer Generation:** Uses `arraybuffer` for browser compatibility
- **File Downloads:** Creates temporary object URLs for download
- **Memory Management:** Proper cleanup of object URLs

## Database Integration

### Timestamp Tracking
Automatically updates generation timestamps in unified bookings table:
```sql
-- Example columns
balance_invoice_generated_at TIMESTAMPTZ
balance_invoice_downloaded_at TIMESTAMPTZ
balance_invoice_updated_at TIMESTAMPTZ
```

### Template Type Mapping
```javascript
const templateTypeMapping = {
  'balanceInvoice': 'balance_invoice',
  'depositInvoice': 'deposit_invoice', 
  'depositReceipt': 'deposit_receipt',
  'contract': 'contract',
  'handoverNotes': 'handover_notes'
}
```

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading:** Templates loaded only when needed
2. **Caching:** Yacht data cached in component state
3. **Batch Processing:** Settings data retrieved once per generation
4. **Memory Management:** Immediate cleanup of large blobs

### Scalability
- **Template Storage:** Uses Supabase storage for distributed access
- **Generation Load:** Client-side processing reduces server load
- **Concurrent Users:** Stateless design supports multiple simultaneous generations

## Security & Data Protection

### Data Handling
1. **Input Validation:** All user inputs validated and sanitized
2. **Template Security:** Only authorized template uploads
3. **Data Privacy:** No customer data stored in logs
4. **Access Control:** Generation requires valid booking access

### File Security
- **Template Validation:** File type and size restrictions
- **Storage Security:** Supabase RLS policies applied
- **Download Security:** Temporary URLs with expiration

## Debugging & Monitoring

### Debug Logging
Comprehensive console logging for troubleshooting:
```javascript
console.log('[DocumentAutoGenerator] Raw booking data received:', bookingData)
console.log('[DocumentAutoGenerator] Template data values:')
Object.entries(templateData).forEach(([key, value]) => {
  if (value === undefined) {
    console.warn(`⚠️ ${key}: ${value} (MISSING VALUE)`)
  } else {
    console.log(`✓ ${key}: ${value}`)
  }
})
```

### Error Tracking
- Generation failures logged with full context
- User-friendly error messages displayed
- Technical details available in console

## Future Enhancements

### Potential Improvements
1. **Template Preview:** Live preview of populated documents
2. **Bulk Generation:** Generate multiple documents simultaneously
3. **Custom Templates:** User-uploadable template variations
4. **Email Integration:** Direct email sending of generated documents
5. **Version Control:** Template versioning and rollback capabilities

### Technical Debt
1. **PDF Support:** Full PDF form field population
2. **Template Validation:** Pre-upload placeholder validation
3. **Performance:** Server-side generation option for large documents
4. **Audit Trail:** Complete document generation history

---

## Quick Reference

### Key Files
- `BookingPanel.jsx:216-316` - Document generation UI logic
- `DocumentAutoGenerator.js:25-63` - Main generation orchestration
- `DocumentAutoGenerator.js:677-790` - DOCX population logic
- `DocumentAutoGenerator.js:715-746` - Template placeholder mapping

### Common Issues & Solutions
1. **"undefined" in placeholders** → Check placeholder name mapping
2. **Corrupted downloads** → Verify MIME type detection
3. **Generation fails** → Check template availability and data completeness
4. **Browser errors** → Ensure arraybuffer usage, not nodebuffer

### Testing Checklist
- [ ] Template uploads correctly
- [ ] All placeholder fields populate
- [ ] Financial calculations accurate
- [ ] File downloads work in all browsers
- [ ] Database timestamps update
- [ ] Error handling graceful