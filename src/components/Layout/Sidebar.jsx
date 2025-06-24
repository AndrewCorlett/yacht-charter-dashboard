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
      className={`h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex-shrink-0 ${
        isExpanded ? 'w-64' : 'w-12'
      }`}
    >
      {/* Expand/Collapse Button */}
      <div className="p-2">
        <button 
          onClick={toggleExpanded}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          <svg 
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
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
      <nav className="mt-4">
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => handleSectionChange('dashboard')}
              className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 ${
                activeSection === 'dashboard' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              {isExpanded && (
                <span className="ml-3 whitespace-nowrap">Dashboard</span>
              )}
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSectionChange('admin')}
              className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 ${
                activeSection === 'admin' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              {isExpanded && (
                <span className="ml-3 whitespace-nowrap">Admin Config</span>
              )}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar