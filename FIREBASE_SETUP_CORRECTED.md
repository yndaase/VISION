# Firebase Setup - Corrected for Cloudflare R2

## ✅ What You Actually Need

Since you use **Cloudflare R2** for file storage, you only need:

1. ✅ **Firebase Authentication** - For user login (Google OAuth, Email/Password)
2. ✅ **Firestore Database** - For user data, progress, stats
3. ❌ **Firebase Storage** - SKIP THIS (you use Cloudflare R2)

---

## 🎯 Simplified Setup Steps

### ✅ Step 1: GCP Resource Location
**Status:** Should be done ✅  
**Location:** `europe-west1` (recommended for Ghana)

---

### ✅ Step 2: Firestore Database
**Status:** Should be done ✅  
**Mode:** Production mode

---

### ✅ Step 3: Firestore Security Rules

**URL:** https://console.firebase.google.com/project/vision-education-main/firestore/rules

**Rules to use:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             exists(/databases/$(database)/documents/users/$(request.auth.token.email)) &&
             get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{email} {
      allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      allow read: if isAdmin();
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
    
    // Materials collection (metadata only - files are in R2)
    match /materials/{materialId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // WAEC Past Questions collection (metadata only - files are in R2)
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
    
    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Status:** Should be done ✅

---

### ✅ Step 4: Authentication

**URL:** https://console.firebase.google.com/project/vision-education-main/authentication

**Enable:**
- ✅ Email/Password
- ✅ Google Sign-In
  - Authorized domains: `visionedu.online`, `www.visionedu.online`, `localhost`

**Status:** Should be done ✅

---

### ❌ Step 5 & 6: Firebase Storage - SKIP

**You don't need Firebase Storage because:**
- ✅ You use Cloudflare R2 for file storage
- ✅ Your `/api/upload.js` handles R2 uploads
- ✅ Materials and WAEC files are stored in R2
- ✅ Firestore only stores metadata (URLs, titles, etc.)

**Action:** Do nothing. Skip Firebase Storage entirely.

---

## 🧪 Testing Your Setup

### 1️⃣ Clear Browser Cache

**Critical:** The browser is caching old config with `?v=3`

**Option A: Hard Refresh**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

**Option B: Incognito Window** (Easiest)
- Open incognito/private window
- Test there

---

### 2️⃣ Test Main Site

1. **Open:** https://visionedu.online/dashboard

2. **Open DevTools (F12) → Console**

3. **Look for:**

**✅ SUCCESS:**
```
[Sessions] Session registered successfully
[Firebase] Stats synced for user@example.com
[Auth] Database migration checked
[Dashboard] Synchronizing visual assets
```

**❌ ERRORS (should NOT see):**
```
Firebase Session Registration blocked: Missing or insufficient permissions
[Firebase] syncStateToCloud failed: Missing or insufficient permissions
```

---

### 3️⃣ Test File Upload/Download (R2)

Your file storage flow:
```
User uploads file
    ↓
/api/upload.js (Vercel serverless function)
    ↓
Cloudflare R2 (file storage)
    ↓
Firestore (save metadata: URL, title, size)
    ↓
User downloads via /api/upload?action=download&materialId=xxx
```

**Test:**
1. Try uploading a material (if you're admin)
2. Try downloading a material
3. Check if files load correctly

---

## 📊 Your Architecture

```
┌─────────────────────────────────────┐
│         Vercel (Frontend)           │
│  - HTML/CSS/JS                      │
│  - API routes (/api/*)              │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│      Firebase (Backend)             │
│  - Authentication ✅                │
│  - Firestore Database ✅            │
│  - Storage ❌ (using R2 instead)    │
└─────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│      Cloudflare R2 (Storage)        │
│  - Materials (PDFs, videos)         │
│  - WAEC questions                   │
│  - User uploads                     │
└─────────────────────────────────────┘
```

---

## ✅ Completion Checklist

- [ ] GCP resource location set (`europe-west1`)
- [ ] Firestore database created
- [ ] Firestore rules deployed (without Storage rules)
- [ ] Email/Password authentication enabled
- [ ] Google authentication enabled
- [ ] ~~Firebase Storage~~ (SKIPPED - using R2)
- [ ] Browser cache cleared
- [ ] Main site tested (no permission errors)
- [ ] Vision AI tested (still works)
- [ ] File uploads/downloads work (R2)

---

## 🎯 What to Test Now

1. **Clear browser cache** (Ctrl+Shift+Delete or use incognito)

2. **Open dashboard** and check console for errors

3. **Test login** with your account

4. **Test file access** (materials, WAEC questions)

5. **Verify Vision AI** still works

---

## 📞 Tell Me

1. **Console output:** What do you see when you open the dashboard?
2. **Any errors:** Copy/paste any error messages
3. **Login works:** Yes/No
4. **Files load:** Can you access materials/WAEC questions?
5. **Vision AI works:** Yes/No

---

**The key difference:** You're using Cloudflare R2 for storage, so Firebase Storage is not needed. Your setup is actually simpler! 🎉
