/**
 * Booking Edit Modal Component
 * 
 * Advanced modal for editing existing bookings with real-time conflict checking,
 * validation, and optimistic updates.
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format, parseISO, addDays, differenceInDays } from 'date-fns'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'
import { BookingModel, BookingStatus, BookingType } from '../../models/core/BookingModel'
import { useBookings } from '../../contexts/BookingContext'
import ConflictResolutionSuggestions from '../booking/ConflictResolutionSuggestions'

function BookingEditModal({ 
  isOpen, 
  onClose, 
  booking,
  onSave,
  onDelete 
}) {
  const [formData, setFormData] = useState({})
  const [originalData, setOriginalData] = useState({})
  const [validationErrors, setValidationErrors] = useState({})
  const [conflicts, setConflicts] = useState([])
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  const {
    updateBooking,
    deleteBooking,
    getBookingConflicts,
    loading,
    error,
    clearError
  } = useBookings()

  // Initialize form data when booking changes
  useEffect(() => {
    if (booking) {
      const frontendData = booking.toFrontend()
      setFormData(frontendData)
      setOriginalData(frontendData)
      setIsDirty(false)
      setValidationErrors({})
      setConflicts([])
      clearError()
    }
  }, [booking, clearError])

  // Check for conflicts when form data changes
  useEffect(() => {
    if (!booking || !isDirty) return

    const checkConflicts = async () => {
      try {
        // Create temporary booking model with updated data
        const tempBooking = new BookingModel({
          ...booking.toDatabase(),
          ...formData,
          start_datetime: formData.startDateTime,
          end_datetime: formData.endDateTime,
          yacht_id: formData.yachtId,
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone,
          total_value: formData.totalValue,
          deposit_amount: formData.depositAmount,
          status: formData.status,
          type: formData.type
        })

        // Validate the temporary booking
        if (!tempBooking.validate()) {
          setValidationErrors(tempBooking.getErrors())
        } else {
          setValidationErrors({})
        }

        // Check conflicts with other bookings
        const conflictResult = getBookingConflicts(tempBooking, booking.id)
        setConflicts(conflictResult.conflicts || [])
      } catch (error) {
        console.error('Error checking conflicts:', error)
      }
    }

    const debounceTimer = setTimeout(checkConflicts, 300)
    return () => clearTimeout(debounceTimer)
  }, [formData, booking, isDirty, getBookingConflicts])

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-adjust end date when start date changes
      if (field === 'startDateTime' && prev.startDateTime && prev.endDateTime) {
        const originalDuration = differenceInDays(
          new Date(prev.endDateTime),
          new Date(prev.startDateTime)
        )
        const newEndDate = addDays(new Date(value), originalDuration)
        newData.endDateTime = newEndDate
      }
      
      return newData
    })
    
    setIsDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!booking) return

    try {
      // Create updated booking model
      const updatedBooking = new BookingModel({
        ...booking.toDatabase(),
        ...formData,
        start_datetime: formData.startDateTime,
        end_datetime: formData.endDateTime,
        yacht_id: formData.yachtId,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        total_value: formData.totalValue,
        deposit_amount: formData.depositAmount,
        status: formData.status,
        type: formData.type
      })

      // Validate before saving
      if (!updatedBooking.validate()) {
        setValidationErrors(updatedBooking.getErrors())
        return
      }

      // Check for blocking conflicts
      const hasBlockingConflicts = conflicts.some(conflict => 
        conflict.severity === 'high' && !conflict.canOverride
      )

      if (hasBlockingConflicts) {
        alert('Cannot save booking due to conflicts. Please resolve conflicts first.')
        return
      }

      // Save the booking
      const savedBooking = await updateBooking(booking.id, {
        summary: formData.summary,
        description: formData.description,
        location: formData.location,
        start_datetime: formData.startDateTime,
        end_datetime: formData.endDateTime,
        yacht_id: formData.yachtId,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        total_value: formData.totalValue,
        deposit_amount: formData.depositAmount,
        status: formData.status,
        type: formData.type,
        notes: formData.notes
      })

      if (onSave) {
        onSave(savedBooking)
      }

      onClose()
    } catch (error) {
      console.error('Failed to save booking:', error)
      // Error handling is managed by the booking context
    }
  }, [booking, formData, conflicts, updateBooking, onSave, onClose])

  const handleDelete = useCallback(async () => {
    if (!booking) return

    try {
      await deleteBooking(booking.id)
      
      if (onDelete) {
        onDelete(booking.id)
      }

      onClose()
    } catch (error) {
      console.error('Failed to delete booking:', error)
      // Error handling is managed by the booking context
    }
  }, [booking, deleteBooking, onDelete, onClose])

  const yachts = [
    { id: 'spectre', name: 'Spectre' },
    { id: 'disk-drive', name: 'Disk Drive' },
    { id: 'arriva', name: 'Arriva' },
    { id: 'zambada', name: 'Zambada' },
    { id: 'melba-so', name: 'Melba So' },
    { id: 'swansea', name: 'Swansea' }
  ]

  const isValid = useMemo(() => {
    return Object.keys(validationErrors).length === 0 && 
           !conflicts.some(c => c.severity === 'high' && !c.canOverride)
  }, [validationErrors, conflicts])

  const hasChanges = useMemo(() => {
    if (!booking || !isDirty) return false
    
    const current = booking.toFrontend()
    return JSON.stringify(current) !== JSON.stringify(formData)
  }, [booking, formData, isDirty])

  if (!booking) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Booking"
      size="large"
    >
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" message="Saving booking..." />
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              value={formData.customerName || ''}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              className={`ios-input w-full ${validationErrors.customer_name ? 'border-red-500' : ''}`}
              placeholder="Enter customer name"
            />
            {validationErrors.customer_name && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.customer_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yacht *
            </label>
            <select
              value={formData.yachtId || ''}
              onChange={(e) => handleInputChange('yachtId', e.target.value)}
              className={`ios-input w-full ${validationErrors.yacht_id ? 'border-red-500' : ''}`}
            >
              <option value="">Select yacht</option>
              {yachts.map(yacht => (
                <option key={yacht.id} value={yacht.id}>
                  {yacht.name}
                </option>
              ))}
            </select>
            {validationErrors.yacht_id && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.yacht_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.customerEmail || ''}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              className={`ios-input w-full ${validationErrors.customer_email ? 'border-red-500' : ''}`}
              placeholder="customer@example.com"
            />
            {validationErrors.customer_email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.customer_email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.customerPhone || ''}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              className={`ios-input w-full ${validationErrors.customer_phone ? 'border-red-500' : ''}`}
              placeholder="+1 (555) 123-4567"
            />
            {validationErrors.customer_phone && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.customer_phone}</p>
            )}
          </div>
        </div>

        {/* Booking Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="datetime-local"
              value={formData.startDateTime ? format(new Date(formData.startDateTime), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => handleInputChange('startDateTime', new Date(e.target.value))}
              className={`ios-input w-full ${validationErrors.start_datetime ? 'border-red-500' : ''}`}
            />
            {validationErrors.start_datetime && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.start_datetime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="datetime-local"
              value={formData.endDateTime ? format(new Date(formData.endDateTime), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => handleInputChange('endDateTime', new Date(e.target.value))}
              className={`ios-input w-full ${validationErrors.end_datetime ? 'border-red-500' : ''}`}
            />
            {validationErrors.end_datetime && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.end_datetime}</p>
            )}
          </div>
        </div>

        {/* Status and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="ios-input w-full"
            >
              {Object.values(BookingStatus).map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type || ''}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="ios-input w-full"
            >
              {Object.values(BookingType).map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Value
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.totalValue || ''}
              onChange={(e) => handleInputChange('totalValue', parseFloat(e.target.value) || null)}
              className={`ios-input w-full ${validationErrors.total_value ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
            {validationErrors.total_value && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.total_value}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deposit Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.depositAmount || ''}
              onChange={(e) => handleInputChange('depositAmount', parseFloat(e.target.value) || null)}
              className={`ios-input w-full ${validationErrors.deposit_amount ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
            {validationErrors.deposit_amount && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.deposit_amount}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="ios-input w-full h-20"
            placeholder="Additional notes or requirements..."
          />
        </div>

        {/* Conflict Resolution */}
        {conflicts.length > 0 && (
          <ConflictResolutionSuggestions
            conflicts={conflicts}
            onResolve={(resolution) => {
              if (resolution.type === 'adjust_dates') {
                handleInputChange('startDateTime', resolution.startDate)
                handleInputChange('endDateTime', resolution.endDate)
              } else if (resolution.type === 'change_yacht') {
                handleInputChange('yachtId', resolution.yachtId)
              }
            }}
          />
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {!showDeleteConfirmation ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                className="ios-button ios-button-destructive"
                disabled={loading}
              >
                Delete Booking
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Confirm deletion:</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="ios-button ios-button-destructive text-sm"
                  disabled={loading}
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="ios-button ios-button-secondary text-sm"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ios-button ios-button-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="ios-button ios-button-primary"
              disabled={loading || !isValid || !hasChanges}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default BookingEditModal