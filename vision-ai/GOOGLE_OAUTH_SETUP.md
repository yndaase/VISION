# 🔐 Google OAuth Setup for Vision AI

## Issue: "Continue with Google" Not Working

The Google Sign-In button isn't working because `ai.visionedu.online` needs to be added to your Google OAuth authorized domains.

---

## ✅ Fix: Add Domain to Google Cloud Console

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account
3. Select your project (the one with Vision Education)

### Step 2: Navigate to Credentials

1. Click on **☰** (hamburger menu) → **APIs & Services** → **Credentials**
2. Or direct link: https://console.cloud.google.com/apis/credentials

### Step 3: Find Your OAuth Client

1. Look for **OAuth 2.0 Client IDs** section
2. Find the client with ID: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s`
3. Click on it to edit

### Step 4: Add Authorized JavaScript Origins

In the **Authorized JavaScript origins** section, add:

```
https://ai.visionedu.online
```

**Also add your Vercel URL:**
```
https://vision-ai-[your-id].vercel.app
```

### Step 5: Add Authorized Redirect URIs

In the **Authorized redirect URIs** section, add:

```
https://ai.visionedu.online/login
https://ai.visionedu.online/chat
https://ai.visionedu.online
```

**Also add Vercel URLs:**
```
https://vision-ai-[your-id].vercel.app/login
https://vision-ai-[your-id].vercel.app/chat
https://vision-ai-[your-id].vercel.app
```

### Step 6: Save Changes

1. Click **Save** at the bottom
2. Wait 5-10 minutes for changes to propagate

---

## 🧪 Test Google Sign-In

After saving:

1. Visit: https://ai.visionedu.online/login
2. Click **"Continue with Google"**
3. Should now show Google account selection popup
4. Select your account
5. Should redirect to chat interface

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause:** The redirect URI isn't in the authorized list

**Solution:**
1. Check the error message for the exact URI
2. Add that exact URI to authorized redirect URIs
3. Make sure there are no trailing slashes

### Error: "origin_mismatch"

**Cause:** The origin domain isn't in the authorized list

**Solution:**
1. Add `https://ai.visionedu.online` to authorized JavaScript origins
2. Make sure it's HTTPS (not HTTP)
3. No trailing slash

### Google Sign-In Button Not Appearing

**Cause:** Google Sign-In library not loading

**Solution:**
1. Check browser console for errors
2. Verify internet connection
3. Check if `https://accounts.google.com/gsi/client` is accessible

### Still Not Working After 10 Minutes

**Cause:** Browser cache or Google cache

**Solution:**
1. Clear browser cache
2. Try incognito/private mode
3. Try different browser
4. Wait up to 1 hour for Google's cache to clear

---

## 📋 Current Configuration

**Google Client ID:**
```
378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com
```

**Required Authorized JavaScript Origins:**
- `https://ai.visionedu.online`
- `https://vision-ai-[your-id].vercel.app`

**Required Authorized Redirect URIs:**
- `https://ai.visionedu.online/login`
- `https://ai.visionedu.online/chat`
- `https://ai.visionedu.online`
- `https://vision-ai-[your-id].vercel.app/login`
- `https://vision-ai-[your-id].vercel.app/chat`
- `https://vision-ai-[your-id].vercel.app`

---

## 🔄 Alternative: Use Email/Password Login

While waiting for Google OAuth to be configured, users can:

1. Use **Email/Password** login instead
2. Enter email and password
3. Click **"Sign In to Vision AI"**

This will work immediately without Google OAuth configuration.

---

## 📞 Need Help?

### Google Cloud Console
- https://console.cloud.google.com/

### OAuth 2.0 Documentation
- https://developers.google.com/identity/protocols/oauth2

### Common Issues
- https://developers.google.com/identity/sign-in/web/troubleshooting

---

## ✅ Quick Checklist

Before testing:
- [ ] Added `https://ai.visionedu.online` to authorized JavaScript origins
- [ ] Added redirect URIs for `/login`, `/chat`, and root
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 5-10 minutes for propagation
- [ ] Cleared browser cache
- [ ] Tested in incognito mode

---

**Status:** ⏳ Waiting for Google OAuth configuration  
**Time Required:** 5-10 minutes after adding domains  
**Alternative:** Use email/password login
