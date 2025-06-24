/**
 * Admin Configuration Layout Component
 * 
 * Purpose: Responsive layout container for admin configuration sections
 * Provides consistent spacing, responsive grid, and section organization
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { useState } from 'react'

function AdminConfigLayout({ children, title, description, sidebarContent, headerActions }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      {sidebarContent && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-md shadow-lg"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Sidebar - Configuration Tools */}
      {sidebarContent && (
        <aside className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static absolute inset-y-0 left-0 z-40
          w-80 bg-white border-r border-gray-200 shadow-lg lg:shadow-none
          transform transition-transform duration-300 ease-in-out
        `}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Configuration Tools</h3>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden text-gray-400 hover:text-gray-600"
                  aria-label="Close sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {sidebarContent}
            </div>
          </div>
        </aside>
      )}

      {/* Sidebar Overlay for Mobile */}
      {sidebarContent && isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Section */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm sm:text-base text-gray-600 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex-shrink-0 flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

// Configuration Section Component
function ConfigSection({ title, description, children, className = "" }) {
  return (
    <section className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4 sm:p-6">
        {(title || description) && (
          <div className="mb-4 sm:mb-6">
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm sm:text-base text-gray-600">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

// Configuration Grid Component
function ConfigGrid({ children, cols = 1, gap = 4 }) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  const gapClasses = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }

  return (
    <div className={`grid ${gridClasses[cols]} ${gapClasses[gap]}`}>
      {children}
    </div>
  )
}

// Configuration Card Component
function ConfigCard({ title, description, icon, children, onClick, isActive = false }) {
  const CardComponent = onClick ? 'button' : 'div'
  
  return (
    <CardComponent
      onClick={onClick}
      className={`
        block p-4 sm:p-6 rounded-lg border-2 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
        ${isActive 
          ? 'border-blue-500 bg-blue-50 shadow-sm' 
          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
        }
        ${onClick && !isActive ? 'hover:bg-white hover:shadow-sm' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        {icon && (
          <div className={`
            flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl
            ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
          `}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`
              text-sm sm:text-base font-semibold truncate
              ${isActive ? 'text-blue-900' : 'text-gray-900'}
            `}>
              {title}
            </h3>
          )}
          {description && (
            <p className={`
              mt-1 text-xs sm:text-sm line-clamp-2
              ${isActive ? 'text-blue-700' : 'text-gray-600'}
            `}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </CardComponent>
  )
}

// Form Row Component
function FormRow({ children, className = "" }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  )
}

// Action Button Component
function ActionButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  disabled = false,
  className = "",
  ...props 
}) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-md 
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${variants[variant]} ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

export default AdminConfigLayout
export { ConfigSection, ConfigGrid, ConfigCard, FormRow, ActionButton }