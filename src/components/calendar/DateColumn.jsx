/**
 * Date Column Component
 * 
 * Purpose: Displays dates in the left column of the calendar
 * 
 * Design Decisions:
 * - Sticky positioning for scroll behavior
 * - Date format matches European yacht charter standards
 * - Z-index 10 for proper layering
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { formatDate } from '../../utils/dateHelpers'

function DateColumn({ dates }) {
  return (
    <div className="sticky left-0 z-10 flex flex-col h-full">
      {/* Empty corner cell */}
      <div 
        className="bg-gray-100 border-b border-r border-gray-300 sticky top-0 z-30 flex-shrink-0"
        style={{ minHeight: '40px' }}
      />
      
      {/* Date cells - Fill remaining height equally */}
      <div className="flex-1 flex flex-col">
        {dates.map((date, index) => (
          <div
            key={index}
            className="bg-gray-50 border-b border-r border-gray-300 flex items-center justify-center font-medium text-sm text-gray-700 flex-1"
            style={{ minHeight: '40px' }}
          >
            {formatDate(date)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DateColumn