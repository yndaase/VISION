# Main Site Firebase Setup - Step by Step Guide

## Project Information
- **Firebase Project:** vision-education-main
- **Project ID:** vision-education-main
- **Project Number:** 1085532052475
- **Purpose:** Main student dashboard, WAEC questions, materials

---

## 🚀 STEP 1: Check GCP Resource Location (START HERE)

### What to Do:

1. **Open this URL in your browser:**
   ```
   https://console.firebase.google.com/project/vision-education-main/settings/general
   ```

2. **Scroll down to find:** "Default GCP resource location"

3. **What do you see?**

   **Option A:** Shows a location (e.g., `us-central1`, `europe-west1`)
   - ✅ **Status:** Already configured!
   - **Action:** Skip to Step 2

   **Option B:** Shows "Not yet selected"
   - ⚠️ **Status:** Needs configuration
   - **Action:** Continue below

---

### If You See "Not yet selected":

1. **Click the "Select location" button**

2. **Choose the best location for Ghana:**
   - **`europe-west1`** (Belgium) - ⭐ **RECOMMENDED** (~100ms latency to Ghana)
   - **`us-central1`** (Iowa, USA) - (~150ms latency to Ghana)
   - **`europe-west2`** (London, UK) - (~120ms latency to Ghana)

3. **Click "Done"**

4. **⚠️ IMPORTANT:** This cannot be changed later! Choose carefully.

5. **Wait 1-2 minutes** for the change to propagate

6. **Refresh the page** and verify the location is now shown

---

## ✅ STEP 2: Enable Firestore Database

### What to Do:

1. **Open this URL:**
   ```
   https://console.firebase.google.com/project/vision-education-main/firestore
   ```

2. **What do you see?**

   **Option A:** Firestore console with database
   - ✅ **Status:** Already enabled!
   - **Action:** Skip to Step 3

   **Option B:** "Create database" button
   - **Action:** Continue below

---

### If You Need to Create Database:

1. **Click "Create database"**

