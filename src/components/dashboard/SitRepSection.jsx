/**
 * SitRep Section Component - Rebuilt
 * 
 * Displays current boats out and upcoming charters with horizontal scrolling cards,
 * real-time updates, accessibility features, and professional loading states.
 * 
 * Features:
 * - Horizontal scrollable card layout
 * - Real-time data updates via op:update events
 * - Fallback polling every 5 minutes
 * - Loading skeleton shimmer
 * - Accessibility with keyboard navigation
 * - Empty state handling
 * - Proper date formatting with Intl.DateTimeFormat
 * 
 * @author AI Agent
 * @created 2025-06-26 (rebuilt)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  eventEmitter, 
  navigateToBooking, 
  categorizeCharters, 
  formatDateRange 
} from '../../utils/charterService'
import { COLOR_KEY_LEGEND, PAYMENT_STATUS_COLORS } from '../../data/mockData'
import { getBookingDisplayProps } from '../../utils/bookingColors'
import useUnifiedData from '../../hooks/useUnifiedData'

function SitRepSection() {
  // Use unified data hook for consistent data access
  const {
    charters: allCharters,
    isLoading,
    error,
    getActiveCharters,
    getUpcomingCharters
  } = useUnifiedData()

  // Categorized charters (automatically updated when data changes)
  const charters = {
    active: getActiveCharters(),
    upcoming: getUpcomingCharters(10)
  }
  
  // Refs for cleanup
  const pollIntervalRef = useRef(null)
  const isMountedRef = useRef(true)

  /**
   * Handle card click navigation
   */
  const handleCardClick = useCallback((charterId) => {
    navigateToBooking(charterId)
  }, [])

  /**
   * Handle keyboard navigation for accessibility
   */
  const handleCardKeyDown = useCallback((event, charterId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigateToBooking(charterId)
    }
  }, [])

  // Set up real-time updates and polling (data loading handled by useUnifiedData)
  useEffect(() => {
    isMountedRef.current = true
    
    // Set up fallback polling every 5 minutes for external updates
    // (useUnifiedData handles real-time updates automatically)
    pollIntervalRef.current = setInterval(() => {
      // Trigger a refresh if needed (though unified service handles most updates)
      eventEmitter.emit('refresh-request')
    }, 5 * 60 * 1000) // 5 minutes
    
    // Cleanup function
    return () => {
      isMountedRef.current = false
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  /**
   * Loading Skeleton Component
   * Displays animated shimmer while data loads
   */
  const LoadingSkeleton = () => (
    <div data-testid="sitrep-loading-skeleton" className="animate-pulse">
      {/* Title skeleton */}
      <div className="h-6 bg-gray-300 rounded w-24 mb-4"></div>
      
      {/* BOATS OUT section skeleton */}
      <div className="mb-6">
        <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-48 h-20 bg-gray-300 rounded-lg"></div>
          ))}
        </div>
      </div>
      
      {/* UPCOMING CHARTERS section skeleton */}
      <div>
        <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-48 h-20 bg-gray-300 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  )

  /**
   * Charter Card Component
   * Reusable card component for both active and upcoming charters
   * Now includes red outline for overdue tasks and proper color coding using centralized booking color utility
   */
  const CharterCard = ({ charter, testId, section }) => {
    // Get booking display properties using centralized utility
    const displayProps = getBookingDisplayProps(charter)
    const backgroundColor = displayProps.color
    
    return (
      <button
        key={charter.id}
        data-testid={testId}
        className="flex-shrink-0 w-48 h-20 p-3 rounded-lg transition-all duration-200 
                   hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-500 
                   focus-visible:ring-offset-2 focus:outline-none"
        style={{ 
          backgroundColor,
          minWidth: '12rem', // Ensure fixed minimum width
          border: displayProps.hasOverdueTasks ? '2px solid #DC2626' : 'none', // Red outline for overdue tasks
          boxShadow: displayProps.hasOverdueTasks ? '0 0 0 1px #DC2626' : 'none' // Additional red glow
        }}
        onClick={() => handleCardClick(charter.id)}
        onKeyDown={(e) => handleCardKeyDown(e, charter.id)}
        aria-label={`${charter.yachtName} charter from ${formatDateRange(charter.startDate, charter.endDate)}${displayProps.hasOverdueTasks ? ' - Has overdue tasks' : ''}`}
      >
        <div className="text-left h-full flex flex-col justify-between">
          {/* Yacht name at the top - largest and bold */}
          <div 
            data-testid={`yacht-name-${charter.id}`}
            className="font-bold text-white text-sm leading-tight"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {charter.yachtName}
          </div>
          
          {/* Charterer name in the middle */}
          <div 
            data-testid={`charterer-name-${charter.id}`}
            className="text-white/90 text-xs leading-tight"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {charter.chartererName}
          </div>
          
          {/* Date range at the bottom */}
          <div 
            data-testid={`date-range-${charter.id}`}
            className="text-white/80 text-xs leading-tight"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {formatDateRange(charter.startDate, charter.endDate)}
          </div>
        </div>
      </button>
    )
  }

  /**
   * Empty State Component
   * Displays when no data is available
   */
  const EmptyState = () => (
    <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
      None at the moment 🚤
    </div>
  )

  /**
   * Color Key Component
   * Shows the color coding legend for the SIT REP widget - Compact horizontal layout
   */
  const ColorKey = () => (
    <div className="mt-4 pt-3 border-t border-gray-200/20">
      <h4 
        className="text-xs font-medium mb-2 uppercase tracking-wide text-center" 
        style={{ color: 'var(--color-ios-text-secondary)' }}
      >
        Color Key
      </h4>
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        {COLOR_KEY_LEGEND.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            {/* Color indicator */}
            <div 
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            ></div>
            {/* Label only */}
            <span 
              className="font-medium whitespace-nowrap" 
              style={{ color: 'var(--color-ios-text-primary)' }}
            >
              {item.label}
            </span>
          </div>
        ))}
        {/* Special indicator for overdue tasks */}
        <div className="flex items-center gap-1.5">
          <div 
            className="w-2.5 h-2.5 rounded-sm border flex-shrink-0"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: '#DC2626'
            }}
          ></div>
          <span 
            className="font-medium whitespace-nowrap" 
            style={{ color: 'var(--color-ios-text-primary)' }}
          >
            Red Outline
          </span>
        </div>
      </div>
    </div>
  )

  // Show loading skeleton while data loads
  if (isLoading) {
    return (
      <div className="ios-card" style={{ fontFamily: 'var(--font-family-ios)' }}>
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="ios-card" style={{ fontFamily: 'var(--font-family-ios)' }}>
      {/* Main title */}
      <h2 
        className="text-lg font-semibold mb-6" 
        style={{ color: 'var(--color-ios-text-primary)' }}
      >
        SIT REP
      </h2>
      
      {/* BOATS OUT Section */}
      <div className="mb-8">
        <div 
          role="region" 
          aria-label="Boats currently out on charter"
        >
          <h3 
            className="text-sm font-medium mb-3 uppercase tracking-wide" 
            style={{ color: 'var(--color-ios-text-secondary)' }}
          >
            BOATS OUT
          </h3>
          
          {charters.active.length > 0 ? (
            <div 
              data-testid="boats-out-scroll-container"
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ 
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none'  // IE/Edge
              }}
            >
              {charters.active.map(charter => (
                <CharterCard
                  key={`active-${charter.id}`}
                  charter={charter}
                  testId={`boats-out-card-${charter.id}`}
                  section="boats-out"
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* UPCOMING CHARTERS Section */}
      <div>
        <div 
          role="region" 
          aria-label="Upcoming charter bookings"
        >
          <h3 
            className="text-sm font-medium mb-3 uppercase tracking-wide" 
            style={{ color: 'var(--color-ios-text-secondary)' }}
          >
            UPCOMING CHARTERS
          </h3>
          
          {charters.upcoming.length > 0 ? (
            <div 
              data-testid="upcoming-charters-scroll-container"
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ 
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none'  // IE/Edge
              }}
            >
              {charters.upcoming.map(charter => (
                <CharterCard
                  key={`upcoming-${charter.id}`}
                  charter={charter}
                  testId={`upcoming-charter-card-${charter.id}`}
                  section="upcoming"
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Color Key Legend */}
      <ColorKey />
      
      {/* Hide scrollbars for WebKit browsers */}
      <style>{`
        [data-testid="boats-out-scroll-container"]::-webkit-scrollbar,
        [data-testid="upcoming-charters-scroll-container"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default SitRepSection