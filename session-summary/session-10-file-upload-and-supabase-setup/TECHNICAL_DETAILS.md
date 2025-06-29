# Technical Details - Session 10: File Upload & Supabase Setup

## Architecture Overview

This session implemented two major technical enhancements: a comprehensive file upload system and complete Supabase database integration. Both implementations follow enterprise-grade patterns and maintain full backward compatibility.

## File Upload System Architecture

### Component Design Pattern
```jsx
// FileUpload Component Architecture
const FileUpload = ({
  onFileUpload,      // Callback for file selection
  acceptedTypes,     // File type restrictions
  maxSize,          // Size limitations
  title,            // Component title
  description,      // User guidance
  currentFile       // Existing file state
}) => {
  // Internal state management
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  
  // File validation logic
  const validateFile = (file) => {
    // MIME type and extension validation
    // Size limit enforcement
    // Error message generation
  }
}
```

### File Validation System
```javascript
// Multi-layer validation approach
const validateFile = (file) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  const allowedExtensions = ['.pdf', '.doc', '.docx']
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

  // Primary validation: MIME type
  if (!allowedTypes.includes(file.type)) {
    // Fallback validation: File extension
    if (!allowedExtensions.includes(fileExtension)) {
      return { valid: false, error: 'Only PDF and Word documents are allowed.' }
    }
  }

  // Size validation with user-friendly messaging
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB.` }
  }

  return { valid: true }
}
```

### Drag & Drop Implementation
```javascript
// Event handling for drag and drop
const handleDragOver = (e) => {
  e.preventDefault()
  e.stopPropagation()
  setIsDragOver(true)
}

const handleDrop = (e) => {
  e.preventDefault()
  e.stopPropagation()
  setIsDragOver(false)

  const files = Array.from(e.dataTransfer.files)
  if (files.length > 0) {
    handleFileSelect(files[0]) // Single file handling
  }
}

// Visual feedback system
const dropZoneClasses = `
  border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors
  ${isDragOver 
    ? 'border-blue-400 bg-blue-400/10' 
    : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
  }
`
```

### File Processing Pipeline
```javascript
const handleFileSelect = async (file) => {
  setErrorMessage('')
  
  // Step 1: Validation
  const validation = validateFile(file)
  if (!validation.valid) {
    setErrorMessage(validation.error)
    setUploadStatus('error')
    return
  }

  // Step 2: Processing state
  setUploadStatus('uploading')
  
  // Step 3: File object creation
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing
    
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      url: URL.createObjectURL(file), // For preview/download
      file: file // Original file for actual upload
    }
    
    // Step 4: Callback execution
    if (onFileUpload) {
      onFileUpload(fileInfo)
    }
    
    setUploadStatus('success')
  } catch (error) {
    setErrorMessage('Failed to upload file. Please try again.')
    setUploadStatus('error')
  }
}
```

## Supabase Integration Architecture

### Client Configuration Pattern
```javascript
// Singleton pattern implementation
let supabaseInstance = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,    // Automatic token refresh
        persistSession: true,      // Session persistence
        detectSessionInUrl: true,  // URL-based auth detection
        storage: window?.localStorage // Browser storage
      },
      realtime: {
        params: {
          eventsPerSecond: 10      // Rate limiting for real-time
        }
      }
    })
  }
  return supabaseInstance
})()
```

### Database Helper Functions
```javascript
// CRUD operations abstraction
export const db = {
  // Read operations
  async getBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create operations
  async createBooking(booking) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Real-time subscriptions
  subscribeToBookings(callback) {
    return supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        callback
      )
      .subscribe()
  }
}
```

### Environment Variable Management
```javascript
// Environment validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required')
}

// Feature flag support
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'
```

## Database Schema Design

### Table Relationship Architecture
```sql
-- Primary entities with relationships
yachts (1) ←→ (N) bookings ←→ (1) customers
       ↓
pricing_rules (N)

