# 🚀 Firebase Setup Assistant - Live Guide

## Current Project: vision-education-main

---

## 📍 WHERE ARE YOU NOW?

Mark your current step:

- [ ] **Step 1:** Checking GCP resource location
- [ ] **Step 2:** Creating Firestore database
- [ ] **Step 3:** Deploying Firestore rules
- [ ] **Step 4:** Enabling Authentication
- [ ] **Step 5:** Enabling Storage
- [ ] **Step 6:** Deploying Storage rules
- [ ] **Step 7:** Testing everything

---

## 🎯 STEP 1: GCP Resource Location (START HERE)

### Open This URL:
```
https://console.firebase.google.com/project/vision-education-main/settings/general
```

### What Do You See?

**Scroll down to "Default GCP resource location"**

#### Option A: Shows a Location ✅
Example: `us-central1`, `europe-west1`, `europe-west2`

**Action:** Great! It's already set. Write it here: __dufaiult_____________

**Next:** Go to Step 2

---

#### Option B: Says "Not yet selected" ⚠️

**Action:** You need to set it now!

1. Click the **"Select location"** button
2. Choose **`europe-west1`** (Belgium) - Best for Ghana! 🇬🇭
3. Click **"Done"**
4. Wait 2 minutes
5. Refresh the page
6. Verify it now shows `europe-west1`

**⚠️ IMPORTANT:** This cannot be changed later!

**Next:** Go to Step 2

---

## 🗄️ STEP 2: Create Firestore Database

### Open This URL:
```
https://console.firebase.google.com/project/vision-education-main/firestore
```

### What Do You See?

#### Option A: Firestore Console with Database ✅
You see the Firestore interface with collections/documents

**Action:** Already done! Skip to Step 3

---

#### Option B: "Create database" Button ⚠️

**Action:** Let's create it!

1. Click **"Create database"**
2. Choose **"Start in production mode"**
3. Location should show what you selected in Step 1
4. Click **"Enable"**
5. Wait 30-60 seconds
6. You should see empty Firestore console

**Next:** Go to Step 3

---

## 🔒 STEP 3: Deploy Firestore Security Rules

### Open This URL:
```
https://console.firebase.google.com/project/vision-education-main/firestore/rules
```

### What to Do:

1. Click the **"Rules"** tab (if not already there)
2. **Delete ALL existing rules** (select all, delete)
3. **Copy the rules below**
4. **Paste into the editor**
5. Click **"Publish"**
6. Wait for "Rules published successfully" ✅

