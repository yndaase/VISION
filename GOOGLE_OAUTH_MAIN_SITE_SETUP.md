# Google OAuth Setup for Main Site

## 🔴 Critical Issue

Your main site (`visionedu.online`) is using the **Vision AI** Google OAuth Client ID, which belongs to a different Firebase project. This causes authentication to fail.

**Error:**
```
Firebase: Invalid Idp Response: the Google id_token is not allowed to be used with this application.
Its audience (OAuth 2.0 client ID) is 378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com,
which is not authorized to be used in the project with project_number: 1085532052475.
```

---

## 🔧 Fix: Create New OAuth Client ID

### **Step 1: Create OAuth Client ID in Google Cloud**

1. **Go to Google Cloud Console:**
   - URL: https://console.cloud.google.com/apis/credentials?project=vision-education-main

2. **Click "+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**

3. **Configure the OAuth client:**
   - **Application type:** Web application
   - **Name:** `Vision Education Main Site`
   
4. **Authorized JavaScript origins** (add all 3):
   ```
   https://visionedu.online
   https://www.visionedu.online
   http://localhost
   ```

5. **Authorized redirect URIs** (add all 3):
   ```
   https://visionedu.online
   https://www.visionedu.online
   http://localhost
   ```

6. **Click "CREATE"**

7. **Copy the Client ID** - It will look like:
   ```
   1085532052475-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```
   
8. **Copy the Client Secret** - It will look like:
   ```
   GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

### **Step 2: Configure Firebase Authentication**

1. **Go to Firebase Console:**
   - URL: https://console.firebase.google.com/project/vision-education-main/authentication/providers

2. **Click on "Google" provider**

3. **Enable it** (toggle ON)

4. **Web SDK configuration:**
   - **Web client ID:** Paste the Client ID from Step 1
   - **Web client secret:** Paste the Client Secret from Step 1

5. **Click "Save"**

---

### **Step 3: Update Main Site Code**

You need to update **3 files** with your new Client ID:

#### **File 1: `login.html`**

Find this line (around line 288):
```html
data-client_id="378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com"
```

Replace with:
```html
data-client_id="YOUR_NEW_CLIENT_ID_HERE"
```

#### **File 2: `parent-portal.html`**

Find this line (around line 431):
```javascript
const clientId = "378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com";
```

Replace with:
```javascript
const clientId = "YOUR_NEW_CLIENT_ID_HERE";
```

#### **File 3: `api/auth-core.js`**

Find this line (around line 132):
```javascript
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com';
```

Replace with:
```javascript
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_NEW_CLIENT_ID_HERE';
```

---

### **Step 4: Add Client ID to Environment Variables (Optional but Recommended)**

1. **Go to Vercel Dashboard:**
   - URL: https://vercel.com/your-project/settings/environment-variables

2. **Add new environment variable:**
   - **Key:** `GOOGLE_CLIENT_ID`
   - **Value:** Your new Client ID
   - **Environment:** Production, Preview, Development

3. **Redeploy** your project

---

## 🧪 Testing

After updating:

1. **Commit and push changes:**
   ```bash
   git add login.html parent-portal.html api/auth-core.js
   git commit -m "Update Google OAuth Client ID for main site"
   git push origin master
   ```

2. **Wait for Vercel deployment** (~2 minutes)

3. **Test Google Sign-In:**
   - Go to: https://visionedu.online/login.html
   - Click "Sign in with Google"
   - Select your account
   - Should redirect to dashboard successfully

4. **Verify in Firebase Console:**
   - Go to: https://console.firebase.google.com/project/vision-education-main/firestore/databases/-default-/data
   - You should see `users` collection with your email

5. **Check browser console:**
   ```
   ✅ [Firebase] Google Auth successful: your-email@gmail.com
   ✅ [Firebase] User saved to users: your-email@gmail.com
   ```

---

## 📋 Quick Checklist

- [ ] Created new OAuth Client ID in Google Cloud Console
- [ ] Copied Client ID and Client Secret
- [ ] Added authorized origins: `visionedu.online`, `www.visionedu.online`
- [ ] Added authorized redirect URIs
- [ ] Configured Firebase Authentication with new Client ID and Secret
- [ ] Updated `login.html` with new Client ID
- [ ] Updated `parent-portal.html` with new Client ID
- [ ] Updated `api/auth-core.js` with new Client ID
- [ ] (Optional) Added `GOOGLE_CLIENT_ID` to Vercel environment variables
- [ ] Committed and pushed changes
- [ ] Tested Google Sign-In
- [ ] Verified data in Firestore

---

## 🎯 Summary

**Problem:** Main site using Vision AI's OAuth Client ID  
**Solution:** Create separate OAuth Client ID for main site  
**Result:** Google Sign-In works, data saves to Firestore  

**Projects:**
- **Main Site:** `vision-education-main` (Project #: 1085532052475) ← NEW OAuth Client ID
- **Vision AI:** `vision-edu-491909` (Project #: 378999569796) ← Keep existing OAuth Client ID

---

## 🆘 Troubleshooting

**Still getting "Invalid Idp Response"?**
- Double-check the Client ID in all 3 files matches exactly
- Verify Firebase has the correct Client ID and Secret
- Clear browser cache and try in incognito window

**"Redirect URI mismatch"?**
- Add `https://visionedu.online` to authorized redirect URIs in Google Cloud Console

**Data still not saving to Firestore?**
- Check browser console for `[Firebase] User saved` message
- Verify Firestore rules are deployed correctly
- Check Firebase Console → Authentication → Users (should see your email)
