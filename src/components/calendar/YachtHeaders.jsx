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
  // No fallback - always use the yachts passed from parent (which come from unified data)
  const yachtsToDisplay = yachts || []

  // Determine grid columns based on number of yachts
  const gridCols = yachtsToDisplay.length <= 3 ? 'grid-cols-3' : 
                   yachtsToDisplay.length <= 4 ? 'grid-cols-4' : 
                   yachtsToDisplay.length <= 5 ? 'grid-cols-5' : 
                   yachtsToDisplay.length <= 6 ? 'grid-cols-6' : 'grid-cols-7'

  return (
    <div className={`sticky top-0 z-20 grid ${gridCols}`}>
      {yachtsToDisplay.map((yacht) => (
        <div
          key={yacht.id}
          className="bg-white border-b border-r border-gray-300 flex items-center justify-center font-semibold text-gray-800 px-2"
          style={{ 
            minHeight: '40px'
          }}
        >
          <span className="truncate text-sm">{yacht.name}</span>
        </div>
      ))}
    </div>
  )
}

export default YachtHeaders