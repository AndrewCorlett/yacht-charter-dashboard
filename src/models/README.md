# Yacht Charter Booking System - Data Models

## Overview

This directory contains a comprehensive frontend data model system for the yacht charter booking application. The models are designed to match Supabase schema specifications while providing a robust, type-safe data layer with validation, transformation utilities, and business logic methods.

## Architecture

### Core Models (`/core/`)

#### 1. BookingModel.js
- **Primary booking entity** with full Supabase schema compatibility
- **iCS calendar integration** (RFC 5545 compliant)
- **Business logic methods** for duration calculation, status checking, etc.
- **Multiple data format conversions** (database, frontend, iCS)
- **Comprehensive validation** with detailed error reporting

**Key Features:**
- Auto-generated UUIDs and booking numbers
- Date validation and range checking
- Financial validation (deposits, totals)
- Email and phone format validation
- Status management and color coding

#### 2. CrewDetailsModel.js
- **Crew member management** with personal and professional information
- **Emergency contact handling** with validation
- **Age and experience tracking** with business rule validation
- **Passport and document management** with expiry checking

**Key Features:**
- Professional vs. guest crew distinction
- Experience level validation
- Address formatting utilities
- Emergency contact completeness validation

#### 3. CharterExperienceModel.js
- **Comprehensive charter preferences** and requirements
- **Dietary restrictions and allergy management** with severity tracking
- **Special event and celebration handling**
- **Previous charter history** with rating system
- **Dynamic request management** (add/remove special requests)

**Key Features:**
- Flexible dietary restriction handling
- Food allergy severity tracking
- Special request categorization and prioritization
- Budget range validation
- Experience level determination

#### 4. StatusTrackingModel.js
- **Complete booking workflow tracking** with 24 default status fields
- **Timestamp and note management** for each status change
- **Progress calculation** by category and overall
- **Alert and milestone systems** for important events
- **Assignment tracking** for team management

**Key Features:**
- Automated progress calculation
- Overdue field detection
- Milestone generation for completed items
- Alert management with due dates
- Cross-category progress reporting

### Validation System (`/validation/`)

#### ValidationSchemas.js
- **Model-specific validation schemas** for all four core models
- **Cross-model validation** for complex business rules
- **Utility validators** for common patterns (email, phone, dates)
- **Comprehensive error reporting** with field-specific messages
- **Booking package validation** for complete data sets

**Validation Features:**
- Email and phone format validation
- Date range and logic validation
- Financial amount validation
- Enum value validation
- Required field checking
- Cross-field dependency validation

### Utilities (`/utilities/`)

#### 1. ModelOperations.js
- **Model factory** for creating instances from different data sources
- **Data transformation** between formats (database ↔ frontend ↔ API)
- **Batch operations** for multiple models
- **Query and search utilities** with filtering, sorting, and pagination
- **Aggregation services** for statistics and reporting

**Operation Types:**
- CRUD operations with validation
- Batch processing with error handling
- Advanced querying with multiple criteria
- Statistical aggregation (count, sum, average, etc.)
- Safe update operations with rollback capability

#### 2. ICSCalendarUtils.js
- **RFC 5545 compliant iCalendar** generation and parsing
- **VEVENT creation** with proper encoding and line folding
- **Complete calendar export** with metadata
- **Alarm/reminder support** for booking notifications
- **Cross-platform compatibility** for calendar applications

**iCS Features:**
- Proper UTF-8 encoding and line folding
- VEVENT with all required properties
- VALARM for reminders
- Complete VCALENDAR structure
- Parsing and validation utilities

#### 3. BookingNumberGenerator.js
- **Multiple format support** (sequential, date-based, yacht-specific)
- **Collision detection** and automatic retry
- **Custom format engine** with token-based templates
- **Database integration support** for persistent sequences
- **Validation and parsing** of existing booking numbers

**Number Formats:**
- `BK001, BK002, BK003...` (sequential)
- `BK24001, BK24002...` (year-sequential)
- `BK2401001, BK2401002...` (year-month-sequential)
- `BK20240624001` (date-sequential)
- `SP001, DD002...` (yacht-specific)
- Custom formats with flexible templates

### Testing (`/tests/`)

#### 1. BookingModel.test.js
- **Comprehensive unit tests** covering all BookingModel functionality
- **Validation testing** with valid and invalid scenarios
- **Business logic verification** for dates, finances, and status
- **Data transformation testing** for all output formats
- **Edge case handling** for null values and extreme inputs

