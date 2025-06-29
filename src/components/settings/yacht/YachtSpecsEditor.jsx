/**
 * Yacht Specifications Editor Component
 * 
 * Provides a comprehensive interface for editing yacht technical specifications
 * and details including dimensions, capacities, equipment, and general information.
 * 
 * Features real-time updates to Supabase and validation for all input fields.
 * 
 * @author AI Agent
 * @created 2025-06-28
 */

import { useState, useEffect } from 'react'
import { LABELS } from '../../../config/labels'

function YachtSpecsEditor({ yacht, onSave, loading }) {
  // [Specifications State] - Current yacht specification data
  const [specs, setSpecs] = useState({
    // Basic Information
    name: '',
    yacht_type: '',
    location: '',
    year_built: '',
    description: '',
    
    // Dimensions
    length_feet: '',
    beam_meters: '',
    draft_meters: '',
    
    // Accommodation
    cabins: '',
    berths: '',
    max_pob: '',
    
    // Capacities
    fuel_capacity_liters: '',
    water_capacity_liters: '',
    
    // Technical
    engine_type: '',
    
    // Insurance
    insurance_policy_number: '',
    insurance_expiry_date: '',
    
    // Pricing
    daily_rate: '',
    weekly_rate: ''
  })

  // [Form State] - Tracks changes and validation
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState({})

  // [Load Yacht Data] - Initialize form with yacht data
  useEffect(() => {
    if (yacht) {
      console.log('[YachtSpecsEditor] Loading yacht data:', yacht.name)
      setSpecs({
        name: yacht.name || '',
        yacht_type: yacht.yacht_type || '',
        location: yacht.location || '',
        year_built: yacht.year_built || '',
        description: yacht.description || '',
        length_feet: yacht.length_feet || '',
        beam_meters: yacht.beam_meters || '',
        draft_meters: yacht.draft_meters || '',
        cabins: yacht.cabins || '',
        berths: yacht.berths || '',
        max_pob: yacht.max_pob || '',
        fuel_capacity_liters: yacht.fuel_capacity_liters || '',
        water_capacity_liters: yacht.water_capacity_liters || '',
        engine_type: yacht.engine_type || '',
        insurance_policy_number: yacht.insurance_policy_number || '',
        insurance_expiry_date: yacht.insurance_expiry_date || '',
        daily_rate: yacht.daily_rate || '',
        weekly_rate: yacht.weekly_rate || ''
      })
      setHasChanges(false)
      setErrors({})
    }
  }, [yacht])

  /**
   * [Handle Input Change] - Updates specification values and tracks changes
   * @param {string} field - Field name being updated
   * @param {string} value - New field value
   */
  const handleInputChange = (field, value) => {
    setSpecs(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  /**
   * [Validate Form] - Validates all specification fields
   * @returns {boolean} True if form is valid
   */
  const validateForm = () => {
    const newErrors = {}

    // Required fields validation
    if (!specs.name.trim()) {
      newErrors.name = 'Yacht name is required'
    }

    // Numeric field validation
    const numericFields = ['length_feet', 'year_built', 'cabins', 'berths', 'max_pob', 'daily_rate', 'weekly_rate']
    numericFields.forEach(field => {
      if (specs[field] && isNaN(Number(specs[field]))) {
        newErrors[field] = 'Must be a valid number'
      }
    })

    // Year validation
    if (specs.year_built && (specs.year_built < 1900 || specs.year_built > new Date().getFullYear() + 1)) {
      newErrors.year_built = 'Year must be between 1900 and next year'
    }

    // Capacity validation
    if (specs.berths && specs.max_pob && Number(specs.max_pob) < Number(specs.berths)) {
      newErrors.max_pob = 'Maximum persons on board cannot be less than berths'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * [Handle Save] - Validates and saves yacht specifications
   */
  const handleSave = () => {
    if (!validateForm()) {
      console.log('[YachtSpecsEditor] Form validation failed:', errors)
      return
    }

    console.log('[YachtSpecsEditor] Saving yacht specifications:', specs)
    onSave(specs)
  }

  /**
   * [Handle Reset] - Resets form to original yacht data
   */
  const handleReset = () => {
    if (yacht) {
      setSpecs({
        name: yacht.name || '',
        yacht_type: yacht.yacht_type || '',
        location: yacht.location || '',
        year_built: yacht.year_built || '',
        description: yacht.description || '',
        length_feet: yacht.length_feet || '',
        beam_meters: yacht.beam_meters || '',
        draft_meters: yacht.draft_meters || '',
        cabins: yacht.cabins || '',
        berths: yacht.berths || '',
        max_pob: yacht.max_pob || '',
        fuel_capacity_liters: yacht.fuel_capacity_liters || '',
        water_capacity_liters: yacht.water_capacity_liters || '',
        engine_type: yacht.engine_type || '',
        insurance_policy_number: yacht.insurance_policy_number || '',
        insurance_expiry_date: yacht.insurance_expiry_date || '',
        daily_rate: yacht.daily_rate || '',
        weekly_rate: yacht.weekly_rate || ''
      })
      setHasChanges(false)
      setErrors({})
    }
  }

  /**
   * [Render Input Field] - Renders input field with error handling
   * @param {string} label - Field label
   * @param {string} field - Field name
   * @param {string} type - Input type
   * @param {string} placeholder - Input placeholder
   * @returns {JSX.Element} Input field component
   */
  const renderInputField = (label, field, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={specs[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors[field] ? 'border-red-500' : 'border-gray-600'
        }`}
        disabled={loading}
      />
      {errors[field] && (
        <p className="text-red-400 text-xs mt-1">{errors[field]}</p>
      )}
    </div>
  )

  /**
   * [Render Select Field] - Renders select field with options
   * @param {string} label - Field label
   * @param {string} field - Field name
   * @param {Array} options - Select options
   * @returns {JSX.Element} Select field component
   */
  const renderSelectField = (label, field, options) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <select
        value={specs[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors[field] ? 'border-red-500' : 'border-gray-600'
        }`}
        disabled={loading}
      >
        <option value="">Select {label}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errors[field] && (
        <p className="text-red-400 text-xs mt-1">{errors[field]}</p>
      )}
    </div>
  )

  const yachtTypes = [
    { value: 'Sailing Yacht', label: 'Sailing Yacht' },
    { value: 'Motor Yacht', label: 'Motor Yacht' },
    { value: 'Catamaran', label: 'Catamaran' },
    { value: 'Trimaran', label: 'Trimaran' },
    { value: 'Gulet', label: 'Gulet' },
    { value: 'Powerboat', label: 'Powerboat' }
  ]

  return (
    <div className="space-y-6">
      {/* [Header] - Section title and save status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            {LABELS.YACHT_MANAGEMENT.YACHT_DETAILS}
          </h3>
          <p className="text-gray-400 text-sm">
            Edit yacht specifications and technical details
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-yellow-400 text-sm">● Unsaved changes</span>
          )}
        </div>
      </div>

      {/* [Basic Information Section] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>ℹ️</span>
          Basic Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInputField(LABELS.YACHT.NAME, 'name', 'text', 'Enter yacht name')}
          {renderSelectField(LABELS.YACHT.TYPE, 'yacht_type', yachtTypes)}
          {renderInputField(LABELS.YACHT.LOCATION, 'location', 'text', 'Home port or location')}
          {renderInputField(LABELS.YACHT.YEAR_BUILT, 'year_built', 'number', 'Year built')}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {LABELS.YACHT.DESCRIPTION}
          </label>
          <textarea
            value={specs.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Yacht description and features"
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
      </div>

      {/* [Dimensions Section] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>📏</span>
          Dimensions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderInputField(LABELS.YACHT.LENGTH + ' (feet)', 'length_feet', 'number', 'Length in feet')}
          {renderInputField(LABELS.YACHT.BEAM + ' (meters)', 'beam_meters', 'number', 'Beam in meters')}
          {renderInputField(LABELS.YACHT.DRAFT + ' (meters)', 'draft_meters', 'number', 'Draft in meters')}
        </div>
      </div>

      {/* [Accommodation Section] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>🛏️</span>
          Accommodation
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderInputField(LABELS.YACHT.CABINS, 'cabins', 'number', 'Number of cabins')}
          {renderInputField(LABELS.YACHT.BERTHS, 'berths', 'number', 'Number of berths')}
          {renderInputField(LABELS.YACHT.MAX_POB, 'max_pob', 'number', 'Maximum persons on board')}
        </div>
      </div>

      {/* [Technical Specifications Section] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>⚙️</span>
          Technical Specifications
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderInputField(LABELS.YACHT.ENGINE_TYPE, 'engine_type', 'text', 'Engine type and specifications')}
          {renderInputField(LABELS.YACHT.FUEL_CAPACITY, 'fuel_capacity_liters', 'number', 'Fuel capacity in liters')}
          {renderInputField(LABELS.YACHT.WATER_CAPACITY, 'water_capacity_liters', 'number', 'Water capacity in liters')}
        </div>
      </div>

      {/* [Insurance Section] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>🛡️</span>
          Insurance Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInputField(LABELS.YACHT.INSURANCE_POLICY, 'insurance_policy_number', 'text', 'Insurance policy number')}
          {renderInputField(LABELS.YACHT.INSURANCE_EXPIRY, 'insurance_expiry_date', 'date')}
        </div>
      </div>

      {/* [Pricing Section] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>💰</span>
          Base Pricing
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInputField(LABELS.YACHT.DAILY_RATE + ' (£)', 'daily_rate', 'number', 'Daily rate in pounds')}
          {renderInputField(LABELS.YACHT.WEEKLY_RATE + ' (£)', 'weekly_rate', 'number', 'Weekly rate in pounds')}
        </div>
      </div>

      {/* [Action Buttons] */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-700">
        <button
          onClick={handleReset}
          disabled={!hasChanges || loading}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {LABELS.ACTION.CANCEL}
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges || loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {LABELS.ACTION.SAVE} {LABELS.YACHT_MANAGEMENT.YACHT_DETAILS}
          </button>
        </div>
      </div>
    </div>
  )
}

export default YachtSpecsEditor