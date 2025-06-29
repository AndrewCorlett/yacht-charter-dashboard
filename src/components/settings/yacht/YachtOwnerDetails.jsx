/**
 * Yacht Owner Details Component
 * 
 * Manages yacht owner contact information, emergency contacts, and communication
 * preferences. Provides a comprehensive interface for maintaining owner records
 * associated with each yacht in the fleet.
 * 
 * Integrates with the yacht_owner_details table in Supabase for data persistence.
 * 
 * @author AI Agent
 * @created 2025-06-28
 */

import { useState, useEffect } from 'react'
import { LABELS } from '../../../config/labels'

function YachtOwnerDetails({ yacht, onSave, loading }) {
  // [Owner Details State] - Current yacht owner information
  const [ownerDetails, setOwnerDetails] = useState({
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    owner_address_line1: '',
    owner_address_line2: '',
    owner_city: '',
    owner_postcode: '',
    owner_country: 'United Kingdom',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    contact_preferences: {
      preferred_method: 'email',
      best_time_to_contact: 'business_hours',
      emergency_contact_only: false
    },
    notes: ''
  })

  // [Form State] - Tracks changes and validation
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState({})

  // [Load Owner Data] - Initialize form with existing owner data
  useEffect(() => {
    if (yacht) {
      console.log('[YachtOwnerDetails] Loading owner data for yacht:', yacht.name)
      loadOwnerDetails()
    }
  }, [yacht])

  /**
   * [Load Owner Details] - Fetches owner data from Supabase
   */
  const loadOwnerDetails = async () => {
    try {
      // TODO: Implement Supabase query to fetch owner details
      // This would use: await supabase.from('yacht_owner_details').select('*').eq('yacht_id', yacht.id).single()
      
      // Mock owner data for now - replace with actual Supabase query
      const mockOwnerData = {
        owner_name: 'Captain James Wilson',
        owner_email: 'james.wilson@example.com',
        owner_phone: '+44 7700 900123',
        owner_address_line1: '123 Marina Way',
        owner_address_line2: 'Harbour View',
        owner_city: 'Portsmouth',
        owner_postcode: 'PO1 2AB',
        owner_country: 'United Kingdom',
        emergency_contact_name: 'Sarah Wilson',
        emergency_contact_phone: '+44 7700 900456',
        contact_preferences: {
          preferred_method: 'email',
          best_time_to_contact: 'business_hours',
          emergency_contact_only: false
        },
        notes: 'Prefers email communication. Available most weekdays 9-5.'
      }
      
      setOwnerDetails(mockOwnerData)
      setHasChanges(false)
      setErrors({})
      
    } catch (error) {
      console.error('[YachtOwnerDetails] Error loading owner details:', error)
    }
  }

  /**
   * [Handle Input Change] - Updates owner detail values and tracks changes
   * @param {string} field - Field name being updated
   * @param {string} value - New field value
   */
  const handleInputChange = (field, value) => {
    setOwnerDetails(prev => ({
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
   * [Handle Contact Preference Change] - Updates contact preferences
   * @param {string} preference - Preference key
   * @param {string} value - Preference value
   */
  const handleContactPreferenceChange = (preference, value) => {
    setOwnerDetails(prev => ({
      ...prev,
      contact_preferences: {
        ...prev.contact_preferences,
        [preference]: value
      }
    }))
    setHasChanges(true)
  }

  /**
   * [Validate Form] - Validates all owner detail fields
   * @returns {boolean} True if form is valid
   */
  const validateForm = () => {
    const newErrors = {}

    // Required fields validation
    if (!ownerDetails.owner_name.trim()) {
      newErrors.owner_name = 'Owner name is required'
    }

    // Email validation
    if (ownerDetails.owner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerDetails.owner_email)) {
      newErrors.owner_email = 'Please enter a valid email address'
    }

    // Phone validation (basic format check)
    if (ownerDetails.owner_phone && !/^[\+\d\s\-\(\)]+$/.test(ownerDetails.owner_phone)) {
      newErrors.owner_phone = 'Please enter a valid phone number'
    }

    // Emergency contact validation
    if (ownerDetails.emergency_contact_name && !ownerDetails.emergency_contact_phone) {
      newErrors.emergency_contact_phone = 'Emergency contact phone is required when name is provided'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * [Handle Save] - Validates and saves yacht owner details
   */
  const handleSave = () => {
    if (!validateForm()) {
      console.log('[YachtOwnerDetails] Form validation failed:', errors)
      return
    }

    console.log('[YachtOwnerDetails] Saving owner details:', ownerDetails)
    onSave({
      yacht_id: yacht.id,
      ...ownerDetails
    })
  }

  /**
   * [Handle Reset] - Resets form to original data
   */
  const handleReset = () => {
    loadOwnerDetails()
  }

  /**
   * [Render Input Field] - Renders input field with error handling
   * @param {string} label - Field label
   * @param {string} field - Field name
   * @param {string} type - Input type
   * @param {string} placeholder - Input placeholder
   * @param {boolean} required - Whether field is required
   * @returns {JSX.Element} Input field component
   */
  const renderInputField = (label, field, type = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={ownerDetails[field] || ''}
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
        value={ownerDetails[field] || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loading}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  const countries = [
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Ireland', label: 'Ireland' },
    { value: 'France', label: 'France' },
    { value: 'Germany', label: 'Germany' },
    { value: 'Netherlands', label: 'Netherlands' },
    { value: 'Spain', label: 'Spain' },
    { value: 'Other', label: 'Other' }
  ]

  const contactMethods = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'text', label: 'Text Message' },
    { value: 'either', label: 'Either Email or Phone' }
  ]

  const contactTimes = [
    { value: 'business_hours', label: 'Business Hours (9 AM - 5 PM)' },
    { value: 'evenings', label: 'Evenings (5 PM - 9 PM)' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'anytime', label: 'Anytime' }
  ]

  return (
    <div className="space-y-6">
      {/* [Header] - Section title and save status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            {LABELS.YACHT_MANAGEMENT.OWNER_DETAILS}
          </h3>
          <p className="text-gray-400 text-sm">
            Manage yacht owner contact information and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-yellow-400 text-sm">● Unsaved changes</span>
          )}
        </div>
      </div>

      {/* [Primary Contact Information] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>👤</span>
          Primary Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInputField(LABELS.OWNER.NAME, 'owner_name', 'text', 'Full name of yacht owner', true)}
          {renderInputField(LABELS.OWNER.EMAIL, 'owner_email', 'email', 'owner@example.com')}
          {renderInputField(LABELS.OWNER.PHONE, 'owner_phone', 'tel', '+44 7XXX XXXXXX')}
        </div>
      </div>

      {/* [Address Information] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>🏠</span>
          Address Information
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInputField(LABELS.OWNER.ADDRESS_LINE_1, 'owner_address_line1', 'text', 'Street address')}
            {renderInputField(LABELS.OWNER.ADDRESS_LINE_2, 'owner_address_line2', 'text', 'Apartment, suite, etc.')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInputField(LABELS.OWNER.CITY, 'owner_city', 'text', 'City')}
            {renderInputField(LABELS.OWNER.POSTCODE, 'owner_postcode', 'text', 'Postcode')}
            {renderSelectField(LABELS.OWNER.COUNTRY, 'owner_country', countries)}
          </div>
        </div>
      </div>

      {/* [Emergency Contact] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>🚨</span>
          Emergency Contact
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInputField(LABELS.OWNER.EMERGENCY_CONTACT_NAME, 'emergency_contact_name', 'text', 'Emergency contact name')}
          {renderInputField(LABELS.OWNER.EMERGENCY_CONTACT_PHONE, 'emergency_contact_phone', 'tel', '+44 7XXX XXXXXX')}
        </div>
      </div>

      {/* [Contact Preferences] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>📞</span>
          Contact Preferences
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Preferred Contact Method
              </label>
              <select
                value={ownerDetails.contact_preferences?.preferred_method || 'email'}
                onChange={(e) => handleContactPreferenceChange('preferred_method', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {contactMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Best Time to Contact
              </label>
              <select
                value={ownerDetails.contact_preferences?.best_time_to_contact || 'business_hours'}
                onChange={(e) => handleContactPreferenceChange('best_time_to_contact', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {contactTimes.map(time => (
                  <option key={time.value} value={time.value}>
                    {time.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="emergency_only"
              checked={ownerDetails.contact_preferences?.emergency_contact_only || false}
              onChange={(e) => handleContactPreferenceChange('emergency_contact_only', e.target.checked)}
              className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
              disabled={loading}
            />
            <label htmlFor="emergency_only" className="text-sm text-gray-300">
              Only contact for emergencies or urgent matters
            </label>
          </div>
        </div>
      </div>

      {/* [Additional Notes] */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span>📝</span>
          Additional Notes
        </h4>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {LABELS.OWNER.NOTES}
          </label>
          <textarea
            value={ownerDetails.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional information about the owner, special instructions, or preferences"
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
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
            {LABELS.ACTION.SAVE} {LABELS.YACHT_MANAGEMENT.OWNER_DETAILS}
          </button>
        </div>
      </div>
    </div>
  )
}

export default YachtOwnerDetails