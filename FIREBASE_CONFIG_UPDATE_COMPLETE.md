# Firebase Configuration Update - COMPLETE ✅

## Summary

Successfully updated the main site to use the new Firebase project while keeping Vision AI completely separate and untouched.

---

## ✅ Files Updated (Main Site)

### 1. `/firebase.js`
**Old Project:** `vision-education-8a794`  
**New Project:** `vision-education-main`  
**Status:** ✅ Updated

### 2. `/sessions.js`
**Old Project:** `vision-education-8a794`  
**New Project:** `vision-education-main`  
**Status:** ✅ Updated

### 3. `/saml-login.html`
**Old Project:** `vision-education-8a794`  
**New Project:** `vision-education-main`  
**Status:** ✅ Updated

---

## 🔒 Vision AI Protected (Unchanged)

### `/vision-ai/firebase.js`
**Project:** `vision-edu-491909`  
**Status:** ✅ Untouched (verified)

All other Vision AI files remain unchanged.

---

## 🎯 New Firebase Configuration

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA2EiDZcp3h5l7zZ4Cbc48RwrSr8ARq9GM",
  authDomain: "vision-education-main.firebaseapp.com",
  projectId: "vision-education-main",
  storageBucket: "vision-education-main.firebasestorage.app",
  messagingSenderId: "1085532052475",
  appId: "1:1085532052475:web:8ea9dd1f0b28f81868895e",
  measurementId: "G-Q6SPHR6E2N"
};
```

---

## 📋 Next Steps - CRITICAL

### Step 1: Deploy Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/project/vision-education-main/firestore)
2. Click **"Firestore Database"** → **"Rules"**
3. Copy and paste these rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isSignedIn() && 
             exists(/databases/$(database)/documents/users/$(request.auth.token.email)) &&
             get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{email} {
      // Anyone authenticated can read/write their own user document
      allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      
      // Admins can read all users
      allow read: if isAdmin();
      
      // Admins can update any user
      allow update: if isAdmin();
      
      // User sessions subcollection
      match /sessions/{sessionId} {
        allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      }
    }

    // Parent Users collection
    match /parent_users/{email} {
      allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      allow read: if isAdmin();
    }
    
    // Materials collection
    match /materials/{materialId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // WAEC Past Questions collection
    match /waec_questions/{questionId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // Analytics collection
    match /analytics/{docId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.token.email;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.token.email;
      allow read: if isAdmin();
    }
    
    // Study planner collection
    match /study_plans/{userId} {
      allow read, write: if isSignedIn() && userId == request.auth.token.email;
      allow read: if isAdmin();
    }
    
    // Mock exam results
    match /mock_results/{resultId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.token.email;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.token.email;
      allow read: if isAdmin();
    }

    // Student Stats collection
    match /student_stats/{email} {
      allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      allow read: if isAdmin();
    }

    // Student Links (Parent Linking)
    match /student_links/{code} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.resource.data.email.toLowerCase() == request.auth.token.email.toLowerCase();
      allow delete: if isAdmin();
    }
    
    // System broadcasts
    match /broadcasts/{broadcastId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // Vision AI Chat History
    match /vision_ai_chats/{email}/sessions/{sessionId} {
      allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      
      match /messages/{messageId} {
        allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      }
    }
    
    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **"Publish"**

### Step 2: Enable Storage Rules

1. Go to [Storage Rules](https://console.firebase.google.com/project/vision-education-main/storage/rules)
2. Copy and paste these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /materials/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.token.email == 'admin@visionedu.online';
    }
    
    match /waec/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.token.email == 'admin@visionedu.online';
    }
  }
}
```

3. Click **"Publish"**

### Step 3: Configure Google OAuth

1. Go to [Authentication](https://console.firebase.google.com/project/vision-education-main/authentication/providers)
2. Click **"Google"** provider
3. Enable it
4. Add authorized domains:
   - `visionedu.online`
   - `www.visionedu.online`
   - `localhost` (for testing)
5. Save

### Step 4: Clear Browser Cache

**CRITICAL:** The browser is caching the old Firebase config with `?v=3` parameter.

**Option 1: Hard Refresh**
1. Open your site
2. Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

**Option 2: Clear Cache Completely**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

**Option 3: Incognito/Private Window**
1. Open an incognito/private window
2. Test your site there (no cache)

### Step 5: Test Main Site

1. Go to your main site dashboard
2. Open DevTools Console (F12)
3. Look for these SUCCESS indicators:
   - ✅ `[Sessions] Session registered successfully`
   - ✅ `[Firebase] Stats synced for user@example.com`
   - ✅ No permission errors
   - ✅ No "Missing or insufficient permissions" errors

### Step 6: Verify Vision AI Still Works

1. Go to Vision AI site
2. Test login
3. Test chat functionality
4. Should work exactly as before (using `vision-edu-491909`)

---

## 🔍 Troubleshooting

### If you still see permission errors:

1. **Check you cleared cache** - This is the #1 cause
2. **Verify Firestore rules are published** - Check Firebase Console
3. **Check you're logged in** - Session registration requires authentication
4. **Wait 1-2 minutes** - Firebase rules can take time to propagate

### If Vision AI stops working:

This should NOT happen, but if it does:
1. Check `vision-ai/firebase.js` - should still have `vision-edu-491909`
2. Let me know immediately - I'll fix it

---

## 📊 Project Separation

### Main Site
- **Firebase Project:** `vision-education-main`
- **Purpose:** Student dashboard, WAEC questions, materials
- **Files:** Root folder files

### Vision AI
- **Firebase Project:** `vision-edu-491909`
- **Purpose:** AI chat, learning assistant
- **Files:** `vision-ai/` folder

Both projects are now completely independent! 🎉

---

## ✅ Verification Checklist

- [x] Updated `/firebase.js` with new config
- [x] Updated `/sessions.js` with new config
- [x] Updated `/saml-login.html` with new config
- [x] Verified Vision AI config unchanged
- [ ] Deployed Firestore rules (YOU NEED TO DO THIS)
- [ ] Deployed Storage rules (YOU NEED TO DO THIS)
- [ ] Configured Google OAuth (YOU NEED TO DO THIS)
- [ ] Cleared browser cache (YOU NEED TO DO THIS)
- [ ] Tested main site login
- [ ] Verified no permission errors
- [ ] Tested Vision AI (should still work)

---

**Status:** ✅ Code Updated - Awaiting Firebase Console Configuration  
**Next Action:** Deploy Firestore rules and clear browser cache  
**Estimated Time:** 5 minutes

🚀 **You're almost there!** Just complete the Firebase Console steps above and clear your cache!