#### 2. MockDataGenerators.js
- **Realistic test data** for all model types
- **Scenario-based generators** for common use cases
- **Edge case and error data** for validation testing
- **Conflict scenario generation** for business rule testing
- **Performance testing data** with large datasets

## Usage Examples

### Basic Model Creation

```javascript
import { BookingModel, CrewDetailsModel } from './models'

// Create a new booking
const booking = new BookingModel({
  summary: 'Smith Family Charter',
  yacht_id: 'spectre',
  customer_name: 'John Smith',
  customer_email: 'john@example.com',
  start_datetime: '2024-07-15T10:00:00Z',
  end_datetime: '2024-07-18T16:00:00Z',
  total_value: 5000
})

// Validate the booking
if (booking.validate()) {
  console.log('Booking is valid!')
  const dbData = booking.toDatabase()
  // Save to database...
} else {
  console.log('Validation errors:', booking.getErrors())
}
```

### Using the Complete System

```javascript
import { QuickActions, ModelOperations } from './models'

// Create a complete booking package
const packageResult = QuickActions.createBookingPackage({
  booking: { /* booking data */ },
  crew: [{ /* crew member data */ }],
  experience: { /* charter experience data */ },
  status: { /* status tracking data */ }
})

if (packageResult.isValid) {
  // Convert to database format for saving
  const dbPackage = ModelOperations.Transformer.bookingPackageToDatabase(
    packageResult.package
  )
  
  // Save to database...
} else {
  console.log('Validation errors:', packageResult.validation.errors)
}
```

### Calendar Integration

```javascript
import { ICSCalendarUtils } from './models'

// Export bookings to calendar
const bookings = [booking1, booking2, booking3]
const icsFile = ICSCalendarUtils.generateICSFile(bookings, {
  calendarName: 'Yacht Charter Bookings',
  includeAlarms: true
})

// Download the calendar file
const blob = new Blob([icsFile.content], { type: icsFile.mimeType })
const url = URL.createObjectURL(blob)
// Trigger download...
```

### Search and Analytics

```javascript
import { Search, Stats } from './models'

// Search bookings
const confirmedBookings = Search.byStatus(allBookings, 'confirmed')
const specterBookings = Search.bookings(allBookings, { yacht_id: 'spectre' })
const julyBookings = Search.byDateRange(
  allBookings, 
  new Date('2024-07-01'), 
  new Date('2024-07-31')
)

// Generate statistics
const bookingStats = Stats.bookings(allBookings)
const revenueStats = Stats.revenue(confirmedBookings)
console.log('Total revenue:', revenueStats.sum)
console.log('Average booking value:', revenueStats.average)
```

## Data Flow

```
Frontend Forms → Model.fromFrontend() → Validation → Model Instance
                                                            ↓
Database ← Model.toDatabase() ← Business Logic ← Model.update()
                                                            ↓
iCS Export ← Model.toICS() ← Display Logic ← Model.toFrontend()
```

## Integration Points

### Supabase Integration
- Models provide `toDatabase()` method for direct Supabase insertion
- `fromDatabase()` static methods for loading from Supabase
- All field names match Supabase column specifications
- JSON field handling for complex data types

### Calendar Applications
- RFC 5545 compliant iCS generation
- Support for Apple Calendar, Google Calendar, Outlook
- VEVENT with all required properties
- VALARM for notifications and reminders

### Frontend Frameworks
- React-ready with `toFrontend()` format
- Form-friendly data structures
- Validation error formatting for UI display
- State management compatible

## Error Handling

The system provides comprehensive error handling at multiple levels:

1. **Field-level validation** with specific error messages
2. **Cross-field validation** for business rules
3. **Model-level validation** for complete data integrity
4. **Batch operation errors** with detailed failure reports
5. **Transformation errors** with rollback capabilities

## Performance Considerations

- **Lazy validation** - only validates when requested
- **Efficient cloning** with proper deep copy handling
- **Batch operations** to minimize individual model overhead
- **Caching strategies** for repeated transformations
- **Memory management** for large datasets

## Security Features

- **Input sanitization** for all text fields
- **SQL injection prevention** through proper data typing
- **XSS prevention** through output encoding
- **Data privacy** with optional field masking
- **Audit trail support** through timestamp tracking

## Future Enhancements

- **Real-time validation** with WebSocket support
- **Offline capability** with local storage sync
- **Multi-language support** for international clients
- **Advanced analytics** with machine learning insights
- **Mobile optimization** for tablet and phone interfaces

---

This data model system provides a robust foundation for the yacht charter booking application with comprehensive validation, flexible data transformation, and extensive business logic support.