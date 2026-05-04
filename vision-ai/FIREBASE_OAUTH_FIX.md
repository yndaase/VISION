# 🔥 Firebase OAuth Client ID Fix - CRITICAL

## The Error

```
Firebase: Invalid Idp Response: the Google id_token is not allowed to be used with this application. 
Its audience (OAuth 2.0 client ID) is 378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com, 
which is not authorized to be used in the project with project_number: 324420775871.
```

## What This Means

Your Google OAuth Client ID (`378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s`) is **NOT registered** in your Firebase project. Firebase is rejecting the Google sign-in because it doesn't recognize this OAuth client.

## The Fix (5 Minutes)

### Step 1: Get Your Google Client Secret

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Find the OAuth 2.0 Client ID: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s`
3. Click on it to open details
4. You'll see:
   - **Client ID**: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com`
   - **Client secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx` ← **Copy this!**

### Step 2: Add OAuth Client to Firebase

1. Go to: **https://console.firebase.google.com/project/vision-education-8a794/authentication/providers**
2. Find **Google** in the list of providers
3. Click on **Google** to open settings
4. You'll see a form with these fields:

   **Web SDK configuration:**
   - ☐ Enable (should already be checked)
   - **Web client ID**: (empty or has a different ID)
   - **Web client secret**: (empty or has a different secret)

5. Fill in:
   - **Web client ID**: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com`
   - **Web client secret**: (paste the secret you copied from Google Cloud Console)

6. Click **Save**

### Step 3: Verify Firebase Configuration

After saving, Firebase should show:
- ✅ Google provider: **Enabled**
- ✅ Web client ID: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com`
- ✅ Web client secret: `GOCSPX-xxxxx` (hidden)

### Step 4: Test Again

1. Wait **2 minutes** for Firebase to update
2. Go to: **https://ai.visionedu.online/login**
3. Clear browser cache (Ctrl+Shift+Delete)
4. Click **"Continue with Google"**
5. Sign in

## What You Should See

### Before Fix:
```
❌ Firebase: Invalid Idp Response: the Google id_token is not allowed...
```

### After Fix:
```
✅ [Firebase] Google Auth successful and persisted: your@email.com
✅ [Login] Firebase Auth successful: your@email.com
```

## Why This Happened

Firebase has its own OAuth client ID by default. When you use Google Sign-In with a custom OAuth client ID (like yours: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s`), you need to explicitly register it in Firebase.

## Alternative: Use Firebase's Default OAuth Client

If you can't find the client secret or don't want to configure it, you can use Firebase's built-in OAuth client:

1. In Firebase Console → Google provider settings
2. Look for **"Use Firebase's OAuth client"** or similar option
3. Enable it
4. Copy the **Client ID** that Firebase provides
5. Update `login.js` to use that Client ID instead

But the **recommended approach** is to register your existing OAuth client in Firebase (Step 2 above).

## Screenshots Guide

### 1. Google Cloud Console - Get Client Secret

```
Google Cloud Console → APIs & Services → Credentials
→ OAuth 2.0 Client IDs
→ Click: 378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s
→ Copy: Client secret (GOCSPX-xxxxx)
```

### 2. Firebase Console - Add OAuth Client

```
Firebase Console → Authentication → Sign-in method
→ Google → Click to edit
→ Web SDK configuration:
   - Web client ID: 378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com
   - Web client secret: GOCSPX-xxxxx (paste here)
→ Save
```

## Common Issues

### Issue: "Can't find Web client ID field"

**Solution**: Make sure you're editing the **Google** provider (not Email/Password). The field should be under "Web SDK configuration" section.

### Issue: "Client secret is invalid"

**Solution**: Make sure you copied the entire secret from Google Cloud Console. It should start with `GOCSPX-`.

### Issue: "Still getting the same error"

**Solution**: 
1. Wait 2-3 minutes for Firebase to update
2. Clear browser cache completely
3. Try in incognito mode

## Next Steps

1. **Get client secret** from Google Cloud Console
2. **Add to Firebase** Authentication → Google provider
3. **Wait 2 minutes** for changes to propagate
4. **Test login** at https://ai.visionedu.online/login

---

**This is the ONLY thing blocking your Firebase Auth from working!** Once you add the OAuth client ID to Firebase, everything will work perfectly.
