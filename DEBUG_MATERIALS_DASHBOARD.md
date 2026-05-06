# Debug Materials Not Showing on Student Dashboard

## Quick Diagnostic

Open the student dashboard and run this in the browser console (F12):

```javascript
// === MATERIALS DASHBOARD DIAGNOSTIC ===
console.log('=== MATERIALS DASHBOARD DIAGNOSTIC ===\n');

// 1. Check if Firebase Auth is initialized
console.log('1. Firebase Auth Status:');
console.log('   - Auth object exists:', typeof window.fbAuth !== 'undefined');
console.log('   - Current user:', window.fbAuth?.currentUser?.email || 'NOT SIGNED IN ❌');
console.log('');

// 2. Check if functions exist
console.log('2. Function Availability:');
console.log('   - syncMaterials:', typeof syncMaterials);
console.log('   - getMaterials:', typeof getMaterials);
console.log('   - renderDashMaterials:', typeof renderDashMaterials);
console.log('   - fbGetMaterials:', typeof window.fbGetMaterials);
console.log('');

// 3. Check localStorage cache
console.log('3. LocalStorage Cache:');
const cached = localStorage.getItem('vision_materials');
if (cached) {
    const materials = JSON.parse(cached);
    console.log('   ✅ Found', materials.length, 'materials in cache');
    if (materials.length > 0) {
        console.log('   First material:', materials[0]);
    }
} else {
    console.log('   ❌ No materials in cache');
}
console.log('');

// 4. Check session
console.log('4. Session Status:');
const sessionStr = sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session');
if (sessionStr) {
    const session = JSON.parse(sessionStr);
    console.log('   ✅ Session found');
    console.log('   - Email:', session.email);
    console.log('   - Name:', session.name);
    console.log('   - Role:', session.role);
} else {
    console.log('   ❌ No session found');
}
console.log('');

// 5. Try to fetch from Firestore
console.log('5. Fetching from Firestore...');
if (typeof window.fbGetMaterials === 'function') {
    window.fbGetMaterials().then(materials => {
        console.log('   Result:', materials.length, 'materials');
        if (materials.length > 0) {
            console.log('   ✅ Firestore has materials');
            console.log('   First material:', materials[0]);
        } else {
            console.log('   ⚠️ Firestore returned empty array');
        }
    }).catch(err => {
        console.log('   ❌ Firestore error:', err.message);
    });
} else {
    console.log('   ❌ fbGetMaterials function not available');
}
console.log('');

// 6. Check materials container
console.log('6. DOM Elements:');
const container = document.getElementById('materialsContainer');
console.log('   - materialsContainer exists:', !!container);
if (container) {
    console.log('   - Container HTML length:', container.innerHTML.length);
    console.log('   - Contains "No Mission Assets":', container.innerHTML.includes('No Mission Assets'));
}
console.log('');

console.log('=== DIAGNOSTIC COMPLETE ===');
console.log('\nNext: Share the output above');
```

## Common Issues & Solutions

### Issue 1: "Current user: NOT SIGNED IN ❌"

**Cause:** Student is not signed into Firebase Auth

**Solution:** Students need to sign in with Firebase Auth, not just the local session.

**Fix Required:**
1. Update login flow to sign into Firebase Auth
2. Or remove Firebase Auth requirement from Firestore rules

**Quick Test:**
```javascript
// Sign in as student
await window.fbSignIn('student@example.com', 'password123');
// Then reload dashboard
```

### Issue 2: "No materials in cache"

**Cause:** Materials never synced from Firestore

**Solution:** Check if sync is running:
```javascript
// Manually trigger sync
await window.syncMaterials();
// Check cache again
const materials = JSON.parse(localStorage.getItem('vision_materials'));
console.log('Materials:', materials);
```

### Issue 3: "Firestore error: Missing or insufficient permissions"

**Cause:** Firestore rules require authentication

**Current Rule:**
```javascript
match /learning_materials/{materialId} {
  allow read: if isSignedIn();  // ← Requires Firebase Auth
  allow create, update, delete: if isAdmin();
}
```

**Solution A: Allow Public Read (Recommended for Students)**
```javascript
match /learning_materials/{materialId} {
  allow read: if true;  // ← Anyone can read
  allow create, update, delete: if isAdmin();
}
```

**Solution B: Sign Students into Firebase Auth**
- Update login.html to call `fbSignIn()`
- Store Firebase Auth token
- Use token for Firestore access

### Issue 4: "fbGetMaterials function not available"

**Cause:** firebase.js not loaded

**Solution:** Check if firebase.js is included in dashboard.html:
```html
<script type="module" src="firebase.js"></script>
```

### Issue 5: Materials uploaded but not in Firestore

**Cause:** Upload succeeded to R2 but failed to save metadata

**Solution:** Check admin console when uploading:
```
[Upload] ✅ File uploaded successfully to R2
[Firebase] ✅ Material saved to Firestore: Test Material  ← Should see this
```

If you don't see the second line, admin is not authenticated.

## Most Likely Issue

Based on the context, the issue is **#1 or #3**:

**Students are not signed into Firebase Auth**, so Firestore rules block them from reading materials.

## Recommended Fix

### Option A: Make Materials Public (Easiest)

1. Go to Firebase Console → Firestore → Rules
2. Find this section:
```javascript
match /learning_materials/{materialId} {
  allow read: if isSignedIn();
  allow create, update, delete: if isAdmin();
}
```

3. Change to:
```javascript
match /learning_materials/{materialId} {
  allow read: if true;  // Public read access
  allow create, update, delete: if isAdmin();
}
```

4. Click "Publish"

**Why this works:**
- Students don't need Firebase Auth to view materials
- Only admins need auth to upload/delete
- Materials are educational content, safe to be public

### Option B: Sign Students into Firebase Auth

This requires code changes to the login flow. Let me know if you want to go this route.

## Testing After Fix

1. Deploy Firestore rules (Option A)
2. Open student dashboard
3. Run diagnostic script above
4. Should see:
```
✅ Found X materials in cache
✅ Firestore has materials
```

## Next Steps

1. Run the diagnostic script
2. Share the output
3. I'll tell you exactly what's wrong
4. We'll fix it together

---

**Most Likely Fix:** Change Firestore rules to allow public read access for learning_materials collection.
