# 🔥 Firebase Auth Debugging Guide

## Current Problem

Firebase Auth shows "User signed out" on chat page even though Google Sign-In succeeded.

---

## Step 1: Test on Login Page

### Open Browser Console on Login Page

1. Go to: https://ai.visionedu.online/login
2. Open DevTools Console (F12)
3. **Before clicking "Continue with Google"**, run this test:

```javascript
// Test 1: Check if Firebase is loaded
console.log('Firebase Auth object:', window.fbAuth);
console.log('Firebase functions available:', typeof window.fbSignInWithGoogle);
```

**Expected output:**
```
Firebase Auth object: AuthImpl {app: {...}, ...}
Firebase functions available: "function"
```

---

## Step 2: Test Google Sign-In Flow

### Click "Continue with Google" and watch console

**Expected logs (in order):**
```
[Login] Custom Google button clicked
[Login] Signing into Firebase Auth...
[Login] Google credential length: [some number]
[Login] Firebase Auth result: {success: true, user: {...}}
[Login] Firebase Auth successful: mensuohyaw@gmail.com
[Login] ✓ Firebase Auth currentUser confirmed: mensuohyaw@gmail.com
[Firebase] Auth state changed: User signed in: mensuohyaw@gmail.com
[Login] ✓ Firebase Auth still valid after wait
```

### If you see these errors instead:

❌ **Error: "Firebase Auth failed: auth/invalid-credential"**
- **Cause:** Firebase doesn't recognize the Google OAuth client
- **Fix:** Update Firebase Console with correct Web client ID

❌ **Error: "fbSignInWithGoogle not available"**
- **Cause:** firebase.js didn't load
- **Fix:** Check network tab for failed script loads

❌ **Warning: "Firebase Auth succeeded but currentUser is null"**
- **Cause:** Auth state not persisting
- **Fix:** Check Firebase Auth persistence settings

---

## Step 3: Test Auth Persistence

### After successful Google Sign-In, run this in console:

```javascript
// Test 2: Check auth state before redirect
setTimeout(() => {
  console.log('=== AUTH STATE CHECK ===');
  console.log('Auth object:', window.fbAuth);
  console.log('Current user:', window.fbAuth?.currentUser);
  console.log('User email:', window.fbAuth?.currentUser?.email);
  console.log('User UID:', window.fbAuth?.currentUser?.uid);
  console.log('========================');
}, 2000);
```

**Expected output:**
```
=== AUTH STATE CHECK ===
Auth object: AuthImpl {app: {...}, ...}
Current user: UserImpl {uid: "...", email: "mensuohyaw@gmail.com", ...}
User email: "mensuohyaw@gmail.com"
User UID: "abc123xyz..."
========================
```

---

## Step 4: Test on Chat Page

### After redirect to chat page, immediately run:

```javascript
// Test 3: Check if auth persisted across pages
console.log('=== CHAT PAGE AUTH CHECK ===');
console.log('Auth object:', window.fbAuth);
console.log('Current user:', window.fbAuth?.currentUser);
console.log('User email:', window.fbAuth?.currentUser?.email);
console.log('========================');
```

**Expected output:**
```
=== CHAT PAGE AUTH CHECK ===
Auth object: AuthImpl {app: {...}, ...}
Current user: UserImpl {uid: "...", email: "mensuohyaw@gmail.com", ...}
User email: "mensuohyaw@gmail.com"
========================
```

**If you see this instead:**
```
Current user: null
User email: undefined
```

**Then the problem is:** Firebase Auth is not persisting across page navigation.

---

## Step 5: Check Firebase Configuration

### Verify Firebase is using the correct OAuth client:

1. Go to: https://console.firebase.google.com/project/vision-education-8a794/authentication/providers
2. Click on **Google** provider
3. **Check Web SDK configuration:**
   - Web client ID should be: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com`
   - Web client secret should be filled (not empty)

### If Web client ID is empty or different:

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Find OAuth client: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s`
3. Copy the **Client secret**
4. Go back to Firebase
5. Paste both Client ID and Client secret
6. Click **Save**
7. Wait 5 minutes
8. Test again

---

## Step 6: Check OAuth Configuration

### Verify OAuth client is configured correctly:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s`
3. Click to edit

**Check Authorized JavaScript origins:**
- ✅ Should include: `https://ai.visionedu.online`
- ✅ Should include: `https://visionedu.online`

**Check Authorized redirect URIs:**
- ✅ Should include: `https://ai.visionedu.online/login`
- ✅ Should include: `https://ai.visionedu.online/chat`
- ✅ Should include: `https://ai.visionedu.online`

### If any are missing:
1. Add them
2. Click **Save**
3. Wait 5-10 minutes
4. Clear browser cache
5. Test in incognito mode

---

