# Vision AI - Assets Setup

## 📁 Required Assets

The Vision AI project needs the following assets from the main site:

### 1. Favicon
- **Source:** `assets/favicon.png` (from main site)
- **Destination:** `vision-ai/public/favicon.png`
- **Used in:** All HTML pages
- **Purpose:** Browser tab icon

### 2. Logo
- **Source:** `assets/logo.png` (from main site)
- **Destination:** `vision-ai/public/assets/logo.png`
- **Used in:** Open Graph meta tags
- **Purpose:** Social media preview image

## 🔧 Setup Instructions

### Option 1: Copy from Main Site

```bash
# From the VISION root directory
mkdir -p vision-ai/public/assets

# Copy favicon
cp assets/favicon.png vision-ai/public/favicon.png

# Copy logo
cp assets/logo.png vision-ai/public/assets/logo.png
```

### Option 2: Use CDN Links

If you prefer to keep using the main site's assets, update the HTML files:

**In `chat.html`, `login.html`, and `index.html`:**

```html
<!-- Change from: -->
<link rel="icon" type="image/png" href="/favicon.png" />

<!-- To: -->
<link rel="icon" type="image/png" href="https://visionedu.online/favicon.png" />
```

```html
<!-- Change from: -->
<meta property="og:image" content="/assets/logo.png" />

<!-- To: -->
<meta property="og:image" content="https://visionedu.online/assets/logo.png" />
```

### Option 3: Create New Assets

Create Vision AI specific branding:

1. **Favicon:** 32x32px PNG with "V" logo
2. **Logo:** 1200x630px PNG for social media

## 📊 Current Status

- ✅ HTML files updated to use local paths
- ⚠️ Assets need to be copied or created
- ⚠️ Choose Option 1, 2, or 3 above

## 🚀 Deployment Note

Before deploying to Vercel:
1. Ensure assets exist in `vision-ai/public/` folder
2. OR revert to using main site CDN links
3. Test that favicon and OG images load correctly

## 📝 Vercel Configuration

The `vercel.json` is configured to serve static files from the root:

```json
{
  "routes": [
    {
      "src": "/favicon.png",
      "dest": "/public/favicon.png"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/public/assets/$1"
    }
  ]
}
```

---

**Recommendation:** Use Option 2 (CDN links) for now to avoid duplication. Create separate branding later if needed.
