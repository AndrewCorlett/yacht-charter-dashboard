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
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden font-ios">
      {/* Mobile Sidebar Toggle */}
      {sidebarContent && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="ios-button lg:hidden fixed top-4 right-4 z-50 shadow-ios-lg"
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
          w-80 bg-ios-bg-primary border-r border-ios-gray-2 shadow-ios-lg lg:shadow-none
          transform transition-transform duration-300 ease-in-out
        `}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex-shrink-0 p-ios-lg border-b border-ios-gray-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ios-text-primary">Configuration Tools</h3>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden text-ios-text-tertiary hover:text-ios-text-secondary transition-colors"
                  aria-label="Close sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-ios-lg">
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
        <header className="flex-shrink-0 bg-ios-bg-primary border-b border-ios-gray-2 px-ios-lg py-ios-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-ios-md">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-ios-text-primary truncate">
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm sm:text-base text-ios-text-secondary line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex-shrink-0 flex items-center gap-ios-sm">
                {headerActions}
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-ios-lg">
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
    <section className={`ios-card ${className}`}>
      <div className="p-ios-lg">
        {(title || description) && (
          <div className="mb-ios-lg">
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold text-ios-text-primary mb-ios-sm">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm sm:text-base text-ios-text-secondary">
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
        block p-ios-lg rounded-ios-lg border-2 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-ios-md' : 'cursor-default'}
        ${isActive 
          ? 'border-ios-blue bg-ios-blue/10 shadow-ios' 
          : 'border-ios-gray-2 bg-ios-bg-primary hover:border-ios-gray-3'
        }
        ${onClick && !isActive ? 'hover:bg-ios-gray-1 hover:shadow-ios' : ''}
      `}
    >
      <div className="flex items-start space-x-ios-sm">
        {icon && (
          <div className={`
            flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-ios flex items-center justify-center text-lg sm:text-xl
            ${isActive ? 'bg-ios-blue/20 text-ios-blue' : 'bg-ios-gray-1 text-ios-text-tertiary'}
          `}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`
              text-sm sm:text-base font-semibold truncate
              ${isActive ? 'text-ios-blue' : 'text-ios-text-primary'}
            `}>
              {title}
            </h3>
          )}
          {description && (
            <p className={`
              mt-1 text-xs sm:text-sm line-clamp-2
              ${isActive ? 'text-ios-blue-dark' : 'text-ios-text-secondary'}
            `}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="mt-ios-md">
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
    primary: 'bg-ios-blue hover:bg-ios-blue-dark text-white',
    secondary: 'bg-ios-gray-5 hover:bg-ios-gray-6 text-white',
    outline: 'border border-ios-gray-3 hover:bg-ios-gray-1 text-ios-text-primary',
    danger: 'bg-ios-red hover:bg-ios-red-dark text-white'
  }

  const sizes = {
    sm: 'px-ios-sm py-1.5 text-sm',
    md: 'px-ios-md py-ios-sm text-sm',
    lg: 'px-ios-lg py-ios-sm text-base'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-ios 
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ios-blue
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