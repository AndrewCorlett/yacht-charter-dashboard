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
      data-testid="sidebar"
      className={`fixed left-0 top-0 h-screen z-40 bg-ios-bg-primary border-r border-ios-gray-2 transition-all duration-300 ease-in-out flex-shrink-0 font-ios shadow-ios ${
        isExpanded ? 'w-64' : 'w-12'
      }`}
    >
      {/* Expand/Collapse Button */}
      <div className="p-ios-sm">
        <button 
          data-testid="sidebar-toggle"
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
              onClick={() => handleSectionChange('bookings')}
              className={`w-full flex items-center px-ios-sm py-ios-sm text-left hover:bg-ios-gray-1 rounded-ios mx-ios-xs transition-all duration-200 ${
                activeSection === 'bookings' ? 'bg-ios-blue/10 text-ios-blue border-r-2 border-ios-blue' : 'text-ios-text-secondary'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              {isExpanded && (
                <span className="ml-ios-sm whitespace-nowrap font-medium">Bookings</span>
              )}
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSectionChange('settings')}
              className={`w-full flex items-center px-ios-sm py-ios-sm text-left hover:bg-ios-gray-1 rounded-ios mx-ios-xs transition-all duration-200 ${
                activeSection === 'settings' ? 'bg-ios-blue/10 text-ios-blue border-r-2 border-ios-blue' : 'text-ios-text-secondary'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              {isExpanded && (
                <span className="ml-ios-sm whitespace-nowrap font-medium">Settings</span>
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