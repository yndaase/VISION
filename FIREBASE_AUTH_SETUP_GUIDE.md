# Firebase Auth Setup for Admin Portal

## Current Status

✅ **Admin portal now works WITHOUT Firebase Auth**
- You can log in and access the admin dashboard
- Local features work (user management, announcements, etc.)
- Firebase Auth runs in background (non-blocking)

⚠️ **Firebase features require Firebase Auth account**
- Loading users from Firestore
- Materials upload to Cloudflare R2
- WAEC questions upload

## Why Firebase Auth Failed

The error `auth/invalid-credential` means:
- Your admin email (`mensuohyaw@gmail.com`) doesn't have a Firebase Auth account yet
- OR the password doesn't match

## How to Fix (Create Firebase Auth Account)

### Option 1: Firebase Console (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select project**: `vision-education-main`
3. **Go to Authentication** (left sidebar)
4. **Click "Users" tab**
5. **Click "Add User"**
6. **Enter**:
   - Email: `mensuohyaw@gmail.com`
   - Password: `[YOUR_ADMIN_PASSWORD]` (same as local login)
7. **Click "Add User"**

### Option 2: Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Create user
firebase auth:import users.json --project vision-education-main
```

Where `users.json` contains:
```json
{
  "users": [{
    "localId": "admin-user-id",
    "email": "mensuohyaw@gmail.com",
    "emailVerified": true,
    "passwordHash": "[hash]",
    "salt": "[salt]",
    "displayName": "Yaw Ndaase"
  }]
}
```

## After Creating Firebase Auth Account

1. **Log out of admin portal**
2. **Log back in**
3. **Enter OTP**
4. **Check console** - should see:
   ```
   [Admin] ✅ Firebase Auth successful
   [Admin] ✅ Admin user document synced to Firestore
   ```

## Testing Firebase Features

### Test 1: Load Firebase Users
1. Go to "Learners" tab
2. Should see users from Firestore
3. If not, check console for errors

### Test 2: Upload Material
1. Go to `/admin-materials-upload`
2. Select a file
3. Fill in details
4. Click "Upload to Cloudflare R2"
5. Should upload successfully

### Test 3: Upload WAEC Question
1. Go to `/admin-waec-upload`
2. Select a PDF
3. Fill in details
4. Click "Upload"
5. Should upload successfully

## Current Behavior (Without Firebase Auth)

### ✅ What Works
- Admin login with OTP
- Dashboard access
- Local user management (localStorage)
- Announcements
- Support chat
- All UI features

### ⚠️ What Doesn't Work
- Loading users from Firestore (shows local cache only)
- Uploading materials (needs Firebase Auth token)
- Uploading WAEC questions (needs Firebase Auth token)
- Real-time Firestore sync

## Console Messages

### Success (Firebase Auth Working)
```
[Admin] OTP verified successfully
[Admin] Attempting Firebase Auth in background...
[Admin] ✅ Firebase Auth successful
[Admin] ✅ Admin user document synced to Firestore
```

### Failure (No Firebase Auth Account)
```
[Admin] OTP verified successfully
[Admin] Attempting Firebase Auth in background...
[Admin] ⚠️ Firebase Auth failed: Firebase: Error (auth/invalid-credential)
[Admin] You need to create a Firebase Auth account for: mensuohyaw@gmail.com
[Admin] Go to Firebase Console → Authentication → Add User
```

## Quick Fix Summary

**To enable all Firebase features:**

1. Create Firebase Auth account for `mensuohyaw@gmail.com`
2. Use the SAME password as your local admin login
3. Log out and log back in
4. Firebase Auth will succeed
5. All features will work

**Current workaround:**

- Admin portal works fine without Firebase Auth
- You can manage local users
- Firebase features will be added once Auth account is created

## Need Help?

If you're still having issues:
1. Send me the console output after logging in
2. Confirm if you've created the Firebase Auth account
3. Verify the password matches your local login password
