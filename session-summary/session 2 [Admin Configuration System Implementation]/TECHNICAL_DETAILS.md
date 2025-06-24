# Technical Implementation Details - Session 2

## Component Architecture Overview

### Admin System Structure
```
src/components/admin/
├── AdminConfigPage.jsx          # Main controller (286 lines)
├── AdminConfigLayout.jsx        # Layout foundation (260 lines)
├── ConfigurationTabs.jsx        # Tab navigation (174 lines)
├── pricing/                     # Pricing management module
│   ├── PricingConfig.jsx        # Rules management (368 lines)
│   ├── AddPricingRule.jsx       # Creation modal (350 lines)
│   ├── EditPricingRule.jsx      # Editing modal (405 lines)
│   └── SeasonalPricing.jsx      # Seasonal management (419 lines)
└── yacht/                       # Fleet management module
    └── YachtSpecsConfig.jsx     # Fleet management (546 lines)
```

## State Management Implementation

### AdminConfigPage State Structure
```javascript
// Main admin state
const [activeTab, setActiveTab] = useState('pricing')
const [isLoading, setIsLoading] = useState(false)

// Pricing-specific state
const [pricingView, setPricingView] = useState('overview')
const [isAddPricingModalOpen, setIsAddPricingModalOpen] = useState(false)
const [isEditPricingModalOpen, setIsEditPricingModalOpen] = useState(false)
const [selectedPricingRule, setSelectedPricingRule] = useState(null)
```

### State Flow Patterns
1. **Top-level State:** AdminConfigPage manages global admin state
2. **Section State:** Individual components manage their local state
3. **Modal State:** Modal visibility and data handled at appropriate level
4. **Form State:** Controlled components with validation state

## Form Validation Implementation

### Pricing Rule Validation
```javascript
const validateForm = () => {
  const newErrors = {}
  
  if (!formData.yachtId) newErrors.yachtId = 'Yacht is required'
  if (!formData.rate || isNaN(formData.rate) || parseFloat(formData.rate) <= 0) {
    newErrors.rate = 'Valid rate is required'
  }
  if (!formData.startDate) newErrors.startDate = 'Start date is required'
  if (!formData.endDate) newErrors.endDate = 'End date is required'
  if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
    newErrors.endDate = 'End date must be after start date'
  }
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

### Validation Features
- **Client-side Validation:** Immediate feedback for user input
- **Business Rule Validation:** Date range conflicts and logical consistency
- **Field-level Validation:** Individual field validation with clear error messages
- **Form-level Validation:** Overall form state validation before submission

## Responsive Design Implementation

### AdminConfigLayout Responsive Features
```javascript
// Mobile sidebar handling
const [isSidebarOpen, setIsSidebarOpen] = useState(false)

// Responsive classes
className={`
  ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  lg:translate-x-0 lg:static absolute inset-y-0 left-0 z-40
  w-80 bg-white border-r border-gray-200 shadow-lg lg:shadow-none
  transform transition-transform duration-300 ease-in-out
`}
```

### Responsive Grid System
- **ConfigGrid Component:** Responsive grid with configurable columns
- **Breakpoint Strategy:** Mobile-first with progressive enhancement
- **Grid Configurations:**
  - 1 column: Mobile (default)
  - 2 columns: md breakpoint (768px+)
  - 3 columns: lg breakpoint (1024px+)
  - 4 columns: lg breakpoint for specific layouts

## Data Structures

### Pricing Rule Data Model
```javascript
{
  id: 1,
  yachtId: 'spectre',
  yachtName: 'Spectre',
  ruleType: 'base', // base | seasonal | special
  rateType: 'daily', // daily | hourly
  rate: 2500,
  currency: 'EUR',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  minHours: 4,
  priority: 1,
  isActive: true
}
```

### Yacht Specification Data Model
```javascript
{
  id: 'spectre',
  name: 'Spectre',
  type: 'Motor Yacht',
  length: 52,
  capacity: 12,
  cabins: 5,
  crew: 4,
  year: 2019,
  manufacturer: 'Sunseeker',
  model: 'Predator 50',
  engines: '2x MAN V8 1000HP',
  maxSpeed: 32,
  cruiseSpeed: 25,
  fuelCapacity: 2200,
  waterCapacity: 500,
  status: 'active',
  homePort: 'Monaco',
  images: ['/images/spectre-1.jpg'],
  description: 'Luxury motor yacht...',
  amenities: ['wifi', 'aircon', 'sound_system'],
  lastMaintenance: '2025-06-01',
  nextMaintenance: '2025-12-01'
}
```

## Component Interaction Patterns

### Modal Management Pattern
```javascript
// Modal state management
const [isModalOpen, setIsModalOpen] = useState(false)
const [selectedData, setSelectedData] = useState(null)

