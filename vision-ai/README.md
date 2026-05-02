# Vision AI - WASSCE Intelligence Engine

AI-powered learning assistant for WASSCE students deployed at **ai.visionedu.online**

## 🚀 Features

- **Modern Authentication** - Google OAuth + Email/Password
- **AI Chat Interface** - Real-time Q&A with WASSCE focus
- **Subject Filtering** - Filter by Core Maths, English, Science, etc.
- **Chat History** - Firebase-powered conversation persistence
- **User Profiles** - Avatar display with Google profile pictures
- **Responsive Design** - Works on mobile and desktop

## 📁 Project Structure

```
vision-ai/
├── index.html              # Main AI chat interface
├── login.html              # Authentication page
├── styles.css              # Main app styles
├── login-styles.css        # Login page styles
├── app.js                  # Main application logic
├── login.js                # Login functionality
├── firebase-config.js      # Firebase configuration
├── api/                    # Backend API endpoints
│   └── chat.js            # Chat API endpoint
├── package.json            # Project dependencies
├── vercel.json             # Vercel configuration
└── README.md               # This file
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd vision-ai
npm install
```

### 2. Configure Firebase

Create `firebase-config.js` with your Firebase credentials:

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 3. Local Development

```bash
# Install Vercel CLI globally
npm install -g vercel

# Run development server
vercel dev
```

Visit: `http://localhost:3000`

## 🌐 Deployment to Vercel

### Method 1: Vercel CLI (Recommended)

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Method 2: GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial Vision AI deployment"
   git push origin master
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `vision-ai` folder as root directory
   - Click "Deploy"

3. **Configure Custom Domain**
   - Go to Project Settings → Domains
   - Add custom domain: `ai.visionedu.online`
   - Update your DNS records:
     ```
     Type: CNAME
     Name: ai
     Value: cname.vercel-dns.com
     ```

### Method 3: Vercel Dashboard

1. **Create New Project**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Set Root Directory to `vision-ai`

2. **Configure Build Settings**
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `npm install`

3. **Add Environment Variables** (if needed)
   - `FIREBASE_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - etc.

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

## 🔐 Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
GOOGLE_CLIENT_ID=your_google_client_id
```

## 📝 DNS Configuration

### For Cloudflare:

1. Go to Cloudflare Dashboard
2. Select your domain: `visionedu.online`
3. Go to DNS → Records
4. Add CNAME record:
   ```
   Type: CNAME
   Name: ai
   Target: cname.vercel-dns.com
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   ```

### For Other DNS Providers:

```
Type: CNAME
Host: ai
Value: cname.vercel-dns.com
TTL: 3600
```

## 🔄 Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `master`
- Create preview deployments for pull requests
- Run build checks before deployment

## 🧪 Testing

### Local Testing
```bash
# Start dev server
vercel dev

# Test login
open http://localhost:3000/login.html

# Test main app
open http://localhost:3000
```

### Production Testing
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 📊 Monitoring

### Vercel Analytics
- Automatically enabled
- View at: vercel.com/your-project/analytics

### Firebase Console
- Monitor auth: console.firebase.google.com
- Check Firestore: Database → Data
- View logs: Functions → Logs

## 🐛 Troubleshooting

### Issue: "Domain not found"
**Solution:** Wait 24-48 hours for DNS propagation

### Issue: "Firebase not initialized"
**Solution:** Check `firebase-config.js` is properly configured

### Issue: "Google Sign-In not working"
**Solution:** 
1. Verify Google Client ID in `login.html`
2. Add `ai.visionedu.online` to authorized domains in Google Console

### Issue: "404 on API routes"
**Solution:** Ensure `vercel.json` routes are configured correctly

## 📚 Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google OAuth Setup](https://developers.google.com/identity/gsi/web/guides/overview)

## 🔗 Links

- **Production:** https://ai.visionedu.online
- **Main Site:** https://visionedu.online
- **Dashboard:** https://visionedu.online/dashboard

## 📄 License

MIT License - Vision Education © 2026

## 👥 Support

For issues or questions:
- Email: support@visionedu.online
- GitHub Issues: Create an issue in the repository

---

**Last Updated:** May 2, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
