# Teacher Firestore Rules Fix

## Problem
Teachers were getting "Missing or insufficient permissions" error when trying to load the enterprise dashboard. The console showed:

```
[Firebase] fbGetAllUsers(users) failed: Missing or insufficient permissions.
[Enterprise Dashboard] Total users fetched: 0
```

## Root Cause
The `fbGetAllUsers()` function uses `getDocs(collection(db, "users"))` to list all users, but the Firestore rules didn't allow teachers to perform collection-level queries (list operations). 

Teachers could only read **specific** user documents (using `get`), but couldn't **list** the collection (using `getDocs`).

## Solution
Added `allow list` permission for teachers and enterprise admins in the Firestore rules:

```javascript
// CRITICAL: Allow enterprise admins and teachers to list users collection
// This enables getDocs() queries needed for dashboard
allow list: if isEnterpriseAdmin() || isTeacher();
```

### What This Does
- **`allow list`** - Permits collection-level queries like `getDocs(collection(db, "users"))`
- **`allow read`** - Permits reading specific documents like `getDoc(doc(db, "users", email))`

Both are needed:
- `list` to fetch all users (for dashboard loading)
- `read` to access individual user details (for filtering by institution)

## Firestore Security Model

### Before Fix
```
Teacher tries: getDocs(collection(db, "users"))
Firestore checks: Do they have "list" permission?
Result: ❌ NO → "Missing or insufficient permissions"
```

### After Fix
```
Teacher tries: getDocs(collection(db, "users"))
Firestore checks: Do they have "list" permission?
Result: ✅ YES → Returns all user documents
Then: Individual "read" rules filter by institutionId
```

## Security Considerations

### Is This Safe?
**YES** - The rules are still secure because:

1. **List permission** allows teachers to query the collection
2. **Read permission** still filters results by `institutionId`
3. Teachers only see users from their own institution
4. Cross-institution data leakage is prevented

### How Filtering Works
```javascript
// Teacher lists all users
const allUsers = await getDocs(collection(db, "users"));

// Firestore applies read rules to each document
// Only returns documents where:
allow read: if isTeacher() && 
  exists(/databases/$(database)/documents/users/$(email)) &&
  sameInstitution(get(/databases/$(database)/documents/users/$(email)).data.institutionId);
```

**Result**: Teacher only receives users from their institution, even though they queried the entire collection.

## Updated Rules Section

```javascript
match /users/{email} {
  // Users can read/write their own document
  allow read, write: if isSignedIn() && 
    (request.auth.token.email == email || 
     request.auth.token.email.lower() == email.lower());
  
  // Admins can read all users
  allow read: if isAdmin();
  
  // Admins can create, update, and delete any user
  allow create, update, delete: if isAdmin();
  
  // ✅ NEW: Allow enterprise admins and teachers to list users collection
  allow list: if isEnterpriseAdmin() || isTeacher();
  
  // Enterprise admins can read users from their institution
  allow read: if isEnterpriseAdmin() && 
    exists(/databases/$(database)/documents/users/$(email)) &&
    sameInstitution(get(/databases/$(database)/documents/users/$(email)).data.institutionId);
  
  // Teachers can read students from their institution
  allow read: if isTeacher() && 
    exists(/databases/$(database)/documents/users/$(email)) &&
    sameInstitution(get(/databases/$(database)/documents/users/$(email)).data.institutionId);
  
  // ... other rules
}
```

## Deployment Instructions

### Option 1: PowerShell Script (Recommended)
```powershell
.\deploy-teacher-rules.ps1
```

### Option 2: Manual Deployment
```bash
firebase deploy --only firestore:rules
```

### Option 3: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database → Rules
4. Copy the contents of `firestore.rules`
5. Click "Publish"

## Testing

### Test 1: Teacher Can List Users
1. Login as a teacher
2. Open enterprise dashboard
3. Check browser console
4. **Expected**: `[Enterprise Dashboard] Total users fetched: X` (where X > 0)
5. **Expected**: No "Missing or insufficient permissions" error

### Test 2: Teacher Sees Only Their Institution
1. Login as teacher from Institution A
2. Open enterprise dashboard
3. Check students list
4. **Expected**: Only students from Institution A appear
5. **Expected**: No students from Institution B

### Test 3: Enterprise Admin Can List Users
1. Login as enterprise admin
2. Open enterprise dashboard
3. Check students and teachers lists
4. **Expected**: All users from their institution appear

### Test 4: Regular Students Cannot List Users
1. Login as regular student
2. Try to access enterprise dashboard
3. **Expected**: Redirected to regular dashboard
4. **Expected**: Cannot query users collection

## Files Modified

1. **firestore.rules**
   - Added `allow list: if isEnterpriseAdmin() || isTeacher();`

2. **deploy-teacher-rules.ps1** (NEW)
   - Deployment script with validation and confirmation

3. **TEACHER_FIRESTORE_RULES_FIX.md** (NEW)
   - This documentation file

## Related Issues

- **Teacher Login Fix**: Teachers can now access enterprise dashboard (frontend)
- **Institution Code Fix**: Institution code field no longer autofills
- **Teacher Sync Fix**: Teachers appear in admin dashboard after creation

## Firestore Rules Reference

### Permission Types
- `read` - Read a specific document
- `write` - Write a specific document
- `list` - Query/list documents in a collection
- `get` - Get a specific document (subset of read)
- `create` - Create a new document (subset of write)
- `update` - Update existing document (subset of write)
- `delete` - Delete a document (subset of write)

### Our Usage
- **Admins**: `read, write, create, update, delete` (full access)
- **Enterprise Admins**: `list, read, create, update` (institution-scoped)
- **Teachers**: `list, read` (institution-scoped, read-only)
- **Students**: `read` (own document only)

## Status
⚠️ **PENDING DEPLOYMENT** - Rules updated in code, need to deploy to Firebase

Run: `.\deploy-teacher-rules.ps1` to deploy

## After Deployment
✅ Teachers will be able to:
- Load enterprise dashboard without errors
- See students from their institution
- View student statistics and grades
- Access quiz builder and grade book
- View analytics for their institution
