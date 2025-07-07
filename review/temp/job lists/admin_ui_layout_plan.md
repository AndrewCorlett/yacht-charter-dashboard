# Admin Configuration Page - Complete UI Layout Plan
## Single Page Application (SPA) Design Specification
*Created: June 24, 2025*

---

## Overall SPA Architecture

### Main Layout Structure
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP NAVIGATION BAR (Fixed Header - 60px height)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ SIDE NAVIGATION │ MAIN CONTENT AREA                                         │
│ (Fixed Left)    │ (Scrollable)                                              │
│ 250px width     │ calc(100% - 250px)                                        │
│                 │                                                           │
│                 │                                                           │
│                 │                                                           │
│                 │                                                           │
│                 │                                                           │
│                 │                                                           │
│                 │                                                           │
│                 │                                                           │
│                 │                                                           │
│                 │                                                           │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

---

## 1. Top Navigation Bar (Fixed Header)

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [≡] Admin Panel │           Breadcrumb Trail           │ User Menu [Profile▼]│
│ 15px padding    │                                      │ 15px padding        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components Breakdown

#### Left Section (200px)
- **Hamburger Menu Icon** `[≡]`
  - Toggle button for collapsing side navigation
  - 24x24px icon
  - Click action: Toggle sidebar visibility
- **Admin Panel Title**
  - Text: "Admin Panel"
  - Font weight: medium
  - Color: primary text

#### Center Section (Flex grow)
- **Breadcrumb Navigation**
  - Home icon > Admin > [Current Section] > [Subsection if applicable]
  - Clickable breadcrumb links
  - Separator: ">" or "/" 
  - Current page: bold/highlighted

#### Right Section (200px)
- **User Profile Dropdown**
  - User avatar (32x32px circle)
  - Username display
  - Dropdown arrow icon
  - Dropdown menu items:
    - "View Profile"
    - "Settings"
    - "Help & Documentation"
    - "Logout"

---

## 2. Side Navigation (Fixed Left Panel)

### Navigation Structure
```
┌─────────────────────────────┐
│ ADMIN NAVIGATION            │
├─────────────────────────────┤
│ 🏠 Dashboard Overview       │
│ 💰 Pricing Management       │
│ 🚤 Yacht Configuration      │
│ 📄 Document Templates       │
│ ⚙️ Business Settings        │
│ 📊 Audit Trail             │
│ ❓ Help & Support          │
├─────────────────────────────┤
│ QUICK ACTIONS               │
├─────────────────────────────┤
│ [+ Add Pricing Rule]        │
│ [+ Upload Template]         │
│ [+ Edit Yacht Specs]        │
└─────────────────────────────┘
```

### Navigation Items Details

#### Main Navigation Section
Each nav item has:
- **Icon** (24x24px)
- **Label** (14px font)
- **Active state indicator** (left border or background highlight)
- **Hover state** (background color change)
- **Click action** (route to section)

#### Quick Actions Section
- **Add Pricing Rule Button**
  - Full width button
  - Primary button styling
  - Icon: "+" symbol
  - Text: "Add Pricing Rule"
  - Action: Open pricing rule modal

- **Upload Template Button**
  - Full width button
  - Secondary button styling  
  - Icon: Upload symbol
  - Text: "Upload Template"
  - Action: Open file upload modal

- **Edit Yacht Specs Button**
  - Full width button
  - Secondary button styling
  - Icon: Edit symbol
  - Text: "Edit Yacht Specs"
  - Action: Navigate to yacht management

---

## 3. Main Content Area Layout

### Content Container Structure
```
┌───────────────────────────────────────────────────────────────┐
│ PAGE HEADER (80px height)                                     │
├───────────────────────────────────────────────────────────────┤
│ CONTENT BODY (Scrollable)                                     │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Page Header Structure
```
┌───────────────────────────────────────────────────────────────┐
│ Page Title                               │ Action Buttons      │
│ "Pricing Management"                     │ [Filter] [Export]   │
│ Subtitle/Description                     │ [+ Primary Action]  │
│ "Manage yacht pricing rules and seasons"│                     │
└───────────────────────────────────────────────────────────────┘
```

#### Page Header Components
- **Page Title** (H1, 28px font, bold)
- **Page Description** (14px font, gray text)
- **Filter Button** (Secondary button with filter icon)
- **Export Button** (Secondary button with download icon)
- **Primary Action Button** (Primary button, varies by page)

---

## 4. Dashboard Overview Page

### Layout Grid
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ SUMMARY CARDS ROW (Grid: 1fr 1fr 1fr)                         │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ Pricing Rules       │ Active Templates    │ Configuration       │
│ Count: 24          │ Count: 8            │ Last Updated        │
│ [View All]         │ [Manage]            │ [Review Changes]    │
└─────────────────────┴─────────────────────┴─────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ RECENT ACTIVITY SECTION                                       │
├───────────────────────────────────────────────────────────────┤
│ Activity Item 1: Updated pricing for Spectre (2 hours ago)   │
│ Activity Item 2: Uploaded new contract template (1 day ago)  │
│ Activity Item 3: Modified business settings (2 days ago)     │
│ [View Full Audit Trail]                                      │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────┬─────────────────────────────────────────┐
│ QUICK SHORTCUTS     │ SYSTEM STATUS                           │
├─────────────────────┼─────────────────────────────────────────┤
│ [Update Pricing]    │ ✅ Database: Connected                  │
│ [Add New Template]  │ ✅ Google Drive: Synced                │
│ [Edit Yacht Info]   │ ⚠️ Backup: 2 hours ago                 │
│ [View Reports]      │ ✅ Real-time Updates: Active           │
└─────────────────────┴─────────────────────────────────────────┘
```

