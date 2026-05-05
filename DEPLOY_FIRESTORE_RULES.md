# Deploy Firestore Rules - Fix Materials Permissions

## Problem

Students getting "Missing or insufficient permissions" when trying to read materials from Firestore.

**Error:**
```
[Firebase] fbGetMaterials failed: Missing or insufficient permissions.
[Firebase] No materials found in Firestore
```

## Root Cause

Firestore security rules had `materials` collection but code uses `learning_materials` collection.

## Solution

Added security rule for `learning_materials` collection:

```javascript
// Learning Materials collection (metadata only - files in R2)
match /learning_materials/{materialId} {
  allow read: if isSignedIn();
  allow create, update, delete: if isAdmin();
}
```

## Deploy Rules to Firebase

### Option 1: Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `vision-education-main`
3. Go to **Firestore Database** (left sidebar)
4. Click **Rules** tab
5. Copy the entire content from `firestore.rules` file
6. Paste into the editor
7. Click **Publish**

### Option 2: Firebase CLI

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules --project vision-education-main
```

## Verify Deployment

### Test 1: Check Rules in Console
1. Go to Firebase Console → Firestore Database → Rules
2. Should see `learning_materials` rule
3. Check "Last deployed" timestamp

### Test 2: Test from Student Dashboard
1. Log into student dashboard
2. Open browser console
3. Run:
```javascript
await window.fbGetMaterials()
```
4. Should return array of materials (not permission error)

### Test 3: Run Full Test
```javascript
await window.testMaterialsSync()
```

**Expected output:**
```
=== MATERIALS SYNC TEST ===
1. Function availability:
   - fbGetMaterials: function
   - syncMaterials: function
   - getMaterials: function

2. Fetching from Firestore...
   ✅ Found X materials in Firestore
   First material: {...}

3. Checking localStorage...
   ✅ Found X materials in cache
   First material: {...}

4. Running sync...
   ✅ Synced X materials

5. Getting materials...
   ✅ getMaterials() returned X materials

=== TEST COMPLETE ===
```

## Current Firestore Rules Structure

```
vision-education-main (Firestore)
├── users/                    ← User profiles
├── parent_users/             ← Parent accounts
├── materials/                ← Old materials (deprecated)
├── learning_materials/       ← NEW: Current materials ✅
├── waec_questions/           ← WAEC past questions
├── student_stats/            ← Student progress
├── student_links/            ← Parent linking codes
├── broadcasts/               ← Announcements
└── vision_ai_chats/          ← Vision AI chat history
```

## Permissions Summary

### `learning_materials` Collection

**Read:** Any authenticated user
- Students can view all materials
- Parents can view all materials
- Admins can view all materials

**Write:** Admin only
- Only admins can create materials
- Only admins can update materials
- Only admins can delete materials

## After Deployment

1. **Test material upload (Admin):**
   - Go to `/admin-materials-upload`
   - Upload a PDF
   - Should save to Firestore successfully

2. **Test material viewing (Student):**
   - Log into student dashboard
   - Materials should load automatically
   - Should see materials in "Learner Materials" section

3. **Check console:**
   ```
   [Firebase] Syncing materials from Firestore...
   [Firebase] ✅ Synced X materials to localStorage
   [Dashboard] Materials sync complete, rendering...
   ```

## Troubleshooting

### Still Getting Permission Error

**Check 1: Rules Deployed**
```bash
firebase deploy --only firestore:rules --project vision-education-main
```

**Check 2: User Authenticated**
```javascript
// In browser console
window.fbAuth.currentUser
// Should return user object, not null
```

**Check 3: Collection Name**
```javascript
// In browser console
await window.fbAuth.currentUser
// Verify email matches Firestore user document
```

### Materials Not Showing After Rules Deployed

**Check 1: Materials Exist in Firestore**
- Go to Firebase Console → Firestore Database
- Check `learning_materials` collection
- Should have documents

**Check 2: Upload Test Material**
- Go to `/admin-materials-upload`
- Upload a test PDF
- Check Firestore for new document

**Check 3: Clear Cache and Reload**
```javascript
localStorage.removeItem('vision_materials');
location.reload();
```

## Files Modified

1. `firestore.rules` - Added `learning_materials` collection rule

## Next Steps

1. ✅ Deploy Firestore rules
2. ✅ Test material upload as admin
3. ✅ Test material viewing as student
4. ✅ Verify console shows no permission errors

---

**Status:** Rules updated, awaiting deployment
**Deploy Command:** `firebase deploy --only firestore:rules --project vision-education-main`
