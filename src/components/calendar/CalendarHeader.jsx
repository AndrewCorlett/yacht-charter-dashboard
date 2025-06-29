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
  currentPeriodText,
  currentDate,
  onDateChange
}) {
  const viewModes = ['day', 'week', 'month']
  
  // Generate options for month dropdown
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
  
  const handleMonthChange = (event) => {
    const newMonth = parseInt(event.target.value)
    const newDate = new Date(currentDate)
    newDate.setMonth(newMonth)
    onDateChange(newDate)
  }
  
  const handleYearChange = (event) => {
    const newYear = parseInt(event.target.value)
    const newDate = new Date(currentDate)
    newDate.setFullYear(newYear)
    onDateChange(newDate)
  }

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
        
        {/* Month/Year Dropdowns for Month View */}
        {viewMode === 'month' && currentDate && onDateChange && (
          <div className="flex items-center gap-2">
            <select
              value={currentDate.getMonth()}
              onChange={handleMonthChange}
              className="ios-input text-sm py-1 px-2 min-w-[120px]"
              aria-label="Select month"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
            
            <select
              value={currentDate.getFullYear()}
              onChange={handleYearChange}
              className="ios-input text-sm py-1 px-2 min-w-[80px]"
              aria-label="Select year"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Current Period Display for other views */}
        {currentPeriodText && viewMode !== 'month' && (
          <div className="text-lg font-semibold text-ios-text-primary min-w-[200px] text-center">
            {currentPeriodText}
          </div>
        )}
      </div>

    </div>
  )
}

export default CalendarHeader