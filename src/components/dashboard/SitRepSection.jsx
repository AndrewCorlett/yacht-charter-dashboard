/**
 * SitRep Section Component
 * 
 * Purpose: Displays current boats out and upcoming charters
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

// import { format } from 'date-fns' // Removed unused import

function SitRepSection() {
  // Mock data for boats out
  const boatsOut = [
    { 
      id: 'spectre-out', 
      yacht: 'Spectre', 
      dateOut: '7 July 2023',
      dateIn: '9 July 2023',
      color: 'bg-green-200'
    }
  ]

  // Mock data for upcoming charters
  const upcomingCharters = [
    {
      id: 'spectre-upcoming',
      yacht: 'Spectre',
      dateRange: '18 July 2023 - 27 July 2023',
      color: 'bg-orange-300'
    },
    {
      id: 'disk-drive-upcoming',
      yacht: 'Disk drive',
      color: 'bg-green-200'
    },
    {
      id: 'spectre-upcoming-2',
      yacht: 'Spectre',
      color: 'bg-orange-300'
    }
  ]

  return (
    <div className="ios-card" style={{ fontFamily: 'var(--font-family-ios)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-ios-text-primary)' }}>SIT REP</h2>
      
      {/* BOATS OUT Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-ios-text-secondary)' }}>BOATS OUT</h3>
        <div className="space-y-2">
          {boatsOut.map(boat => (
            <div key={boat.id} className="p-2 rounded-lg border" style={{ 
              backgroundColor: 'rgba(52, 199, 89, 0.2)', 
              borderColor: 'rgba(52, 199, 89, 0.3)',
              borderRadius: 'var(--radius-ios)'
            }}>
              <div className="font-medium" style={{ color: 'var(--color-ios-text-primary)' }}>{boat.yacht}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-ios-text-tertiary)' }}>
                {boat.dateOut} - {boat.dateIn}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UPCOMING CHARTERS Section */}
      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-ios-text-secondary)' }}>UPCOMING CHARTERS</h3>
        <div className="space-y-2">
          {upcomingCharters.map(charter => (
            <div key={charter.id} className="p-2 rounded-lg border" style={{ 
              backgroundColor: 'rgba(255, 149, 0, 0.2)', 
              borderColor: 'rgba(255, 149, 0, 0.3)',
              borderRadius: 'var(--radius-ios)'
            }}>
              <div className="font-medium" style={{ color: 'var(--color-ios-text-primary)' }}>{charter.yacht}</div>
              {charter.dateRange && (
                <div className="text-xs mt-1" style={{ color: 'var(--color-ios-text-tertiary)' }}>
                  {charter.dateRange}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SitRepSection