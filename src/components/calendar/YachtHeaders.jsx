/**
 * Yacht Headers Component
 * 
 * Purpose: Displays yacht names across the top of the calendar
 * 
 * Design Decisions:
 * - Sticky positioning for scroll behavior
 * - Z-index 20 to layer above date column
 * - Placeholder yacht names match dashboard image
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

function YachtHeaders({ yachts }) {
  const defaultYachts = [
    { id: 'spectre', name: 'Spectre' },
    { id: 'disk-drive', name: 'Disk Drive' },
    { id: 'arriva', name: 'Arriva' },
    { id: 'zambada', name: 'Zambada' },
    { id: 'melba-so', name: 'Melba So' },
    { id: 'swansea', name: 'Swansea' }
  ]

  const yachtsToDisplay = yachts || defaultYachts

  return (
    <div className="sticky top-0 z-20 grid grid-cols-6">
      {yachtsToDisplay.map((yacht) => (
        <div
          key={yacht.id}
          className="bg-white border-b border-r border-gray-300 flex items-center justify-center font-semibold text-gray-800 px-2"
          style={{ 
            minHeight: '40px'
          }}
        >
          <span className="truncate">{yacht.name}</span>
        </div>
      ))}
    </div>
  )
}

export default YachtHeaders