# Google Cloud & Firebase Connection Guide

## Understanding the Connection

Firebase projects **automatically create** a Google Cloud project when you create them. They are linked by default, but you need to verify the connection is working properly.

---

## ✅ How to Check if Firebase is Linked to Google Cloud

### Method 1: Check from Firebase Console (Easiest)

1. Go to your Firebase project:
   ```
   https://console.firebase.google.com/project/vision-education-main
   ```

2. Click the **⚙️ Settings icon** (top left, next to "Project Overview")

3. Click **"Project settings"**

4. Look for **"Google Cloud Platform (GCP) resource location"**
   - If you see a location (e.g., `us-central`, `europe-west`), it's linked ✅
   - If you see "Not yet selected", you need to set it up ⚠️

5. Scroll down to **"Your apps"** section
   - You should see your web app listed
   - Should show the App ID: `1:1085532052475:web:8ea9dd1f0b28f81868895e`

6. Look for **"Service accounts"** tab
   - Click it
   - You should see service account emails
   - This confirms Google Cloud integration ✅

---

### Method 2: Check from Google Cloud Console

1. Go to Google Cloud Console:
   ```
   https://console.cloud.google.com/
   ```

2. Click the **project dropdown** (top left, next to "Google Cloud")

3. Look for **"vision-education-main"** in the list
   - If you see it, Firebase is linked ✅
   - If you don't see it, there's a linking issue ⚠️

4. Select the project and check:
   - **APIs & Services** → Should see Firebase APIs enabled
   - **IAM & Admin** → Should see Firebase service accounts

---

### Method 3: Check GCP Resource Location (CRITICAL)

**This is the most important check!**

1. Go to Firebase Console:
   ```
   https://console.firebase.google.com/project/vision-education-main/settings/general
   ```

2. Scroll to **"Google Cloud Platform (GCP) resource location"**

3. **If it says "Not yet selected":**
   - Click **"Select location"**
   - Choose: **`us-central1`** (closest to Ghana) or **`europe-west1`**
   - Click **"Done"**
   - ⚠️ **WARNING:** This cannot be changed later!

4. **If it shows a location:**
   - You're all set! ✅

---

## 🔧 If Firebase is NOT Linked to Google Cloud

### Option 1: Link Existing Firebase to Google Cloud

1. Go to Firebase Console:
   ```
   https://console.firebase.google.com/project/vision-education-main/settings/general
   ```

2. Scroll to **"Google Cloud Platform (GCP) resource location"**

3. Click **"Select location"**

4. Choose your preferred location:
   - **`us-central1`** - Best for Ghana (lowest latency to Africa)
   - **`europe-west1`** - Alternative for Ghana
   - **`asia-southeast1`** - If you have Asian users

5. Click **"Done"**

---

### Option 2: Enable Required Google Cloud APIs

1. Go to Google Cloud Console:
   ```
   https://console.cloud.google.com/apis/library?project=vision-education-main
   ```

2. Enable these APIs (search and enable each):
   - ✅ **Cloud Firestore API**
   - ✅ **Firebase Authentication API**
   - ✅ **Cloud Storage API**
   - ✅ **Identity Toolkit API**
   - ✅ **Token Service API**

3. For each API:
   - Search for it
   - Click on it
   - Click **"Enable"**
   - Wait for confirmation

---

## 🎯 Quick Verification Checklist

Run through this checklist to confirm everything is linked:

### Firebase Console Checks
- [ ] Go to: https://console.firebase.google.com/project/vision-education-main/settings/general
- [ ] **GCP resource location** is set (not "Not yet selected")
- [ ] **Service accounts** tab shows email addresses
- [ ] **Web app** is registered and shows App ID

### Google Cloud Console Checks
- [ ] Go to: https://console.cloud.google.com/
- [ ] Project "vision-education-main" appears in project list
- [ ] Go to: https://console.cloud.google.com/apis/dashboard?project=vision-education-main
- [ ] See Firebase-related APIs enabled

### Firestore Check
- [ ] Go to: https://console.firebase.google.com/project/vision-education-main/firestore
- [ ] Can create database (or database already exists)
- [ ] No errors about "GCP resource location"

### Authentication Check
- [ ] Go to: https://console.firebase.google.com/project/vision-education-main/authentication
- [ ] Can enable Email/Password provider
- [ ] Can enable Google provider
- [ ] No errors about missing APIs

---

## 🚨 Common Issues & Solutions

### Issue 1: "GCP resource location not set"

**Symptom:** Can't create Firestore database or enable features

