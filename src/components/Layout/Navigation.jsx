/**
 * Navigation Component
 * 
 * Purpose: Top navigation bar with Seascape branding and user menu
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

function Navigation() {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  return (
    <nav 
      data-testid="main-header"
      className="fixed top-0 left-12 right-0 z-30 text-white" 
      style={{
        background: 'linear-gradient(135deg, var(--color-ios-blue) 0%, var(--color-ios-blue-dark) 100%)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - Nav toggle and brand */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-1 rounded transition-colors" style={{
            background: 'rgba(255, 255, 255, 0.15)',
            ':hover': { background: 'rgba(255, 255, 255, 0.25)' }
          }} onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
             onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}>
            <span>Nav</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <h1 className="text-xl font-semibold">Seascape</h1>
        </div>

        {/* Right side - User Menu */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <button className="p-2 rounded transition-colors" style={{
            background: 'rgba(255, 255, 255, 0.15)'
          }} onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
             onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1 rounded transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm">{user?.email || 'User'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 border border-gray-700 z-50"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                    Signed in as<br />
                    <span className="font-medium text-white">{user?.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      signOut()
                      setShowUserMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation