/**
 * Yacht Charter Costs Component
 * 
 * Manages seasonal pricing and charter cost configuration for individual yachts.
 * Allows operators to define high/low/other seasons with specific date ranges,
 * charter totals, deposit amounts, and security deposits.
 * 
 * Integrates with the yacht_charter_costs table in Supabase for data persistence.
 * 
 * @author AI Agent
 * @created 2025-06-28
 */

import { useState, useEffect } from 'react'
import { LABELS } from '../../../config/labels'

function YachtCharterCosts({ yacht, onSave, loading }) {
  // [Charter Costs State] - List of seasonal pricing configurations
  const [charterCosts, setCharterCosts] = useState([])
  const [editingCost, setEditingCost] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // [New Season Form State] - For adding new seasonal pricing
  const [newSeason, setNewSeason] = useState({
    season_type: 'high',
    season_name: '',
    season_start_date: '',
    season_end_date: '',
    charter_total: '',
    deposit_amount: '',
    security_deposit: '',
    notes: ''
  })

  // [Form Validation State]
  const [errors, setErrors] = useState({})

  // [Load Charter Costs] - Initialize with existing cost data
  useEffect(() => {
    if (yacht) {
      console.log('[YachtCharterCosts] Loading charter costs for yacht:', yacht.name)
      loadCharterCosts()
    }
  }, [yacht])

  /**
   * [Load Charter Costs] - Fetches seasonal pricing from Supabase
   */
  const loadCharterCosts = async () => {
    try {
      // TODO: Implement Supabase query to fetch charter costs
      // This would use: await supabase.from('yacht_charter_costs').select('*').eq('yacht_id', yacht.id).order('season_start_date')
      
      // Mock charter costs data for now - replace with actual Supabase query
      const mockCharterCosts = [
        {
          id: '1',
          yacht_id: yacht.id,
          season_type: 'high',
          season_name: 'Summer High Season',
          season_start_date: '2024-06-01',
          season_end_date: '2024-08-31',
          charter_total: 2100.00,
          deposit_amount: 630.00,
          security_deposit: 500.00,
          notes: 'Peak summer season with highest demand',
          is_active: true
        },
        {
          id: '2',
          yacht_id: yacht.id,
          season_type: 'low',
          season_name: 'Winter Low Season',
          season_start_date: '2024-11-01',
          season_end_date: '2024-02-28',
          charter_total: 1200.00,
          deposit_amount: 360.00,
          security_deposit: 300.00,
          notes: 'Winter season with reduced rates',
          is_active: true
        },
        {
          id: '3',
          yacht_id: yacht.id,
          season_type: 'other',
          season_name: 'Spring/Autumn',
          season_start_date: '2024-03-01',
          season_end_date: '2024-05-31',
          charter_total: 1650.00,
          deposit_amount: 495.00,
          security_deposit: 400.00,
          notes: 'Shoulder season with moderate pricing',
          is_active: true
        }
      ]
      
      setCharterCosts(mockCharterCosts)
      setHasChanges(false)
      
    } catch (error) {
      console.error('[YachtCharterCosts] Error loading charter costs:', error)
    }
  }

  /**
   * [Validate Season Form] - Validates seasonal pricing form data
   * @param {Object} seasonData - Season data to validate
   * @returns {Object} Validation errors object
   */
  const validateSeasonForm = (seasonData) => {
    const validationErrors = {}

    // Required fields
    if (!seasonData.season_name.trim()) {
      validationErrors.season_name = 'Season name is required'
    }
    if (!seasonData.season_start_date) {
      validationErrors.season_start_date = 'Start date is required'
    }
    if (!seasonData.season_end_date) {
      validationErrors.season_end_date = 'End date is required'
    }
    if (!seasonData.charter_total || Number(seasonData.charter_total) <= 0) {
      validationErrors.charter_total = 'Charter total must be greater than 0'
    }
    if (!seasonData.deposit_amount || Number(seasonData.deposit_amount) <= 0) {
      validationErrors.deposit_amount = 'Deposit amount must be greater than 0'
    }

    // Date validation
    if (seasonData.season_start_date && seasonData.season_end_date) {
      if (new Date(seasonData.season_start_date) >= new Date(seasonData.season_end_date)) {
        validationErrors.season_end_date = 'End date must be after start date'
      }
    }

    // Financial validation
    if (seasonData.charter_total && seasonData.deposit_amount) {
      if (Number(seasonData.deposit_amount) > Number(seasonData.charter_total)) {
        validationErrors.deposit_amount = 'Deposit cannot exceed charter total'
      }
    }

    return validationErrors
  }

  /**
   * [Handle Add Season] - Adds new seasonal pricing
   */
  const handleAddSeason = () => {
    const validationErrors = validateSeasonForm(newSeason)
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const newCost = {
      id: Date.now().toString(), // Temporary ID for local state
      yacht_id: yacht.id,
      ...newSeason,
      charter_total: Number(newSeason.charter_total),
      deposit_amount: Number(newSeason.deposit_amount),
      security_deposit: Number(newSeason.security_deposit) || 0,
      is_active: true
    }

    setCharterCosts(prev => [...prev, newCost])
    setNewSeason({
      season_type: 'high',
      season_name: '',
      season_start_date: '',
      season_end_date: '',
      charter_total: '',
      deposit_amount: '',
      security_deposit: '',
      notes: ''
    })
    setShowAddForm(false)
    setErrors({})
    setHasChanges(true)

    console.log('[YachtCharterCosts] Added new season:', newCost)
  }

  /**
   * [Handle Edit Season] - Updates existing seasonal pricing
   * @param {Object} updatedSeason - Updated season data
   */
  const handleEditSeason = (updatedSeason) => {
    const validationErrors = validateSeasonForm(updatedSeason)
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setCharterCosts(prev => prev.map(cost => 
      cost.id === updatedSeason.id 
        ? { 
            ...updatedSeason, 
            charter_total: Number(updatedSeason.charter_total),
            deposit_amount: Number(updatedSeason.deposit_amount),
            security_deposit: Number(updatedSeason.security_deposit) || 0
          }
        : cost
    ))
    setEditingCost(null)
    setErrors({})
    setHasChanges(true)

    console.log('[YachtCharterCosts] Updated season:', updatedSeason)
  }

  /**
   * [Handle Delete Season] - Removes seasonal pricing
   * @param {string} costId - ID of season to delete
   */
  const handleDeleteSeason = (costId) => {
    if (confirm('Are you sure you want to delete this seasonal pricing? This action cannot be undone.')) {
      setCharterCosts(prev => prev.filter(cost => cost.id !== costId))
      setHasChanges(true)
      console.log('[YachtCharterCosts] Deleted season:', costId)
    }
  }

  /**
   * [Handle Save All] - Saves all charter cost changes
   */
  const handleSaveAll = () => {
    console.log('[YachtCharterCosts] Saving all charter costs:', charterCosts)
    onSave({
      yacht_id: yacht.id,
      charter_costs: charterCosts
    })
  }

  /**
   * [Get Season Type Badge] - Returns colored badge for season type
   * @param {string} seasonType - Season type (high, low, other)
   * @returns {JSX.Element} Season type badge
   */
  const getSeasonTypeBadge = (seasonType) => {
    const badgeClasses = {
      high: 'bg-red-100 text-red-800 border-red-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      other: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    
    const labels = {
      high: LABELS.CHARTER_COSTS.HIGH_SEASON,
      low: LABELS.CHARTER_COSTS.LOW_SEASON,
      other: LABELS.CHARTER_COSTS.OTHER_SEASON
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${badgeClasses[seasonType] || badgeClasses.other}`}>
        {labels[seasonType] || seasonType}
      </span>
    )
  }

  /**
   * [Render Season Form] - Renders form for adding/editing seasons
   * @param {Object} seasonData - Season data to edit (null for new)
   * @param {Function} onSubmit - Submit handler
   * @param {Function} onCancel - Cancel handler
   * @returns {JSX.Element} Season form component
   */
  const renderSeasonForm = (seasonData, onSubmit, onCancel) => (
    <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
      <h4 className="text-lg font-medium text-white mb-4">
        {seasonData ? 'Edit Season' : 'Add New Season'}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Season Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {LABELS.CHARTER_COSTS.SEASON_TYPE} *
          </label>
          <select
            value={seasonData?.season_type || newSeason.season_type}
            onChange={(e) => {
              if (seasonData) {
                setEditingCost({...editingCost, season_type: e.target.value})
              } else {
                setNewSeason({...newSeason, season_type: e.target.value})
              }
            }}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="high">High Season</option>
            <option value="low">Low Season</option>
            <option value="other">Other Season</option>
          </select>
        </div>

        {/* Season Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {LABELS.CHARTER_COSTS.SEASON_NAME} *
          </label>
          <input
            type="text"
            value={seasonData?.season_name || newSeason.season_name}
            onChange={(e) => {
              if (seasonData) {
                setEditingCost({...editingCost, season_name: e.target.value})
              } else {
                setNewSeason({...newSeason, season_name: e.target.value})
              }
            }}
            placeholder="e.g., Summer High Season"
            className={`w-full px-3 py-2 bg-gray-600 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.season_name ? 'border-red-500' : 'border-gray-500'
            }`}
          />
          {errors.season_name && <p className="text-red-400 text-xs mt-1">{errors.season_name}</p>}
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {LABELS.CHARTER_COSTS.SEASON_START_DATE} *
          </label>
          <input
            type="date"
            value={seasonData?.season_start_date || newSeason.season_start_date}
            onChange={(e) => {
              if (seasonData) {
                setEditingCost({...editingCost, season_start_date: e.target.value})
              } else {
                setNewSeason({...newSeason, season_start_date: e.target.value})
              }
            }}
            className={`w-full px-3 py-2 bg-gray-600 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.season_start_date ? 'border-red-500' : 'border-gray-500'
            }`}
          />
          {errors.season_start_date && <p className="text-red-400 text-xs mt-1">{errors.season_start_date}</p>}
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {LABELS.CHARTER_COSTS.SEASON_END_DATE} *
          </label>
          <input
            type="date"
            value={seasonData?.season_end_date || newSeason.season_end_date}
            onChange={(e) => {
              if (seasonData) {
                setEditingCost({...editingCost, season_end_date: e.target.value})
              } else {
                setNewSeason({...newSeason, season_end_date: e.target.value})
              }
            }}
            className={`w-full px-3 py-2 bg-gray-600 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.season_end_date ? 'border-red-500' : 'border-gray-500'
            }`}
          />
          {errors.season_end_date && <p className="text-red-400 text-xs mt-1">{errors.season_end_date}</p>}
        </div>

        {/* Charter Total */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {LABELS.CHARTER_COSTS.CHARTER_TOTAL} (£) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={seasonData?.charter_total || newSeason.charter_total}
            onChange={(e) => {
              if (seasonData) {
                setEditingCost({...editingCost, charter_total: e.target.value})
              } else {
                setNewSeason({...newSeason, charter_total: e.target.value})
              }
            }}
            placeholder="0.00"
            className={`w-full px-3 py-2 bg-gray-600 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.charter_total ? 'border-red-500' : 'border-gray-500'
            }`}
          />
          {errors.charter_total && <p className="text-red-400 text-xs mt-1">{errors.charter_total}</p>}
        </div>

        {/* Deposit Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {LABELS.CHARTER_COSTS.DEPOSIT_AMOUNT} (£) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={seasonData?.deposit_amount || newSeason.deposit_amount}
            onChange={(e) => {
              if (seasonData) {
                setEditingCost({...editingCost, deposit_amount: e.target.value})
              } else {
                setNewSeason({...newSeason, deposit_amount: e.target.value})
              }
            }}
            placeholder="0.00"
            className={`w-full px-3 py-2 bg-gray-600 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.deposit_amount ? 'border-red-500' : 'border-gray-500'
            }`}
          />
          {errors.deposit_amount && <p className="text-red-400 text-xs mt-1">{errors.deposit_amount}</p>}
        </div>

        {/* Security Deposit */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {LABELS.CHARTER_COSTS.SECURITY_DEPOSIT} (£)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={seasonData?.security_deposit || newSeason.security_deposit}
            onChange={(e) => {
              if (seasonData) {
                setEditingCost({...editingCost, security_deposit: e.target.value})
              } else {
                setNewSeason({...newSeason, security_deposit: e.target.value})
              }
            }}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          value={seasonData?.notes || newSeason.notes}
          onChange={(e) => {
            if (seasonData) {
              setEditingCost({...editingCost, notes: e.target.value})
            } else {
              setNewSeason({...newSeason, notes: e.target.value})
            }
          }}
          placeholder="Additional notes about this season"
          rows={3}
          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          {seasonData ? 'Update Season' : 'Add Season'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* [Header] - Section title and save status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            {LABELS.YACHT_MANAGEMENT.CHARTER_COSTS}
          </h3>
          <p className="text-gray-400 text-sm">
            Configure seasonal pricing and charter costs for {yacht?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-yellow-400 text-sm">● Unsaved changes</span>
          )}
        </div>
      </div>

      {/* [Current Seasons List] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-white flex items-center gap-2">
            <span>📊</span>
            {LABELS.CHARTER_COSTS.PRICING_TABLE}
          </h4>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm || editingCost}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>+</span>
            {LABELS.CHARTER_COSTS.ADD_SEASON}
          </button>
        </div>

        {/* [Existing Seasons] */}
        <div className="space-y-4">
          {charterCosts.map((cost) => (
            <div key={cost.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              {editingCost?.id === cost.id ? (
                renderSeasonForm(
                  editingCost,
                  () => handleEditSeason(editingCost),
                  () => setEditingCost(null)
                )
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="text-lg font-medium text-white">{cost.season_name}</h5>
                      {getSeasonTypeBadge(cost.season_type)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Period:</span>
                        <div className="text-white">
                          {new Date(cost.season_start_date).toLocaleDateString()} - {new Date(cost.season_end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Charter Total:</span>
                        <div className="text-white font-medium">£{cost.charter_total?.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Deposit:</span>
                        <div className="text-white">£{cost.deposit_amount?.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Security Deposit:</span>
                        <div className="text-white">£{cost.security_deposit?.toLocaleString() || '0'}</div>
                      </div>
                    </div>
                    {cost.notes && (
                      <div className="mt-2 text-sm text-gray-300">
                        <span className="text-gray-400">Notes:</span> {cost.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingCost(cost)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit season"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteSeason(cost.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete season"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* [Add New Season Form] */}
          {showAddForm && renderSeasonForm(
            null,
            handleAddSeason,
            () => {
              setShowAddForm(false)
              setNewSeason({
                season_type: 'high',
                season_name: '',
                season_start_date: '',
                season_end_date: '',
                charter_total: '',
                deposit_amount: '',
                security_deposit: '',
                notes: ''
              })
              setErrors({})
            }
          )}

          {/* [Empty State] */}
          {charterCosts.length === 0 && !showAddForm && (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-4">💰</div>
              <h4 className="text-lg font-medium mb-2">No seasonal pricing configured</h4>
              <p className="text-sm">Click "Add Season" to create your first seasonal pricing configuration.</p>
            </div>
          )}
        </div>
      </div>

      {/* [Action Buttons] */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-700">
        <button
          onClick={loadCharterCosts}
          disabled={loading}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset Changes
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={handleSaveAll}
            disabled={!hasChanges || loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {LABELS.ACTION.SAVE} Charter Costs
          </button>
        </div>
      </div>
    </div>
  )
}

export default YachtCharterCosts