# Cloudflare R2 CORS Configuration

## Problem

Uploading files larger than 4.5MB fails with "413 Content Too Large" error because Vercel has a body size limit.

**Error:**
```
PUT https://www.visionedu.online/api/upload 413 (Content Too Large)
```

## Solution

Configure CORS on Cloudflare R2 to allow direct browser uploads, bypassing Vercel's size limit.

## Step 1: Configure R2 CORS

### Using Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Go to **R2** → **Buckets**
4. Click on your bucket: `vision-edu-materials`
5. Go to **Settings** tab
6. Scroll to **CORS Policy**
7. Click **Add CORS Policy**
8. Add this configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://www.visionedu.online",
      "https://visionedu.online",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

9. Click **Save**

### Using Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create CORS config file
cat > r2-cors.json << 'EOF'
[
  {
    "AllowedOrigins": [
      "https://www.visionedu.online",
      "https://visionedu.online",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
EOF

# Apply CORS configuration
wrangler r2 bucket cors put vision-edu-materials --file r2-cors.json
```

## Step 2: Update Upload Code

The upload code is already configured to use pre-signed URLs. Once CORS is configured, direct uploads will work.

**Current flow (will work after CORS setup):**
```
1. Browser requests pre-signed URL from API
2. API generates pre-signed URL for R2
3. Browser uploads directly to R2 using pre-signed URL ✅
4. Browser saves metadata to Firestore
```

## Step 3: Revert to Direct Upload

Once CORS is configured, revert the upload code to use direct R2 uploads:

```javascript
// admin-materials-upload.js
// Get pre-signed URL
const urlResponse = await fetch(`/api/upload?action=get-upload-url&fileKey=${encodeURIComponent(fileKey)}&contentType=${encodeURIComponent(selectedFile.type)}`);
const { uploadUrl } = await urlResponse.json();

// Upload directly to R2
const r2Response = await fetch(uploadUrl, {
  method: 'PUT',
  body: selectedFile,
  headers: {
    'Content-Type': selectedFile.type
  }
});
```

## Verify CORS Configuration

### Test 1: Check CORS Headers

```bash
curl -X OPTIONS https://vision-edu-materials.83c8ca9....r2.cloudflarestorage.com \
  -H "Origin: https://www.visionedu.online" \
  -H "Access-Control-Request-Method: PUT" \
  -v
```

**Expected response:**
```
< HTTP/2 200
< access-control-allow-origin: https://www.visionedu.online
< access-control-allow-methods: GET, PUT, POST, DELETE, HEAD
< access-control-allow-headers: *
< access-control-max-age: 3600
```

### Test 2: Upload Test File

1. Go to `/admin-materials-upload`
2. Select a file (any size up to 50MB)
3. Fill in details
4. Click "Upload to Cloudflare R2"
5. Should upload successfully

## Alternative: Chunked Upload (If CORS Not Available)

If you can't configure CORS, implement chunked uploads:

```javascript
// Split file into 4MB chunks
const chunkSize = 4 * 1024 * 1024; // 4MB
const chunks = Math.ceil(selectedFile.size / chunkSize);

for (let i = 0; i < chunks; i++) {
  const start = i * chunkSize;
  const end = Math.min(start + chunkSize, selectedFile.size);
  const chunk = selectedFile.slice(start, end);
  
  // Upload chunk
  await fetch(`/api/upload?action=upload-chunk&fileKey=${fileKey}&chunkIndex=${i}&totalChunks=${chunks}`, {
    method: 'PUT',
    body: chunk
  });
  
  // Update progress
  const progress = ((i + 1) / chunks) * 100;
  progressFill.style.width = `${progress}%`;
}
```

## Recommended Solution

**For production:** Configure CORS on R2 (Step 1)
- Supports files up to 50MB
- Faster uploads (direct to R2)
- No Vercel function limits

**For development:** Use API proxy with small files (<4MB)
- No CORS configuration needed
- Works immediately
- Limited to 4.5MB files

## Current Limits

### Vercel (API Proxy)
- Max body size: **4.5MB** (Hobby plan)
- Max body size: **100MB** (Pro plan)
- Max function duration: 60s

### Cloudflare R2 (Direct Upload)
- Max file size: **5TB**
- No request size limits
- Requires CORS configuration

## Files to Update After CORS Setup

1. **admin-materials-upload.js** - Revert to direct R2 upload
2. **api/upload.js** - Keep pre-signed URL generation
3. **vercel.json** - Can reduce memory back to 1024MB

---

**Status:** CORS configuration required for files >4.5MB
**Action:** Configure CORS on R2 bucket `vision-edu-materials`