**Solution:**
1. Go to Project Settings → General
2. Set GCP resource location (choose `us-central1`)
3. Wait 1-2 minutes for propagation

---

### Issue 2: "Firebase APIs not enabled"

**Symptom:** Features don't work, API errors in console

**Solution:**
1. Go to: https://console.cloud.google.com/apis/library?project=vision-education-main
2. Enable these APIs:
   - Cloud Firestore API
   - Firebase Authentication API
   - Identity Toolkit API
   - Cloud Storage API

---

### Issue 3: "Project not found in Google Cloud"

**Symptom:** Can't see project in Google Cloud Console

**Solution:**
1. Make sure you're logged in with the same Google account
2. Check Firebase Console → Settings → General
3. Look for "Project ID" - should be `vision-education-main`
4. Go to: https://console.cloud.google.com/projectselector2
5. Search for the project ID

---

### Issue 4: "Billing not enabled"

**Symptom:** Some features require billing

**Solution:**
Firebase Spark (free) plan includes:
- ✅ Authentication (unlimited)
- ✅ Firestore (50K reads/day, 20K writes/day)
- ✅ Storage (1GB, 10GB transfer/month)

For your use case, **free plan is sufficient**. Only upgrade if you exceed limits.

To check billing:
1. Go to: https://console.firebase.google.com/project/vision-education-main/usage
2. See current usage
3. Upgrade to Blaze (pay-as-you-go) only if needed

---

## 📊 Recommended GCP Resource Locations for Ghana

Based on latency to Ghana:

1. **`us-central1`** (Iowa, USA) - ~150ms latency ⭐ RECOMMENDED
2. **`europe-west1`** (Belgium) - ~100ms latency ⭐ BEST FOR GHANA
3. **`europe-west2`** (London, UK) - ~120ms latency
4. **`us-east1`** (South Carolina, USA) - ~180ms latency

**Choose `europe-west1` for best performance in Ghana!**

---

## 🧪 Test Firebase-Google Cloud Connection

Run this test in your browser console:

```javascript
// Test 1: Check Firebase initialization
console.log('Firebase App:', firebase.app().name);
console.log('Firebase Project:', firebase.app().options.projectId);

// Test 2: Check Firestore connection
firebase.firestore().collection('test').doc('connection-test').set({
  timestamp: new Date(),
  test: 'Google Cloud connection'
}).then(() => {
  console.log('✅ Firestore connected to Google Cloud!');
}).catch(err => {
  console.error('❌ Firestore connection failed:', err.message);
});

// Test 3: Check Auth connection
firebase.auth().onAuthStateChanged(user => {
  console.log('✅ Firebase Auth connected!');
});
```

---

## 📝 Step-by-Step: Set GCP Location (Most Important)

**This is the #1 thing you need to do:**

1. **Open Firebase Console:**
   ```
   https://console.firebase.google.com/project/vision-education-main/settings/general
   ```

2. **Scroll to "Default GCP resource location"**

3. **Click "Select location"** (if not already set)

4. **Choose: `europe-west1`** (best for Ghana)

5. **Click "Done"**

6. **Wait 1-2 minutes** for changes to propagate

7. **Verify:** Refresh page, should show selected location

---

## ✅ Final Verification

After setting everything up, verify with these URLs:

1. **Firebase Project Overview:**
   ```
   https://console.firebase.google.com/project/vision-education-main/overview
   ```
   Should show: Project health, usage stats

2. **Google Cloud Project:**
   ```
   https://console.cloud.google.com/home/dashboard?project=vision-education-main
   ```
   Should show: Project dashboard, APIs enabled

3. **Firestore Database:**
   ```
   https://console.firebase.google.com/project/vision-education-main/firestore
   ```
   Should show: Database (or option to create one)

4. **Authentication:**
   ```
   https://console.firebase.google.com/project/vision-education-main/authentication
   ```
   Should show: Sign-in methods

---

## 🎯 Quick Action Plan

**Do this RIGHT NOW:**

1. ✅ Go to: https://console.firebase.google.com/project/vision-education-main/settings/general
2. ✅ Check "Default GCP resource location"
3. ✅ If not set, choose `europe-west1`
4. ✅ Enable Firestore: https://console.firebase.google.com/project/vision-education-main/firestore
5. ✅ Enable Authentication: https://console.firebase.google.com/project/vision-education-main/authentication

**That's it!** Firebase will automatically handle the Google Cloud connection.

---

**Need help?** Let me know what you see when you check the GCP resource location!
