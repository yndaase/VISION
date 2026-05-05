# Admin Portal Firebase Integration Fix

## Issues Identified

1. **Firebase Users Not Loading**: Admin portal calls `fbGetAllUsers()` but admin may not be authenticated with Firebase Auth
2. **Upload Functions Failing**: Materials and WAEC uploads need Firebase Auth token
3. **Missing Auth Flow**: Admin logs in with local auth but doesn't authenticate with Firebase

## Root Cause

The admin portal uses local authentication (email/password stored in localStorage) but doesn't authenticate with Firebase Auth. This means:
- Firestore security rules block access (no `request.auth`)
- `fbGetAllUsers()` fails silently
- Upload APIs can't verify admin status

## Solution

### 1. Admin Must Authenticate with Firebase After Local Login

When admin logs in successfully with local credentials, we need to:
1. Check if they have a Firebase account
2. If yes, sign them in with Firebase Auth
3. If no, create a Firebase Auth account for them

### 2. Update Admin Login Flow

```javascript
// After successful local auth check:
if (user.role === 'admin') {
  // Authenticate with Firebase
  if (typeof window.fbSignIn === 'function') {
    try {
      await window.fbSignIn(email, password);
      console.log('[Admin] Firebase Auth successful');
    } catch (fbError) {
      console.warn('[Admin] Firebase Auth failed:', fbError);
      // Admin can still access local features
    }
  }
}
```

### 3. Firestore Rules Already Allow Admin Access

Current rules in `firestore.rules`:
```
function isAdmin() {
  return isSignedIn() && 
         exists(/databases/$(database)/documents/users/$(request.auth.token.email)) &&
         get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
}
```

This means:
- ✅ Admin must be signed in with Firebase Auth
- ✅ Admin document must exist in Firestore `users` collection
- ✅ Admin document must have `role: 'admin'`

### 4. Required Changes

#### A. Ensure Admin User Exists in Firestore

Admin user document must exist at: `users/mensuohyaw@gmail.com`

With fields:
```json
{
  "email": "mensuohyaw@gmail.com",
  "emailLower": "mensuohyaw@gmail.com",
  "name": "Yaw Ndaase",
  "role": "admin",
  "lastUpdated": "2026-05-05T..."
}
```

#### B. Admin Login Must Call Firebase Auth

After local password check passes, call:
```javascript
await window.fbSignIn(email, password);
```

#### C. Upload Pages Must Wait for Firebase Auth

Before calling upload APIs:
```javascript
// Check if Firebase Auth is ready
if (!auth.currentUser) {
  throw new Error('Firebase authentication required');
}
```

## Implementation Steps

1. ✅ Firestore rules already correct
2. ⏳ Add Firebase Auth call to admin login
3. ⏳ Ensure admin user document exists in Firestore
4. ⏳ Add auth check to upload pages

## Testing

After fix:
1. Admin logs in → Should see Firebase Auth success in console
2. Navigate to Users tab → Should load Firebase users
3. Upload material → Should work without errors
4. Upload WAEC question → Should work without errors
