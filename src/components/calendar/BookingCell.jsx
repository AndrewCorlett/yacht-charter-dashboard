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

import { useState, memo } from 'react'

const BookingCell = memo(function BookingCell({ date, yachtId, booking, onClick, tabIndex = 0 }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const getCellStyles = () => {
    if (booking) {
      if (booking.status === 'confirmed') {
        return 'bg-ios-green/20 hover:bg-ios-green/30 border-ios-green/20'
      }
      if (booking.customerName === 'Cardiff') {
        return 'bg-ios-pink/20 hover:bg-ios-pink/30 border-ios-pink/20'
      }
      return 'bg-ios-red/20 hover:bg-ios-red/30 border-ios-red/20'
    }
    return 'bg-ios-bg-primary hover:bg-ios-gray-1'
  }

  const handleClick = () => {
    onClick({ date, yachtId, booking })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick({ date, yachtId, booking })
    }
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`border-b border-r calendar-grid-border p-2 cursor-pointer transition-all duration-200 relative ${getCellStyles()} ${
        isFocused ? 'ring-2 ring-ios-blue ring-inset z-10' : ''
      }`}
      style={{ 
        height: '60px',
        fontFamily: 'var(--font-family-ios)'
      }}
      tabIndex={tabIndex}
      role="button"
      aria-label={booking ? `${booking.customerName} booking` : `Available slot for ${yachtId} on ${date}`}
    >
      {booking ? (
        <div className="text-xs overflow-hidden">
          <div className="font-medium truncate" title={booking.customerName} style={{ color: 'var(--color-ios-text-primary)' }}>
            {booking.customerName}
          </div>
          <div className="text-xs mt-0.5 truncate" title={`${booking.customerNo} • ${booking.tripNo}`} style={{ color: 'var(--color-ios-text-tertiary)' }}>
            {booking.customerNo} • {booking.tripNo}
          </div>
        </div>
      ) : (
        isHovered && (
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