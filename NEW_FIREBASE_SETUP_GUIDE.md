# New Firebase Project Setup Guide for Main Site

## Step 1: Create New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Project name: `vision-education-main` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click **"Create project"**

## Step 2: Register Web App

1. In your new Firebase project, click the **Web icon** (`</>`)
2. App nickname: `Vision Education Main Site`
3. Check **"Also set up Firebase Hosting"** (optional)
4. Click **"Register app"**
5. **COPY THE CONFIG** - you'll need this!

Your config will look like:
```javascript
const firebaseConfig = {
  apiKey: "YOUR-NEW-API-KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx",
  measurementId: "G-XXXXXXXXXX"
};
```

## Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Enable **Email/Password** provider
3. Enable **Google** provider:
   - Add your support email
   - Add authorized domains: `visionedu.online`, `www.visionedu.online`

## Step 4: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Production mode** (we'll add rules next)
3. Select location: `us-central` or closest to Ghana
4. Click **Enable**

## Step 5: Deploy Firestore Rules

Copy and paste these rules into Firestore Rules editor:

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
    
    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Step 6: Enable Firebase Storage

1. Go to **Storage** → **Get started**
2. Choose **Production mode**
3. Select same location as Firestore
4. Click **Done**

## Step 7: Deploy Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /materials/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.token.email in ['admin@visionedu.online'];
    }
    
    match /waec/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.token.email in ['admin@visionedu.online'];
    }
  }
}
```

## Step 8: Update Your Code

After completing the above steps, I'll update these files with your new Firebase config:
- `firebase.js`
- `sessions.js`
- Any other files using Firebase

## Step 9: Clear Browser Cache

After deploying the new config:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**
4. Or use: Ctrl+Shift+Delete → Clear cache

## Step 10: Test

1. Try logging in with a test account
2. Check console - should see no permission errors
3. Verify session management works
4. Test password change form

---

## Quick Checklist

- [ ] Created new Firebase project
- [ ] Registered web app and copied config
- [ ] Enabled Email/Password authentication
- [ ] Enabled Google authentication
- [ ] Created Firestore database
- [ ] Deployed Firestore rules
- [ ] Enabled Firebase Storage
- [ ] Deployed Storage rules
- [ ] Updated code with new config
- [ ] Cleared browser cache
- [ ] Tested login and features

---

## Need Help?

If you get stuck on any step, let me know and I'll guide you through it!

Once you have the new Firebase config, share it with me and I'll update all the necessary files.
