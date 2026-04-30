# WAEC Past Questions - Visual Guide

## 🎨 User Interface Overview

### Student View (`/waec-past-questions`)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                        │
│                                                             │
│  WAEC Past Questions                                        │
│  Access authentic WAEC past questions for all subjects     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ 📄 120   │  │ 📚 8     │  │ 📅 2015  │                │
│  │ Papers   │  │ Subjects │  │ - 2024   │                │
│  └──────────┘  └──────────┘  └──────────┘                │
│                                                             │
│  [All] [Maths] [English] [Physics] [Chemistry] [Biology]  │
│                                                             │
│  Year: [All Years ▼]  Paper: [All Papers ▼]  Sort: [▼]   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐│
│  │ MATHEMATICS     │  │ ENGLISH         │  │ PHYSICS    ││
│  │ 2024            │  │ 2024            │  │ 2023       ││
│  │                 │  │                 │  │            ││
│  │ WAEC Maths 2024│  │ WAEC English    │  │ WAEC Phys  ││
│  │ - Objective     │  │ 2024 - Obj      │  │ 2023 - Obj ││
│  │                 │  │                 │  │            ││
│  │ 📄 Paper 1      │  │ 📄 Paper 1      │  │ 📄 Paper 1 ││
│  │ ⏱️ 2 hours      │  │ ⏱️ 2 hours      │  │ ⏱️ 2 hours ││
│  │ 📝 50 questions │  │ 📝 60 questions │  │ 📝 50 ques ││
│  │                 │  │                 │  │            ││
│  │ [Download PDF]  │  │ [Download PDF]  │  │ [Download] ││
│  │ [👁️]           │  │ [👁️]           │  │ [👁️]      ││
│  └─────────────────┘  └─────────────────┘  └────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Admin Upload View (`/admin-waec-upload`)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Admin                                            │
│                                                             │
│  Upload WAEC Past Questions                                 │
│  Upload PDF files to Vercel Blob Storage                   │
│                                                             │
│  ✅ Successfully uploaded: WAEC Mathematics 2024            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Subject: [Mathematics ▼]  Year: [2024 ▼]            │ │
│  │  Paper Type: [Objective ▼]                            │ │
│  │                                                        │ │
│  │  Duration: [3 hours]  Questions: [50]                 │ │
│  │                                                        │ │
│  │  Title: [Auto-generated if empty]                     │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────┐    │ │
│  │  │         📤                                    │    │ │
│  │  │  Click to upload or drag and drop            │    │ │
│  │  │  PDF files only (Max 50MB)                   │    │ │
│  │  └──────────────────────────────────────────────┘    │ │
│  │                                                        │ │
│  │  📄 mathematics_2024_obj.pdf  (2.4 MB)  [❌]         │ │
│  │                                                        │ │
│  │  [Upload to Vercel Blob]                              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Recently Uploaded                                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ WAEC Mathematics 2024 - Objective                     │ │
│  │ Mathematics • 2024 • objective • Uploaded 2 mins ago  │ │
│  │                                          [Delete]     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 User Flows

### Student Download Flow

```
1. Student logs in
   ↓
2. Navigates to "Past Questions" from dashboard
   ↓
3. Sees all available questions with filters
   ↓
4. Selects subject (e.g., Mathematics)
   ↓
5. Filters by year (e.g., 2024)
   ↓
6. Clicks "Download PDF" button
   ↓
7. System generates secure download URL
   ↓
8. PDF downloads to device
   ↓
9. Analytics tracked
```

### Admin Upload Flow

```
1. Admin logs in
   ↓
2. Navigates to "Upload Past Questions"
   ↓
3. Fills in question metadata:
   - Subject
   - Year
   - Paper Type
   - Duration
   - Number of questions
   ↓
4. Uploads PDF file (drag-drop or click)
   ↓
5. File validated (PDF, < 50MB)
   ↓
6. Clicks "Upload to Vercel Blob"
   ↓
7. File uploaded to Vercel Blob Storage
   ↓
8. Metadata saved
   ↓
9. Success message shown
   ↓
10. Question appears in student view
```

## 📱 Mobile View

### Student Mobile View