## Step 7: Check OAuth Consent Screen

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Click **"Edit App"**

**Check Scopes:**
- ✅ Should have: `openid`, `email`, `profile`
- ❌ Should NOT have: Google Meet API scopes or other sensitive scopes

**Check Test Users:**
- ✅ Should include: `mensuohyaw@gmail.com`
- ✅ Should include: `atiyaw503@gmail.com`

**Check Publishing Status:**
- ✅ Should be: **"Testing"** (not "In production")

### If Google Meet scope is present:
1. Remove it
2. Save
3. Wait 5 minutes
4. Test again

---

## Step 8: Network Tab Debugging

### Check for failed API calls:

1. Open DevTools → Network tab
2. Click "Continue with Google"
3. Look for **red/failed requests** to:
   - `accounts.google.com`
   - `identitytoolkit.googleapis.com`
   - `firestore.googleapis.com`

**Common errors:**

❌ **401 Unauthorized**
- OAuth scope issue or client not configured

❌ **403 Forbidden**
- Firestore rules issue or domain not authorized

❌ **400 Bad Request**
- Invalid OAuth configuration or missing parameters

---

## Step 9: Test Firebase Auth Directly

### Run this test on login page after Google Sign-In:

```javascript
// Test 4: Manual Firebase Auth test
async function testFirebaseAuth() {
  console.log('=== FIREBASE AUTH TEST ===');
  
  // Check if auth is initialized
  console.log('1. Auth initialized:', !!window.fbAuth);
  
  // Check current user
  console.log('2. Current user:', window.fbAuth?.currentUser?.email || 'null');
  
  // Try to get ID token
  try {
    const token = await window.fbAuth.currentUser?.getIdToken();
    console.log('3. ID token obtained:', !!token);
  } catch (e) {
    console.log('3. ID token error:', e.message);
  }
  
  // Check persistence
  console.log('4. Persistence:', window.fbAuth?.config?.persistence);
  
  console.log('========================');
}

testFirebaseAuth();
```

---

## Step 10: Clear All Auth State and Retry

### If nothing works, clear everything:

```javascript
// Run this in console on login page
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('firebaseLocalStorageDb');
location.reload();
```

Then test the entire flow again from Step 1.

---

## Common Issues and Fixes

### Issue 1: "Auth state changed: User signed out"

**Cause:** Firebase Auth is clearing on page load

**Fix:**
1. Check if firebase.js is loaded on chat page
2. Verify `browserLocalPersistence` is set
3. Check if IndexedDB is enabled in browser

### Issue 2: "Firebase Auth succeeded but currentUser is null"

**Cause:** Auth state not propagating

**Fix:**
1. Increase wait time in login.js (change 500ms to 2000ms)
2. Add `onAuthStateChanged` listener before redirect
3. Store Firebase ID token in localStorage as backup

### Issue 3: "origin_mismatch" error

**Cause:** Domain not in authorized list

**Fix:**
1. Add `https://ai.visionedu.online` to JavaScript origins
2. Wait 10 minutes
3. Clear cache and test

### Issue 4: "invalid-credential" error

**Cause:** Firebase doesn't recognize the Google token

**Fix:**
1. Update Firebase Console with correct Web client ID
2. Ensure client secret is filled
3. Wait 5 minutes and test

---

## Success Criteria

✅ **Login page console shows:**
```
[Login] Firebase Auth successful: mensuohyaw@gmail.com
[Login] ✓ Firebase Auth currentUser confirmed
[Firebase] Auth state changed: User signed in
```

✅ **Chat page console shows:**
```
[Firebase] Auth state changed: User signed in: mensuohyaw@gmail.com
[Chat] Firebase ready with authenticated user: mensuohyaw@gmail.com
[Firebase] Vision AI message saved
```

✅ **No errors about:**
- "User not authenticated"
- "Firebase Auth not ready"
- "auth: null"

---

## Next Steps

1. Run tests in order (Step 1 → Step 10)
2. Note which step fails
3. Apply the fix for that step
4. Report back with console logs

---

## Quick Checklist

Before testing:
- [ ] Firebase Console has correct Web client ID (`378999569796-...`)
- [ ] Firebase Console has Web client secret filled
- [ ] Google OAuth client has `https://ai.visionedu.online` in JavaScript origins
- [ ] Google OAuth client has redirect URIs configured
- [ ] OAuth consent screen is in "Testing" mode
- [ ] Test users are added (`mensuohyaw@gmail.com`)
- [ ] Google Meet API scope is removed
- [ ] Browser cache is cleared
- [ ] Testing in incognito mode

---

**Current Status:** Firebase Auth is signing out on chat page  
**Most Likely Cause:** Firebase Console missing Web client ID or client secret  
**Priority Fix:** Update Firebase Console with OAuth credentials
