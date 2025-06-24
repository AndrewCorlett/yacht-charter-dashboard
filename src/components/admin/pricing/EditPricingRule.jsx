/**
 * Edit Pricing Rule Modal Component
 * 
 * Purpose: Modal form for editing existing yacht pricing rules
 * Pre-populates form with existing data and validates changes
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { useState, useEffect } from 'react'
import Modal from '../../common/Modal'
import { ActionButton } from '../AdminConfigLayout'

function EditPricingRule({ isOpen, onClose, onSave, pricingRule }) {
  const [formData, setFormData] = useState({
    yachtId: '',
    ruleType: 'base',
    rateType: 'daily',
    rate: '',
    currency: 'EUR',
    startDate: '',
    endDate: '',
    minHours: '4',
    priority: '1',
    isActive: true
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const yachts = [
    { id: 'spectre', name: 'Spectre' },
    { id: 'diskdrive', name: 'Disk Drive' },
    { id: 'arriva', name: 'Arriva' },
    { id: 'zambada', name: 'Zambada' },
    { id: 'melba', name: 'Melba So' }
  ]

  const ruleTypes = [
    { id: 'base', name: 'Base Rate', description: 'Standard daily/hourly pricing' },
    { id: 'seasonal', name: 'Seasonal', description: 'Seasonal rate adjustments' },
    { id: 'special', name: 'Special Offer', description: 'Promotional pricing' }
  ]

  const currencies = ['EUR', 'USD', 'GBP']

  // Populate form when pricing rule changes
  useEffect(() => {
    if (pricingRule && isOpen) {
      const newFormData = {
        yachtId: pricingRule.yachtId || '',
        ruleType: pricingRule.ruleType || 'base',
        rateType: pricingRule.rateType || 'daily',
        rate: pricingRule.rate?.toString() || '',
        currency: pricingRule.currency || 'EUR',
        startDate: pricingRule.startDate || '',
        endDate: pricingRule.endDate || '',
        minHours: pricingRule.minHours?.toString() || '4',
        priority: pricingRule.priority?.toString() || '1',
        isActive: pricingRule.isActive !== undefined ? pricingRule.isActive : true
      }
      setFormData(newFormData)
      setHasChanges(false)
    }
  }, [pricingRule, isOpen])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.yachtId) newErrors.yachtId = 'Yacht is required'
    if (!formData.rate || isNaN(formData.rate) || parseFloat(formData.rate) <= 0) {
      newErrors.rate = 'Valid rate is required'
    }
    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (!formData.endDate) newErrors.endDate = 'End date is required'
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date'
    }
    if (!formData.minHours || isNaN(formData.minHours) || parseInt(formData.minHours) < 1) {
      newErrors.minHours = 'Minimum hours must be at least 1'
    }
    if (!formData.priority || isNaN(formData.priority) || parseInt(formData.priority) < 1) {
      newErrors.priority = 'Priority must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const yachtName = yachts.find(y => y.id === formData.yachtId)?.name || formData.yachtId
      
      const updatedRule = {
        ...pricingRule,
        yachtName,
        ...formData,
        rate: parseFloat(formData.rate),
        minHours: parseInt(formData.minHours),
        priority: parseInt(formData.priority)
      }

      await onSave(updatedRule)
      handleClose()
    } catch (error) {
      setErrors({ submit: 'Failed to update pricing rule. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      )
      if (!confirmClose) return
    }

    setFormData({
      yachtId: '',
      ruleType: 'base',
      rateType: 'daily',
      rate: '',
      currency: 'EUR',
      startDate: '',
      endDate: '',
      minHours: '4',
      priority: '1',
      isActive: true
    })
    setErrors({})
    setIsSubmitting(false)
    setHasChanges(false)
    onClose()
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen || !pricingRule) return null

  return (
    <Modal onClose={handleClose} title={`Edit Pricing Rule - ${pricingRule.yachtName}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{errors.submit}</div>
          </div>
        )}

        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-yellow-800">
              <strong>Unsaved changes:</strong> Remember to save your changes before closing.
            </div>
          </div>
        )}

        {/* Rule ID Display */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="text-sm text-gray-600">
            <strong>Rule ID:</strong> {pricingRule.id}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Created:</strong> {new Date(pricingRule.id).toLocaleString()}
          </div>
        </div>

        {/* Yacht Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yacht *
          </label>
          <select
            value={formData.yachtId}
            onChange={(e) => handleInputChange('yachtId', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 ${
              errors.yachtId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a yacht</option>
            {yachts.map(yacht => (
              <option key={yacht.id} value={yacht.id}>{yacht.name}</option>
            ))}
          </select>
          {errors.yachtId && (
            <p className="mt-1 text-sm text-red-600">{errors.yachtId}</p>
          )}
        </div>

        {/* Rule Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rule Type
          </label>
          <div className="space-y-2">
            {ruleTypes.map(type => (
              <label key={type.id} className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="ruleType"
                  value={type.id}
                  checked={formData.ruleType === type.id}
                  onChange={(e) => handleInputChange('ruleType', e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">{type.name}</div>
                  <div className="text-sm text-gray-500">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Rate and Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.rate}
              onChange={(e) => handleInputChange('rate', e.target.value)}
              placeholder="2500.00"
              className={`w-full border rounded-md px-3 py-2 ${
                errors.rate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.rate && (
              <p className="mt-1 text-sm text-red-600">{errors.rate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Rate Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rate Type
          </label>
          <select
            value={formData.rateType}
            onChange={(e) => handleInputChange('rateType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="daily">Daily Rate</option>
            <option value="hourly">Hourly Rate</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 ${
                errors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 ${
                errors.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* Additional Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Hours *
            </label>
            <input
              type="number"
              min="1"
              value={formData.minHours}
              onChange={(e) => handleInputChange('minHours', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 ${
                errors.minHours ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.minHours && (
              <p className="mt-1 text-sm text-red-600">{errors.minHours}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <input
              type="number"
              min="1"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 ${
                errors.priority ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Higher numbers take precedence
            </p>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
            )}
          </div>
        </div>

        {/* Active Status */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Active (rule will be applied immediately)
            </span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {hasChanges ? 'You have unsaved changes' : 'No changes made'}
          </div>
          
          <div className="flex items-center space-x-3">
            <ActionButton
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </ActionButton>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default EditPricingRule