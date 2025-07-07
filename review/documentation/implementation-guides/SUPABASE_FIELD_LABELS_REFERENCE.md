# Supabase Field Labels Reference
## Complete Dictionary of Database Field Names and Definitions

This document provides the exact field names and definitions used in the Supabase database for the Yacht Charter Dashboard. Use this reference when creating forms, templates, or integrations to ensure consistent field naming.

---

## Table of Contents
1. [Bookings Table](#bookings-table)
2. [Yachts Table](#yachts-table)
3. [Customers Table](#customers-table)
4. [Pricing Rules Table](#pricing-rules-table)
5. [Settings Table](#settings-table)
6. [Document Templates Table](#document-templates-table)
7. [Generated Documents Table](#generated-documents-table)
8. [Enumerated Types](#enumerated-types)

---

## Bookings Table
**Table Name:** `bookings`

### Core Identification Fields
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `id` | UUID | Unique booking identifier | `123e4567-e89b-12d3-a456-426614174000` |
| `booking_number` | TEXT | Human-readable booking reference | `SCP-2024-001` |
| `ical_uid` | TEXT | iCalendar unique identifier | `booking-123@seascape.com` |

### Customer Information (Embedded)
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `customer_first_name` | TEXT | Customer's first name | `John` |
| `customer_surname` | TEXT | Customer's surname/last name | `Smith` |
| `customer_email` | TEXT | Customer's email address | `john.smith@email.com` |
| `customer_phone` | TEXT | Customer's phone number | `+44 7700 900123` |
| `customer_street` | TEXT | Street address | `123 Marina View` |
| `customer_city` | TEXT | City name | `Portsmouth` |
| `customer_postcode` | TEXT | Postal/ZIP code | `PO1 2AB` |
| `customer_country` | TEXT | Country name | `United Kingdom` |

### Foreign Key References
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `yacht_id` | UUID | Reference to yachts table | `456e7890-e89b-12d3-a456-426614174001` |
| `customer_id` | UUID | Reference to customers table | `789e1234-e89b-12d3-a456-426614174002` |

### Booking Details
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `charter_type` | ENUM | Type of charter | `bareboat` or `skippered charter` |
| `start_date` | DATE | Booking start date | `2024-07-15` |
| `end_date` | DATE | Booking end date | `2024-07-22` |
| `port_of_departure` | TEXT | Departure marina/port | `Port Solent Marina` |
| `port_of_arrival` | TEXT | Return marina/port | `Port Solent Marina` |

### Status Tracking (Enums)
| Field Name | Data Type | Description | Possible Values |
|------------|-----------|-------------|-----------------|
| `booking_status` | ENUM | Overall booking status | `tentative`, `confirmed`, `completed`, `cancelled` |
| `payment_status` | ENUM | Payment progress status | `pending`, `deposit_paid`, `full_payment`, `refunded` |

### Status Flags (Booleans)
| Field Name | Data Type | Description | Default Value |
|------------|-----------|-------------|---------------|
| `booking_confirmed` | BOOLEAN | Booking confirmation status | `FALSE` |
| `deposit_paid` | BOOLEAN | Deposit payment received | `FALSE` |
| `final_payment_paid` | BOOLEAN | Full payment completed | `FALSE` |
| `contract_sent` | BOOLEAN | Contract sent to customer | `FALSE` |
| `contract_signed` | BOOLEAN | Contract signed by customer | `FALSE` |
| `deposit_invoice_sent` | BOOLEAN | Deposit invoice dispatched | `FALSE` |
| `receipt_issued` | BOOLEAN | Payment receipt provided | `FALSE` |

### Financial Information
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `base_rate` | DECIMAL(10,2) | Base weekly rate | `1250.00` |
| `total_amount` | DECIMAL(10,2) | Total booking value | `1750.00` |
| `deposit_amount` | DECIMAL(10,2) | Required deposit amount | `350.00` |
| `balance_due` | DECIMAL(10,2) | Remaining balance | `1400.00` |

### File Management
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `crew_experience_file_name` | TEXT | Original filename | `crew_experience.pdf` |
| `crew_experience_file_url` | TEXT | File storage URL | `https://storage.supabase.co/...` |
| `crew_experience_file_size` | INTEGER | File size in bytes | `2048576` |

### Document Generation Timestamps
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `contract_generated_at` | TIMESTAMP WITH TIME ZONE | Contract creation time | `2024-06-15T10:30:00Z` |
| `contract_downloaded_at` | TIMESTAMP WITH TIME ZONE | Contract download time | `2024-06-15T11:45:00Z` |
| `contract_updated_at` | TIMESTAMP WITH TIME ZONE | Contract modification time | `2024-06-16T09:15:00Z` |
| `deposit_invoice_generated_at` | TIMESTAMP WITH TIME ZONE | Invoice creation time | `2024-06-15T10:35:00Z` |
| `deposit_invoice_downloaded_at` | TIMESTAMP WITH TIME ZONE | Invoice download time | `2024-06-15T12:00:00Z` |
| `deposit_invoice_updated_at` | TIMESTAMP WITH TIME ZONE | Invoice modification time | `2024-06-16T09:20:00Z` |
| `deposit_receipt_generated_at` | TIMESTAMP WITH TIME ZONE | Receipt creation time | `2024-06-20T14:30:00Z` |
| `deposit_receipt_downloaded_at` | TIMESTAMP WITH TIME ZONE | Receipt download time | `2024-06-20T14:45:00Z` |
| `deposit_receipt_updated_at` | TIMESTAMP WITH TIME ZONE | Receipt modification time | `2024-06-20T15:00:00Z` |
| `balance_invoice_generated_at` | TIMESTAMP WITH TIME ZONE | Balance invoice creation | `2024-07-01T10:00:00Z` |
| `balance_invoice_downloaded_at` | TIMESTAMP WITH TIME ZONE | Balance invoice download | `2024-07-01T10:15:00Z` |
| `balance_invoice_updated_at` | TIMESTAMP WITH TIME ZONE | Balance invoice modification | `2024-07-01T11:00:00Z` |
| `balance_receipt_generated_at` | TIMESTAMP WITH TIME ZONE | Balance receipt creation | `2024-07-10T16:30:00Z` |
| `balance_receipt_downloaded_at` | TIMESTAMP WITH TIME ZONE | Balance receipt download | `2024-07-10T16:45:00Z` |
| `balance_receipt_updated_at` | TIMESTAMP WITH TIME ZONE | Balance receipt modification | `2024-07-10T17:00:00Z` |
| `handover_notes_generated_at` | TIMESTAMP WITH TIME ZONE | Handover notes creation | `2024-07-15T08:00:00Z` |
| `handover_notes_downloaded_at` | TIMESTAMP WITH TIME ZONE | Handover notes download | `2024-07-15T08:30:00Z` |
| `handover_notes_updated_at` | TIMESTAMP WITH TIME ZONE | Handover notes modification | `2024-07-15T09:00:00Z` |

### Additional Information
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `special_requirements` | TEXT | Customer special requests | `Wheelchair accessible dock` |
| `notes` | TEXT | Internal booking notes | `First-time charter customer` |

### Audit Fields
| Field Name | Data Type | Description | Auto-Generated |
|------------|-----------|-------------|----------------|
| `created_at` | TIMESTAMP WITH TIME ZONE | Record creation timestamp | ✅ |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last modification timestamp | ✅ |

---

## Yachts Table
**Table Name:** `yachts`

### Basic Information
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `id` | UUID | Unique yacht identifier | `456e7890-e89b-12d3-a456-426614174001` |
| `name` | TEXT | Yacht name (unique) | `Spectre` |
| `yacht_type` | TEXT | Type of yacht | `Sailing Yacht` |
| `location` | TEXT | Home port/base location | `Port Solent Marina` |
| `year_built` | INTEGER | Year of manufacture | `2018` |
| `description` | TEXT | Yacht description | `Luxury sailing yacht with...` |

### Technical Specifications
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `length_feet` | INTEGER | Overall length in feet | `45` |
| `beam_meters` | DECIMAL(5,2) | Beam width in meters | `4.25` |
| `draft_meters` | DECIMAL(5,2) | Draft depth in meters | `2.10` |
| `cabins` | INTEGER | Number of cabins | `3` |
| `berths` | INTEGER | Number of sleeping berths | `6` |
| `max_pob` | INTEGER | Maximum persons on board | `8` |

### Engine and Capacity
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `fuel_capacity_liters` | INTEGER | Fuel tank capacity | `200` |
| `water_capacity_liters` | INTEGER | Fresh water capacity | `400` |
| `engine_type` | TEXT | Engine specification | `Yanmar 40HP Diesel` |

### Insurance and Legal
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `insurance_policy_number` | TEXT | Insurance policy reference | `POL-2024-YCH-001` |
| `insurance_expiry_date` | DATE | Insurance expiration date | `2024-12-31` |

### Pricing
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `daily_rate` | DECIMAL(10,2) | Base daily charter rate | `200.00` |
| `weekly_rate` | DECIMAL(10,2) | Base weekly charter rate | `1200.00` |

### System Fields
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `is_active` | BOOLEAN | Yacht available for booking | `TRUE` |
| `specifications` | JSONB | Additional specifications | `{"wifi": true, "gps": true}` |
| `created_at` | TIMESTAMP WITH TIME ZONE | Record creation | Auto-generated |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last modification | Auto-generated |

---

## Customers Table
**Table Name:** `customers`

### Personal Information
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `id` | UUID | Unique customer identifier | `789e1234-e89b-12d3-a456-426614174002` |
| `first_name` | TEXT | Customer's first name | `Jane` |
| `surname` | TEXT | Customer's surname | `Doe` |
| `email` | TEXT | Email address (unique) | `jane.doe@email.com` |
| `phone` | TEXT | Phone number | `+44 7700 900456` |

### Address Information
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `address_line1` | TEXT | Primary address line | `456 Harbour Street` |
| `address_line2` | TEXT | Secondary address line | `Apartment 2B` |
| `city` | TEXT | City name | `Southampton` |
| `postcode` | TEXT | Postal code | `SO14 2AA` |
| `country` | TEXT | Country name | `United Kingdom` |

### System Fields
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `created_at` | TIMESTAMP WITH TIME ZONE | Record creation | Auto-generated |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last modification | Auto-generated |

---

## Pricing Rules Table
**Table Name:** `pricing_rules`

### Rule Identification
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `id` | UUID | Unique rule identifier | `abc12345-e89b-12d3-a456-426614174003` |
| `yacht_id` | UUID | Reference to yacht | `456e7890-e89b-12d3-a456-426614174001` |
| `rule_type` | TEXT | Type of pricing rule | `seasonal`, `special`, `base` |

### Pricing Details
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `rate` | DECIMAL(10,2) | Pricing rate amount | `1500.00` |
| `currency` | TEXT | Currency code | `GBP` |
| `rate_type` | TEXT | Rate calculation type | `daily`, `weekly`, `hourly` |

### Date Range
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `start_date` | DATE | Rule effective start date | `2024-06-01` |
| `end_date` | DATE | Rule effective end date | `2024-08-31` |

### Rule Configuration
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `min_hours` | INTEGER | Minimum booking duration | `24` |
| `priority` | INTEGER | Rule priority (higher = more important) | `100` |
| `is_active` | BOOLEAN | Rule currently active | `TRUE` |

### System Fields
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `created_at` | TIMESTAMP WITH TIME ZONE | Record creation | Auto-generated |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last modification | Auto-generated |

---

## Settings Table
**Table Name:** `settings`

### Setting Identification
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `id` | UUID | Unique setting identifier | `def67890-e89b-12d3-a456-426614174004` |
| `key` | TEXT | Setting key (unique) | `high_season_start` |
| `category` | TEXT | Setting category | `pricing` |

### Setting Value
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `value` | JSONB | Setting value (flexible format) | `"2024-06-01"` or `{"rate": 1500}` |

### System Fields
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `created_at` | TIMESTAMP WITH TIME ZONE | Record creation | Auto-generated |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last modification | Auto-generated |

---

## Document Templates Table
**Table Name:** `document_templates`

### Template Identification
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `id` | UUID | Unique template identifier | `ghi78901-e89b-12d3-a456-426614174005` |
| `name` | TEXT | Template name | `Charter Contract` |
| `document_type` | TEXT | Type of document | `contract`, `invoice`, `receipt` |

### Template Content
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `template_content` | TEXT | Document template markup | `<html>...` |
| `variables` | JSONB | Template variables | `["customer_name", "yacht_name"]` |

### Template Configuration
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `is_active` | BOOLEAN | Template currently active | `TRUE` |
| `version` | INTEGER | Template version number | `1` |

### System Fields
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `created_at` | TIMESTAMP WITH TIME ZONE | Record creation | Auto-generated |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last modification | Auto-generated |

---

## Generated Documents Table
**Table Name:** `generated_documents`

### Document Identification
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `id` | UUID | Unique document identifier | `jkl23456-e89b-12d3-a456-426614174006` |
| `booking_id` | UUID | Reference to booking | `123e4567-e89b-12d3-a456-426614174000` |
| `template_id` | UUID | Reference to template used | `ghi78901-e89b-12d3-a456-426614174005` |
| `document_type` | TEXT | Type of document | `contract` |

### Document Storage
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `file_name` | TEXT | Generated filename | `contract_SCP-2024-001.pdf` |
| `file_url` | TEXT | Storage URL | `https://storage.supabase.co/...` |
| `file_size` | INTEGER | File size in bytes | `1048576` |

### Document Status
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `status` | TEXT | Document status | `generated`, `sent`, `signed` |
| `download_count` | INTEGER | Number of downloads | `3` |

### Timestamps
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `generated_at` | TIMESTAMP WITH TIME ZONE | Document generation time | `2024-06-15T10:30:00Z` |
| `first_downloaded_at` | TIMESTAMP WITH TIME ZONE | First download time | `2024-06-15T11:45:00Z` |
| `last_downloaded_at` | TIMESTAMP WITH TIME ZONE | Most recent download | `2024-06-16T09:15:00Z` |

### System Fields
| Field Name | Data Type | Description | Example Value |
|------------|-----------|-------------|---------------|
| `created_at` | TIMESTAMP WITH TIME ZONE | Record creation | Auto-generated |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last modification | Auto-generated |

---

## Enumerated Types

### Charter Type Enum
**Enum Name:** `charter_type`
**Possible Values:**
- `bareboat` - Self-skippered charter
- `skippered charter` - Charter with professional skipper

### Booking Status Enum
**Enum Name:** `booking_status`
**Possible Values:**
- `tentative` - Booking inquiry or preliminary reservation
- `confirmed` - Booking confirmed by customer
- `completed` - Charter completed successfully
- `cancelled` - Booking cancelled

### Payment Status Enum
**Enum Name:** `payment_status`
**Possible Values:**
- `pending` - No payment received
- `deposit_paid` - Deposit received, balance outstanding
- `full_payment` - Full payment completed
- `refunded` - Payment refunded to customer

---

## Form Field Usage Guide

### When Creating Forms
Use these exact field names in your form inputs to ensure seamless integration:

**Example form field mapping:**
```html
<!-- Frontend form field -->
<input name="firstName" type="text" />
<!-- Maps to database field: customer_first_name -->

<input name="startDate" type="date" />
<!-- Maps to database field: start_date -->

<select name="tripType">
<!-- Maps to database field: charter_type -->
```

### Date Format Standards
- **Date fields**: Use ISO 8601 format `YYYY-MM-DD`
- **Timestamp fields**: Use ISO 8601 with timezone `YYYY-MM-DDTHH:mm:ssZ`
- **Display format**: Convert to user-friendly format in frontend

### Currency Standards
- **Decimal fields**: Always use 2 decimal places
- **Currency codes**: Use ISO 4217 codes (GBP, EUR, USD)
- **Default currency**: GBP (British Pounds)

### File Naming Standards
- **Uploaded files**: Include timestamp and booking reference
- **Generated documents**: Use format `{type}_{booking_number}.{ext}`
- **File paths**: Organize by document type in storage buckets

---

## Quick Reference Tables

### Common Field Name Patterns
| Frontend Pattern | Database Pattern | Example |
|------------------|------------------|---------|
| camelCase | snake_case | `firstName` → `customer_first_name` |
| Boolean toggles | Boolean fields | `depositPaid` → `deposit_paid` |
| Date inputs | DATE fields | `startDate` → `start_date` |
| File objects | Multiple fields | `file` → `file_name`, `file_url`, `file_size` |

### Most Frequently Used Fields
1. `customer_first_name` - Customer's first name
2. `customer_surname` - Customer's last name
3. `customer_email` - Customer's email address
4. `start_date` - Booking start date
5. `end_date` - Booking end date
6. `yacht_id` - Selected yacht reference
7. `charter_type` - Type of charter
8. `booking_status` - Current booking status
9. `payment_status` - Payment progress
10. `total_amount` - Total booking value

This reference document ensures consistent field naming across all forms, templates, and integrations in the Yacht Charter Dashboard system.