### Dashboard Components

#### Summary Cards (3-column grid)
Each card contains:
- **Icon** (32x32px)
- **Title** (16px font, medium weight)
- **Count/Metric** (24px font, bold)
- **Action Button** (Small, secondary button)
- **Card Padding**: 20px
- **Card Border**: Light gray border

#### Recent Activity List
- **Section Title**: "Recent Activity" (18px font, bold)
- **Activity Items**: List format
  - Activity description text
  - Timestamp (relative: "2 hours ago")
  - User who made change
- **View All Link**: "View Full Audit Trail"

#### Quick Shortcuts Panel
- **Section Title**: "Quick Actions"
- **Button List**: Vertical stack of action buttons
  - Full width within panel
  - Primary/secondary button styling
  - Icons for each action

#### System Status Panel
- **Section Title**: "System Status"
- **Status Items**: List with status indicators
  - Icon (✅ ⚠️ ❌)
  - Status description
  - Timestamp if applicable

---

## 5. Pricing Management Page

### Main Layout
```
┌───────────────────────────────────────────────────────────────┐
│ FILTERS & CONTROLS BAR                                        │
├───────────────────────────────────────────────────────────────┤
│ PRICING TABLE                                                 │
├───────────────────────────────────────────────────────────────┤
│ PAGINATION & SUMMARY                                          │
└───────────────────────────────────────────────────────────────┘
```

### Filters & Controls Bar
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Yacht: [All Yachts ▼] │ Year: [2025 ▼] │ Season: [All ▼] │ [+ Add Rule] │
│                                                            │ [Export]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Filter Components
- **Yacht Filter Dropdown**
  - Label: "Yacht:"
  - Options: "All Yachts", "Spectre", "Alrisha", etc.
  - Default: "All Yachts"
  - Width: 150px

- **Year Filter Dropdown**
  - Label: "Year:"
  - Options: Current year ±2 years
  - Default: Current year
  - Width: 100px

- **Season Filter Dropdown**
  - Label: "Season:"
  - Options: "All", "High Season", "Low Season", "Holiday"
  - Default: "All"
  - Width: 120px

- **Add Rule Button**
  - Primary button
  - Text: "+ Add Rule"
  - Action: Open pricing rule modal

- **Export Button**
  - Secondary button
  - Icon: Download symbol
  - Text: "Export"
  - Action: Download pricing data

### Pricing Table
```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ Yacht       │ Season      │ Daily Rate  │ Hourly Rate │ Date Range  │ Actions     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Spectre     │ High Season │ £800.00     │ £120.00     │ Jun-Sep     │ [Edit][Del] │
│ Spectre     │ Low Season  │ £500.00     │ £85.00      │ Oct-May     │ [Edit][Del] │
│ Alrisha     │ High Season │ £650.00     │ £95.00      │ Jun-Sep     │ [Edit][Del] │
│ ...         │ ...         │ ...         │ ...         │ ...         │ ...         │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

#### Table Components
- **Table Headers**: Sortable columns with sort indicators
- **Table Rows**: Striped/alternating background
- **Currency Display**: Formatted with £ symbol
- **Date Range**: Abbreviated format (Jun-Sep)
- **Action Buttons**: 
  - Edit button (pencil icon)
  - Delete button (trash icon)
- **Row Hover**: Highlight on hover
- **Click Row**: Edit functionality

### Pagination & Summary
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Showing 1-25 of 156 pricing rules            │ [◀] 1 2 3 ... 7 [▶] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Pricing Rule Modal (Add/Edit)

### Modal Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ✕ Pricing Rule Configuration                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ FORM CONTENT AREA                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    [Cancel] [Save Rule]                     │
└─────────────────────────────────────────────────────────────┘
```

