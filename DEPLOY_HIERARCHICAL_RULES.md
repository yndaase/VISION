# Deploy Updated Firestore Rules for Hierarchical User Creation

## What Changed

The Firestore rules have been updated to support the hierarchical user creation system:

### New Permissions Added:

1. **System Admins:**
   - ✅ Can create any user (including enterprise admins)
   - ✅ Can update any user
   - ✅ Can delete any user

2. **Enterprise Admins:**
   - ✅ Can create teachers for their institution
   - ✅ Can create students (enterprise-student role) for their institution
   - ✅ Can update users from their institution
   - ✅ Can read users from their institution

3. **Security Enforced:**
   - ✅ Enterprise admins can ONLY create users with their own institutionId
   - ✅ Enterprise admins can ONLY create teachers or enterprise-students (not other admins)
   - ✅ All users are automatically isolated by institution

## Deployment Methods

### Method 1: Firebase Console (Recommended for Quick Deploy)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vision-education-main**
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab at the top
5. Copy the entire content from `firestore.rules` file
6. Paste it into the Firebase Console editor
7. Click **Publish** button
8. Wait for confirmation message

### Method 2: Firebase CLI (Recommended for Production)

#### Prerequisites:
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login
```

#### Deploy Rules:
```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Or deploy everything (rules + functions + hosting)
firebase deploy
```

#### Verify Deployment:
```bash
# Check deployment status
firebase deploy --only firestore:rules --dry-run
```

### Method 3: PowerShell Script (Windows)

A PowerShell script is provided for easy deployment:

```powershell
# Run the deployment script
.\deploy-hierarchical-rules.ps1
```

## Updated Rules Summary

### Before (Old Rules):
```javascript
// Admins can update any user
allow update: if isAdmin();
```

### After (New Rules):
```javascript
// Admins can create, update, and delete any user
allow create, update, delete: if isAdmin();

// Enterprise admins can create users for their institution
allow create: if isEnterpriseAdmin() && 
  request.resource.data.institutionId == getUserInstitutionId() &&
  (request.resource.data.role == 'teacher' || request.resource.data.role == 'enterprise-student');

// Enterprise admins can update users from their institution
allow update: if isEnterpriseAdmin() && 
  exists(/databases/$(database)/documents/users/$(email)) &&
  sameInstitution(get(/databases/$(database)/documents/users/$(email)).data.institutionId);
```

## Security Features

### 1. Institution Isolation
Enterprise admins can ONLY create users with their own `institutionId`:
```javascript
request.resource.data.institutionId == getUserInstitutionId()
```

### 2. Role Restrictions
Enterprise admins can ONLY create teachers or students (not other admins):
```javascript
(request.resource.data.role == 'teacher' || request.resource.data.role == 'enterprise-student')
```

### 3. Update Restrictions
Enterprise admins can ONLY update users from their own institution:
```javascript
sameInstitution(get(/databases/$(database)/documents/users/$(email)).data.institutionId)
```

## Testing After Deployment

### Test 1: System Admin Creates Enterprise Account
```javascript
// Should succeed
{
  email: "school@example.com",
  role: "enterprise",
  institutionId: "school@example.com",
  // ... other fields
}
```

### Test 2: Enterprise Admin Creates Teacher
```javascript
// Should succeed (if institutionId matches admin's institution)
{
  email: "teacher@example.com",
  role: "teacher",
  institutionId: "school@example.com",
  // ... other fields
}
```

### Test 3: Enterprise Admin Creates Student
```javascript
// Should succeed (if institutionId matches admin's institution)
{
  email: "student@example.com",
  role: "enterprise-student",
  institutionId: "school@example.com",
  // ... other fields
}
```

### Test 4: Enterprise Admin Creates Another Admin
```javascript
// Should FAIL (enterprise admins cannot create other admins)
{
  email: "another-admin@example.com",
  role: "enterprise",
  institutionId: "school@example.com",
  // ... other fields
}
```

### Test 5: Enterprise Admin Creates User for Different Institution
```javascript
// Should FAIL (institutionId doesn't match)
{
  email: "student@example.com",
  role: "enterprise-student",
  institutionId: "different-school@example.com", // ❌ Wrong institution
  // ... other fields
}
```

## Verification Steps

After deploying the rules, verify they're working:

1. **Login as System Admin:**
   - Create an enterprise account
   - Verify it appears in Firestore
   - Check console for any errors

2. **Login as Enterprise Admin:**
   - Create a teacher account
   - Create a student account
   - Verify both appear in Firestore
   - Check they have correct institutionId

3. **Check Firestore Console:**
   - Go to Firestore Database
   - Navigate to `users` collection
   - Verify new users have correct structure:
     - `email`
     - `emailLower`
     - `role`
     - `institutionId`
     - `schoolCode`
     - `lastUpdated`

4. **Test Security:**
   - Try to create a user with wrong institutionId (should fail)
   - Try to create an admin as enterprise admin (should fail)
   - Try to read users from different institution (should fail)

## Troubleshooting

### Issue: "Missing or insufficient permissions"
**Cause:** Rules not deployed or Firebase Auth not signed in

**Solution:**
1. Verify rules are deployed in Firebase Console
2. Check that admin is signed into Firebase Auth
3. Logout and login again to refresh auth token

### Issue: "Permission denied" when creating user
**Cause:** institutionId mismatch or wrong role

**Solution:**
1. Check that institutionId matches admin's institution
2. Verify role is either 'teacher' or 'enterprise-student'
3. Check console logs for detailed error message

### Issue: Rules deployment fails
**Cause:** Syntax error in rules file

**Solution:**
1. Copy rules from `firestore.rules` file exactly
2. Check for any syntax errors
3. Use Firebase CLI to validate: `firebase deploy --only firestore:rules --dry-run`

## Rollback Plan

If issues occur after deployment, you can rollback to previous rules:

### Via Firebase Console:
1. Go to Firestore Database → Rules
2. Click "View History" at the top
3. Select previous version
4. Click "Restore"

### Via Firebase CLI:
```bash
# View deployment history
firebase firestore:rules:list

# Rollback to specific version
firebase firestore:rules:release <version-id>
```

## Next Steps After Deployment

1. ✅ Test system admin creating enterprise account
2. ✅ Test enterprise admin creating teacher
3. ✅ Test enterprise admin creating student
4. ✅ Verify institution isolation
5. ✅ Test with multiple institutions
6. ✅ Monitor Firestore usage and performance

## Summary

**IMPORTANT:** You MUST deploy the updated Firestore rules for the hierarchical user creation system to work properly!

The new rules enable:
- ✅ System admins to create enterprise accounts
- ✅ Enterprise admins to create teachers and students
- ✅ Automatic institution isolation
- ✅ Role-based access control
- ✅ Secure user creation workflow

**Deploy now using one of the methods above!** 🚀
