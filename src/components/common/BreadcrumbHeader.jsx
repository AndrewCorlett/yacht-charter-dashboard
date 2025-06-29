/**
 * BreadcrumbHeader Component
 * 
 * Purpose: File path style breadcrumb navigation header
 * 
 * Features:
 * - Displays path: Seascape > Booking Management > Booking [BookingNumber]
 * - Each breadcrumb part is clickable with hover states
 * - Dark theme styling consistent with BookingPanel
 * - Responsive design
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

function BreadcrumbHeader({ bookingNumber, onSeascapeClick, onBookingManagementClick, onBack }) {
  const breadcrumbItems = [
    {
      label: 'Seascape',
      onClick: onSeascapeClick,
      isClickable: true
    },
    {
      label: 'Booking Management',
      onClick: onBookingManagementClick,
      isClickable: true
    },
    {
      label: `Booking ${bookingNumber || 'New'}`,
      onClick: null,
      isClickable: false
    }
  ]

  return (
    <div className="bg-blue-600 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="text-white hover:text-gray-200 transition-colors"
            title="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center text-white">
            {breadcrumbItems.map((item, index) => (
              <div key={index} className="flex items-center">
                {/* Breadcrumb Item */}
                {item.isClickable ? (
                  <button
                    onClick={item.onClick}
                    className="hover:text-blue-200 transition-colors font-medium text-lg underline-offset-4 hover:underline"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-blue-100 font-medium text-lg">
                    {item.label}
                  </span>
                )}

                {/* Separator */}
                {index < breadcrumbItems.length - 1 && (
                  <span className="mx-3 text-blue-200 font-medium text-lg">
                    &gt;
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Navigation Indicator */}
        <div className="text-sm text-blue-200">Nav ↓</div>
      </div>
    </div>
  )
}

export default BreadcrumbHeader