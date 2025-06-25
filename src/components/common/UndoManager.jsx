/**
 * Undo Manager Component
 * 
 * Provides undo functionality and keyboard shortcuts for booking operations.
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useBookings } from '../../contexts/BookingContext'

function UndoManager() {
  const [showUndoNotification, setShowUndoNotification] = useState(false)
  const [undoTimeout, setUndoTimeout] = useState(null)
  
  const { undoLastOperation, operationStatus } = useBookings()

  // Show undo notification after successful operations
  useEffect(() => {
    if (operationStatus?.type === 'success' && 
        (operationStatus.message.includes('created') || 
         operationStatus.message.includes('updated') || 
         operationStatus.message.includes('deleted'))) {
      
      setShowUndoNotification(true)
      
      // Auto-hide after 5 seconds
      const timeout = setTimeout(() => {
        setShowUndoNotification(false)
      }, 5000)
      
      setUndoTimeout(timeout)
    }
  }, [operationStatus])

  // Handle undo action
  const handleUndo = useCallback(async () => {
    try {
      await undoLastOperation()
      setShowUndoNotification(false)
      if (undoTimeout) {
        clearTimeout(undoTimeout)
      }
    } catch (error) {
      console.error('Failed to undo operation:', error)
    }
  }, [undoLastOperation, undoTimeout])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        if (showUndoNotification) {
          handleUndo()
        }
      }

      // Escape to dismiss undo notification
      if (event.key === 'Escape' && showUndoNotification) {
        setShowUndoNotification(false)
        if (undoTimeout) {
          clearTimeout(undoTimeout)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (undoTimeout) {
        clearTimeout(undoTimeout)
      }
    }
  }, [handleUndo, showUndoNotification, undoTimeout])

  if (!showUndoNotification) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
        <span className="text-sm">
          Operation completed successfully
        </span>
        <button
          onClick={handleUndo}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          Undo (Ctrl+Z)
        </button>
        <button
          onClick={() => setShowUndoNotification(false)}
          className="text-gray-300 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default UndoManager