// Modal handlers
const handleOpenModal = (data = null) => {
  setSelectedData(data)
  setIsModalOpen(true)
}

const handleCloseModal = () => {
  setIsModalOpen(false)
  setSelectedData(null)
}

// Modal component usage
<EditModal
  isOpen={isModalOpen}
  onClose={handleCloseModal}
  data={selectedData}
  onSave={handleSave}
/>
```

### Navigation State Management
```javascript
// Section navigation in AdminConfigPage
const renderTabContent = () => {
  switch (activeTab) {
    case 'pricing':
      return renderPricingContent()
    case 'yachts':
      return <YachtSpecsConfig />
    // ... other cases
  }
}

// Sub-navigation within pricing
const renderPricingContent = () => {
  switch (pricingView) {
    case 'rules':
      return <PricingConfig />
    case 'seasonal':
      return <SeasonalPricing />
    case 'overview':
    default:
      return renderPricingOverview()
  }
}
```

## Performance Optimizations

### Efficient Rendering
```javascript
// Memoized filtering and sorting
const sortedAndFilteredRules = useMemo(() => {
  let filteredRules = pricingRules.filter(rule => {
    if (filterConfig.yacht !== 'all' && rule.yachtId !== filterConfig.yacht) return false
    if (filterConfig.ruleType !== 'all' && rule.ruleType !== filterConfig.ruleType) return false
    return true
  })

  if (sortConfig.key) {
    filteredRules.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  return filteredRules
}, [pricingRules, sortConfig, filterConfig])
```

### Component Optimization Strategies
- **useMemo for Expensive Calculations:** Filtering, sorting, and data transformations
- **Conditional Rendering:** Only render active components and modals
- **State Coloaction:** Keep state as close to usage as possible
- **Event Handler Optimization:** Stable references and proper cleanup

## Integration Architecture

### Sidebar Integration
```javascript
// Enhanced Sidebar component
function Sidebar({ activeSection = 'dashboard', onSectionChange }) {
  const handleSectionChange = (section) => {
    if (onSectionChange) {
      onSectionChange(section)
    }
  }
  // Navigation items with admin config
}

// MainDashboard integration
const [activeSection, setActiveSection] = useState('dashboard')

const renderMainContent = () => {
  switch (activeSection) {
    case 'admin':
      return <AdminConfigPage />
    case 'dashboard':
    default:
      return renderDashboardContent()
  }
}
```

### Modal System Integration
```javascript
// Modal components using existing Modal component
import Modal from '../../common/Modal'

// Consistent modal pattern across admin system
function AdminModal({ isOpen, onClose, title, children }) {
  return (
    <Modal onClose={onClose} title={title}>
      {children}
    </Modal>
  )
}
```

## Testing Infrastructure

### Component Testing Strategy
- **Unit Tests:** Individual component functionality
- **Integration Tests:** Component interaction and data flow
- **User Journey Tests:** Complete admin workflows
- **Responsive Tests:** Layout behavior across breakpoints

### Mock Data Implementation
```javascript
// Realistic mock data for development and testing
export const mockPricingRules = [
  {
    id: 1,
    yachtId: 'spectre',
    yachtName: 'Spectre',
    ruleType: 'base',
    rate: 2500,
    // ... complete pricing rule
  }
  // ... additional mock data
]

export const mockYachts = [
  {
    id: 'spectre',
    name: 'Spectre',
    type: 'Motor Yacht',
    // ... complete yacht specification
  }
  // ... additional yacht data
]
```

## Code Quality Standards

### TypeScript Readiness
- **Props Interfaces:** Components designed for easy TypeScript migration
- **Data Type Consistency:** Consistent data structures throughout
- **Function Signatures:** Clear parameter and return types

### Error Handling
```javascript
// Comprehensive error handling pattern
const [errors, setErrors] = useState({})
const [isSubmitting, setIsSubmitting] = useState(false)

const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!validateForm()) return

  setIsSubmitting(true)
  try {
    await onSave(formData)
    handleClose()
  } catch (error) {
    setErrors({ submit: 'Failed to save. Please try again.' })
  } finally {
    setIsSubmitting(false)
  }
}
```

### Accessibility Implementation
- **ARIA Labels:** Proper labeling for screen readers
- **Keyboard Navigation:** Tab order and keyboard shortcuts
- **Focus Management:** Proper focus handling in modals and forms
- **Color Contrast:** WCAG compliant color schemes

---

*Technical documentation generated for Session 2*  
*Admin Configuration System Implementation*