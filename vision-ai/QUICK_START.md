# Vision AI - Quick Start Guide

Deploy Vision AI to **ai.visionedu.online** in 5 minutes!

## 🚀 Fastest Deployment Method

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Navigate to Project
```bash
cd vision-ai
```

### 3. Deploy
```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 4. Add Custom Domain

In Vercel Dashboard:
1. Go to your project → Settings → Domains
2. Add domain: `ai.visionedu.online`
3. Copy the CNAME record shown

### 5. Update DNS

In your DNS provider (Cloudflare/GoDaddy/etc):
```
Type: CNAME
Name: ai
Value: cname.vercel-dns.com
```

### 6. Done! ✅

Visit: **https://ai.visionedu.online**

---

## 📋 Alternative: GitHub + Vercel Integration

### 1. Push to GitHub
```bash
git add .
git commit -m "Deploy Vision AI"
git push origin master
```

### 2. Connect to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select `vision-ai` folder as root
4. Click "Deploy"

### 3. Add Custom Domain
Follow steps 4-5 above

---

## 🔧 Configuration Checklist

Before deploying, ensure:

- [ ] Firebase config is set up
- [ ] Google OAuth Client ID is correct
- [ ] API endpoints are configured
- [ ] Environment variables are set (if needed)

---

## 📞 Need Help?

- **Full Guide:** See `DEPLOYMENT_GUIDE.md`
- **Documentation:** See `README.md`
- **Support:** support@visionedu.online

---

**Estimated Time:** 5-10 minutes  
**Difficulty:** Easy  
**Cost:** Free (Vercel free tier)
