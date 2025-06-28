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

import React, { useState, useEffect } from 'react'
import { BookingModel, BookingStatus, CharterType, PaymentStatus } from '../../models'
import yachtService from '../../services/supabase/YachtService.js'
import { useBookingOperations } from '../../contexts/BookingContext'
import BookingSuccessModal from '../modals/BookingSuccessModal'

function CreateBookingSection({ onCreateBooking, prefilledData = {} }) {
  // Get booking operations from context
  const { createBooking: createBookingInContext } = useBookingOperations()
  
  // Form state - Quick create with essential fields only
  const [formData, setFormData] = useState({
    // Customer Information
    firstName: '',
    surname: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    
    // Yacht Selection
    yacht: '',
    
    // Booking Details
    startDate: '',
    endDate: '',
    portOfDeparture: '',
    portOfArrival: '',
    tripType: CharterType.BAREBOAT,
    
    // Status - simplified for quick create
    // Payment status will be managed in booking management page
  })

  const [yachts, setYachts] = useState([])
  const [loadingYachts, setLoadingYachts] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  
  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdBooking, setCreatedBooking] = useState(null)

  // Load yachts from database
  useEffect(() => {
    const loadYachts = async () => {
      try {
        setLoadingYachts(true)
        const yachtData = await yachtService.getYachts()
        setYachts(yachtData)
      } catch (error) {
        console.error('Failed to load yachts:', error)
        // Log error but don't set fallback yachts
        console.error('Failed to load yachts from database:', error)
        setYachts([])
      } finally {
        setLoadingYachts(false)
      }
    }

    loadYachts()
  }, [])


  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    // Handle postcode uppercase transformation
    let processedValue = type === 'checkbox' ? checked : value
    if (name === 'postcode') {
      processedValue = value.toUpperCase()
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
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

  // Handle form submission - Save directly to database
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    const errors = {}
    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.surname.trim()) errors.surname = 'Surname is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    if (!formData.phone.trim()) errors.phone = 'Phone is required'
    if (!formData.addressLine1.trim()) errors.addressLine1 = 'Address line 1 is required'
    if (!formData.city.trim()) errors.city = 'City is required'
    if (!formData.postcode.trim()) errors.postcode = 'Postcode is required'
    if (!formData.yacht.trim()) errors.yacht = 'Yacht selection is required'
    if (!formData.startDate) errors.startDate = 'Start date is required'
    if (!formData.endDate) errors.endDate = 'End date is required'
    
    if (Object.keys(errors).length > 0) {
      setErrors(errors)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Get selected yacht info
      const selectedYacht = yachts.find(y => y.id === formData.yacht)
      
      // Prepare form data in the format expected by BookingModel.fromFrontend()
      const frontendData = {
        // Customer Information 
        firstName: formData.firstName,
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone,
        street: formData.addressLine1,
        city: formData.city,
        postcode: formData.postcode,
        country: 'United Kingdom',
        
        // Yacht and Booking Details
        yacht: formData.yacht,
        tripType: formData.tripType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        portOfDeparture: formData.portOfDeparture || 'Marina Bay',
        portOfArrival: formData.portOfArrival || 'Harbor Point'
      }
      
      // Default payment status for new bookings - will be managed in booking details
      let paymentStatus = PaymentStatus.PENDING
      
      // Status data - simplified for quick create
      const statusData = {
        depositPaid: false,
        finalPaymentPaid: false,
        paymentStatus: paymentStatus,
        bookingConfirmed: false
      }
      
      // Create and validate booking model using the correct method signature
      const booking = BookingModel.fromFrontend(frontendData, statusData)
      
      if (!booking.validate()) {
        // Get specific validation errors from the model
        const validationErrors = booking.getErrors()
        console.error('Booking validation errors:', validationErrors)
        
        // Create detailed error message for user
        const errorMessages = Object.entries(validationErrors).map(([field, message]) => `• ${message}`).join('\n')
        setErrors({ 
          submit: `Booking validation failed:\n\n${errorMessages}\n\nPlease fix the above issues and try again.` 
        })
        return
      }
      
      // Use booking context which handles both Supabase and state management
      const savedBooking = await createBookingInContext(booking.toDatabase())
      
      // Show success modal instead of inline message
      setCreatedBooking(savedBooking)
      setShowSuccessModal(true)
      
      // Reset form on success
      resetForm()
      setErrors({})
    } catch (error) {
      console.error('Booking creation error:', error)
      setErrors({ submit: `Failed to create booking: ${error.message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form reset
  const resetForm = () => {
    setFormData({
      // Customer Information
      firstName: '',
      surname: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcode: '',
      
      // Yacht Selection
      yacht: '',
      
      // Booking Details
      startDate: '',
      endDate: '',
      portOfDeparture: '',
      portOfArrival: '',
      tripType: CharterType.BAREBOAT,
      
      // Payment status managed in booking details page
    })
  }
  
  const handleReset = () => {
    resetForm()
    setErrors({})
    setSuccessMessage('')
  }
  
  // Modal handlers
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    setCreatedBooking(null)
  }
  
  const handleGoToBooking = () => {
    if (createdBooking) {
      // Close the modal first
      handleCloseSuccessModal()
      
      // Trigger parent navigation with the created booking data
      if (onCreateBooking) {
        onCreateBooking(createdBooking)
      }
      
      // Also dispatch a custom event for the main dashboard to handle navigation
      window.dispatchEvent(new CustomEvent('navigateToBooking', {
        detail: { 
          booking: createdBooking,
          section: 'bookings' 
        }
      }))
    }
  }
  

  return (
    <div 
      data-testid="booking-form"
      className="ios-card mt-4" 
      style={{ fontFamily: 'var(--font-family-ios)' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ios-text-primary)' }}>QUICK CREATE BOOKING</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Details */}
        <div className="space-y-3">
          {/* Yacht Selection */}
          <div>
            <label htmlFor="yacht" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
              Yacht *
            </label>
            {loadingYachts ? (
              <div className="ios-input text-sm" style={{ opacity: 0.6 }}>Loading yachts...</div>
            ) : (
              <select
                id="yacht"
                name="yacht"
                value={formData.yacht}
                onChange={handleInputChange}
                className={`ios-input text-sm ${
                  errors.yacht ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select a yacht</option>
                {yachts.map(yacht => (
                  <option key={yacht.id} value={yacht.id}>
                    {yacht.name} ({yacht.type})
                  </option>
                ))}
              </select>
            )}
            {errors.yacht && <p className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.yacht}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                First Name *
              </label>
              <input
                data-testid="input-firstName"
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`ios-input text-sm ${
                  errors.firstName ? 'border-red-500' : ''
                }`}
                placeholder="First name"
              />
              {errors.firstName && <p data-testid="error-firstName" className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.firstName}</p>}
            </div>

            <div>
              <label htmlFor="surname" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                Surname *
              </label>
              <input
                data-testid="input-surname"
                type="text"
                id="surname"
                name="surname"
                value={formData.surname}
                onChange={handleInputChange}
                className={`ios-input text-sm ${
                  errors.surname ? 'border-red-500' : ''
                }`}
                placeholder="Surname"
              />
              {errors.surname && <p data-testid="error-surname" className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.surname}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                Email *
              </label>
              <input
                data-testid="input-email"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`ios-input text-sm ${
                  errors.email ? 'border-red-500' : ''
                }`}
                placeholder="customer@email.com"
              />
              {errors.email && <p data-testid="error-email" className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                Phone *
              </label>
              <input
                data-testid="input-phone"
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`ios-input text-sm ${
                  errors.phone ? 'border-red-500' : ''
                }`}
                placeholder="+44 7XXX XXXXXX"
              />
              {errors.phone && <p data-testid="error-phone" className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.phone}</p>}
            </div>
          </div>
          
          {/* Address Fields - Industry Standard Format */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium" style={{ color: 'var(--color-ios-text-primary)' }}>Address</h4>
            
            <div>
              <label htmlFor="addressLine1" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                Address line 1 *
              </label>
              <input
                type="text"
                id="addressLine1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                className={`ios-input text-sm ${
                  errors.addressLine1 ? 'border-red-500' : ''
                }`}
                placeholder="Building number and street name"
              />
              {errors.addressLine1 && <p className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.addressLine1}</p>}
            </div>

            <div>
              <label htmlFor="addressLine2" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                Address line 2
              </label>
              <input
                type="text"
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                className="ios-input text-sm"
                placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`ios-input text-sm ${
                    errors.city ? 'border-red-500' : ''
                  }`}
                  placeholder="e.g., Cardiff"
                />
                {errors.city && <p className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="postcode" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                  Postcode *
                </label>
                <input
                  type="text"
                  id="postcode"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  className={`ios-input text-sm ${
                    errors.postcode ? 'border-red-500' : ''
                  }`}
                  placeholder="e.g., CF10 1AB"
                />
                {errors.postcode && <p className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.postcode}</p>}
              </div>
            </div>
          </div>

          {/* Trip Type */}
          <div>
            <label htmlFor="tripType" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
              Charter Type
            </label>
            <select
              id="tripType"
              name="tripType"
              value={formData.tripType}
              onChange={handleInputChange}
              className="ios-input text-sm"
            >
              <option value={CharterType.BAREBOAT}>Bareboat</option>
              <option value={CharterType.SKIPPERED_CHARTER}>Skippered Charter</option>
            </select>
          </div>

          {/* Dates and Ports */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                Start Date *
              </label>
              <input
                data-testid="input-startDate"
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`ios-input text-sm ${
                  errors.startDate ? 'border-red-500' : ''
                }`}
              />
              {errors.startDate && <p data-testid="error-startDate" className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                End Date *
              </label>
              <input
                data-testid="input-endDate"
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`ios-input text-sm ${
                  errors.endDate ? 'border-red-500' : ''
                }`}
              />
              {errors.endDate && <p data-testid="error-endDate" className="mt-1 text-xs" style={{ color: 'var(--color-ios-red)' }}>{errors.endDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="portOfDeparture" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                Port of Departure
              </label>
              <input
                type="text"
                id="portOfDeparture"
                name="portOfDeparture"
                value={formData.portOfDeparture}
                onChange={handleInputChange}
                className="ios-input text-sm"
                placeholder="e.g., Cardiff Marina"
              />
            </div>

            <div>
              <label htmlFor="portOfArrival" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
                Port of Arrival
              </label>
              <input
                type="text"
                id="portOfArrival"
                name="portOfArrival"
                value={formData.portOfArrival}
                onChange={handleInputChange}
                className="ios-input text-sm"
                placeholder="e.g., Plymouth"
              />
            </div>
          </div>

          {/* Note about payment status */}
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-ios-border)', backgroundColor: 'var(--color-ios-bg-secondary)' }}>
            <p className="text-sm" style={{ color: 'var(--color-ios-text-secondary)' }}>
              💡 Payment status will be managed in the booking details page after creation
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="ios-button-secondary"
              style={{ backgroundColor: 'var(--color-ios-red)', color: 'white' }}
            >
              🗑️ Reset
            </button>
            
            <button
              data-testid="submit-booking"
              type="submit"
              disabled={isSubmitting}
              className="ios-button"
            >
              <span className="flex items-center justify-center">
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? 'Creating...' : '✅ Quick Create'}
              </span>
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div 
            data-testid="booking-success"
            className="mt-4 p-3 rounded-lg border" 
            style={{ 
              backgroundColor: 'rgba(52, 199, 89, 0.1)', 
              borderColor: 'rgba(52, 199, 89, 0.3)',
              borderRadius: 'var(--radius-ios)'
            }}
          >
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
          <div className="mt-4 p-3 rounded-lg border" style={{ 
            backgroundColor: 'rgba(255, 59, 48, 0.1)', 
            borderColor: 'rgba(255, 59, 48, 0.3)',
            borderRadius: 'var(--radius-ios)'
          }}>
            <div className="text-sm" style={{ color: 'var(--color-ios-red)' }}>
              <div className="flex items-start mb-2">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="whitespace-pre-line">{errors.submit}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Validation Errors Summary */}
        {Object.keys(errors).length > 0 && errors.submit === undefined && (
          <div className="mt-4 p-3 rounded-lg border" style={{ 
            backgroundColor: 'rgba(255, 149, 0, 0.1)', 
            borderColor: 'rgba(255, 149, 0, 0.3)',
            borderRadius: 'var(--radius-ios)'
          }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-ios-orange)' }}>⚠️ Please fix the following errors:</p>
            <ul className="text-xs space-y-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
      
      {/* Booking Success Modal */}
      <BookingSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        bookingNumber={createdBooking?.booking_number}
        bookingData={createdBooking}
        onGoToBooking={handleGoToBooking}
      />
    </div>
  )
}


export default CreateBookingSection