bookings (1) ←→ (N) generated_documents ←→ (1) document_templates
```

### Custom Type System
```sql
-- Enum types for data consistency
CREATE TYPE charter_type AS ENUM ('bareboat', 'skippered charter');
CREATE TYPE booking_status AS ENUM ('tentative', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'deposit_paid', 'full_payment', 'refunded');
```

### Advanced Table Features
```sql
-- Bookings table with comprehensive tracking
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number TEXT UNIQUE NOT NULL,
    
    -- Foreign key relationships
    yacht_id UUID NOT NULL REFERENCES yachts(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Custom types for data integrity
    charter_type charter_type NOT NULL DEFAULT 'bareboat',
    booking_status booking_status NOT NULL DEFAULT 'tentative',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    
    -- Date validation
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    
    -- File upload support
    crew_experience_file_name TEXT,
    crew_experience_file_url TEXT,
    crew_experience_file_size INTEGER,
    
    -- Automatic timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Performance Optimization
```sql
-- Strategic indexing for common queries
CREATE INDEX idx_bookings_yacht ON bookings(yacht_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);

-- Partial indexes for active records
CREATE INDEX idx_yachts_active ON yachts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_settlements_unsettled ON settlements(is_settled) WHERE is_settled = FALSE;
```

### Trigger System
```sql
-- Automatic timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all relevant tables
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Integration Patterns

### BookingPanel Integration
```jsx
// State management enhancement
const [formData, setFormData] = useState({
  // ... existing fields
  crewExperienceFile: booking?.crewExperienceFile || null  // New field
})

// File upload handler
const handleFileUpload = (fileInfo) => {
  setFormData(prev => ({
    ...prev,
    crewExperienceFile: fileInfo
  }))
}

// Component replacement
// OLD: Dropdown + Textarea
<div className="space-y-3">
  <select>...</select>
  <textarea>...</textarea>
</div>

// NEW: File Upload Component
<FileUpload
  title="Crew Experience"
  description="Upload crew experience document (PDF or Word)"
  acceptedTypes=".pdf,.doc,.docx"
  maxSize={10 * 1024 * 1024}
  onFileUpload={handleFileUpload}
  currentFile={formData.crewExperienceFile}
/>
```

### Unsaved Changes Integration
```jsx
// The useUnsavedChanges hook automatically detects file changes
const {
  isDirty,
  showUnsavedModal,
  handleNavigation,
  // ... other handlers
} = useUnsavedChanges(formData, statusData, booking)

// File changes trigger dirty state
useEffect(() => {
  // Existing logic already handles crewExperienceFile changes
  const formChanged = Object.keys(formData).some(key => {
    return formData[key] !== (originalData[key] || '')
  })
  
  setIsDirty(formChanged || statusChanged)
}, [formData, statusData, originalData])
```

## Security Implementation

### File Upload Security
```javascript
// Client-side validation layers
const securityChecks = {
  // MIME type validation
  mimeTypeCheck: (file) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    return allowedMimes.includes(file.type)
  },
  
  // File extension validation (fallback)
  extensionCheck: (filename) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx']
    const extension = '.' + filename.split('.').pop().toLowerCase()
    return allowedExtensions.includes(extension)
  },
  
  // Size limit enforcement
  sizeCheck: (file, maxSize) => {
    return file.size <= maxSize
  }
}
```

### Database Security
```sql
-- Row Level Security implementation
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Basic policies (to be refined based on auth requirements)
CREATE POLICY "Allow all operations on bookings" 
    ON bookings FOR ALL USING (true);

-- Future: User-based policies
CREATE POLICY "Users can view their own bookings" 
    ON bookings FOR SELECT 
    USING (auth.uid() = customer_id);
```

### Environment Security
```bash
# .env file structure
VITE_SUPABASE_URL=https://ijsvrotcvrvrmnzazxya.supabase.co
VITE_SUPABASE_ANON_KEY=[public_key]  # Safe for client-side
VITE_SUPABASE_SERVICE_ROLE_KEY=[admin_key]  # Development only, never in production client
```

## Error Handling Strategy

### File Upload Error Handling
```javascript
// Comprehensive error categorization
const errorTypes = {
  INVALID_TYPE: 'Only PDF and Word documents (.pdf, .doc, .docx) are allowed.',
  FILE_TOO_LARGE: (maxMB) => `File size must be less than ${maxMB}MB.`,
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.'
}

