/**
 * useUnsavedChanges Hook
 * 
 * Purpose: Custom hook to track form dirty state and handle unsaved changes
 * 
 * Features:
 * - Tracks changes to form data against original values
 * - Provides dirty state detection
 * - Handles navigation interception with confirmation modal
 * - Manages pending navigation actions
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

import { useState, useEffect, useCallback } from 'react'

export function useUnsavedChanges(formData, statusData, originalData) {
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)

  // Check if form data has changed from original
  useEffect(() => {
    if (!originalData) {
      setIsDirty(false)
      return
    }

    // Compare form data
    const formChanged = Object.keys(formData).some(key => {
      if (key === 'street' || key === 'city' || key === 'postcode' || key === 'country') {
        return formData[key] !== (originalData.address?.[key] || '')
      }
      return formData[key] !== (originalData[key] || '')
    })

    // Compare status data
    const statusChanged = Object.keys(statusData).some(key => {
      return statusData[key] !== (originalData.status?.[key] || false)
    })

    setIsDirty(formChanged || statusChanged)
  }, [formData, statusData, originalData])

  // Handle navigation with unsaved changes check
  const handleNavigation = useCallback((navigationAction) => {
    if (isDirty) {
      setPendingNavigation(() => navigationAction)
      setShowUnsavedModal(true)
    } else {
      navigationAction()
    }
  }, [isDirty])

  // Modal action handlers
  const handleSaveAndGo = useCallback((saveFunction) => {
    if (saveFunction) {
      saveFunction()
    }
    setShowUnsavedModal(false)
    if (pendingNavigation) {
      // Small delay to allow save to complete
      setTimeout(() => {
        pendingNavigation()
        setPendingNavigation(null)
      }, 100)
    }
  }, [pendingNavigation])

  const handleDiscardAndGo = useCallback(() => {
    setShowUnsavedModal(false)
    if (pendingNavigation) {
      pendingNavigation()
      setPendingNavigation(null)
    }
  }, [pendingNavigation])

  const handleCancel = useCallback(() => {
    setShowUnsavedModal(false)
    setPendingNavigation(null)
  }, [])

  // Reset dirty state (called after successful save)
  const resetDirtyState = useCallback(() => {
    setIsDirty(false)
  }, [])

  return {
    isDirty,
    showUnsavedModal,
    handleNavigation,
    handleSaveAndGo,
    handleDiscardAndGo,
    handleCancel,
    resetDirtyState
  }
}