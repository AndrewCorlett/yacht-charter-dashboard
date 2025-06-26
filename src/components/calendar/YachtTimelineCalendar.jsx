/**
 * Yacht Timeline Calendar Component
 * 
 * Purpose: Main calendar component for visualizing yacht bookings
 * 
 * Design Decisions:
 * - Internal scroll only within calendar card
 * - 7 equal columns (1 date + 6 yachts)
 * - Fixed yacht headers during scroll
 * - Responsive to viewport changes
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import CalendarHeader from './CalendarHeader'
import BookingCell from './BookingCell'
import CalendarLegend from './CalendarLegend'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import { generateDateRange, getWeekStart, formatDate } from '../../utils/dateHelpers'
import { addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, format } from 'date-fns'
import { BookingModel, BookingStatus } from '../../models/core/BookingModel'
import { useBookings } from '../../contexts/BookingContext'
import useUnifiedData from '../../hooks/useUnifiedData'

function YachtTimelineCalendar({ onCreateBooking, onEditBooking }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month')
  const [focusedCell, setFocusedCell] = useState({ dateIndex: 0, yachtIndex: 0 })
  const [draggedBooking, setDraggedBooking] = useState(null)
  const gridRef = useRef(null)
  const [scrollbarWidth, setScrollbarWidth] = useState(0)
  
  // Use real-time booking state from context
  const {
    bookings,
    loading: isLoading,
    error,
    operationStatus,
    getAllBookings,
    getBookingsInRange,
    getDateAvailability,
    moveBooking,
    clearError
  } = useBookings()
  
  // Get yacht data from unified data service (same source as SIT REP)
  const { charters } = useUnifiedData()
  
  // Extract unique yacht names from unified charter data
  const yachts = useMemo(() => {
    // If no charters or bookings, use fallback with correct yacht names
    if (charters.length === 0 && bookings.length === 0) {
      return [
        { id: 'calico-moon', name: 'Calico Moon' },
        { id: 'spectre', name: 'Spectre' },
        { id: 'alrisha', name: 'Alrisha' },
        { id: 'disk-drive', name: 'Disk Drive' },
        { id: 'zavaria', name: 'Zavaria' },
        { id: 'mridula-sarwar', name: 'Mridula Sarwar' }
      ]
    }
    
    const uniqueYachts = new Map()
    
    // Add yachts from unified charter data
    charters.forEach(charter => {
      const yachtId = charter.yachtName.toLowerCase().replace(/\s+/g, '-')
      uniqueYachts.set(yachtId, {
        id: yachtId,
        name: charter.yachtName
      })
    })
    
    // Add yachts from existing bookings (in case there are bookings without charters)
    bookings.forEach(booking => {
      if (booking.yacht_name || booking.yacht_id) {
        const yachtName = booking.yacht_name || booking.yacht_id
        const yachtId = yachtName.toLowerCase().replace(/\s+/g, '-')
        if (!uniqueYachts.has(yachtId)) {
          uniqueYachts.set(yachtId, {
            id: yachtId,
            name: yachtName
          })
        }
      }
    })
    
    // Convert to array and sort for consistent display
    return Array.from(uniqueYachts.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [charters, bookings])

  // Generate dates for full month view (including padding days)
  const dates = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start week on Monday
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      
      const dates = []
      let currentDay = calendarStart
      
      while (currentDay <= calendarEnd) {
        dates.push(currentDay)
        currentDay = addDays(currentDay, 1)
      }
      
      return dates
    } else {
      // For week/day views, use original logic
      const daysToShow = viewMode === 'week' ? 7 : 1
      return generateDateRange(currentDate, daysToShow)
    }
  }, [currentDate, viewMode])

  const handlePrevious = useCallback(() => {
    if (viewMode === 'month') {
      setCurrentDate(prevDate => subMonths(prevDate, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(prevDate => subDays(prevDate, 7))
    } else {
      setCurrentDate(prevDate => subDays(prevDate, 1))
    }
  }, [viewMode])

  const handleNext = useCallback(() => {
    if (viewMode === 'month') {
      setCurrentDate(prevDate => addMonths(prevDate, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(prevDate => addDays(prevDate, 7))
    } else {
      setCurrentDate(prevDate => addDays(prevDate, 1))
    }
  }, [viewMode])

  const handleToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Get current period display text
  const getCurrentPeriodText = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy')
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate)
      const weekEnd = addDays(weekStart, 6)
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'MMMM d, yyyy')
    }
  }

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode)
  }, [])

  const handleCellClick = useCallback(({ date, yachtId, booking, availability }) => {
    if (booking) {
      // Handle booking click - show edit modal
      if (onEditBooking) {
        onEditBooking(booking)
      }
    } else if (availability?.isAvailable) {
      // Handle empty cell click - show create booking modal
      if (onCreateBooking) {
        onCreateBooking({ date, yachtId })
      }
    } else {
      // Cell is not available
      console.log('Cell not available:', availability)
    }
  }, [onCreateBooking, onEditBooking])


  const handleRetry = useCallback(() => {
    clearError()
    // Error handling is managed by the booking context
  }, [clearError])

  // Handle drag and drop operations
  const handleDragStart = useCallback((data) => {
    setDraggedBooking(data.booking)
  }, [])

  const handleDragOver = useCallback((data) => {
    // Visual feedback handled in BookingCell
  }, [])

  const handleDrop = useCallback(async (data) => {
    const { dragData, targetDate, targetYacht } = data
    
    if (!dragData.booking || !targetDate || !targetYacht) {
      console.error('Invalid drag data:', data)
      return
    }

    const { booking, sourceDate } = dragData
    
    // Calculate new end date based on original duration
    const originalDuration = booking.getDurationDays()
    const newEndDate = addDays(targetDate, originalDuration - 1)

    try {
      await moveBooking(booking.id, {
        yachtId: targetYacht,
        startDate: targetDate,
        endDate: newEndDate
      })
    } catch (error) {
      console.error('Failed to move booking:', error)
      // Error handling is managed by the booking context
    } finally {
      setDraggedBooking(null)
    }
  }, [moveBooking])

  useEffect(() => {
    // Calculate scrollbar width
    const scrollContainer = document.getElementById('calendar-scroll-area')
    if (scrollContainer) {
      const scrollbarWidth = scrollContainer.offsetWidth - scrollContainer.clientWidth
      setScrollbarWidth(scrollbarWidth)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const { dateIndex, yachtIndex } = focusedCell
      let newDateIndex = dateIndex
      let newYachtIndex = yachtIndex

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          newYachtIndex = Math.min(yachtIndex + 1, yachts.length - 1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          newYachtIndex = Math.max(yachtIndex - 1, 0)
          break
        case 'ArrowDown':
          e.preventDefault()
          newDateIndex = Math.min(dateIndex + 1, dates.length - 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          newDateIndex = Math.max(dateIndex - 1, 0)
          break
        default:
          return
      }

      setFocusedCell({ dateIndex: newDateIndex, yachtIndex: newYachtIndex })
      
      // Focus the new cell
      const cellIndex = newDateIndex * yachts.length + newYachtIndex
      const cells = gridRef.current?.querySelectorAll('[role="button"]')
      if (cells && cells[cellIndex]) {
        cells[cellIndex].focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedCell, dates.length, yachts.length])

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg p-6">
        <ErrorDisplay error={error} onRetry={handleRetry} />
      </div>
    )
  }

  return (
    <div 
      data-testid="yacht-calendar"
      className="w-full h-full ios-card flex flex-col overflow-x-hidden" 
      style={{ 
        fontFamily: 'var(--font-family-ios)' 
      }}
    >
      {/* Fixed Header */}
      <div className="px-4 py-2 border-b flex-shrink-0 overflow-x-hidden" style={{ 
        borderColor: 'var(--color-ios-gray-2)' 
      }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium" style={{ color: 'var(--color-ios-text-primary)' }}>
            Yacht Timeline Calendar
            {operationStatus && (
              <span className={`ml-2 text-sm ${
                operationStatus.type === 'error' ? 'text-red-500' :
                operationStatus.type === 'success' ? 'text-green-500' :
                'text-blue-500'
              }`}>
                {operationStatus.message}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Updating...</span>
              </div>
            )}
            <input
              type="text"
              placeholder="Search..."
              className="ios-input text-sm w-40"
            />
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading calendar data..." />
      ) : (
        <>
          {/* Fixed Calendar Controls */}
          <div className="px-4 py-2 border-b border-ios-gray-2 flex-shrink-0 overflow-x-hidden">
            <CalendarHeader
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToday={handleToday}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              currentPeriodText={getCurrentPeriodText()}
            />
          </div>
          
          {/* Fixed Header Row Outside Scroll Area */}
          <div 
            data-testid="yacht-headers"
            className="border-b calendar-header-border flex-shrink-0 shadow-ios" 
            style={{ 
              position: 'sticky', 
              top: '0', 
              zIndex: 40,
              backgroundColor: 'var(--color-ios-bg-primary)'
            }}
          >
            <div className="grid w-full" style={{ gridTemplateColumns: `120px repeat(${yachts.length}, minmax(120px, 1fr))` }}>
              <div className="border-r calendar-header-border h-[50px] flex items-center justify-center font-medium" style={{ 
                backgroundColor: 'var(--color-ios-gray-1)',
                color: 'var(--color-ios-text-secondary)'
              }}>
                Date
              </div>
              {yachts.map((yacht) => (
                <div
                  key={`fixed-header-${yacht.id}`}
                  className="border-r calendar-header-border flex items-center justify-center font-medium px-1 h-[50px]"
                  style={{ 
                    backgroundColor: 'var(--color-ios-bg-primary)',
                    color: 'var(--color-ios-text-primary)'
                  }}
                >
                  <span className="truncate text-sm">{yacht.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Container - Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden" id="calendar-scroll-area">
            <div className="grid w-full" style={{ gridTemplateColumns: `120px repeat(${yachts.length}, minmax(120px, 1fr))` }}>
              {/* Calendar Content */}
              {dates.map((date, dateIndex) => (
                <>
                  {/* Date cell */}
                  <div
                    key={`date-${dateIndex}`}
                    className="border-b border-r calendar-grid-border flex items-center justify-center font-medium text-sm h-[60px]"
                    style={{ 
                      backgroundColor: 'var(--color-ios-gray-1)',
                      color: 'var(--color-ios-text-secondary)'
                    }}
                  >
                    <span className="text-xs">{formatDate(date)}</span>
                  </div>
                  
                  {/* Booking cells for this date */}
                  {yachts.map((yacht, yachtIndex) => {
                    const tabIndex = dateIndex === 0 && yachtIndex === 0 ? 0 : -1
                    return (
                      <BookingCell
                        key={`${yacht.id}-${dateIndex}`}
                        date={date}
                        yachtId={yacht.id}
                        booking={null}
                        allBookings={bookings}
                        onClick={handleCellClick}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        tabIndex={tabIndex}
                        isDragging={draggedBooking?.id && 
                                   draggedBooking.yacht_id === yacht.id &&
                                   getDateAvailability(date, yacht.id).booking?.id === draggedBooking.id}
                      />
                    )
                  })}
                </>
              ))}
            </div>
          </div>
          
          <CalendarLegend className="flex-shrink-0 p-ios-lg border-t border-ios-gray-2" />
        </>
      )}
    </div>
  )
}

export default YachtTimelineCalendar