# Create Booking Section - Job List

## Overview
Implement a "Create Booking" form section in the bottom left of the viewport, positioned below the existing SIT REP section in the sidebar.

---

## Phase 1: Component Structure
**Priority: High | Estimated Time: 2-3 hours**

### Task 1.1: Create Base Component
- [ ] Create `src/components/booking/CreateBookingSection.jsx`
- [ ] Set up basic component structure with JSX skeleton
- [ ] Add component documentation header
- **Dependencies**: None
- **Acceptance Criteria**: Component exists and renders without errors

### Task 1.2: Create Form Container
- [ ] Add form wrapper with proper HTML form element
- [ ] Implement basic styling matching SitRepSection design
- [ ] Add "CREATE BOOKING" header with consistent typography
- **Dependencies**: Task 1.1
- **Acceptance Criteria**: Form container matches existing design patterns

### Task 1.3: Set Up Component Exports
- [ ] Export component from `src/components/booking/index.js`
- [ ] Ensure proper import/export structure
- **Dependencies**: Task 1.1
- **Acceptance Criteria**: Component can be imported cleanly

---

## Phase 2: Form Fields Implementation
**Priority: High | Estimated Time: 4-5 hours**

### Task 2.1: Customer Information Fields
- [ ] Add customer name input field
- [ ] Add customer number input field
- [ ] Implement proper input styling and labels
- **Dependencies**: Task 1.2
- **Acceptance Criteria**: Customer fields render with proper validation attributes

### Task 2.2: Yacht Selection Dropdown
- [ ] Create yacht selection dropdown with 6 yacht options
- [ ] Use same yacht data as calendar (Spectre, Disk Drive, etc.)
- [ ] Add placeholder and validation
- **Dependencies**: Task 1.2
- **Acceptance Criteria**: Dropdown shows all 6 yachts and handles selection

### Task 2.3: Date Selection Fields
- [ ] Add start date picker input
- [ ] Add end date picker input
- [ ] Implement date validation (end after start)
- **Dependencies**: Task 1.2
- **Acceptance Criteria**: Date pickers work with proper validation

### Task 2.4: Trip Type Selection
- [ ] Add trip type dropdown/radio buttons
- [ ] Options: Charter, Owner Use, Maintenance
- [ ] Style to match existing design
- **Dependencies**: Task 1.2
- **Acceptance Criteria**: Trip type selection works properly

### Task 2.5: Notes/Comments Field
- [ ] Add textarea for additional notes
- [ ] Implement character limit and validation
- [ ] Style consistently with other fields
- **Dependencies**: Task 1.2
- **Acceptance Criteria**: Notes field accepts input with proper limits

### Task 2.6: Form Field Styling
- [ ] Apply consistent styling across all form fields
- [ ] Match input field design with existing components
- [ ] Ensure proper spacing and alignment
- **Dependencies**: Tasks 2.1-2.5
- **Acceptance Criteria**: All fields have consistent, professional styling

### Task 2.7: Form Accessibility
- [ ] Add proper labels and ARIA attributes
- [ ] Implement keyboard navigation
- [ ] Ensure screen reader compatibility
- **Dependencies**: Tasks 2.1-2.5
- **Acceptance Criteria**: Form meets accessibility standards

---

## Phase 3: Form Functionality
**Priority: High | Estimated Time: 3-4 hours**

### Task 3.1: Form State Management
- [ ] Implement useState for all form fields
- [ ] Create form data object structure
- [ ] Handle input change events
- **Dependencies**: Phase 2 complete
- **Acceptance Criteria**: Form state updates properly on user input

### Task 3.2: Form Validation Logic
- [ ] Add client-side validation for required fields
- [ ] Implement date range validation
- [ ] Add customer number format validation
- **Dependencies**: Task 3.1
- **Acceptance Criteria**: Form validation prevents invalid submissions

### Task 3.3: Submit Handler
- [ ] Create form submit handler function
- [ ] Implement form data processing
- [ ] Add success/error feedback
- **Dependencies**: Task 3.2
- **Acceptance Criteria**: Form submits and processes data correctly

### Task 3.4: Reset Functionality
- [ ] Add reset form function
- [ ] Clear all form fields on reset
- [ ] Reset validation states
- **Dependencies**: Task 3.1
- **Acceptance Criteria**: Form resets to initial state properly

---

## Phase 4: Layout Integration
**Priority: High | Estimated Time: 2-3 hours**

### Task 4.1: Update MainDashboard Layout
- [ ] Import CreateBookingSection in MainDashboard.jsx
- [ ] Add component to sidebar below SitRepSection
- [ ] Ensure proper spacing between sections
- **Dependencies**: Phase 1 complete
- **Acceptance Criteria**: Component appears in correct location

### Task 4.2: Sidebar Scroll Management
- [ ] Ensure sidebar scrolls properly when content overflows
- [ ] Test with different viewport heights
- [ ] Maintain fixed layout for other elements
- **Dependencies**: Task 4.1
- **Acceptance Criteria**: Sidebar scrolling works without affecting other elements

### Task 4.3: Responsive Design Check
- [ ] Test layout on different screen sizes
- [ ] Ensure 60/40 viewport split is maintained
- [ ] Verify form remains usable on smaller screens
- **Dependencies**: Task 4.1
- **Acceptance Criteria**: Layout remains functional across viewport sizes

---

## Phase 5: Styling & UX
**Priority: Medium | Estimated Time: 3-4 hours**

### Task 5.1: Visual Design Consistency
- [ ] Match card styling (white background, rounded corners, shadow)
- [ ] Use consistent color scheme with calendar
- [ ] Apply proper typography hierarchy
- **Dependencies**: Phase 4 complete
- **Acceptance Criteria**: Component visually integrates with existing design

### Task 5.2: Form Validation Feedback
- [ ] Add error message display for validation failures
- [ ] Implement success feedback on valid submission
- [ ] Style validation states appropriately
- **Dependencies**: Task 3.2
- **Acceptance Criteria**: Users receive clear feedback on form state

### Task 5.3: Loading States
- [ ] Add loading spinner for form submission
- [ ] Disable form during submission
- [ ] Show appropriate loading feedback
- **Dependencies**: Task 3.3
- **Acceptance Criteria**: Loading states provide good UX during submission

### Task 5.4: Micro-interactions
- [ ] Add hover effects to buttons
- [ ] Implement focus states for form fields
- [ ] Add smooth transitions for state changes
- **Dependencies**: Task 5.1
- **Acceptance Criteria**: Form feels responsive and polished

---

## Phase 6: Integration
**Priority: High | Estimated Time: 2-3 hours**

### Task 6.1: Connect to Booking System
- [ ] Link form submit to existing `handleCreateBooking` function
- [ ] Pass form data in correct format
- [ ] Handle booking creation response
- **Dependencies**: Task 3.3, existing booking system
- **Acceptance Criteria**: Form creates bookings that appear in calendar

### Task 6.2: Modal Integration
- [ ] Integrate with existing BookingFormModal if needed
- [ ] Ensure consistent booking creation flow
- [ ] Handle modal state management
- **Dependencies**: Task 6.1
- **Acceptance Criteria**: Booking creation integrates with existing modal system

### Task 6.3: Calendar Pre-fill Integration
- [ ] Allow calendar cell clicks to pre-fill date fields
- [ ] Pass yacht and date information from calendar
- [ ] Update form when calendar selection changes
- **Dependencies**: Task 6.1
- **Acceptance Criteria**: Clicking calendar cells populates form appropriately

---

## Phase 7: Testing & Quality Assurance
**Priority: Medium | Estimated Time: 2-3 hours**

### Task 7.1: Form Validation Testing
- [ ] Test all validation scenarios
- [ ] Verify error messages display correctly
- [ ] Test edge cases for date validation
- **Dependencies**: Phase 3 complete
- **Acceptance Criteria**: All validation works as expected

### Task 7.2: Layout & Responsive Testing
- [ ] Test on multiple screen sizes
- [ ] Verify no layout overflow issues
- [ ] Check scrolling behavior
- **Dependencies**: Phase 4 complete
- **Acceptance Criteria**: Layout works across all target devices

### Task 7.3: Integration Testing
- [ ] Test complete booking creation flow
- [ ] Verify calendar updates with new bookings
- [ ] Test error handling scenarios
- **Dependencies**: Phase 6 complete
- **Acceptance Criteria**: End-to-end booking flow works correctly

### Task 7.4: Accessibility Testing
- [ ] Test with keyboard navigation only
- [ ] Verify screen reader compatibility
- [ ] Check color contrast compliance
- **Dependencies**: Task 2.7
- **Acceptance Criteria**: Component meets WCAG accessibility standards

---

## Final Deliverables

### Expected Outcome
- [ ] Clean, professional booking form in bottom left of viewport
- [ ] Seamless integration with existing layout and design
- [ ] Fully functional booking creation with validation
- [ ] Maintains 60/40 viewport split
- [ ] Responsive design that works on all screen sizes
- [ ] Accessible and user-friendly interface

### Technical Requirements Met
- [ ] Component follows existing code patterns
- [ ] Proper error handling and validation
- [ ] Integration with existing booking system
- [ ] No layout conflicts or overflow issues
- [ ] Performance optimized (no unnecessary re-renders)

---

## Notes
- Refer to existing SitRepSection for styling consistency
- Use same yacht data source as calendar component
- Follow existing form patterns in BookingFormModal
- Ensure all changes maintain existing functionality
- Test thoroughly before considering complete