/**
 * Enhanced Booking Form Modal
 * 
 * Comprehensive modal for creating and editing bookings with real-time conflict checking,
 * validation, and seamless calendar integration.
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format, addDays, differenceInDays } from 'date-fns'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'
import { BookingModel, BookingStatus, BookingType } from '../../models/core/BookingModel'
import { useBookings } from '../../contexts/BookingContext'
import ConflictResolutionSuggestions from '../booking/ConflictResolutionSuggestions'

function BookingFormModal({ 
  isOpen, 
  onClose, 
  booking = null, // null for create, BookingModel for edit
  prefilledData = {}, // prefilled data from calendar click
  onSave,
  onDelete 
}) {
  const isEditMode = Boolean(booking)
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    yachtId: '',
    startDateTime: null,
    endDateTime: null,
    status: BookingStatus.PENDING,
    type: BookingType.CHARTER,
    totalValue: null,
    depositAmount: null,
    summary: '',
    description: '',
    location: '',
    notes: ''
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [conflicts, setConflicts] = useState([])
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  const {
    createBooking,
    updateBooking,
    deleteBooking,
    getBookingConflicts,
    loading,
    error,
    clearError
  } = useBookings()

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && booking) {
        // Edit mode - populate with existing booking data
        const frontendData = booking.toFrontend()
        setFormData(frontendData)
      } else {
        // Create mode - use prefilled data from calendar
        setFormData(prev => ({
          ...prev,
          ...prefilledData,
          startDateTime: prefilledData.date || null,
          endDateTime: prefilledData.date ? addDays(prefilledData.date, 1) : null,
          yachtId: prefilledData.yachtId || '',
          summary: prefilledData.customerName ? 
            `${prefilledData.customerName} - ${prefilledData.yachtId}` : 
            `Charter - ${prefilledData.yachtId}`
        }))
      }
      
      setIsDirty(false)
      setValidationErrors({})
      setConflicts([])
      setShowDeleteConfirmation(false)
      clearError()
    }
  }, [isOpen, isEditMode, booking, prefilledData, clearError])

  // Real-time conflict checking
  useEffect(() => {
    if (!isOpen || !isDirty) return

    const checkConflicts = async () => {
      try {
        // Create temporary booking model
        const tempBooking = new BookingModel({
          id: booking?.id || 'temp',
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

        // Validate the booking
        if (!tempBooking.validate()) {
          setValidationErrors(tempBooking.getErrors())
        } else {
          setValidationErrors({})
        }

        // Check conflicts (exclude current booking for edit mode)
        const conflictResult = getBookingConflicts(tempBooking, booking?.id)
        setConflicts(conflictResult.conflicts || [])
      } catch (error) {
        console.error('Error checking conflicts:', error)
      }
    }

    const debounceTimer = setTimeout(checkConflicts, 300)
    return () => clearTimeout(debounceTimer)
  }, [formData, isOpen, isDirty, booking, getBookingConflicts])

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-adjust end date when start date changes (maintain duration)
      if (field === 'startDateTime' && prev.startDateTime && prev.endDateTime) {
        const originalDuration = differenceInDays(
          new Date(prev.endDateTime),
          new Date(prev.startDateTime)
        )
        const newEndDate = addDays(new Date(value), Math.max(originalDuration, 1))
        newData.endDateTime = newEndDate
      }
      
      // Auto-generate summary when customer name or yacht changes
      if (field === 'customerName' || field === 'yachtId') {
        const customerName = field === 'customerName' ? value : prev.customerName
        const yachtId = field === 'yachtId' ? value : prev.yachtId
        if (customerName && yachtId) {
          newData.summary = `${customerName} - ${yachtId}`
        }
      }
      
      return newData
    })
    
    setIsDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    try {
      // Create booking model for validation
      const bookingData = {
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
      }

      let savedBooking

      if (isEditMode) {
        // Update existing booking
        savedBooking = await updateBooking(booking.id, bookingData)
      } else {
        // Create new booking
        savedBooking = await createBooking(bookingData)
      }

      if (onSave) {
        onSave(savedBooking)
      }

      onClose()
    } catch (error) {
      console.error('Failed to save booking:', error)
      // Error handling is managed by the booking context
    }
  }, [formData, isEditMode, booking, createBooking, updateBooking, onSave, onClose])

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
           !conflicts.some(c => c.severity === 'high' && !c.canOverride) &&
           formData.customerName?.trim() &&
           formData.customerEmail?.trim() &&
           formData.yachtId &&
           formData.startDateTime &&
           formData.endDateTime
  }, [validationErrors, conflicts, formData])

  const hasChanges = useMemo(() => {
    if (isEditMode && booking) {
      const current = booking.toFrontend()
      return JSON.stringify(current) !== JSON.stringify(formData)
    }
    return isDirty
  }, [isEditMode, booking, formData, isDirty])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Booking' : 'Create New Booking'}
      size="large"
    >
      <div className="space-y-6 relative">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
            <LoadingSpinner size="lg" message={isEditMode ? "Updating booking..." : "Creating booking..."} />
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.startDateTime ? format(new Date(formData.startDateTime), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => handleInputChange('startDateTime', new Date(e.target.value))}
              className={`ios-input w-full ${validationErrors.start_datetime ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {validationErrors.start_datetime && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.start_datetime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.endDateTime ? format(new Date(formData.endDateTime), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => handleInputChange('endDateTime', new Date(e.target.value))}
              className={`ios-input w-full ${validationErrors.end_datetime ? 'border-red-500' : ''}`}
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
            {validationErrors.deposit_amount && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.deposit_amount}</p>
            )}
          </div>
        </div>

        {/* Summary and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary
            </label>
            <input
              type="text"
              value={formData.summary || ''}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              className="ios-input w-full"
              placeholder="Booking summary"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="ios-input w-full"
              placeholder="Marina or location"
              disabled={loading}
            />
          </div>
        </div>

        {/* Description and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="ios-input w-full h-20"
              placeholder="Booking description..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="ios-input w-full h-20"
              placeholder="Additional notes..."
              disabled={loading}
            />
          </div>
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
            {isEditMode && !showDeleteConfirmation && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                className="ios-button ios-button-destructive"
                disabled={loading}
              >
                Delete Booking
              </button>
            )}
            
            {isEditMode && showDeleteConfirmation && (
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
              disabled={loading || !isValid || (!hasChanges && isEditMode)}
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Booking' : 'Create Booking')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default BookingFormModal