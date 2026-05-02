# Vision AI - Vercel Deployment Guide

Complete step-by-step guide to deploy Vision AI to **ai.visionedu.online**

## 🎯 Prerequisites

- [x] GitHub account
- [x] Vercel account (free tier works)
- [x] Domain access (visionedu.online)
- [x] Firebase project setup

## 📋 Step-by-Step Deployment

### Step 1: Prepare the Repository

```bash
# Navigate to vision-ai folder
cd vision-ai

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial Vision AI setup"

# Create GitHub repository (if new)
# Go to github.com/new and create "vision-ai" repository

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/vision-ai.git

# Push to GitHub
git push -u origin master
```

### Step 2: Connect to Vercel

#### Option A: Using Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? vision-ai
# - Directory? ./ (current directory)
# - Override settings? No

# Deploy to production
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Repository**
   - Click "Import Git Repository"
   - Select your GitHub account
   - Find and select "vision-ai" repository
   - Click "Import"

3. **Configure Project**
   ```
   Project Name: vision-ai
   Framework Preset: Other
   Root Directory: ./
   Build Command: (leave empty)
   Output Directory: (leave empty)
   Install Command: npm install
   ```

4. **Click "Deploy"**
   - Wait for deployment (usually 1-2 minutes)
   - You'll get a URL like: `vision-ai-xyz.vercel.app`

### Step 3: Add Custom Domain

#### In Vercel Dashboard:

1. **Go to Project Settings**
   - Select your "vision-ai" project
   - Click "Settings" → "Domains"

2. **Add Domain**
   - Click "Add"
   - Enter: `ai.visionedu.online`
   - Click "Add"

3. **Vercel will show DNS instructions**
   ```
   Type: CNAME
   Name: ai
   Value: cname.vercel-dns.com
   ```

#### In Your DNS Provider (Cloudflare/GoDaddy/etc):

**For Cloudflare:**
1. Go to Cloudflare Dashboard
2. Select domain: `visionedu.online`
3. Go to "DNS" → "Records"
4. Click "Add record"
5. Configure:
   ```
   Type: CNAME
   Name: ai
   Target: cname.vercel-dns.com
   Proxy status: Proxied (orange cloud ON)
   TTL: Auto
   ```
6. Click "Save"

**For GoDaddy:**
1. Go to GoDaddy DNS Management
2. Click "Add" → "CNAME"
3. Configure:
   ```
   Host: ai
   Points to: cname.vercel-dns.com
   TTL: 1 Hour
   ```
4. Click "Save"

**For Namecheap:**
1. Go to Domain List → Manage
2. Advanced DNS → Add New Record
3. Configure:
   ```
   Type: CNAME Record
   Host: ai
   Value: cname.vercel-dns.com
   TTL: Automatic
   ```
4. Click "Save"

### Step 4: Verify Deployment

1. **Wait for DNS Propagation** (5-30 minutes)
   ```bash
   # Check DNS propagation
   nslookup ai.visionedu.online
   
   # Or use online tool
   # https://dnschecker.org
   ```

2. **Test the Site**
   - Visit: https://ai.visionedu.online
   - Should redirect to login page
   - Test Google Sign-In
   - Test email login

3. **Check SSL Certificate**
   - Vercel automatically provisions SSL
   - Look for padlock icon in browser
   - Certificate should be valid

### Step 5: Configure Environment Variables (Optional)

If you need environment variables:

1. **In Vercel Dashboard**
   - Go to Project → Settings → Environment Variables

2. **Add Variables**
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   GOOGLE_CLIENT_ID=your_client_id
   ```

3. **Redeploy**
   ```bash
   vercel --prod
   ```

## 🔄 Continuous Deployment

### Automatic Deployments

Once connected, Vercel will automatically deploy:

- **Production:** Every push to `master` branch
- **Preview:** Every pull request
- **Instant:** Changes go live in ~30 seconds

### Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
vercel --prod --branch=main
```

## 🧪 Testing Checklist

After deployment, test these features:

- [ ] Homepage loads at `ai.visionedu.online`
- [ ] Redirects to login when not authenticated
- [ ] Google Sign-In works
- [ ] Email login works
- [ ] Chat interface loads after login
- [ ] Messages send and receive
- [ ] User profile displays correctly
- [ ] Logout works
- [ ] Mobile responsive design works
- [ ] SSL certificate is valid

## 🐛 Common Issues & Solutions

### Issue 1: "Domain not found"
**Cause:** DNS not propagated yet  
**Solution:** Wait 24-48 hours, check DNS with `nslookup`

### Issue 2: "404 Not Found"
**Cause:** Incorrect root directory  
**Solution:** Ensure Root Directory is `./` in Vercel settings

### Issue 3: "Firebase not initialized"
**Cause:** Missing Firebase config  
**Solution:** Check `firebase-config.js` exists and has correct credentials

### Issue 4: "Google Sign-In blocked"
**Cause:** Domain not authorized  
**Solution:** 
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. Add `ai.visionedu.online` to Authorized JavaScript origins
5. Add `https://ai.visionedu.online` to Authorized redirect URIs

### Issue 5: "Mixed Content Error"
**Cause:** HTTP resources on HTTPS page  
**Solution:** Ensure all resources use HTTPS URLs

### Issue 6: "Build Failed"
**Cause:** Missing dependencies  
**Solution:** Check `package.json` and run `npm install` locally first

## 📊 Monitoring & Analytics

### Vercel Analytics
- Automatically enabled
- View at: `vercel.com/your-project/analytics`
- Shows: Page views, unique visitors, top pages

### Vercel Logs
- Real-time logs: `vercel logs`
- View in dashboard: Project → Deployments → Click deployment → Logs

### Firebase Monitoring
- Auth users: Firebase Console → Authentication
- Firestore data: Firebase Console → Firestore Database
- Usage: Firebase Console → Usage and billing

## 🔐 Security Checklist

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables secured
- [ ] Firebase rules configured
- [ ] Google OAuth restricted to your domain
- [ ] CORS configured correctly
- [ ] CSP headers set (in vercel.json)

## 🚀 Performance Optimization

### Vercel Edge Network
- Automatic CDN distribution
- Global edge caching
- Instant cache invalidation

### Optimization Tips
1. **Enable Compression**
   - Vercel does this automatically

2. **Optimize Images**
   - Use WebP format
   - Lazy load images

3. **Minimize JavaScript**
   - Remove unused code
   - Use code splitting

4. **Cache Static Assets**
   - Vercel handles this automatically

## 📱 Mobile Testing

Test on multiple devices:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Desktop (Chrome, Firefox, Safari, Edge)

Use browser dev tools:
```
Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
```

## 🔄 Rollback Procedure

If something goes wrong:

1. **Via Vercel Dashboard**
   - Go to Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Via CLI**
   ```bash
   # List deployments
   vercel ls
   
   # Promote specific deployment
   vercel promote <deployment-url>
   ```

## 📞 Support Resources

- **Vercel Support:** https://vercel.com/support
- **Vercel Discord:** https://vercel.com/discord
- **Documentation:** https://vercel.com/docs
- **Status Page:** https://www.vercel-status.com

## ✅ Post-Deployment Checklist

- [ ] Domain resolves correctly
- [ ] SSL certificate active
- [ ] All pages load
- [ ] Authentication works
- [ ] API endpoints respond
- [ ] Firebase connected
- [ ] Analytics tracking
- [ ] Error monitoring setup
- [ ] Backup strategy in place
- [ ] Team members have access

## 🎉 Success!

Your Vision AI is now live at **https://ai.visionedu.online**

Next steps:
1. Monitor analytics
2. Gather user feedback
3. Iterate and improve
4. Scale as needed

---

**Deployment Date:** May 2, 2026  
**Deployed By:** Vision Education Team  
**Status:** ✅ Production Ready