### Form Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Yacht Selection                                             │
│ ○ All Yachts  ○ Specific Yacht: [Spectre ▼]               │
│                                                             │
│ Season Information                                          │
│ Season Name: [High Season_____________]                     │
│ Season Code: [high_________________] (auto-generated)       │
│                                                             │
│ Pricing Details                                             │
│ Daily Rate:  [£][800.00________]                           │
│ Hourly Rate: [£][120.00________]                           │
│                                                             │
│ Date Range                                                  │
│ Start Date: [📅 Jun 01, 2025] End Date: [📅 Sep 30, 2025] │
│                                                             │
│ Priority & Overrides                                        │
│ Priority Level: [Standard ▼] (Higher priority overrides)   │
│ ☑ Active Rule                                              │
│                                                             │
│ Conflict Detection                                          │
│ ⚠️ Warning: Overlaps with existing "Summer Special" rule    │
│ [View Conflicts]                                           │
└─────────────────────────────────────────────────────────────┘
```

#### Form Components

**Yacht Selection Section**
- **Radio Button Group**: All Yachts vs Specific Yacht
- **Yacht Dropdown**: When "Specific Yacht" selected
  - Full yacht list
  - Search/filter capability

**Season Information Section**
- **Season Name Input**: Text field, required
- **Season Code Input**: Auto-generated, editable
- **Helper Text**: "Used for internal identification"

**Pricing Details Section**
- **Daily Rate Input**: Currency field with £ prefix
- **Hourly Rate Input**: Currency field with £ prefix
- **Validation**: Positive numbers only

**Date Range Section**
- **Start Date Picker**: Calendar popup
- **End Date Picker**: Calendar popup
- **Date Validation**: End must be after start

**Priority & Overrides Section**
- **Priority Dropdown**: Standard, High, Holiday
- **Active Checkbox**: Enable/disable rule
- **Helper Text**: Explanation of priority system

**Conflict Detection Section**
- **Warning Display**: If conflicts detected
- **Conflict Details**: List of overlapping rules
- **View Conflicts Button**: Show detailed conflicts

**Modal Footer**
- **Cancel Button**: Close without saving
- **Save Rule Button**: Primary button, save and close

---

## 7. Yacht Configuration Page

### Main Layout
```
┌───────────────────────────────────────────────────────────────┐
│ YACHT GRID LAYOUT                                             │
├───────────────────────────────────────────────────────────────┤
│ [Yacht Card 1] [Yacht Card 2] [Yacht Card 3]                 │
│ [Yacht Card 4] [Yacht Card 5] [Yacht Card 6]                 │
└───────────────────────────────────────────────────────────────┘
```

### Yacht Card Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 📷 Yacht Photo                           │ Status Toggle     │
│ (200x150px)                              │ ○ Active ● Maint  │
├─────────────────────────────────────────┼───────────────────┤
│ Yacht Name: Spectre                     │ [Edit] [Media]    │
│ Type: Motor Yacht                       │                   │
│ Capacity: 12 guests                     │                   │
│ Length: 45ft                            │                   │
├─────────────────────────────────────────┼───────────────────┤
│ Last Updated: 2 days ago                │ [View Details]    │
│ Updated By: Charter Manager             │                   │
└─────────────────────────────────────────┴───────────────────┘
```

#### Yacht Card Components

**Yacht Photo Section**
- **Image Display**: 200x150px placeholder or uploaded image
- **Upload Overlay**: Appears on hover with upload icon
- **Click Action**: Open media manager

**Status Toggle Section**
- **Radio Buttons**: Active vs Maintenance
- **Color Coding**: Green for active, orange for maintenance
- **Immediate Action**: Status changes immediately

**Yacht Information Section**
- **Yacht Name**: Large, bold text
- **Type**: Motor Yacht, Sailing Yacht, etc.
- **Capacity**: Number of guests
- **Length**: Boat length specification

**Action Buttons Section**
- **Edit Button**: Open yacht configuration modal
- **Media Button**: Open media management modal
- **View Details Button**: Expand to detailed view

**Meta Information Section**
- **Last Updated**: Relative timestamp
- **Updated By**: User who made last change

---

## 8. Yacht Configuration Modal

