/**
 * Enhanced Booking Form Modal with Comprehensive Validation
 * 
 * Updated booking form modal with real-time validation, visual feedback,
 * business rule enforcement, and improved user experience.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format, addDays, differenceInDays } from 'date-fns'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'
import { BookingModel, BookingStatus, BookingType } from '../../models/core/BookingModel'
import { useBookings } from '../../contexts/BookingContext'
import ConflictResolutionSuggestions from '../booking/ConflictResolutionSuggestions'

// Import validation system
import { useBookingValidation } from '../../hooks/useValidation'
import { useValidationState } from '../../hooks/useValidationState'
import { 
  ValidatedField, 
  ValidationSummary, 
  ValidationProgress,
  ValidationStatusBadge,
  ValidationSuggestion 
} from '../validation/ValidationFeedback'
import { defaultMessageProvider } from '../../utils/validationMessages'

function EnhancedBookingFormModal({ 
  isOpen, 
  onClose, 
  booking = null, // null for create, BookingModel for edit
  prefilledData = {}, // prefilled data from calendar click
  onSave,
  onDelete 
}) {
  const isEditMode = Boolean(booking)
  
  // Initialize form data
  const initialFormData = useMemo(() => {
    if (isEditMode && booking) {
      return booking.toFrontend()
    }
    
    return {
      customerName: prefilledData.customerName || '',
      customerEmail: prefilledData.customerEmail || '',
      customerPhone: prefilledData.customerPhone || '',
      yachtId: prefilledData.yachtId || '',
      startDateTime: prefilledData.date || null,
      endDateTime: prefilledData.date ? addDays(prefilledData.date, 1) : null,
      status: BookingStatus.PENDING,
      type: BookingType.CHARTER,
      totalValue: null,
      depositAmount: null,
      summary: '',
      description: '',
      location: '',
      notes: '',
      guestCount: 1
    }
  }, [isEditMode, booking, prefilledData])

  // Validation hooks
  const {
    data: formData,
    errors,
    warnings,
    suggestions,
    isValid,
    isValidating,
    validationSummary,
    updateField,
    updateFields,
    getFieldState,
    validateAll,
    onFieldFocus,
    onFieldBlur,
    reset
  } = useBookingValidation(initialFormData, {
    mode: 'hybrid',
    validationOptions: {
      existingBookings: [], // Will be populated from context
      yachtSpecs: {} // Will be populated based on selected yacht
    },
    onValidationChange: (result) => {
      // Handle validation change if needed
      console.log('Validation changed:', result)
    }
  })

  // Validation state management
  const { state: validationState, actions: validationActions } = useValidationState(
    initialFormData,
    { 
      persistKey: isEditMode ? `booking_edit_${booking?.id}` : 'booking_create',
      autoSave: true
    }
  )

  // Additional state
  const [conflicts, setConflicts] = useState([])
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set())

  const {
    createBooking,
    updateBooking,
    deleteBooking,
    getBookingConflicts,
    loading,
    error,
    clearError
  } = useBookings()

  // Yacht options
  const yachts = [
    { id: 'spectre', name: 'Spectre', maxGuests: 10, minBookingHours: 6 },
    { id: 'disk-drive', name: 'Disk Drive', maxGuests: 12, minBookingHours: 4 },
    { id: 'arriva', name: 'Arriva', maxGuests: 8, minBookingHours: 4 },
    { id: 'zambada', name: 'Zambada', maxGuests: 8, minBookingHours: 8 },
    { id: 'melba-so', name: 'Melba So', maxGuests: 6, minBookingHours: 4 },
    { id: 'swansea', name: 'Swansea', maxGuests: 10, minBookingHours: 6 }
  ]

  // Get selected yacht specs
  const selectedYacht = useMemo(() => {
    return yachts.find(yacht => yacht.id === formData.yachtId)
  }, [formData.yachtId, yachts])

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset(initialFormData)
      setConflicts([])
      setShowDeleteConfirmation(false)
      setAppliedSuggestions(new Set())
      clearError()
      
      // Auto-generate summary if we have customer name and yacht
      if (formData.customerName && formData.yachtId) {
        updateField('summary', `${formData.customerName} - ${formData.yachtId}`, { skipValidation: true })
      }
    }
  }, [isOpen, initialFormData, reset, clearError])

  // Real-time conflict checking
  useEffect(() => {
    if (!isOpen || !formData.startDateTime || !formData.endDateTime || !formData.yachtId) {
      return
    }

    const checkConflicts = async () => {
      try {
        const tempBooking = new BookingModel({
          id: booking?.id || 'temp',
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
          summary: formData.summary
        })

        const conflictResult = getBookingConflicts(tempBooking, booking?.id)
        setConflicts(conflictResult.conflicts || [])
      } catch (error) {
        console.error('Error checking conflicts:', error)
      }
    }

    const debounceTimer = setTimeout(checkConflicts, 300)
    return () => clearTimeout(debounceTimer)
  }, [formData, isOpen, booking, getBookingConflicts])

  /**
   * Handle field value changes with validation
   */
  const handleFieldChange = useCallback((field, value) => {
    updateField(field, value)
    
    // Auto-adjust end date when start date changes (maintain duration)
    if (field === 'startDateTime' && formData.startDateTime && formData.endDateTime) {
      const originalDuration = differenceInDays(
        new Date(formData.endDateTime),
        new Date(formData.startDateTime)
      )
      const newEndDate = addDays(new Date(value), Math.max(originalDuration, 1))
      updateField('endDateTime', newEndDate, { immediate: true })
    }
    
    // Auto-generate summary when customer name or yacht changes
    if (field === 'customerName' || field === 'yachtId') {
      const customerName = field === 'customerName' ? value : formData.customerName
      const yachtId = field === 'yachtId' ? value : formData.yachtId
      if (customerName && yachtId) {
        const yacht = yachts.find(y => y.id === yachtId)
        updateField('summary', `${customerName} - ${yacht?.name || yachtId}`, { skipValidation: true })
      }
    }
  }, [formData, updateField, yachts])

  /**
   * Handle suggestion application
   */
  const handleApplySuggestion = useCallback((field, suggestion) => {
    if (suggestion.type === 'date_adjustment' && suggestion.suggestedDates) {
      updateFields({
        startDateTime: suggestion.suggestedDates.start,
        endDateTime: suggestion.suggestedDates.end
      })
    } else if (suggestion.type === 'yacht_alternative' && suggestion.suggestedYacht) {
      updateField('yachtId', suggestion.suggestedYacht)
    } else if (suggestion.type === 'deposit_optimal' && suggestion.suggestedAmount) {
      updateField('depositAmount', suggestion.suggestedAmount)
    }
    
    setAppliedSuggestions(prev => new Set([...prev, `${field}_${suggestion.type}`]))
  }, [updateField, updateFields])

  /**
   * Handle form submission
   */
  const handleSave = useCallback(async () => {
    // Validate all fields before submission
    await validateAll()
    
    if (!validationSummary.isValid) {
      return
    }

    try {
      validationActions.setSubmissionState(true, false)
      
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
        guest_count: formData.guestCount
      }

      let savedBooking
      if (isEditMode) {
        savedBooking = await updateBooking(booking.id, bookingData)
      } else {
        savedBooking = await createBooking(bookingData)
      }

      validationActions.setSubmissionState(false, true)
      
      if (onSave) {
        onSave(savedBooking)
      }

      onClose()
    } catch (error) {
      validationActions.setSubmissionState(false, false)
      console.error('Failed to save booking:', error)
    }
  }, [formData, isEditMode, booking, createBooking, updateBooking, onSave, onClose, validateAll, validationSummary, validationActions])

  /**
   * Handle deletion
   */
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

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return validationSummary.isValid && 
           !conflicts.some(c => c.severity === 'high' && !c.canOverride) &&
           formData.customerName?.trim() &&
           formData.customerEmail?.trim() &&
           formData.yachtId &&
           formData.startDateTime &&
           formData.endDateTime
  }, [validationSummary, conflicts, formData])

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

        {/* Validation Status */}
        <div className="flex items-center justify-between">
          <ValidationStatusBadge validationSummary={validationSummary} />
          <ValidationProgress validationSummary={validationSummary} showDetails />
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValidatedField
            fieldState={getFieldState('customerName')}
            label="Customer Name"
            required
            showValidationIcon
          >
            <input
              type="text"
              value={formData.customerName || ''}
              onChange={(e) => handleFieldChange('customerName', e.target.value)}
              onFocus={() => onFieldFocus('customerName')}
              onBlur={() => onFieldBlur('customerName')}
              className="ios-input w-full"
              placeholder="Enter customer name"
              disabled={loading}
            />
          </ValidatedField>

          <ValidatedField
            fieldState={getFieldState('yachtId')}
            label="Yacht"
            required
            showValidationIcon
          >
            <select
              value={formData.yachtId || ''}
              onChange={(e) => handleFieldChange('yachtId', e.target.value)}
              onFocus={() => onFieldFocus('yachtId')}
              onBlur={() => onFieldBlur('yachtId')}
              className="ios-input w-full"
              disabled={loading}
            >
              <option value="">Select yacht</option>
              {yachts.map(yacht => (
                <option key={yacht.id} value={yacht.id}>
                  {yacht.name} (Max {yacht.maxGuests} guests)
                </option>
              ))}
            </select>
          </ValidatedField>

          <ValidatedField
            fieldState={getFieldState('customerEmail')}
            label="Email"
            required
            showValidationIcon
          >
            <input
              type="email"
              value={formData.customerEmail || ''}
              onChange={(e) => handleFieldChange('customerEmail', e.target.value)}
              onFocus={() => onFieldFocus('customerEmail')}
              onBlur={() => onFieldBlur('customerEmail')}
              className="ios-input w-full"
              placeholder="customer@example.com"
              disabled={loading}
            />
          </ValidatedField>

          <ValidatedField
            fieldState={getFieldState('customerPhone')}
            label="Phone"
            showValidationIcon
          >
            <input
              type="tel"
              value={formData.customerPhone || ''}
              onChange={(e) => handleFieldChange('customerPhone', e.target.value)}
              onFocus={() => onFieldFocus('customerPhone')}
              onBlur={() => onFieldBlur('customerPhone')}
              className="ios-input w-full"
              placeholder="+1 (555) 123-4567"
              disabled={loading}
            />
          </ValidatedField>
        </div>

        {/* Booking Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValidatedField
            fieldState={getFieldState('startDateTime')}
            label="Start Date & Time"
            required
            showValidationIcon
          >
            <input
              type="datetime-local"
              value={formData.startDateTime ? format(new Date(formData.startDateTime), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => handleFieldChange('startDateTime', new Date(e.target.value))}
              onFocus={() => onFieldFocus('startDateTime')}
              onBlur={() => onFieldBlur('startDateTime')}
              className="ios-input w-full"
              disabled={loading}
            />
          </ValidatedField>

          <ValidatedField
            fieldState={getFieldState('endDateTime')}
            label="End Date & Time"
            required
            showValidationIcon
          >
            <input
              type="datetime-local"
              value={formData.endDateTime ? format(new Date(formData.endDateTime), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => handleFieldChange('endDateTime', new Date(e.target.value))}
              onFocus={() => onFieldFocus('endDateTime')}
              onBlur={() => onFieldBlur('endDateTime')}
              className="ios-input w-full"
              disabled={loading}
            />
          </ValidatedField>
        </div>

        {/* Guest Count and Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ValidatedField
            fieldState={getFieldState('guestCount')}
            label="Guest Count"
            showValidationIcon
          >
            <input
              type="number"
              min="1"
              max={selectedYacht?.maxGuests || 12}
              value={formData.guestCount || ''}
              onChange={(e) => handleFieldChange('guestCount', parseInt(e.target.value) || 1)}
              onFocus={() => onFieldFocus('guestCount')}
              onBlur={() => onFieldBlur('guestCount')}
              className="ios-input w-full"
              disabled={loading}
            />
          </ValidatedField>

          <ValidatedField
            fieldState={getFieldState('status')}
            label="Status"
          >
            <select
              value={formData.status || ''}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              className="ios-input w-full"
              disabled={loading}
            >
              {Object.values(BookingStatus).map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </ValidatedField>

          <ValidatedField
            fieldState={getFieldState('type')}
            label="Type"
          >
            <select
              value={formData.type || ''}
              onChange={(e) => handleFieldChange('type', e.target.value)}
              className="ios-input w-full"
              disabled={loading}
            >
              {Object.values(BookingType).map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </ValidatedField>
        </div>

        {/* Financial Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValidatedField
            fieldState={getFieldState('totalValue')}
            label="Total Value"
            showValidationIcon
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.totalValue || ''}
              onChange={(e) => handleFieldChange('totalValue', parseFloat(e.target.value) || null)}
              onFocus={() => onFieldFocus('totalValue')}
              onBlur={() => onFieldBlur('totalValue')}
              className="ios-input w-full"
              placeholder="0.00"
              disabled={loading}
            />
          </ValidatedField>

          <ValidatedField
            fieldState={getFieldState('depositAmount')}
            label="Deposit Amount"
            showValidationIcon
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.depositAmount || ''}
              onChange={(e) => handleFieldChange('depositAmount', parseFloat(e.target.value) || null)}
              onFocus={() => onFieldFocus('depositAmount')}
              onBlur={() => onFieldBlur('depositAmount')}
              className="ios-input w-full"
              placeholder="0.00"
              disabled={loading}
            />
          </ValidatedField>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValidatedField
            fieldState={getFieldState('location')}
            label="Location"
          >
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              className="ios-input w-full"
              placeholder="Marina or location"
              disabled={loading}
            />
          </ValidatedField>

          <ValidatedField
            fieldState={getFieldState('summary')}
            label="Summary"
          >
            <input
              type="text"
              value={formData.summary || ''}
              onChange={(e) => handleFieldChange('summary', e.target.value)}
              className="ios-input w-full"
              placeholder="Booking summary"
              disabled={loading}
            />
          </ValidatedField>
        </div>

        {/* Description and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValidatedField
            fieldState={getFieldState('description')}
            label="Description"
          >
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="ios-input w-full h-20"
              placeholder="Booking description..."
              disabled={loading}
            />
          </ValidatedField>

          <ValidatedField
            fieldState={getFieldState('notes')}
            label="Notes"
          >
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              className="ios-input w-full h-20"
              placeholder="Additional notes..."
              disabled={loading}
            />
          </ValidatedField>
        </div>

        {/* Validation Summary */}
        {(validationSummary.hasErrors || validationSummary.hasWarnings) && (
          <ValidationSummary 
            validationSummary={validationSummary}
            showWarnings
            showSuggestions
          />
        )}

        {/* Suggestions */}
        {Object.keys(suggestions).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Suggestions:</h4>
            {Object.entries(suggestions).map(([field, suggestion]) => (
              <ValidationSuggestion
                key={field}
                suggestion={{ field, message: suggestion, type: 'suggestion' }}
                onApply={(sugg) => handleApplySuggestion(field, sugg)}
                onDismiss={() => {/* Handle dismiss */}}
              />
            ))}
          </div>
        )}

        {/* Conflict Resolution */}
        {conflicts.length > 0 && (
          <ConflictResolutionSuggestions
            conflicts={conflicts}
            onResolve={(resolution) => {
              if (resolution.type === 'adjust_dates') {
                updateFields({
                  startDateTime: resolution.startDate,
                  endDateTime: resolution.endDate
                })
              } else if (resolution.type === 'change_yacht') {
                updateField('yachtId', resolution.yachtId)
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
              disabled={loading || !canSubmit}
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Booking' : 'Create Booking')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default EnhancedBookingFormModal