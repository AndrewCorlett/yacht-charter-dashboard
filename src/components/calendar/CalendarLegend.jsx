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
    { color: 'bg-green-500/20', label: 'Full Balance Paid', borderColor: 'border-green-500/40' },
    { color: 'bg-blue-500/20', label: 'Deposit Only Paid', borderColor: 'border-blue-500/40' },
    { color: 'bg-orange-500/20', label: 'Tentative (No Deposit)', borderColor: 'border-orange-500/40' },
    { color: 'bg-gray-500/20', label: 'Cancelled/Refunded', borderColor: 'border-gray-500/40' },
    { color: 'bg-ios-bg-primary', label: 'Available', borderColor: 'border-ios-gray-2' }
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