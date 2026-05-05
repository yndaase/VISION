# Materials Upload & Delete Fix

## Changes Made

### 1. Upload Method Changed (CORS Bypass)

**Problem:** Direct browser uploads to R2 were failing with CORS errors despite CORS configuration.

**Solution:** Changed from pre-signed URL uploads to API proxy uploads.

**Before:**
```javascript
// Browser → Get pre-signed URL → Upload directly to R2 (CORS blocked)
```

**After:**
```javascript
// Browser → Upload to API → API uploads to R2 (No CORS issues)
```

### 2. File Size Limit

**Vercel Hobby Plan Limits:**
- Maximum request body size: **4.5MB**
- Maximum function memory: **1024MB** (already configured)

**Changes:**
- Frontend now validates files are ≤ 4MB before upload
- API rejects files > 4.5MB with clear error message
- Error message guides users to use smaller files

### 3. Better Error Handling

**Added:**
- File size validation in frontend (4MB limit)
- Body size validation in API (4.5MB limit)
- Clear error messages for 413 errors
- Logging at each step for debugging

### 4. R2 Deletion Already Fixed

The delete functionality was already fixed in previous commits:
- API checks both `url` and `blobUrl` fields
- Deletes from R2 first, then Firestore
- Continues even if R2 delete fails (for orphaned metadata)

## Testing Instructions

### Test 1: Upload Small File (< 4MB)

1. Go to `/admin-materials-upload`
2. Select a PDF file **under 4MB**
3. Fill in form:
   - Subject: Core Mathematics
   - Material Type: Study Notes
   - Title: Test Material
   - Description: Testing upload
4. Click "Upload to Cloudflare R2"

**Expected Result:**
```
✅ Progress bar shows: Preparing → Uploading → Saving → Complete
✅ Success message: "Material 'Test Material' uploaded successfully!"
✅ Material appears in "Recently Uploaded" list
```

**Console Output:**
```
[Upload] File uploaded successfully to R2
[Firebase] ✅ Material saved to Firestore: Test Material
```

### Test 2: Upload Large File (> 4MB)

1. Select a PDF file **over 4MB**

**Expected Result:**
```
❌ Error message: "File size exceeds 4MB limit. Please use a smaller file or upgrade to Pro plan for larger uploads."
❌ File is NOT uploaded
```

### Test 3: Delete Material

1. Find a material in "Recently Uploaded" list
2. Click "Delete" button
3. Confirm deletion

**Expected Result:**
```
✅ Success message: "Material deleted successfully"
✅ Material removed from list
✅ Material deleted from Firestore
✅ File deleted from R2
```

**Console Output:**
```
[Upload API] Deleted from R2: materials/core-maths/1234567890_test.pdf
[Upload API] Deleted from Firestore: 1234567890
[Firebase] ✅ Material deleted (R2 + Firestore): 1234567890
```

### Test 4: Verify Student Dashboard

1. Log into student account
2. Go to dashboard
3. Check "Learner Materials" section

**Expected Result:**
```
✅ Materials appear in the list
✅ Can filter by subject
✅ Can click to download
✅ Download works correctly
```

## Troubleshooting

### Issue: "File too large" error

**Cause:** File exceeds 4MB limit
**Solution:** 
- Compress the PDF (use online tools like iLovePDF)
- Split large files into smaller parts
- Or upgrade to Vercel Pro plan (50MB limit)

### Issue: Upload fails with "Failed to upload file to R2"

**Possible Causes:**
1. R2 credentials not set in Vercel environment variables
2. R2 bucket doesn't exist
3. Network timeout

**Debug Steps:**
1. Check Vercel environment variables:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
2. Check Vercel function logs for detailed error
3. Verify R2 bucket exists in Cloudflare dashboard

### Issue: Materials don't show on student dashboard

**Possible Causes:**
1. Firestore rules not deployed
2. Student not authenticated
3. Materials not synced

**Debug Steps:**
1. Open browser console on student dashboard
2. Run: `await window.testMaterialsSync()`
3. Check output:
   ```javascript
   // Should see:
   ✅ Found X materials in Firestore
   ✅ Synced X materials
   ```
