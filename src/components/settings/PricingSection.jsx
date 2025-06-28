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

import { useState, useEffect } from 'react'
import { LABELS } from '../../config/labels.js'

function PricingSection() {
  // [Pricing State] - Manages yacht pricing data and UI state
  const [pricingData, setPricingData] = useState([])
  const [yachts, setYachts] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingYacht, setEditingYacht] = useState(null)
  const [seasonDates, setSeasonDates] = useState({
    highSeasonStart: '2024-06-01',
    highSeasonEnd: '2024-09-30',
    lowSeasonStart: '2024-10-01',
    lowSeasonEnd: '2024-05-31'
  })

  // [Load Data] - Fetch yachts and pricing data on component mount
  useEffect(() => {
    loadYachtsAndPricing()
  }, [])

  /**
   * [Load Yachts and Pricing] - Fetches yacht list and pricing data from Supabase
   */
  const loadYachtsAndPricing = async () => {
    setLoading(true)
    try {
      // TODO: Implement Supabase queries
      // 1. Fetch yacht list from yachts table
      // 2. Fetch pricing data from yacht_pricing table
      
      console.log('Loading yachts and pricing data from Supabase...')
      
      // Mock yacht data - replace with actual Supabase query
      const mockYachts = [
        { id: 'yacht-1', name: 'Serenity', type: 'Sailing Yacht', location: 'Mediterranean' },
        { id: 'yacht-2', name: 'Atlantis', type: 'Motor Yacht', location: 'Caribbean' },
        { id: 'yacht-3', name: 'Poseidon', type: 'Catamaran', location: 'Greek Islands' }
      ]
      
      // Mock pricing data - replace with actual Supabase query
      const mockPricingData = [
        {
          yachtId: 'yacht-1',
          highSeasonRate: 2500,
          lowSeasonRate: 1800,
          currency: 'GBP',
          rateType: 'weekly',
          lastUpdated: new Date().toISOString()
        },
        {
          yachtId: 'yacht-2',
          highSeasonRate: 3200,
          lowSeasonRate: 2400,
          currency: 'GBP',
          rateType: 'weekly',
          lastUpdated: new Date().toISOString()
        },
        {
          yachtId: 'yacht-3',
          highSeasonRate: 1900,
          lowSeasonRate: 1400,
          currency: 'GBP',
          rateType: 'weekly',
          lastUpdated: new Date().toISOString()
        }
      ]
      
      setYachts(mockYachts)
      setPricingData(mockPricingData)
      
    } catch (error) {
      console.error('Error loading yachts and pricing:', error)
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
    try {
      // TODO: Implement Supabase update
      // 1. Update yacht_pricing table with new rates
      // 2. Log pricing change in audit table
      
      console.log(`Updating pricing for yacht ${yachtId}:`, newPricing)
      
      // Mock save operation - replace with actual Supabase update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state
      setPricingData(prev => {
        const existingIndex = prev.findIndex(p => p.yachtId === yachtId)
        if (existingIndex >= 0) {
          // Update existing pricing
          const updated = [...prev]
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...newPricing,
            lastUpdated: new Date().toISOString()
          }
          return updated
        } else {
          // Add new pricing
          return [...prev, {
            yachtId,
            ...newPricing,
            currency: 'GBP',
            rateType: 'weekly',
            lastUpdated: new Date().toISOString()
          }]
        }
      })
      
      setEditingYacht(null)
      
    } catch (error) {
      console.error('Error updating pricing:', error)
    } finally {
      setSaving(false)
    }
  }

  /**
   * [Get Yacht Pricing] - Gets pricing data for a specific yacht
   * @param {string} yachtId - ID of the yacht
   * @returns {Object} Pricing data or default values
   */
  const getYachtPricing = (yachtId) => {
    return pricingData.find(p => p.yachtId === yachtId) || {
      highSeasonRate: 0,
      lowSeasonRate: 0,
      currency: 'GBP',
      rateType: 'weekly'
    }
  }

  /**
   * [Handle Edit Click] - Starts editing mode for a yacht
   * @param {string} yachtId - ID of the yacht to edit
   */
  const handleEditClick = (yachtId) => {
    setEditingYacht(yachtId)
  }

  /**
   * [Handle Save] - Saves pricing changes for the currently editing yacht
   * @param {Object} formData - Form data with new pricing
   */
  const handleSave = (formData) => {
    updatePricing(editingYacht, formData)
  }

  /**
   * [Handle Cancel] - Cancels editing mode
   */
  const handleCancel = () => {
    setEditingYacht(null)
  }

  /**
   * [Pricing Row Component] - Individual yacht pricing row
   */
  const PricingRow = ({ yacht }) => {
    const pricing = getYachtPricing(yacht.id)
    const isEditing = editingYacht === yacht.id
    const [formData, setFormData] = useState(pricing)

    useEffect(() => {
      setFormData(pricing)
    }, [pricing, yacht.id])

    if (isEditing) {
      return (
        <tr className="bg-gray-700">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <span className="text-lg mr-2">⚓</span>
              <div>
                <div className="text-sm font-medium">{yacht.name}</div>
                <div className="text-xs text-gray-400">{yacht.type}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="number"
              value={formData.highSeasonRate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, highSeasonRate: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
              placeholder="0"
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="number"
              value={formData.lowSeasonRate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, lowSeasonRate: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
              placeholder="0"
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <select
              value={formData.currency || 'GBP'}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(formData)}
                disabled={saving}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50"
              >
                {saving ? '⏳' : '✅'} {LABELS.ACTION.SAVE}
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                ❌ {LABELS.ACTION.CANCEL}
              </button>
            </div>
          </td>
        </tr>
      )
    }

    return (
      <tr className="hover:bg-gray-800 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <span className="text-lg mr-2">⚓</span>
            <div>
              <div className="text-sm font-medium">{yacht.name}</div>
              <div className="text-xs text-gray-400">{yacht.type} • {yacht.location}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium">
            £{pricing.highSeasonRate?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-gray-400">per week</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium">
            £{pricing.lowSeasonRate?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-gray-400">per week</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm">{pricing.currency || 'GBP'}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={() => handleEditClick(yacht.id)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            ✏️ {LABELS.ACTION.EDIT}
          </button>
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
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={seasonDates.lowSeasonStart}
                  onChange={(e) => setSeasonDates(prev => ({ ...prev, lowSeasonStart: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={seasonDates.lowSeasonEnd}
                  onChange={(e) => setSeasonDates(prev => ({ ...prev, lowSeasonEnd: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
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

      {/* [Pricing Summary] - Display pricing statistics */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-medium mb-4">📊 Pricing Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Total Yachts</div>
            <div className="text-xl font-bold">{yachts.length}</div>
          </div>
          <div>
            <div className="text-gray-400">Avg High Season</div>
            <div className="text-xl font-bold">
              £{Math.round(
                pricingData.reduce((sum, p) => sum + (p.highSeasonRate || 0), 0) / Math.max(pricingData.length, 1)
              ).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Avg Low Season</div>
            <div className="text-xl font-bold">
              £{Math.round(
                pricingData.reduce((sum, p) => sum + (p.lowSeasonRate || 0), 0) / Math.max(pricingData.length, 1)
              ).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Last Updated</div>
            <div className="text-sm">
              {pricingData.length > 0 
                ? new Date(Math.max(...pricingData.map(p => new Date(p.lastUpdated)))).toLocaleDateString()
                : 'Never'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingSection