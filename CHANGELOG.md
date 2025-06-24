# Changelog

All notable changes to the Yacht Charter Dashboard will be documented in this file.

## [0.1.0] - 2025-06-22

### Added
- Initial project setup with React + Vite
- Tailwind CSS configuration
- Yacht timeline calendar component
- Date navigation (Previous/Today/Next)
- View mode selector (Day/Week/Month)
- 6 yacht tracking: Spectre, Disk Drive, Arriva, Zambada, Melba So, Swansea
- Color-coded booking status
- Mock booking data
- Sticky headers for yacht names and dates
- Calendar legend
- Click handlers for cells
- Modal component for future booking forms
- Loading and error states
- Responsive design for mobile/desktop
- Keyboard navigation with arrow keys
- Performance optimizations (React.memo, useCallback, useMemo)
- Unit tests for all components
- Comprehensive documentation

### Technical Details
- React 19.1.0
- Vite 6.3.5
- Tailwind CSS 4.1.10
- date-fns 4.1.0
- Vitest 3.2.4
- 28 unit tests passing

### Known Issues
- Calendar is using mock data (ready for backend integration)
- Modal forms not yet implemented
- No data persistence