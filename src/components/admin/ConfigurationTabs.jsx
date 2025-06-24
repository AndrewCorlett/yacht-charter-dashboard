/**
 * Configuration Tabs Component
 * 
 * Purpose: Reusable tab navigation for admin configuration sections
 * Provides consistent tab styling and navigation behavior
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { useState } from 'react'

function ConfigurationTabs({ tabs, defaultTab, onTabChange, className = "" }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (onTabChange) {
      onTabChange(tabId)
    }
  }

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon && (
              <span className="mr-2 text-base" aria-hidden="true">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                activeTab === tab.id 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

// Tab Panel Component for content areas
function TabPanel({ tabId, activeTab, children, className = "" }) {
  if (tabId !== activeTab) {
    return null
  }

  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      className={`outline-none ${className}`}
      tabIndex={0}
    >
      {children}
    </div>
  )
}

// Vertical Tabs Component
function VerticalTabs({ tabs, defaultTab, onTabChange, className = "" }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (onTabChange) {
      onTabChange(tabId)
    }
  }

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors duration-200 ${
            activeTab === tab.id
              ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.icon && (
            <span className="mr-3 text-base" aria-hidden="true">
              {tab.icon}
            </span>
          )}
          <span className="flex-1">{tab.label}</span>
          {tab.badge && (
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              activeTab === tab.id 
                ? 'bg-blue-200 text-blue-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// Card Tabs Component
function CardTabs({ tabs, defaultTab, onTabChange, className = "" }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (onTabChange) {
      onTabChange(tabId)
    }
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${
            activeTab === tab.id
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          }`}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.icon && (
            <div className="text-2xl mb-2" aria-hidden="true">
              {tab.icon}
            </div>
          )}
          <div className="font-medium text-sm">{tab.label}</div>
          {tab.description && (
            <div className="text-xs mt-1 opacity-75">{tab.description}</div>
          )}
          {tab.badge && (
            <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              activeTab === tab.id 
                ? 'bg-blue-200 text-blue-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.badge}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

export default ConfigurationTabs
export { TabPanel, VerticalTabs, CardTabs }