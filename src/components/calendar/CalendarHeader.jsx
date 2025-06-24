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
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
      {/* Navigation Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          aria-label="Previous period"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={onToday}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Today
        </button>
        
        <button
          onClick={onNext}
          className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          aria-label="Next period"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        </div>
        
        {/* Current Period Display */}
        {currentPeriodText && (
          <div className="text-lg font-semibold text-gray-800 min-w-[200px] text-center">
            {currentPeriodText}
          </div>
        )}
      </div>

    </div>
  )
}

export default CalendarHeader