4. If "Missing or insufficient permissions":
   - Deploy Firestore rules (see MATERIALS_COMPLETE_SETUP.md)
5. If "No materials found":
   - Upload a test material first

### Issue: Delete doesn't work

**Possible Causes:**
1. Admin not authenticated
2. Material ID not found
3. R2 credentials missing

**Debug Steps:**
1. Check console for error messages
2. Verify admin is logged in: `window.fbAuth.currentUser?.email`
3. Check Vercel function logs for API errors

## File Size Recommendations

### Optimal File Sizes:
- **Study Notes (PDF):** 500KB - 2MB
- **Presentation Slides (PPTX):** 1MB - 3MB
- **Worksheets (PDF):** 200KB - 1MB
- **Images (JPG/PNG):** 100KB - 500KB

### How to Reduce File Size:

**For PDFs:**
1. Use online compression: https://www.ilovepdf.com/compress_pdf
2. Reduce image quality in PDF
3. Remove unnecessary pages
4. Use "Save As" → "Reduced Size PDF" in Adobe

**For PowerPoint:**
1. Compress images: Picture Tools → Compress Pictures
2. Remove unused slides
3. Save as PDF instead (usually smaller)

**For Images:**
1. Use JPEG instead of PNG for photos
2. Resize to appropriate dimensions (1920x1080 max)
3. Use online compression: https://tinypng.com/

## Architecture

### Upload Flow
```
┌─────────────┐
│   Browser   │
│  (Admin)    │
└──────┬──────┘
       │ 1. Select file (< 4MB)
       │ 2. Fill form
       │ 3. Click upload
       ▼
┌─────────────────────────────────┐
│  admin-materials-upload.js      │
│  - Validate file size           │
│  - Generate fileKey             │
│  - PUT /api/upload              │
└──────┬──────────────────────────┘
       │ 4. Send file in body
       ▼
┌─────────────────────────────────┐
│  api/upload.js                  │
│  - Check body size (< 4.5MB)    │
│  - Upload to R2                 │
│  - Return success               │
└──────┬──────────────────────────┘
       │ 5. File stored in R2
       ▼
┌─────────────────────────────────┐
│  firebase.js                    │
│  - fbSaveMaterial()             │
│  - Save metadata to Firestore   │
└─────────────────────────────────┘
```

### Delete Flow
```
┌─────────────┐
│   Browser   │
│  (Admin)    │
└──────┬──────┘
       │ 1. Click delete
       │ 2. Confirm
       ▼
┌─────────────────────────────────┐
│  firebase.js                    │
│  - fbDeleteMaterial(id)         │
│  - DELETE /api/upload           │
└──────┬──────────────────────────┘
       │ 3. Send material ID
       ▼
┌─────────────────────────────────┐
│  api/upload.js                  │
│  - Get material from Firestore  │
│  - Delete from R2 (url field)   │
│  - Delete from Firestore        │
│  - Return success               │
└─────────────────────────────────┘
```

## Environment Variables

Required in Vercel:

```bash
# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=vision-edu-materials

# Firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## Files Modified

1. **admin-materials-upload.js**
   - Changed from pre-signed URL to API proxy upload
   - Reduced file size limit to 4MB
   - Added better error handling for 413 errors

2. **api/upload.js**
   - Added body size validation (4.5MB)
   - Added logging for debugging
   - Improved error messages

3. **vercel.json**
   - Memory already set to 1024MB (correct)

4. **firebase.js**
   - Delete function already fixed (checks url and blobUrl)
   - Authentication checks already added

## Next Steps

1. ✅ Deploy changes to Vercel
2. ✅ Test upload with small file (< 4MB)
3. ✅ Test upload with large file (> 4MB) - should fail gracefully
4. ✅ Test delete functionality
5. ✅ Verify materials show on student dashboard
6. ✅ Upload real materials (compressed to < 4MB)

## Support

If issues persist:
1. Share Vercel function logs
2. Share browser console output
3. Share output of `await window.testMaterialsSync()`
4. Verify environment variables are set correctly

---

**Status:** Ready for testing
**Critical:** Files must be < 4MB due to Vercel Hobby plan limits
**Workaround:** Compress PDFs before uploading
