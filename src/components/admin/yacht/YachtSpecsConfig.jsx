/**
 * Yacht Specifications Configuration Component
 * 
 * Purpose: Manage yacht specifications, amenities, and technical details
 * Provides yacht listing/cards interface for fleet management
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { useState } from 'react'
import { ConfigSection, ConfigGrid, ConfigCard, ActionButton } from '../AdminConfigLayout'

function YachtSpecsConfig() {
  const [yachts, setYachts] = useState([])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState('cards') // cards or list

  const amenityIcons = {
    wifi: '📶',
    aircon: '❄️',
    sound_system: '🔊',
    bbq: '🔥',
    water_toys: '🏄',
    tender: '🚤',
    jacuzzi: '🛁',
    kitchen: '👨‍🍳',
    bar: '🍸'
  }

  const amenityLabels = {
    wifi: 'WiFi',
    aircon: 'Air Conditioning',
    sound_system: 'Sound System',
    bbq: 'BBQ/Grill',
    water_toys: 'Water Toys',
    tender: 'Tender',
    jacuzzi: 'Jacuzzi',
    kitchen: 'Full Kitchen',
    bar: 'Bar'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getYachtTypeColor = (type) => {
    switch (type) {
      case 'Motor Yacht': return 'bg-blue-100 text-blue-800'
      case 'Sport Yacht': return 'bg-purple-100 text-purple-800'
      case 'Sailing Yacht': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAndSortedYachts = yachts
    .filter(yacht => {
      const matchesSearch = yacht.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           yacht.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           yacht.model.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || yacht.status === filterStatus
      const matchesType = filterType === 'all' || yacht.type === filterType
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'length': return b.length - a.length
        case 'capacity': return b.capacity - a.capacity
        case 'year': return b.year - a.year
        default: return 0
      }
    })

  const handleDeleteYacht = (yachtId) => {
    setYachts(prev => prev.filter(yacht => yacht.id !== yachtId))
  }

  const handleToggleStatus = (yachtId) => {
    setYachts(prev => 
      prev.map(yacht => 
        yacht.id === yachtId 
          ? { 
              ...yacht, 
              status: yacht.status === 'active' ? 'inactive' : 'active' 
            }
          : yacht
      )
    )
  }

  const renderYachtCard = (yacht) => (
    <div key={yacht.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Yacht Image */}
      <div className="aspect-video bg-gray-200 rounded-t-lg relative">
        {yacht.images.length > 0 ? (
          <img 
            src={yacht.images[0]} 
            alt={yacht.name}
            className="w-full h-full object-cover rounded-t-lg"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-t-lg">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(yacht.status)}`}>
            {yacht.status}
          </span>
        </div>
        
        {/* Image Count */}
        {yacht.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {yacht.images.length} photos
          </div>
        )}
      </div>

      {/* Yacht Details */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{yacht.name}</h3>
            <p className="text-sm text-gray-600">{yacht.manufacturer} {yacht.model} ({yacht.year})</p>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getYachtTypeColor(yacht.type)}`}>
            {yacht.type}
          </span>
        </div>

        {/* Key Specs */}
        <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900">{yacht.length}ft</div>
            <div className="text-gray-500">Length</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{yacht.capacity}</div>
            <div className="text-gray-500">Guests</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{yacht.cabins}</div>
            <div className="text-gray-500">Cabins</div>
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-700 mb-2">Amenities</div>
          <div className="flex flex-wrap gap-1">
            {yacht.amenities.slice(0, 6).map(amenity => (
              <span 
                key={amenity}
                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                title={amenityLabels[amenity]}
              >
                <span className="mr-1">{amenityIcons[amenity]}</span>
                {amenityLabels[amenity]}
              </span>
            ))}
            {yacht.amenities.length > 6 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{yacht.amenities.length - 6} more
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {yacht.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => console.log('Edit yacht', yacht.id)}
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => console.log('View yacht', yacht.id)}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              View
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleToggleStatus(yacht.id)}
              className={`text-sm font-medium ${
                yacht.status === 'active' 
                  ? 'text-red-600 hover:text-red-900' 
                  : 'text-green-600 hover:text-green-900'
              }`}
            >
              {yacht.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => handleDeleteYacht(yacht.id)}
              className="text-red-600 hover:text-red-900 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderYachtList = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Yacht
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Specifications
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Maintenance
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredAndSortedYachts.map(yacht => (
            <tr key={yacht.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{yacht.name}</div>
                    <div className="text-sm text-gray-500">{yacht.manufacturer} {yacht.model}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {yacht.length}ft • {yacht.capacity} guests • {yacht.cabins} cabins
                </div>
                <div className="text-sm text-gray-500">
                  {yacht.year} • {yacht.type}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(yacht.status)}`}>
                  {yacht.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  Next: {new Date(yacht.nextMaintenance).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">
                  Last: {new Date(yacht.lastMaintenance).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => console.log('Edit yacht', yacht.id)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => console.log('View yacht', yacht.id)}
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteYacht(yacht.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <ConfigSection title="Fleet Management">
        <ConfigGrid cols={4}>
          <ConfigCard
            title="Add New Yacht"
            description="Add a new yacht to the fleet"
            icon="⛵"
            onClick={() => console.log('Add yacht clicked')}
          />
          <ConfigCard
            title="Bulk Import"
            description="Import yacht data from CSV"
            icon="📊"
            onClick={() => console.log('Bulk import clicked')}
          />
          <ConfigCard
            title="Maintenance Schedule"
            description="View upcoming maintenance"
            icon="🔧"
            onClick={() => console.log('Maintenance schedule clicked')}
          />
          <ConfigCard
            title="Photo Manager"
            description="Manage yacht photo galleries"
            icon="📸"
            onClick={() => console.log('Photo manager clicked')}
          />
        </ConfigGrid>
      </ConfigSection>

      {/* Yacht Fleet */}
      <ConfigSection 
        title="Yacht Fleet"
        description="Manage yacht specifications, amenities, and fleet information"
      >
        {/* Filters and Controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search yachts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-48"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="Motor Yacht">Motor Yacht</option>
                <option value="Sport Yacht">Sport Yacht</option>
                <option value="Sailing Yacht">Sailing Yacht</option>
              </select>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="name">Name</option>
                <option value="length">Length</option>
                <option value="capacity">Capacity</option>
                <option value="year">Year</option>
              </select>
            </div>

            <div className="flex items-center bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>

            <ActionButton variant="primary" size="sm">
              Add Yacht
            </ActionButton>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredAndSortedYachts.length} of {yachts.length} yachts
        </div>

        {/* Yacht Display */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedYachts.map(renderYachtCard)}
          </div>
        ) : (
          renderYachtList()
        )}

        {filteredAndSortedYachts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="mt-2 text-lg font-medium">No yachts found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </ConfigSection>
    </div>
  )
}

export default YachtSpecsConfig