```
┌─────────────────────┐
│ ☰  WAEC Questions  │
│                     │
│ ← Back              │
│                     │
│ WAEC Past Questions │
│ Access authentic... │
│                     │
│ ┌─────┐ ┌─────┐    │
│ │ 120 │ │  8  │    │
│ │Paper│ │Subj │    │
│ └─────┘ └─────┘    │
│                     │
│ [All] [Maths]      │
│ [English] [Physics]│
│                     │
│ Year: [All ▼]      │
│ Paper: [All ▼]     │
│                     │
│ ┌─────────────────┐│
│ │ MATHEMATICS     ││
│ │ 2024            ││
│ │                 ││
│ │ WAEC Maths 2024 ││
│ │ - Objective     ││
│ │                 ││
│ │ 📄 Paper 1      ││
│ │ ⏱️ 2 hours      ││
│ │ 📝 50 questions ││
│ │                 ││
│ │ [Download PDF]  ││
│ │ [Preview 👁️]   ││
│ └─────────────────┘│
│                     │
│ ┌─────────────────┐│
│ │ ENGLISH         ││
│ │ 2024            ││
│ │ ...             ││
│ └─────────────────┘│
│                     │
└─────────────────────┘
```

## 🎨 Color Scheme

### Subject Colors
- **Mathematics**: `#6366f1` (Indigo)
- **English**: `#60a5fa` (Blue)
- **Physics**: `#34d399` (Green)
- **Chemistry**: `#a78bfa` (Purple)
- **Biology**: `#4ade80` (Light Green)
- **Economics**: `#fbbf24` (Yellow)
- **Geography**: `#fb923c` (Orange)
- **Literature**: `#f472b6` (Pink)

### UI Colors
- **Primary**: `#6366f1` (Indigo)
- **Success**: `#22c55e` (Green)
- **Error**: `#ef4444` (Red)
- **Background**: `var(--bg)` (Theme-based)
- **Card**: `var(--bg-card)` (Theme-based)
- **Border**: `var(--border)` (Theme-based)
- **Text Primary**: `var(--text-primary)` (Theme-based)
- **Text Secondary**: `var(--text-secondary)` (Theme-based)

## 🔄 Interactive States

### Question Card States

**Default:**
```
┌─────────────────┐
│ MATHEMATICS     │
│ 2024            │
│ ...             │
└─────────────────┘
```

**Hover:**
```
┌═════════════════┐  ← Elevated shadow
║ MATHEMATICS     ║  ← Border color changes
║ 2024            ║  ← Slight scale up
║ ...             ║
└═════════════════┘
```

**Loading:**
```
┌─────────────────┐
│ MATHEMATICS     │
│ 2024            │
│ [⟳ Downloading] │  ← Spinner animation
└─────────────────┘
```

### Button States

**Download Button:**
- Default: Blue background, white text
- Hover: Darker blue, slight lift
- Active: Pressed effect
- Disabled: Gray, no interaction

**Preview Button:**
- Default: Transparent, border
- Hover: Border color changes
- Active: Background fill

## 📊 Data Visualization

### Stats Cards

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 📄           │  │ 📚           │  │ 📅           │
│              │  │              │  │              │
│    120       │  │     8        │  │  2015-2024   │
│ Total Papers │  │  Subjects    │  │  Year Range  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Filter Pills

```
Active:   [All Subjects]  ← Blue background, white text
Inactive: [Mathematics]   ← Gray background, gray text
Hover:    [English]       ← Border highlight
```

## 🎭 Animations

1. **Page Load**: Fade in from bottom
2. **Card Hover**: Scale up 1.02x, shadow increase
3. **Button Click**: Press effect (scale 0.98x)
4. **Filter Change**: Smooth transition
5. **Loading**: Rotating spinner
6. **Success**: Slide in from top
7. **Error**: Shake animation

## 📐 Layout Breakpoints

- **Desktop** (> 900px): 3-column grid
- **Tablet** (600px - 900px): 2-column grid
- **Mobile** (< 600px): 1-column grid

## 🎯 Key UI Elements

### Navigation
- Side navigation (desktop)
- Bottom navigation (mobile)
- Breadcrumb trail
- Back button

### Filters
- Subject pills (horizontal scroll on mobile)
- Dropdown selects (year, paper type, sort)
- Clear filters button

### Cards
- Question metadata
- Subject badge
- Year badge
- Action buttons
- Hover effects

### Forms (Admin)
- Input fields
- Select dropdowns
- File upload area
- Submit button
- Validation messages

## 🌟 Special Features

### Empty State
```
┌─────────────────────────────┐
│                             │
│         📄                  │
│    (Large icon)             │
│                             │
│  No Questions Found         │
│  Try adjusting your filters │
│                             │
└─────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────┐
│                             │
│         ⟳                   │
│    (Spinning)               │
│                             │
│  Loading past questions...  │
│                             │
└─────────────────────────────┘
```

### Error State
```
┌─────────────────────────────┐
│                             │
│         ⚠️                  │
│                             │
│  Error Loading Questions    │
│  Failed to load. Try again  │
│                             │
│     [Try Again]             │
│                             │
└─────────────────────────────┘
```

---

**Design System**: Material Design inspired
**Typography**: Outfit (sans-serif)
**Icons**: SVG inline icons
**Theme**: Dark mode primary, light mode supported