### Modal Tabbed Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ✕ Configure Yacht: Spectre                                 │
├─────────────────────────────────────────────────────────────┤
│ [Specs] [Amenities] [Media] [Marketing] [Restrictions]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ TAB CONTENT AREA                                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    [Cancel] [Save Changes]                  │
└─────────────────────────────────────────────────────────────┘
```

### Specs Tab Content
```
┌─────────────────────────────────────────────────────────────┐
│ Technical Specifications                                    │
│                                                             │
│ Length: [45____________] ft                                 │
│ Beam:   [12____________] ft                                 │
│ Draft:  [3_____________] ft                                 │
│ Capacity: [12__] guests                                     │
│ Cabins:   [3___] bedrooms                                   │
│ Bathrooms: [2__] bathrooms                                  │
│                                                             │
│ Engine & Performance                                        │
│ Engine Type: [Twin Diesel_________________]                 │
│ Horsepower:  [750_____________] HP                          │
│ Max Speed:   [25______________] knots                       │
│ Cruise Speed: [18_____________] knots                       │
│                                                             │
│ Additional Specifications                                   │
│ Year Built: [2018____]                                      │
│ Builder:    [Sunseeker_____________________]                │
│ Model:      [Predator 45___________________]                │
└─────────────────────────────────────────────────────────────┘
```

### Amenities Tab Content
```
┌─────────────────────────────────────────────────────────────┐
│ Standard Amenities                                          │
│ ☑ Air Conditioning    ☑ WiFi              ☑ Sound System   │
│ ☑ GPS Navigation      ☑ Safety Equipment  ☑ Life Jackets   │
│ ☑ Fresh Water         ☑ Electric Toilet   ☑ Shower         │
│ ☐ Watermaker          ☐ Generator         ☐ Inverter       │
│                                                             │
│ Entertainment & Recreation                                  │
│ ☑ Snorkeling Gear     ☑ Fishing Equipment ☐ Water Skis     │
│ ☑ Swimming Platform   ☐ Jet Ski           ☐ Kayaks         │
│ ☑ Bluetooth Audio     ☑ TV/Entertainment  ☐ Gaming Console │
│                                                             │
│ Galley & Dining                                             │
│ ☑ Full Galley         ☑ Refrigerator      ☑ Microwave      │
│ ☑ Dining Table        ☑ BBQ Grill         ☐ Ice Maker      │
│ ☑ Crockery/Cutlery    ☑ Glassware         ☑ Cooler Boxes   │
│                                                             │
│ Custom Amenities                                            │
│ [+ Add Custom Amenity]                                      │
│ • Professional Crew Available                               │
│ • Catering Service Available                                │
└─────────────────────────────────────────────────────────────┘
```

### Media Tab Content
```
┌─────────────────────────────────────────────────────────────┐
│ Primary Photo                                               │
│ [Upload Primary Image] Current: spectre-main.jpg           │
│ 📷 Preview: [200x150 image thumbnail]                      │
│                                                             │
│ Photo Gallery                                               │
│ [📷][📷][📷][📷] [+ Add Photos]                            │
│ Drag to reorder | Click to preview | ✕ to remove          │
│                                                             │
│ Marketing Materials                                         │
│ Brochure PDF: [Upload Brochure] Current: spectre-specs.pdf │
│ Specification Sheet: [Upload Specs] Current: none          │
│                                                             │
│ Virtual Tour                                                │
│ 360° Tour URL: [________________________________]          │
│ Video Tour URL: [________________________________]          │
│                                                             │
│ Photo Guidelines                                            │
│ • Minimum resolution: 1200x800px                           │
│ • Preferred formats: JPG, PNG                              │
│ • Maximum file size: 5MB per image                         │
│ • Recommended: Exterior, interior, deck views              │
└─────────────────────────────────────────────────────────────┘
```

### Marketing Tab Content
```
┌─────────────────────────────────────────────────────────────┐
│ Marketing Description                                       │
│ Short Description (for listings):                          │
│ [Luxury motor yacht perfect for day charters_______________│
│ _______________________________________________________]    │
│ Character count: 85/150                                     │
│                                                             │
│ Detailed Description (for full page):                      │
│ [Experience the ultimate in luxury aboard Spectre, a______│
│ stunning 45ft motor yacht. With accommodation for up to___│
│ 12 guests, this vessel offers the perfect platform for____│
│ memorable charter experiences._____________________________│
│ _________________________________________________________]  │
│ Character count: 234/500                                    │
│                                                             │
│ Key Highlights                                              │
│ • [Professional crew available__________________] [Remove]  │
│ • [Complimentary snorkeling gear________________] [Remove]  │
│ • [Full galley and dining facilities____________] [Remove]  │
│ [+ Add Highlight]                                           │
│                                                             │
│ Charter Types Suitable For                                  │
│ ☑ Day Charters        ☑ Corporate Events    ☑ Celebrations │
│ ☑ Family Outings      ☐ Fishing Trips      ☐ Water Sports  │
│ ☐ Romantic Occasions  ☐ Photography        ☐ Sunset Cruises│
└─────────────────────────────────────────────────────────────┘
```

### Restrictions Tab Content
```
┌─────────────────────────────────────────────────────────────┐
│ Age Restrictions                                            │
│ Minimum Age: [No minimum_▼] Maximum Age: [No maximum_▼]     │
│ Special Considerations: [_____________________________]     │
│                                                             │
│ Behavioral Restrictions                                     │
│ ☑ No smoking inside cabin                                   │
│ ☑ No shoes on upholstery                                    │
│ ☑ No glass on deck                                          │
│ ☐ No alcohol permitted                                      │
│ ☐ No pets allowed                                           │
│ ☐ Quiet hours enforced                                      │
│                                                             │
│ Capacity Limits                                             │
│ Maximum Guests: [12__] (Total capacity)                     │
│ Adults: [12__] Children: [12__] (If different limits)       │
│                                                             │
│ Special Requirements                                        │
│ Safety Briefing Required: ☑ Yes ☐ No                       │
│ Swimming Ability Required: ☐ Yes ☑ No                      │
│ ID Required: ☑ Yes ☐ No                                     │
│                                                             │
│ Custom Restrictions                                         │
│ [+ Add Custom Restriction]                                  │
│ • Captain reserves right to cancel for weather             │
│ • Life jackets must be worn during water activities        │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Document Templates Page

