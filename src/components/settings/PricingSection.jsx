/**
 * Pricing Section Component
 * 
 * Manages yacht pricing configuration for different seasons. Allows operations staff
 * to set high and low season rates for each yacht individually. This data is used
 * when generating pricing documents and contracts.
 * 
 * Features:
 * - Individual yacht pricing management
 * - High season and low season rate configuration
 * - Real-time sync with Supabase backend
 * - Bulk pricing updates
 * - Season date range configuration
 * 
 * @author AI Agent
 * @created 2025-06-28
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { LABELS } from '../../config/labels'
import YachtPricingConfigService from '../../services/supabase/yachtPricingConfigService'

function PricingSection() {
  // [Pricing State] - Manages yacht pricing data and UI state
  const [pricingData, setPricingData] = useState([])
  const [yachts, setYachts] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [seasonDates, setSeasonDates] = useState({
    highSeasonStart: '2024-06-01',
    highSeasonEnd: '2024-09-30'
  })
  const [error, setError] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingChanges, setPendingChanges] = useState({})

  // [Load Data] - Fetch yachts and pricing data on component mount
  useEffect(() => {
    loadYachtsAndPricing()
  }, []) // Only run once on mount

  /**
   * [Load Yachts and Pricing] - Fetches yacht list and pricing data from Supabase
   */
  const loadYachtsAndPricing = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch yacht list and pricing configurations from Supabase
      const [yachtsData, pricingConfigsData] = await Promise.all([
        YachtPricingConfigService.getAllYachtsForPricing(),
        YachtPricingConfigService.getAllYachtPricingConfigs()
      ])
      
      // Transform pricing data to frontend format
      // If no pricing configs exist yet, create empty array
      const transformedPricingData = pricingConfigsData ? pricingConfigsData.map(config => 
        YachtPricingConfigService.transformFromDatabase(config)
      ) : []
      
      // Set season dates from first config if available
      if (transformedPricingData.length > 0) {
        const firstConfig = transformedPricingData[0]
        setSeasonDates({
          highSeasonStart: firstConfig.highSeasonStartDate,
          highSeasonEnd: firstConfig.highSeasonEndDate
        })
      }
      
      setYachts(yachtsData)
      setPricingData(transformedPricingData)
      
    } catch (error) {
      console.error('Error loading yachts and pricing:', error)
      setError('Failed to load yacht pricing data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * [Update Pricing] - Updates pricing for a specific yacht
   * @param {string} yachtId - ID of the yacht to update
   * @param {Object} newPricing - New pricing data
   */
  const updatePricing = async (yachtId, newPricing) => {
    setSaving(true)
    setError(null)
    try {
      // Prepare pricing data with season dates
      const pricingConfigData = {
        yachtId: yachtId,
        highSeasonStartDate: seasonDates.highSeasonStart,
        highSeasonEndDate: seasonDates.highSeasonEnd,
        highSeasonRate: newPricing.highSeasonRate,
        highSeasonDeposit: newPricing.highSeasonDeposit || newPricing.deposit,
        highSeasonSecurityDeposit: newPricing.highSeasonSecurityDeposit || newPricing.securityDeposit,
        lowSeasonRate: newPricing.lowSeasonRate,
        lowSeasonDeposit: newPricing.lowSeasonDeposit || newPricing.deposit,
        lowSeasonSecurityDeposit: newPricing.lowSeasonSecurityDeposit || newPricing.securityDeposit,
        currency: newPricing.currency || 'GBP',
        rateType: newPricing.rateType || 'weekly',
        minimumCharterDays: newPricing.minimumCharterDays || 7,
        updatedBy: 'admin'
      }
      
      // Save to Supabase
      const savedConfig = await YachtPricingConfigService.upsertYachtPricingConfig(
        YachtPricingConfigService.transformToDatabase(pricingConfigData)
      )
      
      // Transform and update local state
      const transformedConfig = YachtPricingConfigService.transformFromDatabase(savedConfig)
      
      setPricingData(prev => {
        const existingIndex = prev.findIndex(p => p.yachtId === yachtId)
        if (existingIndex >= 0) {
          // Update existing pricing
          const updated = [...prev]
          updated[existingIndex] = transformedConfig
          return updated
        } else {
          // Add new pricing
          return [...prev, transformedConfig]
        }
      })
      
      
    } catch (error) {
      console.error('Error updating pricing:', error)
      setError('Failed to save pricing configuration. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /**
   * [Save All Changes] - Saves all pending changes to Supabase
   */
  const saveAllChanges = async () => {
    if (!hasUnsavedChanges || Object.keys(pendingChanges).length === 0) {
      return
    }

    setSaving(true)
    setError(null)
    
    try {
      // Save each yacht's changes
      for (const [yachtId, changes] of Object.entries(pendingChanges)) {
        await updatePricing(yachtId, changes)
      }
      
      // Clear pending changes
      setPendingChanges({})
      setHasUnsavedChanges(false)
      
      console.log('All pricing changes saved successfully')
      
    } catch (error) {
      console.error('Error saving all changes:', error)
      setError('Failed to save some pricing changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /**
   * [Update Local Pricing] - Updates local pricing data and tracks changes
   */
  const updateLocalPricing = (yachtId, field, value) => {
    // Update the display data immediately
    setPricingData(prev => {
      const updated = [...prev]
      const index = updated.findIndex(p => p.yachtId === yachtId)
      
      if (index >= 0) {
        updated[index] = { ...updated[index], [field]: value }
      } else {
        // Create new pricing entry if it doesn't exist
        const newPricing = {
          yachtId,
          highSeasonRate: 1, // Default to 1 for rates that must be > 0
          lowSeasonRate: 1,  // Default to 1 for rates that must be > 0
          highSeasonDeposit: 0,
          lowSeasonDeposit: 0,
          highSeasonSecurityDeposit: 0,
          lowSeasonSecurityDeposit: 0,
          currency: 'GBP',
          rateType: 'weekly',
          [field]: value
        }
        updated.push(newPricing)
      }
      
      return updated
    })

    // Track pending changes
    setPendingChanges(prev => ({
      ...prev,
      [yachtId]: {
        ...prev[yachtId],
        [field]: value
      }
    }))
    
    setHasUnsavedChanges(true)
  }

  /**
   * [Get Yacht Pricing] - Gets pricing data for a specific yacht (memoized)
   * @param {string} yachtId - ID of the yacht
   * @returns {Object} Pricing data or default values
   */
  const getYachtPricing = useCallback((yachtId) => {
    return pricingData.find(p => p.yachtId === yachtId) || {
      highSeasonRate: 1, // Default to 1 for rates that must be > 0
      lowSeasonRate: 1,  // Default to 1 for rates that must be > 0
      highSeasonDeposit: 0,
      lowSeasonDeposit: 0,
      highSeasonSecurityDeposit: 0,
      lowSeasonSecurityDeposit: 0,
      deposit: 0, // Fallback for compatibility
      securityDeposit: 0, // Fallback for compatibility
      currency: 'GBP',
      rateType: 'weekly'
    }
  }, [pricingData])


  /**
   * [Inline Edit Input] - Compact inline editing input component
   */
  const InlineEditInput = ({ value, onChange, placeholder, className = "", yachtId, field, hasChanges = false }) => {
    const [inputValue, setInputValue] = useState(value || '')
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
      setInputValue(value || '')
    }, [value])

    const handleSave = () => {
      let newValue = parseFloat(inputValue)
      
      // Handle special validation for different field types
      if (isNaN(newValue)) {
        // For rate fields that must be > 0, default to 1
        if (field.includes('Rate')) {
          newValue = 1
        } else {
          // For deposit fields that can be >= 0, default to 0
          newValue = 0
        }
      } else if (field.includes('Rate') && newValue <= 0) {
        // Ensure rate fields are always > 0
        newValue = 1
      } else if (newValue < 0) {
        // Ensure no negative values
        newValue = 0
      }
      
      onChange(newValue)
      updateLocalPricing(yachtId, field, newValue)
      setIsEditing(false)
    }

    const handleCancel = () => {
      setInputValue(value || '')
      setIsEditing(false)
    }

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSave()
      } else if (e.key === 'Escape') {
        handleCancel()
      }
    }

    if (isEditing) {
      return (
        <div className="inline-flex items-center gap-1">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleSave}
            autoFocus
            className={`w-20 px-2 py-1 bg-gray-700 border border-blue-500 rounded text-xs focus:outline-none ${className}`}
            placeholder={placeholder}
          />
        </div>
      )
    }

    const displayClass = hasChanges 
      ? "cursor-pointer hover:bg-gray-700 px-1 py-0.5 rounded transition-colors border border-orange-500 bg-orange-900/20" 
      : "cursor-pointer hover:bg-gray-700 px-1 py-0.5 rounded transition-colors border border-transparent hover:border-gray-600"

    return (
      <span 
        onClick={() => setIsEditing(true)}
        className={displayClass}
        title={hasChanges ? "Unsaved changes - click to edit" : "Click to edit"}
      >
        £{(value || 0).toLocaleString()}
      </span>
    )
  }

  /**
   * [Pricing Row Component] - Individual yacht pricing row with inline editing
   */
  const PricingRow = ({ yacht }) => {
    const pricing = useMemo(() => getYachtPricing(yacht.id), [yacht.id, getYachtPricing])
    const yachtChanges = pendingChanges[yacht.id] || {}
    const hasAnyChanges = Object.keys(yachtChanges).length > 0

    const handleFieldChange = (field, value) => {
      // This is handled by the InlineEditInput component now
      console.log(`Field ${field} changed to ${value} for yacht ${yacht.id}`)
    }

    return (
      <tr className={`hover:bg-gray-800 transition-colors ${hasAnyChanges ? 'bg-orange-900/10' : ''}`}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <span className="text-lg mr-2">⚓</span>
            <div>
              <div className="text-sm font-medium flex items-center gap-2">
                {yacht.name}
                {hasAnyChanges && (
                  <span className="text-xs px-2 py-1 bg-orange-600 text-orange-100 rounded-full">
                    Unsaved
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">{yacht.engine_type || 'Yacht'} • {yacht.location || 'Unknown'}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium">
            <InlineEditInput
              value={pricing.highSeasonRate}
              onChange={handleFieldChange}
              placeholder="0"
              yachtId={yacht.id}
              field="highSeasonRate"
              hasChanges={yachtChanges.highSeasonRate !== undefined}
            />
          </div>
          <div className="text-xs text-gray-400">per week</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium">
            <InlineEditInput
              value={pricing.lowSeasonRate}
              onChange={handleFieldChange}
              placeholder="0"
              yachtId={yacht.id}
              field="lowSeasonRate"
              hasChanges={yachtChanges.lowSeasonRate !== undefined}
            />
          </div>
          <div className="text-xs text-gray-400">per week</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-1">
            <div className="text-sm font-medium">
              <InlineEditInput
                value={pricing.highSeasonDeposit || pricing.deposit}
                onChange={handleFieldChange}
                placeholder="0"
                yachtId={yacht.id}
                field="highSeasonDeposit"
                hasChanges={yachtChanges.highSeasonDeposit !== undefined}
              />
            </div>
            <div className="text-xs text-gray-400">High season</div>
            <div className="text-sm text-gray-300">
              <InlineEditInput
                value={pricing.lowSeasonDeposit || pricing.deposit}
                onChange={handleFieldChange}
                placeholder="0"
                yachtId={yacht.id}
                field="lowSeasonDeposit"
                hasChanges={yachtChanges.lowSeasonDeposit !== undefined}
              />
            </div>
            <div className="text-xs text-gray-400">Low season</div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-1">
            <div className="text-sm font-medium">
              <InlineEditInput
                value={pricing.highSeasonSecurityDeposit || pricing.securityDeposit}
                onChange={handleFieldChange}
                placeholder="0"
                yachtId={yacht.id}
                field="highSeasonSecurityDeposit"
                hasChanges={yachtChanges.highSeasonSecurityDeposit !== undefined}
              />
            </div>
            <div className="text-xs text-gray-400">High season</div>
            <div className="text-sm text-gray-300">
              <InlineEditInput
                value={pricing.lowSeasonSecurityDeposit || pricing.securityDeposit}
                onChange={handleFieldChange}
                placeholder="0"
                yachtId={yacht.id}
                field="lowSeasonSecurityDeposit"
                hasChanges={yachtChanges.lowSeasonSecurityDeposit !== undefined}
              />
            </div>
            <div className="text-xs text-gray-400">Low season</div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm">{pricing.currency || 'GBP'}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-xs text-gray-400">
            Click values to edit
          </div>
        </td>
      </tr>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-400">Loading pricing data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* [Pricing Header] - Section title and description */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{LABELS.SETTINGS.PRICING}</h2>
        <p className="text-gray-400">
          Configure yacht pricing for different seasons. These rates will be used when generating
          invoices and contracts for customers. All changes are automatically synced to the database.
        </p>
      </div>

      {/* [Unsaved Changes Banner] */}
      {hasUnsavedChanges && (
        <div className="bg-orange-900/50 border border-orange-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-orange-400 mr-2">⚠️</span>
              <span className="text-orange-200">
                You have unsaved pricing changes. Click "Save All Changes" to persist them to the database.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveAllChanges}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  <>💾 Save All Changes</>
                )}
              </button>
              <button
                onClick={() => {
                  setPendingChanges({})
                  setHasUnsavedChanges(false)
                  loadYachtsAndPricing() // Reload original data
                }}
                disabled={saving}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                🔄 Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [Error Display] */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-400 mr-2">⚠️</span>
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* [Season Configuration] - Define high and low season date ranges */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-medium mb-4">📅 Season Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-orange-400">☀️ {LABELS.SEASON.HIGH_SEASON}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={seasonDates.highSeasonStart}
                  onChange={(e) => setSeasonDates(prev => ({ ...prev, highSeasonStart: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={seasonDates.highSeasonEnd}
                  onChange={(e) => setSeasonDates(prev => ({ ...prev, highSeasonEnd: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-blue-400">❄️ {LABELS.SEASON.LOW_SEASON}</h4>
            <div className="bg-gray-700 rounded p-4">
              <p className="text-sm text-gray-300 mb-2">
                Low season automatically applies to all dates outside the high season period.
              </p>
              <p className="text-xs text-gray-400">
                Current low season: All dates except {seasonDates.highSeasonStart} to {seasonDates.highSeasonEnd}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* [Pricing Table] - Main pricing configuration table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium">⚓ Yacht Pricing Configuration</h3>
          <p className="text-sm text-gray-400 mt-1">
            Click {LABELS.ACTION.EDIT} to modify rates. Changes are saved immediately to Supabase.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {LABELS.YACHT.NAME}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {LABELS.PRICING.HIGH_SEASON_RATE}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {LABELS.PRICING.LOW_SEASON_RATE}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Deposit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Security Deposit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {LABELS.PRICING.CURRENCY}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {yachts.map((yacht) => (
                <PricingRow key={yacht.id} yacht={yacht} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default PricingSection