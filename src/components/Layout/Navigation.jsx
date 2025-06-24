/**
 * Navigation Component
 * 
 * Purpose: Top navigation bar with Seascape branding
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

function Navigation() {
  return (
    <nav className="fixed top-0 left-12 right-0 z-30 text-white" style={{
      background: 'linear-gradient(135deg, var(--color-ios-blue) 0%, var(--color-ios-blue-dark) 100%)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
    }}>
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

        {/* Right side - Search */}
        <button className="p-2 rounded transition-colors" style={{
          background: 'rgba(255, 255, 255, 0.15)'
        }} onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
           onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </nav>
  )
}

export default Navigation