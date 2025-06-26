/**
 * Calendar Header Component
 * 
 * Purpose: Navigation controls and view mode selector for calendar
 * 
 * Design Decisions:
 * - Navigation buttons styled to match dashboard UI
 * - View mode toggle with active state highlighting
 * - Responsive layout for mobile/desktop
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

function CalendarHeader({ 
  onPrevious, 
  onNext, 
  onToday, 
  viewMode, 
  onViewModeChange,
  currentPeriodText 
}) {
  const viewModes = ['day', 'week', 'month']

  return (
    <div 
      data-testid="calendar-header"
      className="flex flex-col sm:flex-row justify-between items-center mb-ios-sm gap-ios-md font-ios"
    >
      {/* Navigation Controls */}
      <div className="flex items-center gap-ios-md">
        <div className="flex items-center gap-ios-sm">
        <button
          onClick={onPrevious}
          className="ios-button-secondary"
          aria-label="Previous period"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={onToday}
          className="ios-button"
        >
          Today
        </button>
        
        <button
          onClick={onNext}
          className="ios-button-secondary"
          aria-label="Next period"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        </div>
        
        {/* Current Period Display */}
        {currentPeriodText && (
          <div className="text-lg font-semibold text-ios-text-primary min-w-[200px] text-center">
            {currentPeriodText}
          </div>
        )}
      </div>

    </div>
  )
}

export default CalendarHeader