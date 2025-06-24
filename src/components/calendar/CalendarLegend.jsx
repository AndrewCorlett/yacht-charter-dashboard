/**
 * Calendar Legend Component
 * 
 * Purpose: Shows color coding for booking status types
 * 
 * Design Decisions:
 * - Horizontal layout for compact display
 * - Consistent with booking cell colors
 * - Simple visual guide for users
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

function CalendarLegend() {
  const legendItems = [
    { color: 'bg-green-200', label: 'Confirmed Booking', borderColor: 'border-green-400' },
    { color: 'bg-red-200', label: 'Unavailable', borderColor: 'border-red-400' },
    { color: 'bg-pink-300', label: 'Cardiff', borderColor: 'border-pink-400' },
    { color: 'bg-white', label: 'Available', borderColor: 'border-gray-300' }
  ]

  return (
    <div className="flex items-center gap-6 mt-4 text-sm">
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className={`w-4 h-4 ${item.color} border ${item.borderColor} rounded`}
          />
          <span className="text-gray-700">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default CalendarLegend