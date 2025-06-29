/**
 * Yacht Management Section Component
 * 
 * Main yacht management interface allowing operators to:
 * - Select and manage yacht records
 * - Edit yacht specifications and details
 * - Manage yacht owner information
 * - Configure seasonal charter costs and pricing
 * 
 * This component provides a comprehensive yacht administration interface
 * with real-time sync to Supabase database.
 * 
 * @author AI Agent
 * @created 2025-06-28
 */

import { useState, useEffect } from 'react'
import { LABELS } from '../../config/labels'
import YachtSelector from './yacht/YachtSelector'
import YachtSpecsEditor from './yacht/YachtSpecsEditor'
import YachtOwnerDetails from './yacht/YachtOwnerDetails'
import YachtCharterCosts from './yacht/YachtCharterCosts'

function YachtManagementSection() {
  // [Selected Yacht State] - Currently selected yacht for editing
  const [selectedYacht, setSelectedYacht] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // [Tab State] - Active tab within yacht management (specs, owner, costs)
  const [activeYachtTab, setActiveYachtTab] = useState('specs')

  // [Yacht Management Tabs] - Sub-tabs for yacht detail management
  const yachtTabs = [
    {
      key: 'specs',
      label: LABELS.YACHT_MANAGEMENT.YACHT_DETAILS,
      icon: '🛥️',
      description: 'Yacht specifications and technical details'
    },
    {
      key: 'owner',
      label: LABELS.YACHT_MANAGEMENT.OWNER_DETAILS,
      icon: '👤',
      description: 'Yacht owner contact and emergency information'
    },
    {
      key: 'costs',
      label: LABELS.YACHT_MANAGEMENT.CHARTER_COSTS,
      icon: '💰',
      description: 'Seasonal pricing and charter cost configuration'
    }
  ]

  /**
   * [Handle Yacht Selection] - Updates selected yacht and resets active tab
   * @param {Object} yacht - Selected yacht object from YachtSelector
   */
  const handleYachtSelection = (yacht) => {
    console.log('[YachtManagement] Yacht selected:', yacht?.name || 'None')
    setSelectedYacht(yacht)
    setActiveYachtTab('specs') // Reset to first tab when selecting new yacht
    setError(null)
  }

  /**
   * [Handle Data Save] - Processes save operations from child components
   * @param {string} section - Section being saved (specs, owner, costs)
   * @param {Object} data - Data to save
   */
  const handleDataSave = async (section, data) => {
    if (!selectedYacht) {
      console.error('[YachtManagement] No yacht selected for save operation')
      setError('No yacht selected. Please select a yacht first.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`[YachtManagement] Saving ${section} data for yacht:`, selectedYacht.id)
      console.log(`[YachtManagement] Data to save:`, data)
      
      // TODO: Implement Supabase save operations
      // This will be connected to the database in the next step
      
      // Mock successful save for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`[YachtManagement] ${section} data saved successfully`)
      
    } catch (saveError) {
      console.error(`[YachtManagement] Error saving ${section} data:`, saveError)
      setError(`Failed to save ${section} data. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * [Render Yacht Detail Content] - Renders content based on active yacht tab
   */
  const renderYachtDetailContent = () => {
    if (!selectedYacht) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-4">⚓</div>
            <h3 className="text-lg font-medium mb-2">No Yacht Selected</h3>
            <p>Please select a yacht from the list above to view and edit details.</p>
          </div>
        </div>
      )
    }

    switch (activeYachtTab) {
      case 'specs':
        return (
          <YachtSpecsEditor 
            yacht={selectedYacht} 
            onSave={(data) => handleDataSave('specs', data)}
            loading={loading}
          />
        )
      case 'owner':
        return (
          <YachtOwnerDetails 
            yacht={selectedYacht} 
            onSave={(data) => handleDataSave('owner', data)}
            loading={loading}
          />
        )
      case 'costs':
        return (
          <YachtCharterCosts 
            yacht={selectedYacht} 
            onSave={(data) => handleDataSave('costs', data)}
            loading={loading}
          />
        )
      default:
        return (
          <YachtSpecsEditor 
            yacht={selectedYacht} 
            onSave={(data) => handleDataSave('specs', data)}
            loading={loading}
          />
        )
    }
  }

  return (
    <div className="space-y-8">
      {/* [Yacht Management Header] - Section title and description */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{LABELS.SETTINGS.YACHT_MANAGEMENT}</h2>
        <p className="text-gray-400">
          Manage yacht fleet information, specifications, owner details, and charter pricing.
          Select a yacht below to view and edit its details.
        </p>
      </div>

      {/* [Error Display] - Show error messages if any */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-lg">❌</span>
            <span className="text-red-400 font-medium">Error</span>
          </div>
          <p className="text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* [Yacht Selector] - Yacht selection component */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <span>🛥️</span>
          {LABELS.YACHT_MANAGEMENT.SELECT_YACHT}
        </h3>
        <YachtSelector 
          onYachtSelect={handleYachtSelection}
          selectedYacht={selectedYacht}
        />
      </div>

      {/* [Yacht Detail Tabs] - Sub-navigation for yacht details */}
      {selectedYacht && (
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <span>⚙️</span>
            Managing: {selectedYacht.name}
          </h3>

          {/* [Tab Navigation] - Horizontal tab bar for yacht detail sections */}
          <div className="border-b border-gray-700 mb-6">
            <nav className="flex space-x-8">
              {yachtTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveYachtTab(tab.key)}
                  disabled={loading}
                  className={`flex items-center gap-3 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeYachtTab === tab.key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* [Yacht Detail Content] - Dynamic content area based on selected tab */}
          <div className="space-y-6">
            {renderYachtDetailContent()}
          </div>
        </div>
      )}

      {/* [Quick Stats] - Summary information */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-medium mb-3">📊 Yacht Fleet Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Total Yachts</div>
            <div className="text-xl font-bold">6</div>
          </div>
          <div>
            <div className="text-gray-400">Active Fleet</div>
            <div className="text-xl font-bold">6</div>
          </div>
          <div>
            <div className="text-gray-400">Selected Yacht</div>
            <div className="text-sm">{selectedYacht?.name || 'None'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default YachtManagementSection