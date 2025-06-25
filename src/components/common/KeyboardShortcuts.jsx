/**
 * Keyboard Shortcuts Manager
 * 
 * Provides keyboard shortcuts for power users to efficiently navigate
 * and perform actions in the yacht charter system.
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { useEffect, useState } from 'react'

const SHORTCUTS = [
  { key: 'Ctrl+N', description: 'Create new booking', action: 'create-booking' },
  { key: 'Ctrl+F', description: 'Search bookings', action: 'search' },
  { key: 'Ctrl+Z', description: 'Undo last action', action: 'undo' },
  { key: 'Escape', description: 'Close modal/cancel', action: 'escape' },
  { key: '?', description: 'Show keyboard shortcuts', action: 'show-help' },
  { key: 'Tab', description: 'Navigate between elements', action: 'navigate' },
  { key: 'Enter', description: 'Confirm action', action: 'confirm' },
  { key: 'Space', description: 'Select/toggle', action: 'select' },
  { key: 'Arrow Keys', description: 'Navigate calendar cells', action: 'navigate-calendar' },
  { key: 'Ctrl+S', description: 'Save current form', action: 'save' },
]

function KeyboardShortcuts({ onAction }) {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent shortcuts when typing in inputs
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.contentEditable === 'true') {
        
        // Only allow specific shortcuts in inputs
        if (event.key === 'Escape') {
          event.target.blur()
          return
        }
        
        // Allow Ctrl+Z in inputs for undo
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
          // Let undo work normally in inputs, but also trigger global undo
          if (onAction) {
            setTimeout(() => onAction('undo'), 0)
          }
        }
        
        return
      }

      // Global keyboard shortcuts
      switch (true) {
        // Create new booking
        case (event.ctrlKey || event.metaKey) && event.key === 'n':
          event.preventDefault()
          onAction?.('create-booking')
          break

        // Search
        case (event.ctrlKey || event.metaKey) && event.key === 'f':
          event.preventDefault()
          onAction?.('search')
          break

        // Undo
        case (event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey:
          event.preventDefault()
          onAction?.('undo')
          break

        // Save
        case (event.ctrlKey || event.metaKey) && event.key === 's':
          event.preventDefault()
          onAction?.('save')
          break

        // Show help
        case event.key === '?' && !event.ctrlKey && !event.metaKey:
          event.preventDefault()
          setShowHelp(true)
          break

        // Escape - close modals/cancel
        case event.key === 'Escape':
          if (showHelp) {
            setShowHelp(false)
          } else {
            onAction?.('escape')
          }
          break

        // Today - go to today's date
        case event.key === 't' && !event.ctrlKey && !event.metaKey:
          event.preventDefault()
          onAction?.('today')
          break

        // Previous/Next navigation
        case event.key === 'ArrowLeft' && (event.ctrlKey || event.metaKey):
          event.preventDefault()
          onAction?.('previous-period')
          break

        case event.key === 'ArrowRight' && (event.ctrlKey || event.metaKey):
          event.preventDefault()
          onAction?.('next-period')
          break

        // View mode switching
        case event.key === '1' && !event.ctrlKey && !event.metaKey:
          event.preventDefault()
          onAction?.('day-view')
          break

        case event.key === '2' && !event.ctrlKey && !event.metaKey:
          event.preventDefault()
          onAction?.('week-view')
          break

        case event.key === '3' && !event.ctrlKey && !event.metaKey:
          event.preventDefault()
          onAction?.('month-view')
          break

        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onAction, showHelp])

  if (!showHelp) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {SHORTCUTS.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.key.split('+').map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                      {key}
                    </kbd>
                    {keyIndex < shortcut.key.split('+').length - 1 && (
                      <span className="mx-1 text-gray-400">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Escape</kbd> to close this help
          </p>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcuts