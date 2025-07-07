/**
 * External Booking Form Component
 * Provides a form for creating external booking placeholders
 * to reserve booking numbers for bookings made outside the system
 * 
 * @created 2025-07-05
 */

import React, { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import BookingService from '../../services/supabase/BookingService'
import YachtService from '../../services/supabase/YachtService'

/**
 * ExternalBookingForm Component
 * @param {Object} props Component props
 * @param {Function} props.onSave - Callback when external booking is created
 * @param {Function} props.onCancel - Callback when form is cancelled
 * @param {boolean} props.isOpen - Whether the form is open
 * @returns {JSX.Element} Form component
 */
export function ExternalBookingForm({ onSave, onCancel, isOpen }) {
  const [formData, setFormData] = useState({
    yacht_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    booking_number: '',
    customer_first_name: 'External',
    customer_surname: 'Booking',
    customer_email: 'external@placeholder.com',
    notes: ''
  })
  
  const [yachts, setYachts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Booking number format validation pattern (YYWWBCNN)
  const BOOKING_NUMBER_PATTERN = /^\d{2}\d{2}[A-Z]{2}\d{2}$/

  useEffect(() => {
    if (isOpen) {
      loadYachts()
    }
  }, [isOpen])

  const loadYachts = async () => {
    setIsLoading(true)
    try {
      const yachtService = new YachtService()
      const yachtList = await yachtService.getYachts()
      setYachts(yachtList || [])
    } catch (err) {
      console.error('Failed to load yachts:', err)
      setError('Failed to load yachts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'booking_number' ? value.toUpperCase() : value
    }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.yacht_id) {
      setError('Please select a yacht')
      return false
    }
    
    if (!formData.start_date || !formData.end_date) {
      setError('Please select dates')
      return false
    }
    
    if (formData.booking_number && !BOOKING_NUMBER_PATTERN.test(formData.booking_number)) {
      setError('Invalid booking number format. Expected: YYWWBCNN (e.g., 2528ZA01)')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSaving(true)
    setError('')
    
    try {
      const bookingService = new BookingService()
      
      // Prepare the external booking data
      const externalBookingData = {
        ...formData,
        charter_type: 'bareboat',
        base_rate: 0,
        total_amount: 0,
        deposit_amount: 0,
        balance_due: 0,
        notes: formData.notes || 'External booking placeholder'
      }
      
      // Create the external booking
      const createdBooking = await bookingService.createExternalBooking(externalBookingData)
      
      if (onSave) {
        onSave(createdBooking)
      }
      
      // Reset form
      setFormData({
        yacht_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        booking_number: '',
        customer_first_name: 'External',
        customer_surname: 'Booking',
        customer_email: 'external@placeholder.com',
        notes: ''
      })
    } catch (err) {
      console.error('Failed to create external booking:', err)
      setError(err.message || 'Failed to create external booking')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create External Booking</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-gray-100"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yacht
            </label>
            <select
              name="yacht_id"
              value={formData.yacht_id}
              onChange={handleChange}
              disabled={isLoading || isSaving}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a yacht</option>
              {yachts.map(yacht => (
                <option key={yacht.id} value={yacht.id}>
                  {yacht.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking Number (Optional)
            </label>
            <input
              type="text"
              name="booking_number"
              value={formData.booking_number}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="YYWWBCNN (e.g., 2528ZA01)"
              maxLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to auto-generate
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isSaving}
              rows={3}
              placeholder="Additional notes about this external booking..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create External Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExternalBookingForm