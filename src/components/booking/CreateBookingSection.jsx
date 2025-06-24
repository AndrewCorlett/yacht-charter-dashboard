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
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h2 className="text-lg font-bold mb-4">CREATE BOOKING</h2>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Customer Information */}
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name *
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customerName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter customer name"
          />
          {errors.customerName && <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>}
        </div>

        <div>
          <label htmlFor="customerNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Number *
          </label>
          <input
            type="text"
            id="customerNumber"
            name="customerNumber"
            value={formData.customerNumber}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customerNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., C2401"
          />
          {errors.customerNumber && <p className="mt-1 text-xs text-red-600">{errors.customerNumber}</p>}
        </div>

        {/* Yacht Selection */}
        <div>
          <label htmlFor="yachtId" className="block text-sm font-medium text-gray-700 mb-1">
            Yacht *
          </label>
          <select
            id="yachtId"
            name="yachtId"
            value={formData.yachtId}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.yachtId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a yacht</option>
            {yachts.map(yacht => (
              <option key={yacht.id} value={yacht.id}>
                {yacht.name}
              </option>
            ))}
          </select>
          {errors.yachtId && <p className="mt-1 text-xs text-red-600">{errors.yachtId}</p>}
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
          </div>
        </div>

        {/* Trip Type */}
        <div>
          <label htmlFor="tripType" className="block text-sm font-medium text-gray-700 mb-1">
            Trip Type
          </label>
          <select
            id="tripType"
            name="tripType"
            value={formData.tripType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes or comments"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">{formData.notes.length}/500 characters</p>
        </div>

        {/* Deposit Paid Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="depositPaid"
            name="depositPaid"
            checked={formData.depositPaid}
            onChange={(e) => setFormData(prev => ({ ...prev, depositPaid: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="depositPaid" className="ml-2 block text-sm font-medium text-gray-700">
            Deposit Paid
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
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
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset Form
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md animate-fade-in">
            <p className="text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </p>
          </div>
        )}
        
        {/* Error Message */}
        {errors.submit && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md animate-fade-in">
            <p className="text-sm text-red-600 flex items-center">
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