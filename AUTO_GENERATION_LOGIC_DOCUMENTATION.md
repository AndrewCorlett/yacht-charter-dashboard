# Yacht Charter Document Auto-Generation Logic Documentation

## Overview
This document outlines the comprehensive logic flow for automatically generating yacht charter documents with integrated pricing data from the yacht pricing configuration system.

## System Architecture

### Core Components
1. **DocumentAutoGenerator.js** - Main service for document generation
2. **FormsTemplateService.js** - Template management and storage interface
3. **YachtPricingConfigService.js** - Pricing calculation and lookup
4. **CharterCostSection.jsx** - UI component with reset functionality

### Document Generation Flow

```
User Request → Template Selection → Data Collection → Price Calculation → Document Generation → Download
```

## Implementation Details

### 1. Template Management
- Templates stored in Supabase Storage bucket 'forms-templates'
- Support for both PDF and DOCX formats
- Fallback system for missing templates
- Template validation and error handling

### 2. Pricing Integration
- Real-time pricing lookup from yacht_pricing_config table
- Seasonal rate calculation (high/low season)
- Manual override capability with reset functionality
- Fallback to legacy pricing rules system

### 3. Document Processing
- PDF generation using pdf-lib for template overlays
- DOCX generation using docx library for structured documents
- Dynamic field replacement with booking and pricing data
- Error handling for malformed templates

### 4. Data Flow
```javascript
Booking Data + Yacht ID → Pricing Lookup → Cost Calculation → Template Processing → Generated Document
```

## Reset Functionality

### CharterCostSection Reset Logic
1. **Always-visible reset button** in component header
2. **Smart state indicators** showing override status
3. **Real-time pricing refresh** from configuration
4. **Visual feedback** with "Modified" badges
5. **Dual reset buttons** for better UX
6. **Robust error handling** with fallback systems

### Reset Process
```javascript
User clicks reset → Fetch yacht ID → Calculate fresh pricing → Update costs → Clear overrides → Show feedback
```

## Error Handling

### Database Errors
- Graceful handling of missing tables/functions
- Fallback to default calculations
- User-friendly error messages
- Logging for debugging

### Template Errors
- Template not found fallback
- Malformed template handling
- Generation failure recovery
- Alternative format suggestions

## Future Enhancements

1. **Batch Document Generation** - Generate multiple documents at once
2. **Custom Template Editor** - In-app template customization
3. **Advanced Pricing Rules** - Complex pricing calculations
4. **Document Versioning** - Track document changes over time
5. **Email Integration** - Automatic document sending

## Configuration

### Environment Variables
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### Required Tables
- yacht_pricing_config
- yachts
- bookings
- customer_details

### Required Storage Buckets
- forms-templates

## Testing

Comprehensive test files included:
- test-auto-generator.js
- test-complete-workflow.js
- test-pricing-integration.js
- test-docx-generation.js
- test-pdf-generation.js

## Deployment Notes

1. Ensure all database tables are created
2. Upload default templates to storage
3. Configure RLS policies
4. Test pricing calculation functions
5. Verify document generation workflow

This system provides a robust, scalable foundation for yacht charter document management with integrated pricing functionality.
