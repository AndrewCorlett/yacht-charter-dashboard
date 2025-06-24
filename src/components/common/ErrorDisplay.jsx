/**
 * Error Display Component
 * 
 * Purpose: User-friendly error display with retry option
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
      <div className="w-16 h-16 mb-4">
        <svg
          className="w-full h-full text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      
      <p className="text-gray-600 text-center mb-4 max-w-md">
        {error || 'An unexpected error occurred while loading the calendar.'}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorDisplay