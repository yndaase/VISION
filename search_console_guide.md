# 🚀 Google Search Console: Domain Setup Guide

To get your **Vision Education** platform appearing in Google search results, follow these steps to verify your domain.

## Step 1: Add a New Property

1.  Go to the [Google Search Console](https://search.google.com/search-console/about).
2.  Sign in with your Google Account (e.g., `admin@visionedu.online`).
3.  Click the **"Add Property"** dropdown in the top left.
4.  Choose the **Domain** (left side) entry.
5.  Enter your domain name (e.g., `visionedu.online`) and click **Continue**.

## Step 2: Verify Domain via DNS (Recommended)

Google needs to prove you own the domain. This is done through your domain registrar (e.g., Namecheap, GoDaddy, or Cloudflare).

1.  **Copy the TXT Record**: Google will provide a unique string starting with `google-site-verification=...`. Copy this.
2.  **Log in to your Registrar**: Go to the DNS Management/Advanced DNS section of your domain.
3.  **Add a New Record**:
    - **Type**: `TXT`
    - **Host/Name**: `@`
    - **Value**: Paste the code you copied from Google.
    - **TTL**: Automatic or 1 Hour.
4.  **Save Changes**: Wait about 5–10 minutes for the DNS to propagate.
5.  **Go back to Google**: Click **Verify**.

## Step 3: Submit Your Sitemap

Once verified, tell Google about all your pages so it can crawl them.

1.  In Search Console, go to **Indexing** > **Sitemaps**.
2.  In "Add a new sitemap", you will see your domain already written (e.g., `https://www.visionedu.online/`).
3.  **IMPORTANT**: Only type `sitemap.xml` in the box.
    - ❌ **DO NOT** paste the full link (`https://.../sitemap.xml`).
    - ✅ **DO** just type: `sitemap.xml`
4.  Click **Submit**.

> [!WARNING]
> **"Invalid sitemap address" error?**
> This usually happens if you paste the full URL instead of just the file name. GSC already knows your domain; it just needs the path to the file.

> [!TIP]
> **Why do this?** Search Console shows you which keywords bring students to your site, identifies mobile display errors, and alerts you if there are performance issues.

## Step 4: Request Indexing

If you have a new page (like a new subject), you can force Google to find it:

1.  Paste the URL (e.g., `https://visionedu.online/dashboard.html`) into the top search bar.
2.  Click **"Request Indexing"**.

---

**Status**: Once complete, your site will usually appear in Google within 24–48 hours.
