













# Vision AI Authentication Flow Diagram

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER VISITS VISION AI                        │
│                    /vision-ai.html                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Auth Guard Check   │
              │  Session exists?     │
              └──────────┬───────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼ NO                            ▼ YES
┌────────────────────┐          ┌────────────────────┐
│   REDIRECT TO      │          │   LOAD VISION AI   │
│ /vision-ai-login   │          │   WITH PROFILE     │
└────────┬───────────┘          └────────────────────┘
         │                               │
         ▼                               │
┌────────────────────┐                  │
│   LOGIN PAGE       │                  │
│  ┌──────────────┐  │                  │
│  │ Google OAuth │  │                  │
│  └──────┬───────┘  │                  │
│         │          │                  │
│  ┌──────▼───────┐  │                  │
│  │ Email/Pass   │  │                  │
│  └──────┬───────┘  │                  │
└─────────┼──────────┘                  │
          │                             │
          ▼                             │
┌────────────────────┐                  │
│  AUTHENTICATION    │                  │
│   ┌──────────┐     │                  │
│   │ Validate │     │                  │
│   └────┬─────┘     │                  │
│        │           │                  │
│   ┌────▼─────┐     │                  │
│   │  Create  │     │                  │
│   │ Session  │     │                  │
│   └────┬─────┘     │                  │
└────────┼───────────┘                  │
         │                              │
         ▼                              │
┌────────────────────┐                  │
│  STORE SESSION     │                  │
│  ┌──────────────┐  │                  │
│  │sessionStorage│  │                  │
│  └──────────────┘  │                  │
│  ┌──────────────┐  │                  │
│  │localStorage  │  │                  │
│  └──────────────┘  │                  │
└────────┬───────────┘                  │
         │                              │
         ▼                              │
┌────────────────────┐                  │
│  REDIRECT BACK TO  │                  │
│   /vision-ai.html  │                  │
└────────┬───────────┘                  │
         │                              │
         └──────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   VISION AI LOADED     │
         │  ┌──────────────────┐  │
         │  │  User Profile    │  │
         │  │  ┌────────────┐  │  │
         │  │  │  Avatar    │  │  │
         │  │  └────────────┘  │  │
         │  │  ┌────────────┐  │  │
         │  │  │   Name     │  │  │
         │  │  └────────────┘  │  │
         │  │  ┌────────────┐  │  │
         │  │  │  Dropdown  │  │  │
         │  │  └────────────┘  │  │
         │  └──────────────────┘  │
         │                        │
         │  ┌──────────────────┐  │
         │  │   AI Chat        │  │
         │  │   Interface      │  │
         │  └──────────────────┘  │
         └────────────────────────┘
```

## Detailed Component Flow

### 1. Initial Page Load
```
vision-ai.html
    │
    ├─► Auth Guard Script (inline)
    │   └─► Check sessionStorage/localStorage
    │       ├─► Session Found → Continue
    │       └─► No Session → Redirect to login
    │
    └─► Load User Profile
        ├─► Parse session data
        ├─► Display user name
        ├─► Display avatar/initials
        └─► Setup dropdown menu
```

### 2. Login Page Flow
```
vision-ai-login.html
    │
    ├─► Google Sign-In
    │   ├─► Click "Continue with Google"
    │   ├─► Google OAuth popup
    │   ├─► User selects account
    │   ├─► Receive JWT credential
    │   ├─► Decode JWT payload
    │   ├─► Extract user data
    │   ├─► Create session object
    │   ├─► Store in sessionStorage
    │   ├─► Store in localStorage
    │   └─► Redirect to vision-ai.html
    │
    └─► Email/Password Login
        ├─► Enter email & password
        ├─► Submit form
        ├─► Call auth.js handleLogin()
        ├─► Validate credentials
        ├─► Create session object
        ├─► Store in sessionStorage
        ├─► Store in localStorage
        └─► Redirect to vision-ai.html
```

### 3. Session Management
```
Session Object Structure:
{
  name: "John Doe",
  email: "john@example.com",
  picture: "https://...",  // Optional (Google)
  provider: "google",      // or "email"
  sub: "google-user-id",   // Optional (Google)
  role: "student"
}

Storage Locations:
├─► sessionStorage (temporary, cleared on tab close)
│   └─► Key: "waec_session"
│
└─► localStorage (persistent, survives refresh)
    └─► Key: "waec_session"
