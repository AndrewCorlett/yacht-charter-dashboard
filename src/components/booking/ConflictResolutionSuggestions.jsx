/**
 * Conflict Resolution Suggestions Component
 * 
 * Displays alternative booking options when conflicts are detected
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import React from 'react'
import { format, differenceInDays } from 'date-fns'

function ConflictResolutionSuggestions({ 
  suggestions, 
  currentYachtId, 
  currentYachtName,
  onApplySuggestion,
  className = '' 
}) {
  if (!suggestions || (!suggestions.alternativeDates?.length && !suggestions.alternativeYachts?.length && !suggestions.nearbySlots?.length)) {
    return null
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-2 mb-3">
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">Alternative Booking Options</h3>
          <p className="text-xs text-blue-700 mt-1">
            The selected dates are not available. Here are some alternatives:
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Alternative Dates for Same Yacht */}
        {suggestions.alternativeDates?.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Available dates for {currentYachtName || 'selected yacht'}:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.alternativeDates.slice(0, 4).map((slot, index) => (
                <button
                  key={`date-${index}`}
                  type="button"
                  onClick={() => onApplySuggestion(slot)}
                  className="flex flex-col items-start p-3 bg-white border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {format(slot.startDate, 'MMM d')} - {format(slot.endDate, 'MMM d, yyyy')}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {slot.days} days • {slot.daysDifference} days {slot.daysDifference > 0 ? 'later' : 'earlier'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Alternative Yachts for Same Dates */}
        {suggestions.alternativeYachts?.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Available yachts for your selected dates:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.alternativeYachts.map((alt, index) => (
                <button
                  key={`yacht-${index}`}
                  type="button"
                  onClick={() => onApplySuggestion(alt)}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {alt.yacht.name}
                    </span>
                    <span className="text-xs text-gray-500 block mt-1">
                      {format(alt.startDate, 'MMM d')} - {format(alt.endDate, 'MMM d')}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Available Slots */}
        {suggestions.nearbySlots?.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Nearby available periods:
            </h4>
            <div className="space-y-2">
              {suggestions.nearbySlots.map((slot, index) => {
                const isBefore = slot.endDate < new Date()
                return (
                  <button
                    key={`nearby-${index}`}
                    type="button"
                    onClick={() => onApplySuggestion(slot)}
                    className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="text-left">
                      <span className="text-sm font-medium text-gray-900">
                        {format(slot.startDate, 'MMM d')} - {format(slot.endDate, 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        {slot.days} days available • {isBefore ? 'Before' : 'After'} your requested dates
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {slot.isWeekend && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          Weekend
                        </span>
                      )}
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => {
              // This would typically open a calendar view
              console.log('View full calendar')
            }}
          >
            View Full Calendar
          </button>
          <button
            type="button"
            className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => {
              // This would check other yachts
              console.log('Check all yachts')
            }}
          >
            Check All Yachts
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConflictResolutionSuggestions