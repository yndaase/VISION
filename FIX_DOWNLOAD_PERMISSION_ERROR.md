# Fix Download Permission Error

## Error Message

```json
{"error":"7 PERMISSION_DENIED: Permission denied on resource project vision-education-8a794."}
```

## Root Cause

The `FIREBASE_SERVICE_ACCOUNT` environment variable in Vercel is pointing to the **wrong Firebase project**:

- ❌ Currently using: `vision-education-8a794` (Vision AI project)
- ✅ Should be using: `vision-education-main` (Main site project)

## The Fix

Update the `FIREBASE_SERVICE_ACCOUNT` environment variable in Vercel to use the correct Firebase project credentials.

### Step 1: Get Correct Service Account Key (5 minutes)

1. **Go to Firebase Console**
   - https://console.firebase.google.com/
   - Select project: **vision-education-main** (NOT vision-education-8a794)

2. **Navigate to Service Accounts**
   - Click ⚙️ (Settings icon) → Project settings
   - Click "Service accounts" tab
   - Click "Generate new private key" button
   - Click "Generate key" in the popup
   - A JSON file will download (e.g., `vision-education-main-xxxxx.json`)

3. **Open the JSON file**
   - Open with any text editor
   - Copy the ENTIRE contents
   - Should look like:
   ```json
   {
     "type": "service_account",
     "project_id": "vision-education-main",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "firebase-adminsdk-xxxxx@vision-education-main.iam.gserviceaccount.com",
     ...
   }
   ```

4. **Verify project_id**
   - Make sure `"project_id": "vision-education-main"`
   - NOT `"vision-education-8a794"`

### Step 2: Update Vercel Environment Variable (2 minutes)

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Select your project: **VISION**

2. **Navigate to Environment Variables**
   - Click "Settings" tab
   - Click "Environment Variables" in left sidebar

3. **Find FIREBASE_SERVICE_ACCOUNT**
   - Look for the variable named `FIREBASE_SERVICE_ACCOUNT`
   - Click the "..." menu → "Edit"

4. **Replace the value**
   - Delete the old JSON
   - Paste the NEW JSON from Step 1
   - Make sure it's the complete JSON (starts with `{` and ends with `}`)
   - Click "Save"

5. **Redeploy**
   - Go to "Deployments" tab
   - Click "..." on the latest deployment
   - Click "Redeploy"
   - Wait ~2 minutes for deployment to complete

### Step 3: Test Download (1 minute)

1. **Refresh student dashboard**
2. **Click on a material to download**
3. **Should download successfully!** ✅

## Alternative: Check Current Environment Variable

If you want to verify which project is currently configured:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Find `FIREBASE_SERVICE_ACCOUNT`
3. Click "..." → "Edit"
4. Look for `"project_id"` in the JSON
5. Should be `"vision-education-main"`, not `"vision-education-8a794"`

## Why This Happened

You likely have two Firebase projects:
1. **vision-education-main** - Main site (students, materials, WAEC)
2. **vision-education-8a794** - Vision AI (separate project)

The Vercel environment variable was set to Vision AI's credentials instead of the main site's credentials.

## Security Note

**Keep the service account key secure!**
- Don't commit it to Git
- Don't share it publicly
- Only store it in Vercel environment variables
- Regenerate if compromised

## Verification Checklist

After updating:

- [ ] Service account JSON downloaded from **vision-education-main**
- [ ] JSON contains `"project_id": "vision-education-main"`
- [ ] Environment variable updated in Vercel
- [ ] Deployment completed successfully
- [ ] Material download works on student dashboard

## Troubleshooting

### Issue: Still getting permission error after update

**Solution 1: Clear deployment cache**
1. Vercel Dashboard → Settings → General
2. Scroll to "Deployment Protection"
3. Click "Clear Cache"
4. Redeploy

**Solution 2: Verify environment variable**
1. Check that the JSON is complete (no truncation)
2. Check that there are no extra quotes or escaping
3. Should be raw JSON, not a string

### Issue: Can't find FIREBASE_SERVICE_ACCOUNT variable

**Solution:** Create it
1. Vercel Dashboard → Settings → Environment Variables
2. Click "Add New"
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: Paste the complete JSON
5. Environment: Production, Preview, Development (select all)
6. Click "Save"

### Issue: Download still fails with different error

**Solution:** Check Firestore rules are deployed
- Follow `DEPLOY_RULES_NOW.md` to deploy rules
- Make sure `learning_materials` has `allow read: if true`

## Summary

**Problem:** Wrong Firebase project credentials in Vercel

**Solution:** Update `FIREBASE_SERVICE_ACCOUNT` to use vision-education-main credentials

**Time Required:** ~10 minutes

**Impact:** Downloads will work immediately after redeployment

---

**Status:** Waiting for environment variable update
**Next Step:** Get service account key from vision-education-main
**Expected Result:** Downloads work perfectly ✅