### Rules to Copy:

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
    
    match /users/{email} {
      allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      allow read: if isAdmin();
      allow update: if isAdmin();
      
      match /sessions/{sessionId} {
        allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      }
    }

    match /parent_users/{email} {
      allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      allow read: if isAdmin();
    }
    
    match /materials/{materialId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    match /waec_questions/{questionId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    match /analytics/{docId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.token.email;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.token.email;
      allow read: if isAdmin();
    }
    
    match /study_plans/{userId} {
      allow read, write: if isSignedIn() && userId == request.auth.token.email;
      allow read: if isAdmin();
    }
    
    match /mock_results/{resultId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.token.email;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.token.email;
      allow read: if isAdmin();
    }

    match /student_stats/{email} {
      allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
      allow read: if isAdmin();
    }

    match /student_links/{code} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.resource.data.email.toLowerCase() == request.auth.token.email.toLowerCase();
      allow delete: if isAdmin();
    }
    
    match /broadcasts/{broadcastId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Did it publish successfully?** _______________

**Next:** Go to Step 4

---

## 🔐 STEP 4: Enable Authentication

### Open This URL:
```
https://console.firebase.google.com/project/vision-education-main/authentication
```

### What Do You See?

#### Option A: Authentication Dashboard ✅
You see "Sign-in method" tab and providers

**Action:** Continue to enable providers below

---

#### Option B: "Get started" Button ⚠️

**Action:** Click **"Get started"** then continue below

---

### Enable Email/Password:

1. Click **"Sign-in method"** tab
2. Find **"Email/Password"** in the list
3. Click on it
4. Toggle **"Enable"** to ON
5. Click **"Save"**

**Enabled?** __yes_____________

---

### Enable Google Sign-In:

1. Still in **"Sign-in method"** tab
2. Find **"Google"** in the list
3. Click on it
4. Toggle **"Enable"** to ON
5. **Support email:** Enter your email (e.g., support@visionedu.site)
6. **Authorized domains:** Add these:
   - `visionedu.online`
   - `www.visionedu.online`
   - `localhost`
7. Click **"Save"**

**Enabled?** ____yrs___________

**Next:** Go to Step 5

---

## 📦 STEP 5: Enable Storage

### Open This URL:
```
https://console.firebase.google.com/project/vision-education-main/storage
```

### What Do You See?

#### Option A: Storage Console with Buckets ✅
You see storage interface

**Action:** Already done! Skip to Step 6

---

#### Option B: "Get started" Button ⚠️

**Action:** Let's enable it!

1. Click **"Get started"**
2. Choose **"Start in production mode"**
3. Location should match Step 1
4. Click **"Done"**
5. Wait 30 seconds

**Enabled?** ______is for paid users i cant pay_________

**Next:** Go to Step 6

---

## 🔒 STEP 6: Deploy Storage Security Rules

### Open This URL:
```
https://console.firebase.google.com/project/vision-education-main/storage/rules
```

### What to Do:

1. Click the **"Rules"** tab
2. **Delete ALL existing rules**
3. **Copy the rules below**
4. **Paste into the editor**
5. Click **"Publish"**
6. Wait for "Rules published successfully" ✅

### Rules to Copy:

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

**Did it publish successfully?** ______no_________

**Next:** Go to Step 7

---

## 🧪 STEP 7: Test Everything

### Clear Browser Cache First:

**Windows/Linux:** Press `Ctrl + Shift + Delete`  
**Mac:** Press `Cmd + Shift + Delete`

1. Select **"Cached images and files"**
2. Click **"Clear data"**

**Or use Incognito/Private window**

---

### Test Main Site:

1. **Open:** https://visionedu.online/dashboard
2. **Press F12** to open DevTools
3. **Click "Console" tab**
4. **Look for these SUCCESS messages:**
   - ✅ `[Sessions] Session registered successfully`
   - ✅ `[Firebase] Stats synced for...`
   - ✅ NO "Missing or insufficient permissions"
   - ✅ NO "Firebase Session Registration blocked"

**What do you see in console?** _______________

---

### Test Vision AI (Should Still Work):

1. **Open:** https://visionedu.online/vision-ai/
2. **Test login**
3. **Test chat**
4. **Should work exactly as before**

**Does Vision AI work?** _______________

---

## ✅ COMPLETION CHECKLIST

Mark each as complete:

- [ ] Step 1: GCP location set to `europe-west1`
- [ ] Step 2: Firestore database created
- [ ] Step 3: Firestore rules published
- [ ] Step 4: Email/Password auth enabled
- [ ] Step 4: Google auth enabled
- [ ] Step 5: Storage enabled
- [ ] Step 6: Storage rules published
- [ ] Step 7: Browser cache cleared
- [ ] Step 7: Main site tested (no errors)
- [ ] Step 7: Vision AI tested (still works)

---

## 🎯 SUCCESS CRITERIA

**You're done when:**

✅ All checkboxes above are marked  
✅ Console shows NO permission errors  
✅ Can login to main site  
✅ Vision AI still works  

---

## 🆘 TROUBLESHOOTING

### "Can't create Firestore database"
→ Make sure Step 1 (GCP location) is complete

### "Rules won't publish"
→ Check for syntax errors, copy rules exactly as shown

### "Still seeing permission errors"
→ Wait 2 minutes, clear cache, try incognito window

### "Vision AI stopped working"
→ Check `vision-ai/firebase.js` still has `vision-edu-491909`

---

## 📞 NEED HELP?

**Tell me:**
1. Which step you're on: _______________
2. What you see: _______________
3. Any error messages: _______________

---

**Start with Step 1 and work through each step!** 🚀