```

### 4. User Profile Display
```
Header Component
    │
    ├─► User Avatar
    │   ├─► If picture URL exists
    │   │   └─► Display <img> with picture
    │   └─► Else
    │       └─► Display initials in colored circle
    │
    ├─► User Name
    │   └─► Display user.name
    │
    └─► Dropdown Menu
        ├─► Dashboard Link
        ├─► AI Learning Hub Link
        ├─► Divider
        └─► Logout Button
            └─► Clear session → Redirect to login
```

## State Diagram

```
┌─────────────┐
│             │
│  NOT LOGGED │
│     IN      │
│             │
└──────┬──────┘
       │
       │ User clicks login
       │
       ▼
┌─────────────┐
│             │
│  LOGGING IN │
│             │
└──────┬──────┘
       │
       │ Auth successful
       │
       ▼
┌─────────────┐
│             │
│  LOGGED IN  │◄────┐
│             │     │
└──────┬──────┘     │
       │            │
       │ Page       │ Session
       │ refresh    │ valid
       │            │
       └────────────┘
       │
       │ User clicks logout
       │
       ▼
┌─────────────┐
│             │
│  LOGGED OUT │
│             │
└──────┬──────┘
       │
       │ Redirect to login
       │
       └──────────────────┐
                          │
                          ▼
                   ┌─────────────┐
                   │             │
                   │  NOT LOGGED │
                   │     IN      │
                   │             │
                   └─────────────┘
```

## Security Flow

```
┌────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
└────────────────────────────────────────────────────────────┘

Layer 1: Auth Guard
    │
    ├─► Check session on page load
    ├─► Redirect if no session
    └─► Validate session structure

Layer 2: Session Validation
    │
    ├─► Check session key exists
    ├─► Parse JSON safely
    ├─► Verify required fields
    └─► Handle parse errors

Layer 3: Google OAuth
    │
    ├─► JWT token validation
    ├─► Verify issuer (Google)
    ├─► Check audience (Client ID)
    ├─► Decode payload securely
    └─► Extract user claims

Layer 4: Email Authentication
    │
    ├─► SHA-256 password hashing
    ├─► Firestore validation
    ├─► Local cache fallback
    └─► 2FA support (if enabled)

Layer 5: Session Storage
    │
    ├─► Dual storage (session + local)
    ├─► Automatic expiry handling
    ├─► Secure logout clearing
    └─► Cross-tab synchronization
```

## Error Handling Flow

```
┌────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                          │
└────────────────────────────────────────────────────────────┘

Scenario 1: No Session Found
    │
    ├─► Auth guard detects missing session
    ├─► Redirect to /vision-ai-login.html
    └─► Show login form

Scenario 2: Invalid Session Data
    │
    ├─► JSON parse fails
    ├─► Clear corrupted session
    ├─► Redirect to login
    └─► Log error to console

Scenario 3: Google OAuth Failure
    │
    ├─► JWT decode fails
    ├─► Show error message
    ├─► Keep user on login page
    └─► Suggest email login

Scenario 4: Email Login Failure
    │
    ├─► Invalid credentials
    ├─► Show error message
    ├─► Shake form animation
    └─► Keep user on login page

Scenario 5: Network Error
    │
    ├─► API call fails
    ├─► Show network error message
    ├─► Retry button appears
    └─► Fallback to local cache
```

## Mobile Responsive Flow

```
Desktop (> 600px)
    │
    ├─► Full-width login card (480px max)
    ├─► Side-by-side form elements
    ├─► Larger fonts and spacing
    └─► Hover effects enabled

Mobile (≤ 600px)
    │
    ├─► Full-width login card (100% - padding)
    ├─► Stacked form elements
    ├─► Smaller fonts and spacing
    └─► Touch-optimized buttons
```

## Performance Optimization

```
Initial Load
    │
    ├─► Inline critical CSS
    ├─► Defer non-critical scripts
    ├─► Preconnect to Google fonts
    └─► Lazy load Google OAuth script

Session Check
    │
    ├─► Synchronous localStorage read (< 50ms)
    ├─► No network calls required
    └─► Instant redirect decision

Profile Load
    │
    ├─► Parse cached session data
    ├─► Update DOM elements
    └─► Load avatar image (async)

Animations
    │
    ├─► CSS transforms (GPU accelerated)
    ├─► RequestAnimationFrame for JS
    └─► 60fps target maintained
```

---

**Legend:**
- `│` = Flow continues
- `├─►` = Branch/Option
- `└─►` = Final step
- `▼` = Next step
- `◄─` = Loop back

**Status:** ✅ Complete  
**Version:** 1.0.0  
**Last Updated:** May 2, 2026
