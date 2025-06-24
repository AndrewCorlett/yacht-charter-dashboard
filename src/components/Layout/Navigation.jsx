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
    <nav className="bg-blue-600 text-white">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - Nav toggle and brand */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-1 bg-blue-700 rounded hover:bg-blue-800 transition-colors">
            <span>Nav</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <h1 className="text-xl font-semibold">Seascape</h1>
        </div>

        {/* Right side - Search */}
        <button className="p-2 hover:bg-blue-700 rounded transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </nav>
  )
}

export default Navigation