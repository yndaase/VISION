# Deploy Enterprise Firestore Rules

## Quick Deploy

### Option 1: Firebase CLI (Recommended)

```bash
# Make sure you're in the project directory
cd /path/to/VISION

# Deploy the rules
firebase deploy --only firestore:rules
```

### Option 2: Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click on the **Rules** tab
5. Copy the contents of `firestore.rules`
6. Paste into the editor
7. Click **Publish**

## What's Included

The new Firestore rules include:

### ✅ Enterprise Student Support
- Enterprise students can read their own data
- Enterprise students can access materials from their institution
- Enterprise students can read quizzes assigned to them
- Enterprise students can view their grades
- Enterprise students can access their classes

### ✅ Data Isolation
- Materials filtered by `institutionId`
- Students only see content from their institution
- No cross-institution data access
- Public materials visible to all

### ✅ Role-Based Access Control
- **Admin**: Full access to all data
- **Enterprise Admin**: Full access to their institution's data
- **Teacher**: Read/write access to their institution's content
- **Enterprise Student**: Read access to institution-specific content
- **Regular Student**: Access to public content only

### ✅ Helper Functions
```javascript
isSignedIn()           // Check if user is authenticated
isOwner(userId)        // Check if user owns the document
isAdmin()              // Check if user is system admin
isEnterpriseAdmin()    // Check if user is institution admin
isTeacher()            // Check if user is teacher
isEnterpriseStudent()  // Check if user is enterprise student
sameInstitution(id)    // Check if user belongs to institution
hasEnterpriseRole()    // Check if user has any enterprise role
```

## Testing the Rules

### Test 1: Enterprise Student Access

```javascript
// Enterprise student should be able to read their institution's materials
match /materials/{materialId} {
  allow read: if isEnterpriseStudent() && 
                 sameInstitution(resource.data.institutionId);
}
```

**Test:**
1. Login as enterprise student
2. Try to access materials with your `institutionId`
3. Should succeed ✅
4. Try to access materials with different `institutionId`
5. Should fail ❌

### Test 2: Data Isolation

```javascript
// Students should only see their institution's content
allow read: if sameInstitution(resource.data.institutionId);
```

**Test:**
1. Create materials with `institutionId: "SCHOOL001"`
2. Login as student from `SCHOOL001`
3. Should see materials ✅
4. Login as student from `SCHOOL002`
5. Should NOT see materials ❌

### Test 3: Public Materials

```javascript
// Anyone authenticated can read public materials
allow read: if isSignedIn() && !('institutionId' in resource.data);
```

**Test:**
1. Create materials without `institutionId` field
2. Login as any authenticated user
3. Should see materials ✅

## Verification Checklist

After deploying, verify:

- [ ] Enterprise students can login
- [ ] Enterprise students see their dashboard
- [ ] Materials are filtered by institution
- [ ] Students cannot access other institutions' data
- [ ] Teachers can upload materials
- [ ] Enterprise admins can manage their institution
- [ ] Regular students still have access to public content

## Troubleshooting

### Issue: Permission Denied

**Symptom**: `FirebaseError: Missing or insufficient permissions`

**Solutions**:
1. Check if user has correct role in Firestore
2. Verify `institutionId` matches between user and resource
3. Ensure user is authenticated
4. Check if resource has required fields

### Issue: Enterprise Student Can't See Materials

**Symptom**: Materials section is empty

**Solutions**:
1. Verify materials have `institutionId` field
2. Check if `institutionId` matches user's institution
3. Ensure materials collection exists in Firestore
4. Verify user role is `enterprise-student`

### Issue: Cross-Institution Access

**Symptom**: Students see materials from other institutions

**Solutions**:
1. Verify `sameInstitution()` function is working
2. Check if materials have correct `institutionId`
3. Ensure rules are deployed correctly
4. Test with Firebase Rules Playground

## Firebase Rules Playground

Test your rules before deploying:

1. Go to Firebase Console → Firestore → Rules
2. Click **Rules Playground**
3. Select operation (read/write)
4. Choose collection and document
5. Set authentication state
6. Run simulation

**Example Test:**
```
Operation: get
Path: /materials/test-material-123
Auth: Authenticated as enterprise-student@school.edu
Custom Claims: { "institutionId": "SCHOOL001" }
```

## Security Best Practices

### ✅ DO:
- Always check authentication
- Validate institution membership
- Use helper functions for consistency
- Test rules before deploying
- Monitor security logs

### ❌ DON'T:
- Allow unauthenticated access
- Skip institution validation
- Use `allow read, write: if true`
- Deploy untested rules
- Ignore security warnings

## Rollback Plan

If issues occur after deployment:

### Quick Rollback

```bash
# Revert to previous rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

### Manual Rollback

1. Go to Firebase Console
2. Navigate to Firestore → Rules
3. Click on **History** tab
4. Select previous version
5. Click **Restore**

## Monitoring

After deployment, monitor:

### Firebase Console
- Go to Firestore → Usage
- Check for permission denied errors
- Monitor read/write operations
- Review security logs

### Application Logs
```javascript
// In browser console
console.log('[Firestore] Read attempt:', {
  collection: 'materials',
  institutionId: session.institutionId,
  role: session.role
});
```

## Support

### For Issues:
- Check Firebase Console logs
- Review browser console errors
- Test with Rules Playground
- Contact: tech@visionedu.online

### For Questions:
- Read Firestore documentation
- Check Firebase community
- Review this deployment guide

---

**Last Updated**: May 2026
**Version**: 2.0.0 (Enterprise Support)
**Status**: Production Ready
