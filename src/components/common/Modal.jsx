/**
 * Modal Component
 * 
 * Purpose: Reusable modal dialog for booking forms and details
 * 
 * Design Decisions:
 * - Click outside to close functionality
 * - ESC key support for accessibility
 * - Smooth fade-in animation
 * - Portal rendering for proper z-index
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { useEffect } from 'react'

function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Size configuration
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl'
  }

  return (
    <div 
      data-testid="booking-modal"
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal