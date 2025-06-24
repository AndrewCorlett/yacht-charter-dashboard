/**
 * Create Booking Section Component
 * 
 * Purpose: Provides a form interface for creating new yacht bookings
 * 
 * Design Decisions:
 * - Positioned in bottom left of viewport below SIT REP
 * - Matches existing design patterns and styling
 * - Integrates with existing booking system
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { useState } from 'react'

function CreateBookingSection({ onCreateBooking }) {
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerNumber: '',
    yachtId: '',
    startDate: '',
    endDate: '',
    tripType: 'charter',
    notes: '',
    depositPaid: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  // Available yachts (matching calendar data)
  const yachts = [
    { id: 'spectre', name: 'Spectre' },
    { id: 'disk-drive', name: 'Disk Drive' },
    { id: 'arriva', name: 'Arriva' },
    { id: 'zambada', name: 'Zambada' },
    { id: 'melba-so', name: 'Melba So' },
    { id: 'swansea', name: 'Swansea' }
  ]

  const tripTypes = [
    { value: 'charter', label: 'Charter' },
    { value: 'owner', label: 'Owner Use' },
    { value: 'maintenance', label: 'Maintenance' }
  ]

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage('')
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors = {}
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required'
    if (!formData.customerNumber.trim()) newErrors.customerNumber = 'Customer number is required'
    if (!formData.yachtId) newErrors.yachtId = 'Please select a yacht'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (!formData.endDate) newErrors.endDate = 'End date is required'
    
    // Date validation
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Call the booking creation handler
      if (onCreateBooking) {
        await onCreateBooking(formData)
      }
      
      // Reset form on success
      setFormData({
        customerName: '',
        customerNumber: '',
        yachtId: '',
        startDate: '',
        endDate: '',
        tripType: 'charter',
        notes: '',
        depositPaid: false
      })
      setErrors({})
      setSuccessMessage('Booking created successfully!')
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch {
      setErrors({ submit: 'Failed to create booking. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form reset
  const handleReset = () => {
    setFormData({
      customerName: '',
      customerNumber: '',
      yachtId: '',
      startDate: '',
      endDate: '',
      tripType: 'charter',
      notes: '',
      depositPaid: false
    })
    setErrors({})
    setSuccessMessage('')
  }

  return (
    <div className="ios-card mt-4" style={{ fontFamily: 'var(--font-family-ios)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-ios-text-primary)' }}>CREATE BOOKING</h2>
      
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Customer Information */}
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
            Customer Name *
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            className={`ios-input text-sm ${
              errors.customerName ? 'border-red-500' : ''
            }`}
            placeholder="Enter customer name"
          />
          {errors.customerName && <p className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.customerName}</p>}
        </div>

        <div>
          <label htmlFor="customerNumber" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
            Customer Number *
          </label>
          <input
            type="text"
            id="customerNumber"
            name="customerNumber"
            value={formData.customerNumber}
            onChange={handleInputChange}
            className={`ios-input text-sm ${
              errors.customerNumber ? 'border-red-500' : ''
            }`}
            placeholder="e.g., C2401"
          />
          {errors.customerNumber && <p className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.customerNumber}</p>}
        </div>

        {/* Yacht Selection */}
        <div>
          <label htmlFor="yachtId" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
            Yacht *
          </label>
          <select
            id="yachtId"
            name="yachtId"
            value={formData.yachtId}
            onChange={handleInputChange}
            className={`ios-select text-sm ${
              errors.yachtId ? 'border-red-500' : ''
            }`}
          >
            <option value="">Select a yacht</option>
            {yachts.map(yacht => (
              <option key={yacht.id} value={yacht.id}>
                {yacht.name}
              </option>
            ))}
          </select>
          {errors.yachtId && <p className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.yachtId}</p>}
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className={`ios-input text-sm ${
                errors.startDate ? 'border-red-500' : ''
              }`}
            />
            {errors.startDate && <p className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.startDate}</p>}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className={`ios-input text-sm ${
                errors.endDate ? 'border-red-500' : ''
              }`}
            />
            {errors.endDate && <p className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.endDate}</p>}
          </div>
        </div>

        {/* Trip Type */}
        <div>
          <label htmlFor="tripType" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
            Trip Type
          </label>
          <select
            id="tripType"
            name="tripType"
            value={formData.tripType}
            onChange={handleInputChange}
            className="ios-select text-sm"
          >
            {tripTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="ios-textarea text-sm"
            placeholder="Additional notes or comments"
            maxLength={500}
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--color-ios-text-tertiary)' }}>{formData.notes.length}/500 characters</p>
        </div>

        {/* Deposit Paid Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="depositPaid"
            name="depositPaid"
            checked={formData.depositPaid}
            onChange={(e) => setFormData(prev => ({ ...prev, depositPaid: e.target.checked }))}
            className="h-4 w-4 rounded"
            style={{ accentColor: 'var(--color-ios-blue)' }}
          />
          <label htmlFor="depositPaid" className="ml-2 block text-sm font-medium" style={{ color: 'var(--color-ios-text-secondary)' }}>
            Deposit Paid
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="ios-button w-full"
          >
            <span className="flex items-center justify-center">
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Creating Booking...' : 'Create Booking'}
            </span>
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="ios-button-secondary w-full"
          >
            Reset Form
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-2 p-2 rounded-lg border" style={{ 
            backgroundColor: 'rgba(52, 199, 89, 0.1)', 
            borderColor: 'rgba(52, 199, 89, 0.3)',
            borderRadius: 'var(--radius-ios)'
          }}>
            <p className="text-sm flex items-center" style={{ color: 'var(--color-ios-green)' }}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </p>
          </div>
        )}
        
        {/* Error Message */}
        {errors.submit && (
          <div className="mt-2 p-2 rounded-lg border" style={{ 
            backgroundColor: 'rgba(255, 59, 48, 0.1)', 
            borderColor: 'rgba(255, 59, 48, 0.3)',
            borderRadius: 'var(--radius-ios)'
          }}>
            <p className="text-sm flex items-center" style={{ color: 'var(--color-ios-red)' }}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.submit}
            </p>
          </div>
        )}
      </form>
    </div>
  )
}

export default CreateBookingSection