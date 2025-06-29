/**
 * Booking Success Modal Component
 * 
 * Purpose: Shows booking confirmation with booking number and navigation options
 * 
 * Features:
 * - Displays generated booking number prominently
 * - Shows booking summary details
 * - Provides "Dismiss" and "Go to booking" actions
 * - Success animation and styling
 * 
 * @author AI Agent
 * @created 2025-06-27
 */

import React from 'react'
import Modal from '../common/Modal'

function BookingSuccessModal({ 
  isOpen, 
  onClose, 
  bookingNumber, 
  bookingData, 
  onGoToBooking 
}) {
  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 Booking Created Successfully!"
      size="medium"
    >
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>

        {/* Booking Number */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Booking Number
          </h3>
          <div 
            className="text-3xl font-bold text-blue-600 bg-blue-50 py-3 px-6 rounded-lg border-2 border-blue-200"
            data-testid="booking-number-display"
          >
            {bookingNumber}
          </div>
          <p className="text-sm text-gray-600">
            Please save this number for your records
          </p>
        </div>

        {/* Booking Summary */}
        {bookingData && (
          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
            <h4 className="font-semibold text-gray-900 text-center mb-3">
              Booking Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Yacht:</span>
                <p className="text-gray-900">{bookingData.yacht_name || bookingData.yacht_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Customer:</span>
                <p className="text-gray-900">
                  {bookingData.customer_first_name} {bookingData.customer_surname}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Start Date:</span>
                <p className="text-gray-900">
                  {new Date(bookingData.start_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">End Date:</span>
                <p className="text-gray-900">
                  {new Date(bookingData.end_date).toLocaleDateString()}
                </p>
              </div>
              {bookingData.charter_type && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Charter Type:</span>
                  <p className="text-gray-900">{bookingData.charter_type}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• Your booking is now saved in the system</li>
            <li>• You can view it in the calendar and booking dashboard</li>
            <li>• Click "Go to booking" to add more details or documents</li>
            <li>• The booking status is currently set to "Tentative"</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            data-testid="dismiss-button"
          >
            Dismiss
          </button>
          <button
            onClick={onGoToBooking}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            data-testid="go-to-booking-button"
          >
            Go to Booking
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default BookingSuccessModal