### Main Layout with Category Tabs
```
┌───────────────────────────────────────────────────────────────┐
│ [Contracts] [Invoices] [Receipts] [Quotes] [Trip Sheets]     │
├───────────────────────────────────────────────────────────────┤
│ TEMPLATE LIBRARY CONTENT                                      │
└───────────────────────────────────────────────────────────────┘
```

### Template Library Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Contract Templates                                    [+ Upload Template] │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📄 Standard Charter Contract.docx                  [Default] [★]      │ │
│ │ Last modified: 2 days ago by Charter Manager                          │ │
│ │ Variables: 12 | Size: 45KB | Version: 3.2                            │ │
│ │ [Preview] [Edit] [Download] [Duplicate] [Delete]                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📄 Multi-Day Charter Contract.docx                 [Make Default]     │ │
│ │ Last modified: 1 week ago by Operations Staff                         │ │
│ │ Variables: 15 | Size: 52KB | Version: 2.1                            │ │
│ │ [Preview] [Edit] [Download] [Duplicate] [Delete]                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📄 Corporate Event Contract.docx                   [Make Default]     │ │
│ │ Last modified: 3 weeks ago by Charter Manager                         │ │
│ │ Variables: 18 | Size: 61KB | Version: 1.5                            │ │
│ │ [Preview] [Edit] [Download] [Duplicate] [Delete]                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Template Card Components

**Template Header**
- **File Icon**: Document type icon (📄)
- **Template Name**: Clickable filename
- **Default Badge**: "Default" label for default templates
- **Star Icon**: Favorite/bookmark indicator

**Template Metadata**
- **Last Modified**: Relative timestamp and user
- **Variable Count**: Number of template variables
- **File Size**: Template file size
- **Version**: Template version number

**Template Actions**
- **Preview Button**: Open template preview modal
- **Edit Button**: Open template editor
- **Download Button**: Download original template file
- **Duplicate Button**: Create copy of template
- **Delete Button**: Remove template (with confirmation)
- **Make Default Button**: Set as default for this category

---

## 10. Document Upload Modal

### Upload Modal Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ✕ Upload Document Template                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ UPLOAD AREA & FORM                                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    [Cancel] [Upload Template]               │
└─────────────────────────────────────────────────────────────┘
```

### Upload Form Content
```
┌─────────────────────────────────────────────────────────────┐
│ File Upload                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │     📁 Drag and drop files here                        │ │
│ │            or [Browse Files]                           │ │
│ │                                                         │ │
│ │     Supported formats: .docx, .doc, .pdf              │ │
│ │     Maximum size: 10MB                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Template Information                                        │
│ Template Name: [Standard Charter Contract_____________]     │
│ Template Type: [Contract ▼]                                │
│ Description: [Standard charter agreement template_______]  │
│                                                             │
│ Template Configuration                                      │
│ ☑ Set as default template for this category                │
│ ☐ Yacht-specific template                                   │
│ If yacht-specific: [Select Yachts ▼]                       │
│                                                             │
│ Variable Detection                                          │
│ ⚙️ Scanning for template variables...                      │
│ Found variables: {CUSTOMER_NAME}, {YACHT_NAME}, {DATE}     │
│ [Edit Variables]                                            │
└─────────────────────────────────────────────────────────────┘
```

#### Upload Components

**File Upload Area**
- **Drag & Drop Zone**: Large visual area for file dropping
- **Browse Files Button**: Traditional file picker
- **Format Support**: List of accepted file types
- **Size Limit**: Maximum file size display

**Template Information Section**
- **Template Name Input**: Required text field
- **Template Type Dropdown**: Contract, Invoice, Receipt, etc.
- **Description Input**: Optional description text area

**Template Configuration Section**
- **Default Template Checkbox**: Set as default for category
- **Yacht-Specific Checkbox**: Enable yacht-specific templates
- **Yacht Selection**: Multi-select dropdown when yacht-specific enabled

**Variable Detection Section**
- **Auto-Detection Status**: Scanning progress indicator
- **Detected Variables**: List of found template variables
- **Edit Variables Button**: Open variable management modal

---

## 11. Template Variable Editor Modal

### Variable Editor Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ✕ Template Variables: Standard Charter Contract             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ VARIABLE MANAGEMENT CONTENT                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│               [Cancel] [Test Template] [Save Variables]     │
└─────────────────────────────────────────────────────────────┘
```

