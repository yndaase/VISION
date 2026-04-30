# Firebase & Vercel Blob CORS Fix

## Issues Fixed

1. ✅ **Firebase Permissions Error** - "Missing or insufficient permissions"
2. ✅ **Vercel Blob CORS Error** - "No 'Access-Control-Allow-Origin' header"

## Firebase Security Rules Setup

### Step 1: Deploy Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

### What the Rules Do

- ✅ Users can read/write their own data
- ✅ Admins can read/write all data
- ✅ Materials are readable by all authenticated users
- ✅ Only admins can create/update/delete materials
- ✅ Analytics and study plans are user-specific
- ✅ Broadcasts are readable by all, writable by admins

### Quick Test

After deploying rules, test in Firebase Console:
```javascript
// Test as authenticated user
auth.uid = "user@example.com"
get(/databases/(default)/documents/users/user@example.com)
// Should: Allow

// Test as admin
auth.uid = "admin@visionedu.online"
get(/databases/(default)/documents/users/anyuser@example.com)
// Should: Allow
```

## Vercel Blob CORS Fix

### Option 1: Use Blob Proxy (Recommended)

The blob proxy API endpoint handles CORS automatically.

#### Implementation

1. **Add blob-helper.js to your pages:**
```html
<script src="/blob-helper.js"></script>
```

2. **Update your code to use proxied URLs:**
```javascript
// OLD (causes CORS error):
const url = 'https://blob.vercel-storage.com/materials/file.pdf';
window.open(url, '_blank');

// NEW (works with CORS):
const url = 'https://blob.vercel-storage.com/materials/file.pdf';
const proxiedUrl = getProxiedBlobUrl(url);
window.open(proxiedUrl, '_blank');

// Or use helper function:
openBlob(url);
```

3. **For downloads:**
```javascript
// OLD:
fetch(blobUrl).then(...)

// NEW:
downloadBlob(blobUrl, 'filename.pdf');
```

### Option 2: Configure Vercel Blob CORS (Alternative)

If you prefer to configure CORS directly on Vercel Blob:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Configure CORS for your blob store:
```bash
vercel blob cors set --store your-store-name --config vercel-blob-cors.json
```

4. Verify CORS configuration:
```bash
vercel blob cors get --store your-store-name
```

## Quick Fix for Current Pages

### Update Materials Modal (admin.html or wherever materials are displayed)

Find where you open blob URLs and wrap them:

```javascript
// Before:
function openMaterial(url) {
  window.open(url, '_blank');
}

// After:
function openMaterial(url) {
  const proxiedUrl = getProxiedBlobUrl(url);
  window.open(proxiedUrl, '_blank');
}
```

### Update WAEC Past Questions Download

In `waec-past-questions.js`, update the download function:

```javascript
// Before:
const link = document.createElement('a');
link.href = data.downloadUrl;
link.download = filename;

// After:
const proxiedUrl = getProxiedBlobUrl(data.downloadUrl);
const link = document.createElement('a');
link.href = proxiedUrl;
link.download = filename;
```

## Testing

### Test Firebase Rules

1. Open browser console on your site
2. Try to access user data:
```javascript
// Should work (your own data)
await fbGetUser('your-email@example.com');

// Should work if you're admin
await fbGetAllUsers();
```

### Test Blob Proxy

1. Open browser console
2. Test the proxy:
```javascript
const blobUrl = 'https://blob.vercel-storage.com/materials/test.pdf';
const proxiedUrl = getProxiedBlobUrl(blobUrl);
console.log(proxiedUrl); // Should be: /api/blob-proxy?url=...

// Try to fetch
fetch(proxiedUrl).then(r => console.log('Success:', r.ok));
```

## Files Created

1. ✅ `firestore.rules` - Firebase security rules
2. ✅ `vercel-blob-cors.json` - CORS configuration for Vercel Blob
3. ✅ `api/blob-proxy.js` - API endpoint to proxy blob requests
4. ✅ `blob-helper.js` - Helper functions for blob operations
5. ✅ `FIREBASE_BLOB_FIX.md` - This guide

## Deployment Checklist

- [ ] Deploy Firebase security rules
- [ ] Test Firebase permissions in console
- [ ] Add `blob-helper.js` to pages that use blobs
- [ ] Update blob URL usage to use proxy
- [ ] Test blob downloads
- [ ] Test blob previews
- [ ] Verify no CORS errors in console

## Common Issues

### Issue: Still getting CORS errors

**Solution:** Make sure you're using the proxied URL:
```javascript
const proxiedUrl = getProxiedBlobUrl(originalUrl);
```

### Issue: Firebase rules not working

**Solution:** 
1. Check rules are published in Firebase Console
2. Verify user has correct role in Firestore
3. Check browser console for auth errors

### Issue: Blob proxy returns 404

**Solution:**
1. Verify API endpoint is deployed
2. Check Vercel function logs
3. Ensure blob URL is valid

## Support

If issues persist:
1. Check browser console for errors
2. Check Vercel function logs
3. Check Firebase Console logs
4. Verify environment variables are set

---

**Status:** Ready to deploy ✅
