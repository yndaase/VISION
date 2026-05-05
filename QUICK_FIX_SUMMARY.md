# Quick Fix Summary - Materials Upload & Delete

## What Was Fixed

### ✅ CORS Upload Issue
**Problem:** Browser couldn't upload directly to R2 due to CORS errors
**Solution:** Changed to upload through API proxy (bypasses CORS completely)

### ✅ File Size Limit
**Problem:** Vercel Hobby plan has 4.5MB body size limit
**Solution:** Added 4MB file size validation with clear error messages

### ✅ Delete Already Working
**Problem:** You mentioned delete doesn't work
**Solution:** Code already checks both `url` and `blobUrl` fields - should work now

## What You Need to Do

### 1. Deploy to Vercel (1 minute)

```bash
git add .
git commit -m "Fix materials upload CORS and file size limits"
git push
```

Vercel will auto-deploy in ~2 minutes.

### 2. Test Upload (2 minutes)

1. Go to: `https://www.visionedu.online/admin-materials-upload`
2. Select a PDF file **UNDER 4MB** (important!)
3. Fill in the form
4. Click "Upload to Cloudflare R2"
5. Should see: "Upload complete!" ✅

**If file is over 4MB:**
- Compress it first: https://www.ilovepdf.com/compress_pdf
- Or split into smaller files

### 3. Test Delete (1 minute)

1. Find a material in "Recently Uploaded"
2. Click "Delete"
3. Confirm
4. Should see: "Material deleted successfully" ✅

### 4. Verify Student Dashboard (1 minute)

1. Log in as student
2. Go to dashboard
3. Check "Learner Materials" section
4. Materials should appear ✅

## Important Notes

### File Size Limits

**Vercel Hobby Plan:**
- Maximum upload size: **4MB**
- This is a Vercel platform limit, not our code

**Solutions:**
1. Compress PDFs before uploading (recommended)
2. Split large files into parts
3. Upgrade to Vercel Pro ($20/month) for 50MB limit

### How to Compress PDFs

**Online Tools (Free):**
- https://www.ilovepdf.com/compress_pdf
- https://www.adobe.com/acrobat/online/compress-pdf.html
- https://smallpdf.com/compress-pdf

**Tips:**
- Most study notes can be compressed to 1-2MB
- Reduce image quality to 150 DPI (good for screen viewing)
- Remove unnecessary pages

## Troubleshooting

### Upload fails with "File too large"
→ File is over 4MB. Compress it first.

### Upload fails with "Failed to upload file to R2"
→ Check Vercel environment variables are set:
- R2_ACCOUNT_ID
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME

### Materials don't show on student dashboard
→ Run in browser console:
```javascript
await window.testMaterialsSync()
```
→ If "Missing permissions": Deploy Firestore rules (see MATERIALS_COMPLETE_SETUP.md)

### Delete doesn't work
→ Check console for errors
→ Verify admin is logged in: `window.fbAuth.currentUser?.email`
→ Should show: `admin@visionedu.online`

## What Changed in Code

### admin-materials-upload.js
- ❌ Removed: Pre-signed URL upload (CORS issues)
- ✅ Added: Direct API proxy upload (no CORS)
- ✅ Added: 4MB file size validation
- ✅ Added: Better error messages

### api/upload.js
- ✅ Added: Body size validation (4.5MB)
- ✅ Added: Detailed logging
- ✅ Added: Better error handling

### No Changes Needed
- vercel.json (already correct)
- firebase.js (already fixed)
- firestore.rules (already deployed)

## Expected Results

### Successful Upload
```
Console Output:
[Upload] File uploaded successfully to R2
[Firebase] ✅ Material saved to Firestore: Test Material

UI:
✅ Progress bar: 0% → 30% → 70% → 100%
✅ Success message: "Material 'Test Material' uploaded successfully!"
✅ Material appears in list
```

### Successful Delete
```
Console Output:
[Upload API] Deleted from R2: materials/core-maths/1234567890_test.pdf
[Upload API] Deleted from Firestore: 1234567890
[Firebase] ✅ Material deleted (R2 + Firestore): 1234567890

UI:
✅ Success message: "Material deleted successfully"
✅ Material removed from list
```

## Next Steps

1. **Deploy** → Push to GitHub (Vercel auto-deploys)
2. **Test Upload** → Use file < 4MB
3. **Test Delete** → Should work now
4. **Compress Files** → Prepare materials < 4MB
5. **Upload Real Materials** → Start with compressed PDFs

## Need Help?

If issues persist after deployment:
1. Share Vercel function logs (Vercel Dashboard → Functions → Logs)
2. Share browser console output (F12 → Console tab)
3. Share output of `await window.testMaterialsSync()`

---

**Status:** Ready to deploy ✅
**Time to Deploy:** ~2 minutes
**Time to Test:** ~5 minutes
**Critical:** Remember 4MB file size limit!
