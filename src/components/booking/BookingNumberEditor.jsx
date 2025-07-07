/**
 * Booking Number Editor Component
 * Provides inline editing functionality for booking numbers with validation
 * and conflict checking
 * 
 * @created 2025-07-05
 */

import React, { useState, useRef, useEffect } from 'react'
import bookingService from '../../services/supabase/BookingService'

/**
 * BookingNumberEditor Component
 * @param {Object} props Component props
 * @param {string} props.bookingId - Booking ID
 * @param {string} props.currentNumber - Current booking number
 * @param {Function} props.onSave - Callback when number is saved
 * @param {Function} props.onCancel - Callback when editing is cancelled
 * @returns {JSX.Element} Editor component
 */
export function BookingNumberEditor({ bookingId, currentNumber, onSave, onCancel }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentNumber)
  const [error, setError] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef(null)

  // Booking number format validation pattern (YYWWBCNN)
  const BOOKING_NUMBER_PATTERN = /^\d{2}\d{2}[A-Z]{2}\d{2}$/

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const validateFormat = (value) => {
    if (!value) {
      return 'Booking number is required'
    }
    if (!BOOKING_NUMBER_PATTERN.test(value)) {
      return 'Invalid format. Expected: YYWWBCNN (e.g., 2528ZA01)'
    }
    return ''
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(currentNumber)
    setError('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(currentNumber)
    setError('')
    if (onCancel) onCancel()
  }

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase()
    setEditValue(value)
    
    // Real-time format validation
    const formatError = validateFormat(value)
    setError(formatError)
  }

  const handleSave = async () => {
    // Validate format
    const formatError = validateFormat(editValue)
    if (formatError) {
      setError(formatError)
      return
    }

    // Don't save if unchanged
    if (editValue === currentNumber) {
      handleCancel()
      return
    }

    setIsValidating(true)
    setIsSaving(true)
    setError('')

    try {
      // Update booking number via BookingService (using singleton instance)
      const updatedBooking = await bookingService.updateBookingNumber(bookingId, editValue)
      
      setIsEditing(false)
      if (onSave) {
        onSave(updatedBooking)
      }
    } catch (err) {
      console.error('Failed to update booking number:', err)
      setError(err.message || 'Failed to update booking number')
    } finally {
      setIsValidating(false)
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !error) {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 group">
        <span className="font-mono text-sm">{currentNumber}</span>
        <button
          onClick={handleEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
          title="Edit booking number"
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={`font-mono text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 ${
              error 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            } ${isSaving ? 'bg-gray-100' : ''}`}
            placeholder="YYWWBCNN"
            maxLength={8}
          />
          <button
            onClick={handleSave}
            disabled={!!error || isSaving}
            className={`p-1 rounded transition-colors ${
              error || isSaving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            title="Save"
          >
            {isSaving ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:bg-gray-300"
            title="Cancel"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
      </div>
    </div>
  )
}

export default BookingNumberEditor