### Variable Management Content
```
┌─────────────────────────────────────────────────────────────┐
│ Detected Variables                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Variable: {CUSTOMER_NAME}                    [✓] [✕]   │ │
│ │ Description: Customer's full name                       │ │
│ │ Data Source: Customer profile → formatted_name         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Variable: {YACHT_NAME}                       [✓] [✕]   │ │
│ │ Description: Name of chartered yacht                   │ │
│ │ Data Source: Yacht profile → name                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Variable: {START_DATE}                       [✓] [✕]   │ │
│ │ Description: Charter start date                         │ │
│ │ Data Source: Booking → start_date                       │ │
│ │ Format: [DD/MM/YYYY ▼]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Custom Variables                                            │
│ [+ Add Custom Variable]                                     │
│                                                             │
│ Available Variables Reference                               │
│ Customer: {CUSTOMER_NAME}, {CUSTOMER_EMAIL}, {CUSTOMER_PHONE}│
│ Booking: {START_DATE}, {END_DATE}, {DURATION}, {TOTAL_COST} │
│ Yacht: {YACHT_NAME}, {YACHT_CAPACITY}, {YACHT_TYPE}        │
│ Business: {COMPANY_NAME}, {COMPANY_PHONE}, {COMPANY_EMAIL}  │
│ [View All Variables]                                        │
└─────────────────────────────────────────────────────────────┘
```

#### Variable Management Components

**Variable Item Card**
- **Variable Name**: Template placeholder (e.g., {CUSTOMER_NAME})
- **Description**: Human-readable description
- **Data Source**: Where data comes from
- **Format Options**: Date/number formatting when applicable
- **Accept/Reject Buttons**: Include or exclude variable

**Custom Variables Section**
- **Add Custom Variable Button**: Create business-specific variables
- **Custom Variable Form**: Name, description, data source

**Variables Reference Section**
- **Categorized Variable List**: All available template variables
- **Category Groups**: Customer, Booking, Yacht, Business
- **View All Button**: Expand to see complete variable list

---

## 12. Business Settings Page

### Settings Page Layout
```
┌───────────────────────────────────────────────────────────────┐
│ SETTINGS CATEGORIES SIDEBAR │ SETTINGS CONTENT AREA            │
│ (200px width)               │ (Remaining width)                │
├─────────────────────────────┼──────────────────────────────────┤
│ 💼 Business Information     │                                  │
│ 💰 Payment Policies         │ SETTING FORMS                    │
│ 📅 Booking Rules           │                                  │
│ 📧 Communication           │                                  │
│ 🔒 Security Settings       │                                  │
│ 📊 System Configuration    │                                  │
└─────────────────────────────┴──────────────────────────────────┘
```

### Business Information Settings
```
┌─────────────────────────────────────────────────────────────┐
│ Business Information                               [Edit]    │
├─────────────────────────────────────────────────────────────┤
│ Company Details                                             │
│ Company Name: [Yacht Charter Operations_______________]     │
│ Trading Name: [YCO Charters______________________]         │
│ Registration: [Company Reg: 12345678_____________]         │
│                                                             │
│ Contact Information                                         │
│ Primary Email: [bookings@yacht-charter.com__________]      │
│ Phone Number:  [+44 1234 567890____________________]       │
│ Mobile Number: [+44 7890 123456____________________]       │
│                                                             │
│ Business Address                                            │
│ Street Address: [Marina Business Park_____________]        │
│ City:          [Portsmouth____________________]            │
│ County/State:  [Hampshire____________________]             │
│ Postal Code:   [PO1 2AB_____]                             │
│ Country:       [United Kingdom ▼]                          │
│                                                             │
│ Social Media & Website                                      │
│ Website:    [https://yacht-charter.com______________]      │
│ Facebook:   [https://facebook.com/yachtcharter______]      │
│ Instagram:  [https://instagram.com/yachtcharter_____]      │
│ LinkedIn:   [https://linkedin.com/company/yacht_____]      │
└─────────────────────────────────────────────────────────────┘
```