2. **Choose mode:**
   - Select **"Start in production mode"**
   - (We'll add rules in the next step)

3. **Location:**
   - Should auto-select based on your GCP resource location
   - Should match what you chose in Step 1

4. **Click "Enable"**

5. **Wait 30-60 seconds** for database creation

6. **You should see:** Empty Firestore console with "Start collection" button

---

## 🔒 STEP 3: Deploy Firestore Security Rules

### What to Do:

1. **Open this URL:**
   ```
   https://console.firebase.google.com/project/vision-education-main/firestore/rules
   ```

2. **Click the "Rules" tab** (if not already there)

3. **Delete all existing rules** (select all and delete)

4. **Copy and paste these rules:**

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
    
    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. **Click "Publish"**

6. **Wait for confirmation:** "Rules published successfully"

---

## 🔐 STEP 4: Enable Authentication

### What to Do:

1. **Open this URL:**
   ```
   https://console.firebase.google.com/project/vision-education-main/authentication
   ```

2. **What do you see?**

   **Option A:** Authentication dashboard with providers
   - ✅ **Status:** Already enabled!
   - **Action:** Continue to enable providers below

   **Option B:** "Get started" button
   - **Action:** Click "Get started" then continue below

---

### Enable Email/Password Authentication:

1. **Click "Sign-in method" tab**

2. **Find "Email/Password" in the list**

3. **Click on it**

4. **Toggle "Enable"** to ON

5. **Click "Save"**

---

### Enable Google Authentication:

1. **Still in "Sign-in method" tab**

2. **Find "Google" in the list**

3. **Click on it**

4. **Toggle "Enable"** to ON

5. **Add support email:** Your email address (e.g., support@visionedu.site)

6. **Add authorized domains:**
   - `visionedu.online`
   - `www.visionedu.online`
   - `localhost` (for testing)

7. **Click "Save"**

---

## 📦 STEP 5: Enable Storage

### What to Do:

1. **Open this URL:**
   ```
   https://console.firebase.google.com/project/vision-education-main/storage
   ```

2. **What do you see?**

   **Option A:** Storage console with buckets
   - ✅ **Status:** Already enabled!
   - **Action:** Skip to Step 6

   **Option B:** "Get started" button
   - **Action:** Continue below

---

### If You Need to Enable Storage:

1. **Click "Get started"**

2. **Choose mode:**
   - Select **"Start in production mode"**

3. **Location:**
   - Should auto-select based on your GCP resource location
   - Should match what you chose in Step 1

4. **Click "Done"**

5. **Wait 30 seconds** for storage to be enabled

---

## 🔒 STEP 6: Deploy Storage Security Rules

### What to Do:

1. **Open this URL:**
   ```
   https://console.firebase.google.com/project/vision-education-main/storage/rules
   ```

2. **Click the "Rules" tab**

3. **Delete all existing rules**

4. **Copy and paste these rules:**

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

5. **Click "Publish"**

6. **Wait for confirmation:** "Rules published successfully"

---

## ✅ STEP 7: Verify Google Cloud Connection

### What to Do:

1. **Open Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Click the project dropdown** (top left, next to "Google Cloud")

3. **Look for "vision-education-main"** in the project list

4. **What do you see?**

   **Option A:** Project is in the list
   - ✅ **Status:** Properly linked!
   - **Action:** Select it and continue below

   **Option B:** Project is NOT in the list
   - ⚠️ **Status:** Linking issue
   - **Action:** Make sure you're logged in with the same Google account

---

### Verify APIs are Enabled:

1. **With project selected, go to:**
   ```
   https://console.cloud.google.com/apis/dashboard?project=vision-education-main
   ```

2. **You should see these APIs enabled:**
   - ✅ Cloud Firestore API
   - ✅ Identity Toolkit API
   - ✅ Firebase Authentication API
   - ✅ Cloud Storage API

3. **If any are missing:**
   - Go to: https://console.cloud.google.com/apis/library?project=vision-education-main
   - Search for the missing API
   - Click "Enable"

---

## 🧪 STEP 8: Test Your Setup

### Clear Browser Cache:

1. **Press `Ctrl + Shift + Delete`**

2. **Select "Cached images and files"**

3. **Click "Clear data"**

4. **Or use Incognito window** for testing

---

### Test Main Site:

1. **Open your dashboard:**
   ```
   https://visionedu.online/dashboard
   ```

2. **Open DevTools (F12) → Console tab**

3. **Look for SUCCESS indicators:**
   - ✅ `[Sessions] Session registered successfully`
   - ✅ `[Firebase] Stats synced for...`
   - ✅ NO "Missing or insufficient permissions" errors
   - ✅ NO "Firebase Session Registration blocked" errors

4. **If you see errors:**
   - Wait 2 minutes (rules need time to propagate)
   - Clear cache again
   - Try incognito window
   - Check that you completed all steps above

---

### Test Vision AI (Should Still Work):

1. **Open Vision AI:**
   ```
   https://visionedu.online/vision-ai/
   ```

2. **Test login and chat**

3. **Should work exactly as before** (uses different Firebase project)

---

## 📋 Progress Checklist

Track your progress:

- [ ] **Step 1:** GCP resource location set (`europe-west1` recommended)
- [ ] **Step 2:** Firestore database created
- [ ] **Step 3:** Firestore rules deployed
- [ ] **Step 4:** Authentication enabled (Email + Google)
- [ ] **Step 5:** Storage enabled
- [ ] **Step 6:** Storage rules deployed
- [ ] **Step 7:** Google Cloud connection verified
- [ ] **Step 8:** Browser cache cleared
- [ ] **Step 8:** Main site tested (no errors)
- [ ] **Step 8:** Vision AI tested (still works)

---

## 🆘 Troubleshooting

### "Can't create Firestore database"
**Solution:** Set GCP resource location first (Step 1)

### "APIs not enabled"
**Solution:** Go to Google Cloud Console → APIs & Services → Enable required APIs

### "Still seeing permission errors"
**Solution:** 
1. Wait 2 minutes for rules to propagate
2. Clear browser cache completely
3. Try incognito window
4. Verify you completed Steps 3 and 6 (rules deployment)

### "Vision AI stopped working"
**Solution:** This should NOT happen. Check that `vision-ai/firebase.js` still has `vision-edu-491909`

---

## 🎯 Current Status

**What's Done:**
- ✅ Firebase config updated in code (3 files)
- ✅ Vision AI protected (separate project)

**What You Need to Do:**
- [ ] Complete Steps 1-8 above
- [ ] Test and verify

**Estimated Time:** 15-20 minutes

---

## 📞 Need Help?

**Tell me what you see at each step:**

1. **Step 1:** What does "Default GCP resource location" show?
2. **Step 2:** Do you see "Create database" or existing database?
3. **Step 3:** Did rules publish successfully?
4. **Step 4:** Are Email and Google providers enabled?
5. **Step 5:** Is Storage enabled?
6. **Step 6:** Did storage rules publish successfully?
7. **Step 7:** Do you see the project in Google Cloud Console?
8. **Step 8:** What errors (if any) do you see in the console?

Let me know where you are and I'll guide you through! 🚀
