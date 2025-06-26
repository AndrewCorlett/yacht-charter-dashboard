/**
 * UnsavedChangesModal Component
 * 
 * Purpose: Modal dialog for handling unsaved changes when navigating away
 * 
 * Features:
 * - Three action options: Save and go, Don't save and go, Cancel
 * - Dark theme styling to match the booking panel
 * - Keyboard shortcuts (Escape for cancel)
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

import { useEffect } from 'react'

function UnsavedChangesModal({ isOpen, onSaveAndGo, onDiscardAndGo, onCancel }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel()
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
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Unsaved Changes</h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          <p className="text-gray-300 mb-6">
            You have unsaved changes to this booking. What would you like to do?
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onSaveAndGo}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Save and go
            </button>

            <button
              onClick={onDiscardAndGo}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Don't save and go
            </button>

            <button
              onClick={onCancel}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnsavedChangesModal