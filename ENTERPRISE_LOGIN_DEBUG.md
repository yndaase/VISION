# Enterprise Admin Login Debugging Guide

## Issue
Enterprise admin login not working at `/enterprise-login.html`

## Recent Fixes Applied
✅ Added detailed console logging for debugging
✅ Fixed institution code validation (not required for admins)
✅ Improved error messages to show actual user role
✅ Added logging for Firebase Auth attempts

## How to Debug

### Step 1: Open Browser Console
1. Go to: https://www.visionedu.online/enterprise-login.html
2. Press `F12` to open Developer Tools
3. Click on the **Console** tab

### Step 2: Attempt Login
1. Select **"School Admin"** role (should be selected by default)
2. Enter email: `school@visionedu.online`
3. Enter password: `Vision@2026`
4. Click "Sign In to Dashboard"

### Step 3: Check Console Logs
Look for these log messages in the console:

```
[Enterprise Login] Selected role: admin
[Enterprise Login] Email: school@visionedu.online
[Enterprise Login] Institution code: (not required for admin)
[Enterprise Login] Firebase Auth successful (or failed)
[Enterprise Login] User role: enterprise | Selected role: admin
[Enterprise Login] Admin role - skipping institution code verification
```

## Common Issues & Solutions

### Issue 1: "This account does not have admin privileges"
**Console shows:** `User role: student | Selected role: admin`

**Solution:** The account was created as a regular student, not an enterprise admin.

**Fix:**
1. Go to `/admin.html` (system admin portal)
2. Login with system admin credentials
3. Create a new user with:
   - Role: **Enterprise Admin**
   - Email: `school@visionedu.online`
   - Password: `Vision@2026`
   - This will auto-generate institution details

### Issue 2: "Account not found"
**Console shows:** `[Enterprise Login] Error: Account not found`

**Solution:** The user doesn't exist in Firestore or localStorage.

**Fix:**
1. Check if Firestore rules are deployed (see `DEPLOY_RULES_NOW.md`)
2. Create the user from system admin portal at `/admin.html`

### Issue 3: "Invalid credentials"
**Console shows:** `Firebase: Error (auth/invalid-credential)`

**Solution:** Password doesn't match or Firebase Auth account doesn't exist.

**Fix:**
- The system should fall back to manual password verification
- If it still fails, the password hash in Firestore doesn't match
- Recreate the user from admin portal

### Issue 4: "Missing or insufficient permissions"
**Console shows:** `[Firebase] fbGetUser(users) failed: Missing or insufficient permissions`

**Solution:** Firestore rules haven't been deployed yet.

**Fix:**
1. Follow instructions in `DEPLOY_RULES_NOW.md`
2. Deploy the rules from `firestore.rules` to Firebase Console
3. Refresh the page and try again

### Issue 5: Institution code field is showing for admin
**Visual:** Institution code input is visible when "School Admin" is selected

**Solution:** JavaScript not loaded properly or role selector not working.

**Fix:**
1. Hard refresh the page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check console for JavaScript errors

## Expected Behavior

### For School Admin Role:
- ✅ Institution code field is **HIDDEN**
- ✅ Only email and password required
- ✅ Redirects to `/enterprise-dashboard.html` on success
- ✅ User role must be `enterprise` or `admin`

### For Teacher Role:
- ✅ Institution code field is **VISIBLE**
- ✅ Must enter institution code (e.g., `VISION-2026`)
- ✅ Redirects to `/teacher-dashboard.html` on success
- ✅ User role must be `teacher`

### For Enterprise Student Role:
- ✅ Institution code field is **VISIBLE**
- ✅ Must enter institution code
- ✅ Redirects to `/dashboard.html?enterprise=true` on success
- ✅ User role must be `enterprise-student`

## Test Credentials

### System Admin (for creating enterprise admins)
- Portal: `/admin.html`
- Email: `ai@ai.m`
- Password: `ai`

### Enterprise Admin (to be created)
- Portal: `/enterprise-login.html`
- Email: `school@visionedu.online`
- Password: `Vision@2026`
- Role: Select "School Admin"
- Institution Code: Not required

## Next Steps

1. **Open the enterprise login page** with console open
2. **Attempt login** and copy all console logs
3. **Share the console logs** so I can see exactly what's failing
4. **Check if Firestore rules are deployed** (this is the most common issue)

## Quick Verification Commands

Run these in the browser console to check system state:

```javascript
// Check if Firebase is initialized
console.log('Firebase initialized:', typeof window.fbGetUser === 'function');

// Check if user exists in localStorage
const users = JSON.parse(localStorage.getItem('waec_users') || '[]');
const user = users.find(u => u.email === 'school@visionedu.online');
console.log('User in localStorage:', user);

// Check current session
const session = sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session');
console.log('Current session:', session ? JSON.parse(session) : null);
```

## Summary

The enterprise login has been updated with:
- ✅ Better error messages showing actual user role
- ✅ Detailed console logging for debugging
- ✅ Fixed institution code validation for admins
- ✅ Improved Firebase Auth fallback

**Most likely issue:** Firestore rules not deployed or user doesn't exist yet.

**Quick fix:** Deploy Firestore rules and create enterprise admin from system admin portal.
