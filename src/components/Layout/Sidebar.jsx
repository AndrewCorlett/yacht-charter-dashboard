import { useState } from 'react'

function Sidebar({ activeSection = 'dashboard', onSectionChange }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleSectionChange = (section) => {
    if (onSectionChange) {
      onSectionChange(section)
    }
  }

  return (
    <div 
      className={`h-full bg-ios-bg-primary border-r border-ios-gray-2 transition-all duration-300 ease-in-out flex-shrink-0 font-ios shadow-ios ${
        isExpanded ? 'w-64' : 'w-12'
      }`}
    >
      {/* Expand/Collapse Button */}
      <div className="p-ios-sm">
        <button 
          onClick={toggleExpanded}
          className="w-8 h-8 flex items-center justify-center hover:bg-ios-gray-1 rounded-ios transition-colors duration-200"
        >
          <svg 
            className={`w-4 h-4 text-ios-text-tertiary transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="mt-ios-md">
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => handleSectionChange('dashboard')}
              className={`w-full flex items-center px-ios-sm py-ios-sm text-left hover:bg-ios-gray-1 rounded-ios mx-ios-xs transition-all duration-200 ${
                activeSection === 'dashboard' ? 'bg-ios-blue/10 text-ios-blue border-r-2 border-ios-blue' : 'text-ios-text-secondary'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              {isExpanded && (
                <span className="ml-ios-sm whitespace-nowrap font-medium">Dashboard</span>
              )}
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSectionChange('admin')}
              className={`w-full flex items-center px-ios-sm py-ios-sm text-left hover:bg-ios-gray-1 rounded-ios mx-ios-xs transition-all duration-200 ${
                activeSection === 'admin' ? 'bg-ios-blue/10 text-ios-blue border-r-2 border-ios-blue' : 'text-ios-text-secondary'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              {isExpanded && (
                <span className="ml-ios-sm whitespace-nowrap font-medium">Admin Config</span>
              )}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar