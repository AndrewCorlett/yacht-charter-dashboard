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
        return 'bg-green-200 hover:bg-green-300'
      }
      if (booking.customerName === 'Cardiff') {
        return 'bg-pink-300 hover:bg-pink-400'
      }
      return 'bg-red-200 hover:bg-red-300'
    }
    return 'bg-white hover:bg-gray-50'
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
      className={`border-b border-r border-gray-300 p-2 cursor-pointer transition-colors relative ${getCellStyles()} ${
        isFocused ? 'ring-2 ring-blue-500 ring-inset z-10' : ''
      }`}
      style={{ height: '60px' }}
      tabIndex={tabIndex}
      role="button"
      aria-label={booking ? `${booking.customerName} booking` : `Available slot for ${yachtId} on ${date}`}
    >
      {booking ? (
        <div className="text-xs overflow-hidden">
          <div className="font-bold text-gray-800 truncate" title={booking.customerName}>
            {booking.customerName}
          </div>
          <div className="text-gray-600 text-xs mt-0.5 truncate" title={`${booking.customerNo} • ${booking.tripNo}`}>
            {booking.customerNo} • {booking.tripNo}
          </div>
        </div>
      ) : (
        isHovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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