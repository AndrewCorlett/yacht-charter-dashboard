# Unified Data Architecture

## Overview

The yacht charter dashboard now uses a centralized data management system where all components (SIT REP, Calendar, Bookings) pull from the same data source. This ensures consistency and real-time updates across the entire application.

## Architecture Components

### 1. **Unified Data Service** (`/src/services/UnifiedDataService.js`)
- **Central data store** for all charter/booking information
- **Single source of truth** preventing data inconsistencies
- **Automatic data transformation** between Charter and Booking formats
- **Real-time event emission** for cross-component updates
- **Mock data integration** from `/src/data/mockData.js`

### 2. **Data Hook** (`/src/hooks/useUnifiedData.js`)
- **React hook** for easy component integration
- **Automatic subscriptions** to data changes
- **Query helpers** for common data operations
- **Error handling** and loading states
- **Auto-refresh** capabilities with configurable intervals

### 3. **Enhanced Booking Context** (`/src/contexts/BookingContext.jsx`)
- **Dual integration** with both UnifiedDataService and legacy BookingStateManager
- **Backwards compatibility** with existing booking components
- **Real-time synchronization** between data sources
- **Optimistic updates** for calendar interactions

### 4. **Updated Charter Service** (`/src/utils/charterService.js`)
- **Redirected to unified service** instead of direct mock data
- **Maintains same API** for backwards compatibility
- **Network simulation** for realistic user experience

## Data Flow

```
Mock Data (/src/data/mockData.js)
    ↓
Unified Data Service
    ↓ (automatically transforms)
    ├── Charter Format (for SIT REP)
    └── Booking Format (for Calendar & Bookings)
    ↓ (real-time events)
    ├── SIT REP Widget (useUnifiedData)
    ├── Calendar Component (BookingContext)
    └── Booking Pages (BookingContext)
```

## Key Benefits

### ✅ **Single Source of Truth**
- All components read from the same data store
- No data duplication or synchronization issues
- Consistent yacht names, dates, and colors everywhere

### ✅ **Real-Time Updates**
- Change yacht name in one place → updates everywhere instantly
- Modify booking status → SIT REP color changes automatically
- Add/remove charters → all views update immediately

### ✅ **Data Consistency**
- **SIT REP** shows: Spectre, Disk Drive, Melba, Swansea
- **Calendar** shows: Same yachts with same dates/colors
- **Bookings** shows: Same data in booking format

### ✅ **Automatic Transformation**
- Charter format (for SIT REP): `{ yachtName, startDate, status, calendarColor }`
- Booking format (for Calendar): `{ yacht_name, start_datetime, booking_number, customer_name }`
- No manual synchronization required

## Usage Examples

### SIT REP Widget
```jsx
// Uses unified data automatically
const SitRepSection = () => {
  const { getActiveCharters, getUpcomingCharters } = useUnifiedData()
  
  const activeCharters = getActiveCharters()      // Spectre, Disk Drive
  const upcomingCharters = getUpcomingCharters()  // Melba, Swansea
  
  return <CharterCards charters={activeCharters} />
}
```

### Calendar Component
```jsx
// Uses booking context (connected to unified service)
const Calendar = () => {
  const { bookings } = useBookings() // Auto-synced with unified service
  
  return <CalendarGrid bookings={bookings} />
}
```

### Booking Management
```jsx
// Both read from and update the same data source
const BookingManager = () => {
  const { updateBooking } = useUnifiedData()
  
  const handleStatusChange = (id, newStatus) => {
    updateBooking(id, { payment_status: newStatus })
    // SIT REP color automatically updates!
  }
}
```

## Making Changes

### To Update Mock Data
1. **Edit** `/src/data/mockData.js`
2. **Changes automatically propagate** to all components
3. **No additional steps required**

### To Add New Charter
```javascript
import unifiedDataService from './services/UnifiedDataService'

// Add via charter format (simpler)
unifiedDataService.addCharter({
  id: "c5",
  yachtName: "New Yacht",
  startDate: "2025-08-01T10:00:00.000Z",
  endDate: "2025-08-08T16:00:00.000Z",
  status: "upcoming",
  calendarColor: "#8B5CF6"
})

// Automatically appears in SIT REP, Calendar, and Bookings!
```

### To Modify Existing Data
```javascript
// Update yacht name everywhere at once
unifiedDataService.updateCharter("c1", {
  yachtName: "Spectre Renamed"
})

// Or update via booking format
unifiedDataService.updateBooking("c1", {
  yacht_name: "Spectre Renamed",
  payment_status: "full-paid"
})
```

## Migration Status

### ✅ **Completed**
- SIT REP Widget → Now uses `useUnifiedData()`
- Charter Service → Redirected to unified service
- Booking Context → Integrated with unified service
- Mock Data → Centralized in `/src/data/mockData.js`

### 🔄 **Next Steps** (if needed)
- Calendar Component → Already connected via BookingContext
- Booking Forms → Already connected via BookingContext
- Admin Pages → Will inherit from BookingContext

## File Locations

```
src/
├── data/
│   └── mockData.js                    # Central mock data
├── services/
│   └── UnifiedDataService.js          # Core data service
├── hooks/
│   └── useUnifiedData.js              # React hook
├── contexts/
│   └── BookingContext.jsx             # Enhanced context
├── utils/
│   └── charterService.js              # Updated service
└── components/
    └── dashboard/
        └── SitRepSection.jsx          # Updated component
```

## Summary

The unified data architecture ensures that when you change yacht information in one place (like the mock data), it automatically updates across all components:

- **SIT REP** shows correct yacht names and colors
- **Calendar** displays same yachts with consistent dates
- **Booking pages** show synchronized booking information
- **Real-time updates** propagate changes instantly

This eliminates data synchronization issues and provides a robust foundation for the yacht charter dashboard. 🚤