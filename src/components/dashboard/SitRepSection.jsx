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
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">SIT REP</h2>
      
      {/* BOATS OUT Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">BOATS OUT</h3>
        <div className="space-y-2">
          {boatsOut.map(boat => (
            <div key={boat.id} className={`${boat.color} p-3 rounded-lg`}>
              <div className="font-semibold text-gray-800">{boat.yacht}</div>
              <div className="text-xs text-gray-600 mt-1">
                {boat.dateOut} - {boat.dateIn}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UPCOMING CHARTERS Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">UPCOMING CHARTERS</h3>
        <div className="space-y-2">
          {upcomingCharters.map(charter => (
            <div key={charter.id} className={`${charter.color} p-3 rounded-lg`}>
              <div className="font-semibold text-gray-800">{charter.yacht}</div>
              {charter.dateRange && (
                <div className="text-xs text-gray-600 mt-1">
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