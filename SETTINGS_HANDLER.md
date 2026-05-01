# Universal Settings & Account Handler

## Overview
The `settings-handler.js` file provides consistent settings modal and account dropdown functionality across all pages in the Vision Education platform.

## How It Works

### Settings Button Behavior

#### On Dashboard Page
- Clicking "Settings" opens the settings modal directly
- Modal contains all user settings (profile, security, WhatsApp, etc.)
- Modal can be closed with Escape key or by clicking the backdrop

#### On Other Pages (Mocks, WAEC, AI Learning, etc.)
- Clicking "Settings" redirects to the dashboard
- Settings modal automatically opens after redirect
- Uses `sessionStorage` to maintain the intent to open settings

### Account Dropdown Behavior

#### On Dashboard Page
- Clicking the user avatar opens the account dropdown
- Shows user name, email, and quick actions
- Closes when clicking outside or pressing Escape

#### On Other Pages
- Account dropdown is not available (no top bar)
- User can access settings via the sidebar Settings button

## Technical Implementation

### Script Loading Order
**IMPORTANT**: `settings-handler.js` must load AFTER `auth.js` because it depends on the `getSession()` function.

```html
<!-- Correct order -->
<script src="auth.js"></script>
<script src="settings-handler.js"></script>
```

### Key Functions

#### `openSettings()`
- Checks if user is logged in
- If settings modal exists: opens it and populates user data
- If settings modal doesn't exist: redirects to dashboard with intent flag

#### `closeSettings()`
- Closes the settings modal
- Restores page scrolling

#### `toggleUserDropdown()`
- Opens/closes the user account dropdown
- Only works on pages with the dropdown element

#### `openUserDropdown()`
- Opens the dropdown and updates user info

#### `closeUserDropdown()`
- Closes the dropdown

### Auto-Open on Redirect
When a user clicks "Settings" on a page without the modal:
1. `sessionStorage.setItem('openSettingsOnLoad', 'true')` is set
2. User is redirected to `/dashboard.html`
3. On dashboard load, the handler checks for this flag
4. If flag exists, settings modal opens automatically after 500ms
5. Flag is removed from sessionStorage

## Files Updated

### Core Files
- `settings-handler.js` - Universal handler (NEW)
- `auth.js` - Removed duplicate openSettings/closeSettings functions

### Pages with Settings Handler
- `dashboard.html` - Has full settings modal
- `waec-past-questions.html` - Redirects to dashboard
- `mocks.html` - Redirects to dashboard
- `ai-learning.html` - Redirects to dashboard

## Benefits

✅ **Consistent Behavior** - Settings works the same way everywhere
✅ **No Errors** - Gracefully handles missing elements
✅ **Single Source of Truth** - One file manages all settings interactions
✅ **Easy Maintenance** - Update once, works everywhere
✅ **Better UX** - Seamless redirect with auto-open

## Troubleshooting

### Settings button doesn't work
1. Check browser console for errors
2. Verify `auth.js` loads before `settings-handler.js`
3. Ensure user is logged in (`getSession()` returns valid session)

### Settings doesn't auto-open after redirect
1. Check if `sessionStorage` is enabled in browser
2. Verify 500ms delay is sufficient for page load
3. Check console for "[Settings Handler] Initialized" message

### Account dropdown doesn't work
1. Verify page has `<div id="userDropdown">` element
2. Check if `getSession()` returns valid user data
3. Ensure no JavaScript errors blocking execution
