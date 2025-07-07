/**
 * Yacht Selector Component
 * 
 * Displays a list of all available yachts and allows the operator to select
 * one for detailed management. Shows yacht cards with basic information
 * and provides visual feedback for the currently selected yacht.
 * 
 * Integrates with Supabase to fetch yacht data in real-time.
 * 
 * @author AI Agent
 * @created 2025-06-28
 */

import { useState, useEffect } from 'react'
import { LABELS } from '../../../config/labels'
import yachtService from '../../../services/supabase/YachtService'

function YachtSelector({ onYachtSelect, selectedYacht }) {
  // [Yachts State] - List of all available yachts
  const [yachts, setYachts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // [Load Yachts] - Fetch yacht list from Supabase
  useEffect(() => {
    loadYachts()
  }, [])

  /**
   * [Load Yachts Function] - Fetches yacht data from Supabase
   */
  const loadYachts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('[YachtSelector] Loading yachts from Supabase...')
      
      // Use YachtService to fetch real yacht data from database
      const yachtData = await yachtService.getYachts()
      setYachts(yachtData)
      console.log('[YachtSelector] Yachts loaded:', yachtData.length)
      
    } catch (loadError) {
      console.error('[YachtSelector] Error loading yachts:', loadError)
      setError('Failed to load yacht list. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * [Handle Yacht Selection] - Processes yacht selection and notifies parent
   * @param {Object} yacht - Selected yacht object
   */
  const handleYachtClick = (yacht) => {
    console.log('[YachtSelector] Yacht selected:', yacht.name)
    onYachtSelect(yacht)
  }

  /**
   * [Get Yacht Card Classes] - Returns CSS classes for yacht card styling
   * @param {Object} yacht - Yacht object to style
   * @returns {string} CSS classes
   */
  const getYachtCardClasses = (yacht) => {
    const baseClasses = 'bg-gray-800 rounded-lg p-6 border-2 cursor-pointer transition-all duration-200 hover:shadow-lg'
    
    if (selectedYacht?.id === yacht.id) {
      return `${baseClasses} border-blue-500 bg-blue-900/20`
    } else {
      return `${baseClasses} border-gray-700 hover:border-gray-600`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-400 text-sm">Loading yacht fleet...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-red-400 text-lg">❌</span>
          <span className="text-red-400 font-medium">Error Loading Yachts</span>
        </div>
        <p className="text-red-300 text-sm mb-3">{error}</p>
        <button
          onClick={loadYachts}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* [Yacht Grid] - Grid layout for yacht selection cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {yachts.map((yacht) => (
          <div
            key={yacht.id}
            onClick={() => handleYachtClick(yacht)}
            className={getYachtCardClasses(yacht)}
          >
            {/* [Yacht Card Header] - Yacht name and type */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">{yacht.name}</h4>
              <span className="text-blue-400 text-sm">{yacht.yacht_type}</span>
            </div>

            {/* [Yacht Quick Info] - Key specifications */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">{LABELS.YACHT.LOCATION}:</span>
                <span className="text-white">{yacht.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{LABELS.YACHT.LENGTH}:</span>
                <span className="text-white">{yacht.length_feet}ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{LABELS.YACHT.BERTHS}:</span>
                <span className="text-white">{yacht.berths}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{LABELS.YACHT.MAX_POB}:</span>
                <span className="text-white">{yacht.max_pob}</span>
              </div>
            </div>

            {/* [Selection Indicator] - Visual indicator for selected yacht */}
            {selectedYacht?.id === yacht.id && (
              <div className="mt-3 flex items-center gap-2 text-blue-400 text-sm">
                <span>✅</span>
                <span>Selected for editing</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* [Selection Status] - Show current selection info */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-white">
              {selectedYacht ? `Selected: ${selectedYacht.name}` : 'No yacht selected'}
            </h4>
            <p className="text-gray-400 text-sm">
              {selectedYacht 
                ? 'Click the tabs above to edit yacht details, owner information, or charter costs.'
                : 'Click on a yacht card above to select it for editing.'
              }
            </p>
          </div>
          <div className="text-2xl">
            {selectedYacht ? '⚓' : '🛥️'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default YachtSelector