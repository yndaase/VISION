# Complete Materials Setup Checklist

## Current Status

✅ **Completed:**
- Firebase Auth timeout errors fixed
- Materials sync functions created (syncMaterials, getMaterials)
- R2 CORS configured
- Upload code fixed (uses 'url' field)
- Delete code fixed (checks both url and blobUrl)
- Code deployed to production

❌ **Pending:**
- Firestore rules deployment
- Test material upload
- Verify materials show on student dashboard

## Critical Issue

**Materials are not showing because Firestore rules haven't been deployed.**

The error "No materials found in Firestore" means students can't read from the `learning_materials` collection.

## Step-by-Step Fix

### Step 1: Deploy Firestore Rules (CRITICAL - 2 minutes)

1. Go to https://console.firebase.google.com/
2. Select project: **vision-education-main**
3. Click **Firestore Database** in left sidebar
4. Click **Rules** tab at the top
5. Find this section (around line 50):

```javascript
// Materials collection (metadata only - files in R2)
match /materials/{materialId} {
  allow read: if isSignedIn();
  allow create, update, delete: if isAdmin();
}
```

6. **Add this RIGHT AFTER it:**

```javascript
// Learning Materials collection (metadata only - files in R2)
match /learning_materials/{materialId} {
  allow read: if isSignedIn();
  allow create, update, delete: if isAdmin();
}
```

7. Click **Publish** button (top right)
8. Wait for "Rules published successfully" message

### Step 2: Verify Rules Deployed

1. Stay on the Rules tab
2. Check "Last deployed" timestamp - should be recent
3. Search for "learning_materials" in the rules editor
4. Should see the rule you just added

### Step 3: Upload Test Material

1. Go to `/admin-materials-upload`
2. Select a PDF file (any size up to 50MB)
3. Fill in form:
   - Subject: Core Mathematics
   - Material Type: PDF
   - Title: Test Material
   - Description: Testing upload
4. Click "Upload to Cloudflare R2"
5. Should see "Upload complete!" message

### Step 4: Verify Material in Firestore

1. Go to Firebase Console → Firestore Database
2. Click **Data** tab
3. Look for `learning_materials` collection
4. Should see a document with your material
5. Check the document has these fields:
   - id
   - title
   - subject
   - type
   - url (R2 key)
   - uploadedAt

### Step 5: Test Student Dashboard

1. Log into student dashboard
2. Go to "Learner Materials" section
3. Should see the material you uploaded
4. Click on material - should download

### Step 6: Run Debug Test

Open browser console on student dashboard and run:

```javascript
// Test 1: Check authentication
console.log('Auth user:', window.fbAuth.currentUser?.email);

// Test 2: Fetch materials
const materials = await window.fbGetMaterials();
console.log('Materials found:', materials.length);
console.log('First material:', materials[0]);

// Test 3: Check localStorage
const cached = JSON.parse(localStorage.getItem('vision_materials'));
console.log('Cached materials:', cached?.length);

// Test 4: Full sync test
await window.testMaterialsSync();
```

**Expected output:**
```
Auth user: your-email@gmail.com
Materials found: 1
First material: {id: "...", title: "Test Material", ...}
Cached materials: 1
=== MATERIALS SYNC TEST ===
✅ Found 1 materials in Firestore
✅ Synced 1 materials
```

## Common Issues & Solutions

### Issue 1: "Missing or insufficient permissions"

**Cause:** Firestore rules not deployed
**Solution:** Deploy rules (Step 1 above)

### Issue 2: "No materials found in Firestore"

**Cause:** Either rules not deployed OR no materials uploaded
**Solution:** 
1. Deploy rules first
2. Upload a test material
3. Check Firestore Data tab to verify material exists

### Issue 3: Materials uploaded but not showing

**Cause:** Old materials might have wrong field names
**Solution:**
1. Delete old materials from Firestore
2. Upload new materials (will use correct 'url' field)

### Issue 4: Upload fails with CORS error

**Cause:** R2 CORS not configured
**Solution:** Already done - CORS is configured

### Issue 5: Upload fails with "413 Content Too Large"

**Cause:** File larger than 4.5MB going through API
**Solution:** Already fixed - now uses direct R2 upload with CORS

## Architecture Overview

### Upload Flow
```
1. Admin selects file on /admin-materials-upload
2. Browser requests pre-signed URL from /api/upload
3. API generates pre-signed URL for R2
4. Browser uploads file directly to R2 (CORS allows this)
5. Browser calls window.fbSaveMaterial()
6. Material metadata saved to Firestore
7. Success message shown
```

### Student View Flow
```
1. Student loads dashboard
2. syncMaterials() called automatically
3. Fetches materials from Firestore
4. Saves to localStorage cache
5. renderDashMaterials() displays materials
6. Student clicks material
7. Downloads via /api/upload?action=download
8. API generates pre-signed download URL
9. Browser downloads from R2
```

### Delete Flow
```
1. Admin clicks delete on material
2. Browser calls window.fbDeleteMaterial(id)
3. API fetches material from Firestore
4. API deletes file from R2 using material.url
5. API deletes document from Firestore
6. Success message shown
```

## Files Modified

1. **firebase.js** - Added syncMaterials(), getMaterials(), testMaterialsSync()
2. **admin-materials-upload.js** - Fixed to use 'url' field
3. **api/upload.js** - Fixed delete to check both url and blobUrl
4. **dashboard.js** - Improved materials sync logging
5. **firestore.rules** - Added learning_materials collection rule
6. **vercel.json** - Increased function memory to 3008MB

## Environment Variables Required

```
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=vision-edu-materials
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## Next Steps After Rules Deployed

1. ✅ Upload test material
2. ✅ Verify in Firestore
3. ✅ Check student dashboard
4. ✅ Test download
5. ✅ Test delete
6. ✅ Upload real materials

## Support

If materials still don't show after deploying rules:

1. Share the output of `await window.testMaterialsSync()`
2. Share screenshot of Firestore Rules tab
3. Share screenshot of Firestore Data tab (learning_materials collection)
4. Share any console errors

---

**Status:** Waiting for Firestore rules deployment
**Critical Action:** Deploy Firestore rules (Step 1)
**Time Required:** 2 minutes
**Impact:** Enables all materials functionality