### Payment Policies Settings
```
┌─────────────────────────────────────────────────────────────┐
│ Payment Policies                                   [Edit]    │
├─────────────────────────────────────────────────────────────┤
│ Deposit Requirements                                        │
│ Deposit Percentage: [30____] % of total charter cost       │
│ Minimum Deposit:    [£][200___] (if percentage < minimum)  │
│ Deposit Due:        [At booking confirmation ▼]            │
│                                                             │
│ Final Payment Terms                                         │
│ Final Payment Due: [7____] days before charter             │
│ Late Payment Fee:  [£][50___] per day                      │
│ Currency:         [GBP (£) ▼]                              │
│                                                             │
│ Cancellation Policy                                         │
│ Cancellation Notice: [48___] hours minimum                 │
│ Cancellation Fees:                                         │
│ • More than 7 days: [10___] % of total                    │
│ • 3-7 days:         [50___] % of total                    │
│ • Less than 3 days: [100__] % of total                    │
│                                                             │
│ Refund Processing                                           │
│ Refund Method:     [Original payment method ▼]             │
│ Processing Time:   [5-10 business days_______]             │
│ Weather Refunds:   ☑ Full refund for unsafe conditions    │
└─────────────────────────────────────────────────────────────┘
```

### Booking Rules Settings
```
┌─────────────────────────────────────────────────────────────┐
│ Booking Rules                                      [Edit]    │
├─────────────────────────────────────────────────────────────┤
│ Booking Windows                                             │
│ Minimum Advance: [1____] day(s) before charter             │
│ Maximum Advance: [365__] days in advance                   │
│ Same Day Booking: ☑ Allow (subject to availability)        │
│                                                             │
│ Charter Duration                                            │
│ Minimum Duration: [4____] hours                            │
│ Maximum Duration: [12___] hours (day charters)             │
│ Multi-day Charters: ☑ Available (special terms apply)      │
│                                                             │
│ Capacity & Age Limits                                       │
│ Default Max Capacity: [Per yacht specifications ▼]         │
│ Minimum Age:         [No minimum ▼]                        │
│ Unaccompanied Minors: ☐ Permitted with special terms       │
│                                                             │
│ Booking Modifications                                       │
│ Date Changes:     [48___] hours notice required            │
│ Guest Count:      [24___] hours notice for increases       │
│ Yacht Changes:    [Subject to availability_________]       │
│ Modification Fee: [£][25___] per change                    │
└─────────────────────────────────────────────────────────────┘
```

### Communication Settings
```
┌─────────────────────────────────────────────────────────────┐
│ Communication Settings                             [Edit]    │
├─────────────────────────────────────────────────────────────┤
│ Quote Settings                                              │
│ Quote Validity: [7____] days                               │
│ Auto-reminder:  [24___] hours before expiry               │
│ Include Terms:  ☑ Attach terms and conditions             │
│                                                             │
│ Customer Communication                                      │
│ Confirmation Email: ☑ Send immediately upon booking        │
│ Reminder Email:     ☑ Send [24___] hours before charter   │
│ Follow-up Email:    ☑ Send [24___] hours after charter    │
│                                                             │
│ Email Templates                                             │
│ From Name:     [Yacht Charter Operations____________]      │
│ From Email:    [bookings@yacht-charter.com_________]       │
│ Reply-to:      [Same as from email ▼]                     │
│ Signature:     [Best regards,________________________]     │
│                [The Yacht Charter Team_______________]     │
│                                                             │
│ SMS Notifications (Future)                                  │
│ SMS Service:   [Not configured - Contact Support]          │
│ Mobile Updates: ☐ Enable SMS notifications                │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Audit Trail Page

### Audit Page Layout
```
┌───────────────────────────────────────────────────────────────┐
│ AUDIT FILTERS BAR                                             │
├───────────────────────────────────────────────────────────────┤
│ AUDIT TRAIL TABLE                                             │
├───────────────────────────────────────────────────────────────┤
│ PAGINATION                                                    │
└───────────────────────────────────────────────────────────────┘
```

### Audit Filters Bar
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Date: [Last 7 days ▼] │ User: [All Users ▼] │ Action: [All ▼] │ [Export] │
│ Table: [All Tables ▼] │ Search: [______________] 🔍            │ [Clear]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Audit Trail Table
```
┌──────────────┬──────────────┬─────────────┬─────────────┬──────────────┬─────────────────┐
│ Timestamp    │ User         │ Action      │ Table       │ Record       │ Changes         │
├──────────────┼──────────────┼─────────────┼─────────────┼──────────────┼─────────────────┤
│ 2025-06-24   │ Charter      │ UPDATE      │ yacht_      │ Spectre      │ daily_rate:     │
│ 14:30:25     │ Manager      │             │ pricing     │ High Season  │ £750→£800       │
├──────────────┼──────────────┼─────────────┼─────────────┼──────────────┼─────────────────┤
│ 2025-06-24   │ Operations   │ INSERT      │ document_   │ New Contract │ template_name,  │
│ 10:15:42     │ Staff        │             │ templates   │ Template     │ file_path       │
├──────────────┼──────────────┼─────────────┼─────────────┼──────────────┼─────────────────┤
│ 2025-06-23   │ Charter      │ UPDATE      │ business_   │ deposit_     │ setting_value:  │
│ 16:45:18     │ Manager      │             │ settings    │ percentage   │ 30→35           │
└──────────────┴──────────────┴─────────────┴─────────────┴──────────────┴─────────────────┘
```

#### Audit Table Components

**Timestamp Column**
- **Date**: YYYY-MM-DD format
- **Time**: HH:MM:SS format
- **Timezone**: Local timezone display

**User Column**
- **User Name**: Display name or role
- **User Type**: Manager, Operations Staff, etc.
- **Click Action**: View user details

**Action Column**
- **Action Type**: INSERT, UPDATE, DELETE
- **Color Coding**: Green (insert), Blue (update), Red (delete)

**Table Column**
- **Table Name**: Database table affected
- **Table Type**: Configuration vs transactional

**Record Column**
- **Record Identifier**: Human-readable record identifier
- **Record Type**: Pricing rule, template, setting, etc.

**Changes Column**
- **Field Changes**: field_name: old_value→new_value
- **Multiple Changes**: Truncated with "..." and expand option
- **Click Action**: View detailed change information

---

## 14. Common Modal Patterns

### Confirmation Dialog
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Confirm Action                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Are you sure you want to delete the pricing rule           │
│ "Spectre High Season 2025"?                                │
│                                                             │
│ This action cannot be undone.                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    [Cancel] [Delete Rule]                   │
└─────────────────────────────────────────────────────────────┘
```

