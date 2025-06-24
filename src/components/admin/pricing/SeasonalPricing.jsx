/**
 * Seasonal Pricing Component
 * 
 * Purpose: Manage seasonal pricing adjustments and holiday rates
 * Provides visual calendar interface for seasonal rate management
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { useState } from 'react'
import { ConfigSection, ConfigGrid, ConfigCard, ActionButton } from '../AdminConfigLayout'

function SeasonalPricing() {
  const [seasonalRates, setSeasonalRates] = useState([
    {
      id: 1,
      name: 'Summer High Season',
      type: 'high',
      startDate: '2025-06-01',
      endDate: '2025-08-31',
      adjustment: 40,
      adjustmentType: 'percentage',
      description: 'Peak summer season with maximum demand',
      color: '#ef4444',
      isActive: true
    },
    {
      id: 2,
      name: 'Holiday Premium',
      type: 'holiday',
      startDate: '2025-12-20',
      endDate: '2025-01-05',
      adjustment: 60,
      adjustmentType: 'percentage',
      description: 'Christmas and New Year premium rates',
      color: '#8b5cf6',
      isActive: true
    },
    {
      id: 3,
      name: 'Spring Shoulder',
      type: 'medium',
      startDate: '2025-04-01',
      endDate: '2025-05-31',
      adjustment: 15,
      adjustmentType: 'percentage',
      description: 'Moderate demand spring season',
      color: '#f59e0b',
      isActive: true
    },
    {
      id: 4,
      name: 'Winter Low Season',
      type: 'low',
      startDate: '2025-01-06',
      endDate: '2025-03-31',
      adjustment: -20,
      adjustmentType: 'percentage',
      description: 'Discounted rates for low season',
      color: '#06b6d4',
      isActive: true
    }
  ])

  const [selectedSeason, setSelectedSeason] = useState(null)
  const [viewMode, setViewMode] = useState('calendar') // calendar or list

  const seasonTypes = [
    { id: 'high', name: 'High Season', color: '#ef4444', description: 'Peak demand periods' },
    { id: 'medium', name: 'Shoulder Season', color: '#f59e0b', description: 'Moderate demand' },
    { id: 'low', name: 'Low Season', color: '#06b6d4', description: 'Reduced demand' },
    { id: 'holiday', name: 'Holiday Premium', color: '#8b5cf6', description: 'Special occasions' }
  ]

  const getSeasonTypeConfig = (type) => {
    return seasonTypes.find(s => s.id === type) || seasonTypes[0]
  }

  const handleDeleteSeason = (seasonId) => {
    setSeasonalRates(rates => rates.filter(rate => rate.id !== seasonId))
  }

  const handleToggleActive = (seasonId) => {
    setSeasonalRates(rates => 
      rates.map(rate => 
        rate.id === seasonId ? { ...rate, isActive: !rate.isActive } : rate
      )
    )
  }

  const renderCalendarView = () => {
    // Simplified calendar representation
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-12 gap-2">
          {months.map((month, index) => {
            const monthRates = seasonalRates.filter(rate => {
              const startMonth = new Date(rate.startDate).getMonth()
              const endMonth = new Date(rate.endDate).getMonth()
              
              // Handle cross-year seasons
              if (startMonth > endMonth) {
                return index >= startMonth || index <= endMonth
              }
              return index >= startMonth && index <= endMonth
            })

            return (
              <div key={month} className="text-center">
                <div className="text-xs font-medium text-gray-600 mb-2">
                  {month.slice(0, 3)}
                </div>
                <div className="space-y-1">
                  {monthRates.map(rate => (
                    <div
                      key={rate.id}
                      className="h-6 rounded text-xs text-white flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: rate.color }}
                      onClick={() => setSelectedSeason(rate)}
                      title={`${rate.name}: ${rate.adjustment > 0 ? '+' : ''}${rate.adjustment}%`}
                    >
                      {rate.adjustment > 0 ? '+' : ''}{rate.adjustment}%
                    </div>
                  ))}
                  {monthRates.length === 0 && (
                    <div className="h-6 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                      Base
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Season Types</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {seasonTypes.map(type => (
              <div key={type.id} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: type.color }}
                />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{type.name}</div>
                  <div className="text-gray-500 text-xs">{type.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderListView = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Season
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adjustment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {seasonalRates.map(rate => {
              const typeConfig = getSeasonTypeConfig(rate.type)
              
              return (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: rate.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{rate.name}</div>
                        <div className="text-sm text-gray-500">{rate.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(rate.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      to {new Date(rate.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      rate.adjustment > 0 
                        ? 'bg-red-100 text-red-800' 
                        : rate.adjustment < 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rate.adjustment > 0 ? '+' : ''}{rate.adjustment}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(rate.id)}
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        rate.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rate.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedSeason(rate)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => console.log('Copy season', rate.id)}
                        className="text-gray-600 hover:text-gray-900 text-sm"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleDeleteSeason(rate.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <ConfigSection title="Seasonal Rate Management">
        <ConfigGrid cols={4}>
          <ConfigCard
            title="High Season"
            description="Create peak demand pricing"
            icon="🌞"
            onClick={() => console.log('Add high season clicked')}
          />
          <ConfigCard
            title="Low Season"
            description="Set discounted off-season rates"
            icon="❄️"
            onClick={() => console.log('Add low season clicked')}
          />
          <ConfigCard
            title="Holiday Rates"
            description="Special event premium pricing"
            icon="🎉"
            onClick={() => console.log('Add holiday rates clicked')}
          />
          <ConfigCard
            title="Import Seasons"
            description="Bulk import from previous year"
            icon="📅"
            onClick={() => console.log('Import seasons clicked')}
          />
        </ConfigGrid>
      </ConfigSection>

      {/* Seasonal Calendar */}
      <ConfigSection 
        title="Seasonal Pricing Overview"
        description="Visual representation of pricing adjustments throughout the year"
      >
        {/* View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                viewMode === 'calendar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List View
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <ActionButton variant="outline" size="sm">
              Export Schedule
            </ActionButton>
            <ActionButton variant="primary" size="sm">
              Add Season
            </ActionButton>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
      </ConfigSection>

      {/* Selected Season Details */}
      {selectedSeason && (
        <ConfigSection title="Season Details">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: selectedSeason.color }}
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedSeason.name}</h3>
                  <p className="text-gray-600">{selectedSeason.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSeason(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Period</label>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(selectedSeason.startDate).toLocaleDateString()} - {new Date(selectedSeason.endDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Adjustment</label>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedSeason.adjustment > 0 ? '+' : ''}{selectedSeason.adjustment}%
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <div className="mt-1 text-sm text-gray-900 capitalize">
                  {selectedSeason.type} Season
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedSeason.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedSeason.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center space-x-3">
              <ActionButton variant="primary" size="sm">
                Edit Season
              </ActionButton>
              <ActionButton variant="outline" size="sm">
                Duplicate
              </ActionButton>
              <ActionButton variant="outline" size="sm">
                Deactivate
              </ActionButton>
            </div>
          </div>
        </ConfigSection>
      )}
    </div>
  )
}

export default SeasonalPricing