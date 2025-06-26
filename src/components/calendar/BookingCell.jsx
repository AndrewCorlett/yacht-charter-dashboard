/**
 * Booking Cell Component
 * 
 * Purpose: Individual calendar cell displaying booking information
 * 
 * Design Decisions:
 * - Three visual states: available (white), booked (green), unavailable (red)
 * - Shows + icon on hover for available cells
 * - Displays customer info for booked cells
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { useState, memo, useMemo } from 'react'
import { BookingConflictService } from '../../services/BookingConflictService'

const BookingCell = memo(function BookingCell({ 
  date, 
  yachtId, 
  booking, 
  allBookings = [], 
  onClick, 
  onDragStart,
  onDragOver,
  onDrop,
  tabIndex = 0 
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Calculate availability status for this cell
  const availability = useMemo(() => {
    if (!date || !yachtId) return { status: 'available', isAvailable: true }
    
    const dateObj = date instanceof Date ? date : new Date(date)
    return BookingConflictService.getDateAvailability(dateObj, yachtId, allBookings)
  }, [date, yachtId, allBookings])

  const getCellStyles = () => {
    // Use availability status for styling
    switch (availability.status) {
      case 'confirmed':
        return 'bg-ios-green/20 hover:bg-ios-green/30 border-ios-green/20'
      case 'pending':
        return 'bg-ios-orange/20 hover:bg-ios-orange/30 border-ios-orange/20'
      case 'blocked':
        return 'bg-ios-gray-3/50 hover:bg-ios-gray-3/70 border-ios-gray-3 cursor-not-allowed'
      case 'maintenance':
        return 'bg-ios-pink/20 hover:bg-ios-pink/30 border-ios-pink/20'
      case 'owner':
        return 'bg-ios-purple/20 hover:bg-ios-purple/30 border-ios-purple/20'
      case 'available':
      default:
        return 'bg-ios-bg-primary hover:bg-ios-gray-1'
    }
  }

  // Get status indicator for the cell
  const getStatusIndicator = () => {
    if (availability.isTransitionDay) {
      return (
        <div className="absolute top-0.5 right-0.5">
          <div className="w-2 h-2 rounded-full bg-ios-orange animate-pulse" title="Transition day"></div>
        </div>
      )
    }
    return null
  }

  const handleClick = () => {
    // Don't allow clicks on blocked periods
    if (availability.status === 'blocked' && !booking) return
    
    onClick({ 
      date, 
      yachtId, 
      booking: availability.booking || booking,
      availability 
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick({ date, yachtId, booking: availability.booking || booking, availability })
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e) => {
    if (!booking && !availability.booking) return
    
    const dragBooking = availability.booking || booking
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({
      booking: dragBooking,
      sourceDate: date,
      sourceYacht: yachtId
    }))
    
    if (onDragStart) {
      onDragStart({ booking: dragBooking, date, yachtId })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
    
    // Only allow drop if cell is available
    if (availability.isAvailable) {
      e.dataTransfer.dropEffect = 'move'
    } else {
      e.dataTransfer.dropEffect = 'none'
    }
    
    if (onDragOver) {
      onDragOver({ date, yachtId, availability })
    }
  }

  const handleDragLeave = (e) => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    // Only allow drop if cell is available
    if (!availability.isAvailable) {
      return
    }
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'))
      
      if (onDrop) {
        onDrop({
          dragData,
          targetDate: date,
          targetYacht: yachtId,
          availability
        })
      }
    } catch (error) {
      console.error('Invalid drag data:', error)
    }
  }

  return (
    <div
      data-testid="booking-cell"
      data-yacht-id={yachtId}
      data-date={date instanceof Date ? date.toISOString().split('T')[0] : date}
      data-booking-id={booking?.id || availability.booking?.id || ''}
      draggable={!!(booking || availability.booking)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-b border-r calendar-grid-border p-2 transition-all duration-200 relative ${
        getCellStyles()
      } ${
        isFocused ? 'ring-2 ring-ios-blue ring-inset z-10' : ''
      } ${
        isDragOver && availability.isAvailable ? 'ring-2 ring-green-400 bg-green-50' : ''
      } ${
        isDragOver && !availability.isAvailable ? 'ring-2 ring-red-400 bg-red-50' : ''
      } ${
        availability.status === 'blocked' ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{ 
        height: '60px',
        fontFamily: 'var(--font-family-ios)'
      }}
      tabIndex={tabIndex}
      role="button"
      aria-label={
        availability.booking 
          ? `${availability.booking.customer_name || availability.booking.customerName} - ${availability.status}` 
          : `${availability.status === 'available' ? 'Available' : availability.status} slot for ${yachtId} on ${date}`
      }
    >
      {getStatusIndicator()}
      
      {/* Drag overlay when dragging over */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 rounded">
          {availability.isAvailable ? (
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      )}
      
      {availability.booking || booking ? (
        <div className="text-xs overflow-hidden">
          <div className="font-medium truncate flex items-center" 
               title={(availability.booking || booking).customer_name || (availability.booking || booking).customerName} 
               style={{ color: 'var(--color-ios-text-primary)' }}>
            {(availability.booking || booking).customer_name || (availability.booking || booking).customerName}
            {(booking || availability.booking) && (
              <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Draggable">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            )}
          </div>
          {((availability.booking || booking).booking_no || (availability.booking || booking).customerNo) && (
            <div className="text-xs mt-0.5 truncate" 
                 title={`${(availability.booking || booking).booking_no || (availability.booking || booking).customerNo} • ${(availability.booking || booking).trip_no || (availability.booking || booking).tripNo || 'N/A'}`} 
                 style={{ color: 'var(--color-ios-text-tertiary)' }}>
              {(availability.booking || booking).booking_no || (availability.booking || booking).customerNo} • {(availability.booking || booking).trip_no || (availability.booking || booking).tripNo || 'N/A'}
            </div>
          )}
        </div>
      ) : (
        availability.status === 'available' && isHovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(74, 158, 255, 0.1)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-ios-blue)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        )
      )}
    </div>
  )
})

export default BookingCell