### Loading Dialog
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ Processing...                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔄 Uploading template to Google Drive...                   │
│                                                             │
│ ████████████████████████░░░░░░░░ 75%                       │
│                                                             │
│ Please wait while we process your request.                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Error Dialog
```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Error                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Failed to update pricing rule                              │
│                                                             │
│ Error: Overlapping date range with existing                │
│ "Summer Special" pricing rule.                             │
│                                                             │
│ Please adjust the dates and try again.                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                      [View Details] [OK]                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 15. Responsive Design Considerations

### Mobile Layout (768px and below)
- **Side Navigation**: Collapses to hamburger menu
- **Main Content**: Full width
- **Tables**: Horizontal scroll or card layout
- **Modals**: Full screen on mobile
- **Forms**: Single column layout
- **Buttons**: Larger touch targets (44px minimum)

### Tablet Layout (768px - 1024px)
- **Side Navigation**: Remains visible but narrower (200px)
- **Content**: Adjusted for medium screen
- **Tables**: Responsive column hiding
- **Modals**: Standard modal size
- **Forms**: Two column layout where appropriate

### Desktop Layout (1024px and above)
- **Full Layout**: All components at designed sizes
- **Multi-column**: Maximum content density
- **Hover States**: Full hover interactions
- **Keyboard Navigation**: Complete keyboard support

---

## 16. Accessibility Requirements

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through all interactive elements
- **Focus Indicators**: Clear visual focus states
- **Keyboard Shortcuts**: Common shortcuts (Esc to close modals)
- **Skip Links**: Skip to main content option

### Screen Reader Support
- **ARIA Labels**: Comprehensive labeling of all controls
- **Semantic HTML**: Proper heading structure and landmarks
- **Alt Text**: Descriptive alternative text for images
- **Status Announcements**: Screen reader notifications for changes

### Visual Accessibility
- **Color Contrast**: WCAG AA compliance (4.5:1 ratio minimum)
- **Text Size**: Minimum 16px font size for body text
- **Interactive Elements**: Minimum 44px touch targets
- **Color Independence**: No information conveyed by color alone

---

## 17. Performance Considerations

### Initial Load Optimization
- **Code Splitting**: Lazy load admin sections
- **Image Optimization**: Compressed images with appropriate formats
- **Bundle Size**: Minimize JavaScript bundle size
- **Caching**: Aggressive caching for static assets

### Runtime Performance
- **Virtual Scrolling**: For large data tables
- **Debounced Search**: Prevent excessive API calls
- **Optimistic Updates**: Immediate UI feedback
- **Background Sync**: Non-blocking data synchronization

### Data Loading
- **Pagination**: Limit initial data loads
- **Progressive Loading**: Load additional data on demand
- **Error Boundaries**: Graceful error handling
- **Offline Support**: Basic offline functionality

---

This comprehensive UI layout plan provides detailed specifications for every aspect of the Admin Configuration Page SPA. Each component, input field, button, and interaction is documented to ensure consistent implementation and user experience across the entire admin interface.