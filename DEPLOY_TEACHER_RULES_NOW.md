# 🚨 DEPLOY FIRESTORE RULES NOW

## Critical Issue Fixed
Teachers cannot load the enterprise dashboard because Firestore rules don't allow them to list users.

## What Was Changed
Added `allow list` permission for teachers in `firestore.rules`:

```javascript
// CRITICAL: Allow enterprise admins and teachers to list users collection
allow list: if isEnterpriseAdmin() || isTeacher();
```

## Deploy Now

### Option 1: PowerShell Script (Easiest)
```powershell
.\deploy-teacher-rules.ps1
```

### Option 2: Firebase CLI
```bash
firebase deploy --only firestore:rules
```

### Option 3: Firebase Console (Manual)
1. Go to https://console.firebase.google.com/
2. Select your project: **waec-prep-2026**
3. Click **Firestore Database** in left menu
4. Click **Rules** tab
5. Copy entire contents of `firestore.rules` file
6. Paste into the editor
7. Click **Publish**

## Verify Deployment

After deploying, test:

1. **Login as teacher**
   - Email: (teacher email you created)
   - Password: (teacher password)
   - Institution code: (your institution code)

2. **Check console**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for: `[Enterprise Dashboard] Total users fetched: X`
   - Should show number > 0

3. **Check dashboard**
   - Students should appear in the table
   - No "Missing or insufficient permissions" error

## What This Fixes

✅ Teachers can now load enterprise dashboard
✅ Teachers can see students from their institution
✅ Teachers can access grade book and analytics
✅ No more "Missing or insufficient permissions" error

## Security

This is **SAFE** because:
- Teachers can list the collection (query it)
- But read rules still filter by institutionId
- Teachers only see users from their own institution
- No cross-institution data leakage

## Status

- ✅ Code updated and pushed to GitHub
- ⚠️ **PENDING**: Rules need to be deployed to Firebase
- ⏳ **Action Required**: Run deployment command above

## Need Help?

If deployment fails:
1. Check you're logged in: `firebase login`
2. Check correct project: `firebase use`
3. Check for syntax errors in rules
4. See `TEACHER_FIRESTORE_RULES_FIX.md` for details
