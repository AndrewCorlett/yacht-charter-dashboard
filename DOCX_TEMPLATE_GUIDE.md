# DOCX Template Guide

## Overview

The system now supports DOCX template population using placeholders. Simply create your Word document with placeholder tags like `{customer_name}` and the system will automatically replace them with actual booking data.

## How It Works

1. Create your Word template with placeholders in curly braces: `{placeholder_name}`
2. Upload the template via Settings > Forms Management
3. When generating documents, the system replaces all placeholders with real data
4. The formatting, styles, and layout of your template are preserved

## Available Placeholders

### Customer Information
- `{customer_name}` - Full customer name
- `{customer_first_name}` - First name only
- `{customer_surname}` - Surname only
- `{customer_email}` - Email address
- `{customer_phone}` - Phone number
- `{customer_street}` - Street address
- `{customer_city}` - City
- `{customer_postcode}` - Postcode
- `{customer_country}` - Country
- `{customer_full_address}` - Complete formatted address
- `{customer_address_full}` - Same as above (alias)

### Document Information
- `{document_type}` - Type of document (e.g., "Remaining Balance Invoice")
- `{document_number}` - Unique document number
- `{document_date}` - Document generation date
- `{document_date_formatted}` - Same as above

### Booking Details
- `{booking_number}` - Booking reference number
- `{yacht_name}` - Name of the yacht
- `{yacht_type}` - Type/description of yacht
- `{yacht_location}` - Base location
- `{yacht_full_description}` - Combined yacht name and type
- `{charter_type}` - Type of charter (bareboat, skippered, etc.)
- `{start_date}` - Charter start date
- `{end_date}` - Charter end date
- `{charter_date_range}` - Full date range text
- `{charter_duration}` - Number of days
- `{charter_duration_days}` - Duration with "days" text
- `{port_of_departure}` - Departure port
- `{port_of_arrival}` - Arrival port

### Financial Information
All amounts include the £ symbol automatically:
- `{total_amount}` - Total charter cost
- `{deposit_amount}` - Deposit amount
- `{amount_due}` - Current amount due
- `{previous_payments}` - Payments already made
- `{remaining_balance}` - Balance remaining
- `{deposit_status}` - Raw status (PAID/PENDING)
- `{deposit_status_text}` - Formatted status (Paid/Pending)
- `{payment_status}` - Overall payment status
- `{payment_status_text}` - Formatted payment status
- `{payment_terms}` - Payment terms text
- `{balance_due_date}` - Due date for balance
- `{balance_due_date_formatted}` - Same as above

### Owner/Company Information
- `{owner_name}` - Company/owner name
- `{owner_email}` - Company email
- `{owner_phone}` - Company phone
- `{owner_address}` - Company address
- `{owner_contact}` - Combined email and phone

## Example Template

```
                    INVOICE

Invoice Number: {document_number}
Date: {document_date}

BILL TO:
{customer_name}
{customer_street}
{customer_city}, {customer_postcode}
{customer_country}

Email: {customer_email}
Phone: {customer_phone}

CHARTER DETAILS:
Booking Reference: {booking_number}
Yacht: {yacht_full_description}
Dates: {charter_date_range}
Duration: {charter_duration_days}

AMOUNT DUE: {amount_due}

Total Charter Cost: {total_amount}
Deposit Paid: {deposit_amount}
Previous Payments: {previous_payments}
-----------------------------------
Balance Due: {amount_due}

Payment Due Date: {balance_due_date}
Status: {deposit_status_text}

{payment_terms}

Please remit payment to:
{owner_name}
{owner_email}
{owner_phone}
```

## Tips

1. **Test Your Template**: Upload a test template and generate a document to ensure all placeholders are working correctly

2. **Formatting**: All text formatting (bold, italic, colors, fonts) in your template will be preserved

3. **Tables**: You can use placeholders within tables - they work just like regular text

4. **Missing Data**: If a field is empty, the placeholder will be replaced with an empty string

5. **Currency**: All financial amounts automatically include the £ symbol - no need to add it in your template

## Troubleshooting

### Common Issues

1. **Placeholder Not Replaced**: Ensure the placeholder name exactly matches the list above (case-sensitive)

2. **Formatting Issues**: Make sure placeholders are not split across formatting changes. Keep the entire `{placeholder}` in the same format

3. **Special Characters**: Avoid using special characters inside placeholder names

### Error Messages

If you see template errors in the console, they usually indicate:
- Misspelled placeholder names
- Unclosed braces `{}`
- Placeholders split across formatting

## Migration from PDF

If you're switching from PDF templates:
1. Open your existing Word template
2. Replace static text with appropriate placeholders
3. Save and upload the updated template
4. Test with a sample booking to verify

The DOCX approach provides much cleaner output than PDF overlays and is easier to maintain!