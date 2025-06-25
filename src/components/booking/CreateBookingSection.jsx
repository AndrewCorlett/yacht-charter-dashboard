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
import { BookingModel } from '../../models/core/BookingModel.js'
import { StatusTrackingModel, DefaultStatusFields } from '../../models/core/StatusTrackingModel.js'
import { BookingValidationSchema } from '../../models/validation/ValidationSchemas.js'
import { useBookings } from '../../contexts/BookingContext'

function CreateBookingSection({ onCreateBooking, prefilledData = {} }) {
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
    
    // Booking Details
    startDate: '',
    endDate: '',
    portOfDeparture: '',
    portOfArrival: '',
    
    // Auto-generated fields
    bookingNo: '',
    
    // Status
    depositPaid: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')


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
  
  // Auto-generate booking numbers and IDs
  const generateBookingNumbers = () => {
    const bookingModel = new BookingModel()
    setFormData(prev => ({
      ...prev,
      bookingNo: bookingModel.booking_no
    }))
  }

  // Handle form submission
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
    if (!formData.startDate) errors.startDate = 'Start date is required'
    if (!formData.endDate) errors.endDate = 'End date is required'
    
    if (Object.keys(errors).length > 0) {
      setErrors(errors)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Create booking data package
      const customerAddress = [
        formData.addressLine1,
        formData.addressLine2,
        formData.city,
        formData.postcode
      ].filter(line => line.trim()).join('\n')

      const bookingData = {
        customer_name: `${formData.firstName} ${formData.surname}`.trim(),
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_address: customerAddress,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2,
        city: formData.city,
        postcode: formData.postcode,
        start_datetime: formData.startDate,
        end_datetime: formData.endDate,
        port_of_departure: formData.portOfDeparture,
        port_of_arrival: formData.portOfArrival,
        booking_no: formData.bookingNo,
        deposit_paid: formData.depositPaid,
        summary: `${formData.firstName} ${formData.surname} - Quick Booking`
      }
      
      // Call the booking creation handler
      if (onCreateBooking) {
        await onCreateBooking(bookingData)
      }
      
      // Reset form on success
      resetForm()
      setErrors({})
      setSuccessMessage('Booking created successfully!')
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error) {
      console.error('Booking creation error:', error)
      setErrors({ submit: 'Failed to create booking. Please try again.' })
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
      
      // Booking Details
      startDate: '',
      endDate: '',
      portOfDeparture: '',
      portOfArrival: '',
      
      // Auto-generated fields
      bookingNo: '',
      
      // Status
      depositPaid: false
    })
  }
  
  const handleReset = () => {
    resetForm()
    setErrors({})
    setSuccessMessage('')
  }
  
  // Auto-generate booking numbers on component mount
  useEffect(() => {
    if (!formData.bookingNo) {
      generateBookingNumbers()
    }
  }, [])

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
          <div>
            <label htmlFor="bookingNo" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-ios-text-secondary)' }}>
              Booking Number
            </label>
            <input
              type="text"
              id="bookingNo"
              name="bookingNo"
              value={formData.bookingNo}
              className="ios-input text-sm"
              placeholder="Auto-generated"
              disabled
              style={{ opacity: 0.6 }}
            />
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

          {/* Deposit Paid Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--color-ios-border)' }}>
            <label htmlFor="depositPaid" className="text-sm font-medium" style={{ color: 'var(--color-ios-text-primary)' }}>
              💰 Deposit Paid
            </label>
            <input
              type="checkbox"
              id="depositPaid"
              name="depositPaid"
              checked={formData.depositPaid}
              onChange={handleInputChange}
              className="h-4 w-4 rounded"
              style={{ accentColor: 'var(--color-ios-blue)' }}
            />
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
            <p className="text-sm flex items-center" style={{ color: 'var(--color-ios-red)' }}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.submit}
            </p>
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
    </div>
  )
}


export default CreateBookingSection