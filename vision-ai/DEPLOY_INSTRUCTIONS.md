# 🚀 Deploy Vision AI to Vercel - Step by Step

## Current Status
❌ **Not Deployed** - The code is ready but needs to be deployed to Vercel

## ⚡ Quick Deploy (5 Minutes)

### Option 1: Vercel CLI (Fastest)

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Navigate to vision-ai folder
cd vision-ai

# 3. Login to Vercel
vercel login

# 4. Deploy to production
vercel --prod
```

**That's it!** Vercel will:
- Build and deploy your project
- Give you a URL like `vision-ai-xxx.vercel.app`
- You can then add your custom domain

---

### Option 2: Vercel Dashboard (Easiest)

#### Step 1: Go to Vercel
1. Visit: https://vercel.com/new
2. Sign in with GitHub

#### Step 2: Import Repository
1. Click **"Import Git Repository"**
2. Select: `yndaase/VISION`
3. Click **"Import"**

#### Step 3: Configure Project
**IMPORTANT:** Set these settings:

```
Project Name: vision-ai
Framework Preset: Other
Root Directory: vision-ai    ⚠️ CRITICAL - Must be "vision-ai"
Build Command: (leave empty)
Output Directory: (leave empty)
Install Command: npm install
```

#### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes
3. Your site will be live at `vision-ai-xxx.vercel.app`

---

## 🌐 Add Custom Domain (ai.visionedu.online)

### Step 1: In Vercel Dashboard

1. Go to your project: https://vercel.com/dashboard
2. Click on **vision-ai** project
3. Go to **Settings** → **Domains**
4. Click **"Add Domain"**
5. Enter: `ai.visionedu.online`
6. Click **"Add"**

Vercel will show you DNS instructions.

### Step 2: Update DNS

#### If using Cloudflare:
1. Go to Cloudflare Dashboard
2. Select domain: `visionedu.online`
3. Go to **DNS** → **Records**
4. Click **"Add record"**

```
Type: CNAME
Name: ai
Target: cname.vercel-dns.com
Proxy status: Proxied (orange cloud ON)
TTL: Auto
```

5. Click **"Save"**

#### If using GoDaddy/Namecheap:
1. Go to DNS Management
2. Add CNAME record:

```
Type: CNAME
Host: ai
Points to: cname.vercel-dns.com
TTL: 1 Hour
```

### Step 3: Wait for DNS Propagation
- Usually takes 5-30 minutes
- Can take up to 24-48 hours
- Check status: https://dnschecker.org/#CNAME/ai.visionedu.online

---

## ✅ Verify Deployment

After deployment, test these URLs:

### 1. Homepage
```
https://ai.visionedu.online/
```
**Expected:** Landing page with "Better Future For Your Kids"

### 2. Login Page
```
https://ai.visionedu.online/login
```
**Expected:** Login form with Google OAuth

### 3. Chat Interface
```
https://ai.visionedu.online/chat
```
**Expected:** Redirects to login if not authenticated

### 4. API Endpoint
```bash
curl -X POST https://ai.visionedu.online/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"Hello","sessionId":"test"}'
```
**Expected:** JSON response with AI answer

---

## 🐛 Troubleshooting

### Issue: "Deployment Not Found"
**Cause:** Project not deployed yet
**Solution:** Follow deployment steps above

### Issue: "404 - This page could not be found"
**Cause:** Wrong root directory
**Solution:** 
1. Go to Project Settings → General
2. Set Root Directory to `vision-ai`
3. Redeploy

### Issue: "Build Failed"
**Cause:** Missing dependencies or wrong configuration
**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure `package.json` exists in `vision-ai/` folder
3. Try deploying again

### Issue: Domain not working
**Cause:** DNS not propagated yet
**Solution:**
1. Wait 24-48 hours
2. Check DNS: `nslookup ai.visionedu.online`
3. Verify CNAME record is correct

### Issue: "Internal Server Error" on /api/chat
**Cause:** API endpoint not working
**Solution:**
1. Check Vercel function logs
2. Ensure `api/chat.js` exists
3. Check `engine/` folder files exist

---

## 📊 Expected Results

After successful deployment:

✅ **Homepage:** Professional landing page  
✅ **Login:** Google OAuth + Email/Password  
✅ **Chat:** AI chat interface with auth  
✅ **API:** Working chat endpoint  
✅ **Mobile:** Fully responsive  
✅ **Performance:** Fast loading  

---

## 🔧 Post-Deployment

### Update Firebase (Optional)
If using Firebase for chat history:

1. Go to Firebase Console
2. Authentication → Settings → Authorized domains
3. Add: `ai.visionedu.online`
4. Add: `vision-ai-xxx.vercel.app` (your Vercel URL)

### Update Google OAuth (Optional)
If using Google Sign-In:

1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. Add to Authorized JavaScript origins:
   - `https://ai.visionedu.online`
   - `https://vision-ai-xxx.vercel.app`
5. Add to Authorized redirect URIs:
   - `https://ai.visionedu.online/login`
   - `https://vision-ai-xxx.vercel.app/login`

---

## 📞 Need Help?

### Vercel Documentation
- https://vercel.com/docs

### Check Deployment Status
- https://vercel.com/dashboard

### View Build Logs
- Go to your project in Vercel
- Click on latest deployment
- View "Build Logs" and "Function Logs"

---

## 🎉 Quick Summary

**To deploy right now:**

```bash
cd vision-ai
vercel --prod
```

**Then add domain:**
1. Vercel Dashboard → Settings → Domains
2. Add `ai.visionedu.online`
3. Update DNS with CNAME record

**Done!** 🚀

---

**Status:** ⏳ Waiting for deployment  
**Next Step:** Run `vercel --prod` in vision-ai folder  
**Time Required:** 5-10 minutes