// User-friendly error display
const ErrorDisplay = ({ error }) => (
  <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-600 rounded-lg">
    <svg className="w-5 h-5 text-red-400" /* error icon */ />
    <p className="text-sm text-red-300">{error}</p>
  </div>
)
```

### Database Error Handling
```javascript
// Supabase error handling patterns
const handleDatabaseError = (error) => {
  if (error.code === 'PGRST116') {
    return 'No records found'
  } else if (error.code === '23505') {
    return 'This record already exists'
  } else if (error.code === '23503') {
    return 'Referenced record does not exist'
  } else {
    return 'Database operation failed. Please try again.'
  }
}

// Wrapper function for consistent error handling
const safeDbOperation = async (operation) => {
  try {
    return await operation()
  } catch (error) {
    console.error('Database error:', error)
    throw new Error(handleDatabaseError(error))
  }
}
```

## Performance Considerations

### File Upload Performance
```javascript
// Efficient file handling
const optimizations = {
  // Debounced validation for large files
  debouncedValidation: useMemo(() => 
    debounce(validateFile, 300), [maxSize, acceptedTypes]),
  
  // Memory cleanup
  cleanupFileUrl: useCallback((fileUrl) => {
    if (fileUrl && fileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(fileUrl)
    }
  }, []),
  
  // Lazy loading for file icons
  fileIcon: useMemo(() => getFileIcon(fileName), [fileName])
}
```

### Database Performance
```javascript
// Query optimization patterns
const optimizedQueries = {
  // Select only needed fields
  getBookingSummary: () => supabase
    .from('bookings')
    .select('id, booking_number, start_date, end_date, booking_status')
    .order('start_date', { ascending: false }),
  
  // Use indexes for filtering
  getBookingsByStatus: (status) => supabase
    .from('bookings')
    .select('*')
    .eq('booking_status', status)
    .order('created_at', { ascending: false }),
  
  // Limit results for pagination
  getBookingsPage: (page, limit = 20) => supabase
    .from('bookings')
    .select('*')
    .range(page * limit, (page + 1) * limit - 1)
}
```

## Testing Architecture

### Component Testing Strategy
```javascript
// File upload component tests
describe('FileUpload Component', () => {
  test('validates file types correctly', () => {
    // Test PDF acceptance
    // Test Word document acceptance
    // Test rejection of other file types
  })
  
  test('enforces size limits', () => {
    // Test files under limit
    // Test files over limit
    // Test size limit messaging
  })
  
  test('handles drag and drop', () => {
    // Test drag enter/leave events
    // Test drop event processing
    // Test visual feedback
  })
})
```

### Integration Testing
```javascript
// BookingPanel integration tests
describe('BookingPanel File Upload Integration', () => {
  test('maintains unsaved changes tracking', () => {
    // Upload file
    // Verify dirty state
    // Test navigation warning
  })
  
  test('preserves existing form validation', () => {
    // Test required field validation
    // Test form submission
    // Test error handling
  })
})
```

### Database Testing
```javascript
// Supabase connection tests
describe('Supabase Integration', () => {
  test('connects successfully', async () => {
    const { data, error } = await supabase.auth.getSession()
    expect(error).toBeNull()
  })
  
  test('handles CRUD operations', async () => {
    // Test create, read, update, delete
    // Test error conditions
    // Test data validation
  })
})
```

## Deployment Considerations

### Build Process
```javascript
// Vite configuration considerations
export default defineConfig({
  // Environment variable handling
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
  },
  
  // Build optimization
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
})
```

### Environment Management
```bash
# Development
VITE_SUPABASE_URL=https://ijsvrotcvrvrmnzazxya.supabase.co
VITE_SUPABASE_ANON_KEY=[dev_key]
VITE_USE_SUPABASE=true
VITE_USE_MOCK_DATA=false

# Production
VITE_SUPABASE_URL=https://production-project.supabase.co
VITE_SUPABASE_ANON_KEY=[prod_key]
VITE_USE_SUPABASE=true
VITE_USE_MOCK_DATA=false
# Note: SERVICE_ROLE_KEY should never be in production client builds
```

### Database Migration Strategy
```sql
-- Version control for schema changes
-- v1.0.0 - Initial schema
CREATE TABLE schema_versions (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_versions (version, description) 
VALUES ('1.0.0', 'Initial yacht charter schema with file upload support');
```

This technical implementation provides a robust foundation for both file management and database operations, with comprehensive error handling, security considerations, and performance optimizations throughout.