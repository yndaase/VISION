# R2 CORS Setup (No Custom Domain Needed)

## Important: You DON'T Need a Custom Domain

CORS configuration works with the default R2 URL. You only need a custom domain if you want public access through a nice URL like `files.visionedu.online`.

For uploads to work, you just need to configure CORS on the bucket.

## Step 1: Find CORS Settings in R2 Dashboard

1. Go to https://dash.cloudflare.com/
2. Select your account
3. Click **R2** in the left sidebar
4. Click on your bucket: **vision-edu-materials**
5. Click the **Settings** tab
6. Scroll down to find **CORS Policy** section

## Step 2: Add CORS Policy

Click **Add CORS Policy** or **Edit CORS Policy** and paste this:

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
      "ETag",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

Click **Save**.

## Step 3: Test Upload

1. Go to `/admin-materials-upload`
2. Select a PDF file (any size up to 50MB)
3. Fill in the form
4. Click "Upload to Cloudflare R2"
5. Should upload successfully!

## What This Does

**AllowedOrigins**: Tells R2 to accept uploads from your website
**AllowedMethods**: Allows PUT (upload), GET (download), DELETE (remove)
**AllowedHeaders**: Allows all headers (needed for authentication)
**MaxAgeSeconds**: Browser caches CORS response for 1 hour

## If You Can't Find CORS Settings

The CORS settings might be in a different location depending on your Cloudflare plan:

### Alternative Location 1: Bucket Overview
1. Go to R2 → Buckets
2. Click on **vision-edu-materials**
3. Look for **CORS** or **Settings** tab at the top

### Alternative Location 2: Using Wrangler CLI

If you can't find CORS in the dashboard, use the CLI:

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Create CORS config file
echo '[
  {
    "AllowedOrigins": ["https://www.visionedu.online", "https://visionedu.online"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]' > r2-cors.json

# Apply CORS
wrangler r2 bucket cors put vision-edu-materials --file r2-cors.json
```

## Verify CORS is Working

After configuring CORS, test with curl:

```bash
curl -X OPTIONS \
  -H "Origin: https://www.visionedu.online" \
  -H "Access-Control-Request-Method: PUT" \
  -v \
  https://vision-edu-materials.83c8ca9....r2.cloudflarestorage.com/test
```

**Expected response headers:**
```
access-control-allow-origin: https://www.visionedu.online
access-control-allow-methods: GET, PUT, POST, DELETE, HEAD
```

## Common Issues

### Issue 1: "CORS settings not found"
**Solution**: Your Cloudflare plan might not show CORS in the UI. Use Wrangler CLI instead.

### Issue 2: "Still getting CORS error"
**Solution**: 
1. Clear browser cache
2. Wait 1-2 minutes for CORS to propagate
3. Try upload again

### Issue 3: "Domain not found on account"
**Solution**: Ignore the custom domain section. You don't need it. Just configure CORS.

## What You DON'T Need

❌ Custom domain (like files.visionedu.online)
❌ Public bucket access
❌ DNS configuration
❌ SSL certificates

## What You DO Need

✅ CORS policy configured on the bucket
✅ That's it!

## After CORS is Configured

Your upload flow will work like this:

```
1. Admin clicks "Upload" on /admin-materials-upload
2. Browser requests pre-signed URL from your API
3. API generates pre-signed URL for R2
4. Browser uploads file directly to R2 ✅ (CORS allows this)
5. Browser saves metadata to Firestore
6. Students can download via /api/upload?action=download
```

## Screenshot Guide

If you're having trouble finding CORS settings, look for:

1. **R2 Dashboard** → **Buckets** → **vision-edu-materials**
2. **Settings** tab (or **Configuration** tab)
3. Section labeled **CORS Policy** or **CORS Configuration**
4. Button that says **Add CORS Policy** or **Edit CORS**

---

**Status**: Waiting for CORS configuration
**Action**: Add CORS policy to R2 bucket (no custom domain needed)
**Time**: 2 minutes
