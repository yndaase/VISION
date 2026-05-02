# Vision AI - Domain Structure

## 🌐 Domain Configuration

### Primary Domain: `ai.visionedu.online`

All Vision AI pages are served from this subdomain.

---

## 📍 URL Structure

### Internal Pages (ai.visionedu.online)

| URL | File | Purpose | Auth Required |
|-----|------|---------|---------------|
| `/` | `index.html` | Landing page | No |
| `/chat` | `chat.html` | Chat interface | Yes |
| `/login` | `login.html` | Authentication | No |
| `/api/chat` | `api/chat.js` | API endpoint | No |

### External Links (visionedu.online)

| URL | Purpose | Opens In |
|-----|---------|----------|
| `https://visionedu.online` | Main platform | New tab |
| `https://visionedu.online/dashboard` | Student dashboard | New tab |
| `https://visionedu.online/ai-learning` | Learning hub | New tab |
| `https://visionedu.online/login` | Main site login | New tab |

---

## 🔗 Navigation Flow

### Homepage (`/`)
```
ai.visionedu.online
    ↓
Landing page with features
    ↓
Actions:
- "Start Learning" → /chat (internal)
- "Main Platform" → visionedu.online (external, new tab)
```

### Chat Interface (`/chat`)
```
ai.visionedu.online/chat
    ↓
User dropdown menu:
- Home → / (internal, same tab)
- Main Dashboard → visionedu.online/dashboard (external, new tab)
- Learning Hub → visionedu.online/ai-learning (external, new tab)
- Logout → /login (internal, same tab)
```

### Login Page (`/login`)
```
ai.visionedu.online/login
    ↓
Links:
- Create Account → visionedu.online/login (external, new tab)
- Forgot Password → visionedu.online/login (external, new tab)
- Back to Main Site → visionedu.online (external, new tab)
    ↓
After login:
- Redirect → /chat (internal, same tab)
```

---

## 🎨 Assets & Resources

### Shared Assets (from main site)

These assets are loaded from the main site CDN:

```html
<!-- Favicon -->
<link rel="icon" href="https://visionedu.online/favicon.png" />

<!-- Open Graph Image -->
<meta property="og:image" content="https://visionedu.online/assets/logo.png" />
```

**Why?**
- Consistent branding across platforms
- No asset duplication
- Centralized asset management
- Faster deployment

### Local Assets (vision-ai specific)

```
vision-ai/
├── styles.css              # Chat interface styles
├── login-styles.css        # Login page styles
├── app.js                  # Chat functionality
├── login.js                # Auth functionality
└── firebase-config.js      # Firebase setup
```

---

## 🔒 Authentication Flow

### Session Storage
```javascript
const SESSION_KEY = "waec_session";

// Stored in both:
sessionStorage.setItem(SESSION_KEY, userData);  // Cleared on tab close
localStorage.setItem(SESSION_KEY, userData);     // Persists
```

### Auth Guard (chat.html)
```javascript
if (!session) {
  window.location.href = "/login";  // Relative path
}
```

### Login Redirect (login.js)
```javascript
// After successful login
window.location.href = '/chat';  // Relative path

// If already logged in
window.location.href = '/chat';  // Relative path
```

---

## 📊 Domain Separation

### Vision AI Subdomain (ai.visionedu.online)
**Purpose:** Standalone AI learning assistant

**Features:**
- Self-contained chat interface
- Independent authentication
- Separate session management
- Own API endpoints

**Benefits:**
- Can be deployed independently
- Separate scaling
- Isolated from main site issues
- Cleaner URL structure

### Main Site (visionedu.online)
**Purpose:** Full learning platform

**Features:**
- Student dashboard
- Course materials
- WAEC past questions
- User management
- Admin panels

**Integration:**
- Links to Vision AI
- Shared authentication (optional)
- Shared branding assets
- Cross-platform navigation

---

## 🔄 Cross-Domain Communication

### From Main Site → Vision AI
```html
<!-- Link to Vision AI -->
<a href="https://ai.visionedu.online">Try Vision AI</a>
<a href="https://ai.visionedu.online/chat">Chat with AI</a>
```

### From Vision AI → Main Site
```html
<!-- Link to main platform -->
<a href="https://visionedu.online" target="_blank">Main Platform</a>
<a href="https://visionedu.online/dashboard" target="_blank">Dashboard</a>
```

### Shared Session (Future Enhancement)
```javascript
// Could implement cross-domain session sharing
// Using secure cookies or token-based auth
// For seamless user experience
```

---

## 🧪 Testing Checklist

### Internal Navigation (Same Tab)
- [ ] `/` → `/chat` works
- [ ] `/chat` → `/` works
- [ ] `/login` → `/chat` works
- [ ] `/chat` logout → `/login` works

### External Navigation (New Tab)
- [ ] `/` → `visionedu.online` opens new tab
- [ ] `/chat` → `visionedu.online/dashboard` opens new tab
- [ ] `/chat` → `visionedu.online/ai-learning` opens new tab
- [ ] `/login` → `visionedu.online/login` opens new tab

### Assets Loading
- [ ] Favicon loads from main site
- [ ] OG image loads from main site
- [ ] Local CSS loads correctly
- [ ] Local JS loads correctly

### Authentication
- [ ] Login redirects to `/chat`
- [ ] Chat redirects to `/login` when not authenticated
- [ ] Session persists across page reloads
- [ ] Logout clears session and redirects

---

## 🚀 Deployment Configuration

### DNS Setup
```
Type: CNAME
Name: ai
Target: cname.vercel-dns.com
TTL: Auto
```

### Vercel Routes
```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/chat", "dest": "/chat.html" },
    { "src": "/login", "dest": "/login.html" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

### Environment Variables
```bash
# None required for core functionality
# Optional: Firebase credentials for chat history
```

---

## 📝 Best Practices

### ✅ DO:
- Use relative paths for internal navigation (`/chat`, `/login`)
- Use full URLs for external links (`https://visionedu.online`)
- Add `target="_blank"` for external links
- Keep session management consistent
- Test all navigation flows

### ❌ DON'T:
- Use `.html` extensions in URLs (`/login.html` ❌)
- Mix internal and external domains
- Forget to add `target="_blank"` for external links
- Hardcode full URLs for internal pages
- Duplicate assets unnecessarily

---

## 🎯 Summary

**Vision AI Domain:** `ai.visionedu.online`
- Standalone AI learning assistant
- Self-contained with own pages and API
- Links to main site for extended features
- Shares branding assets for consistency

**Main Site Domain:** `visionedu.online`
- Full learning platform
- Links to Vision AI for AI features
- Provides shared assets (favicon, logo)
- Separate but integrated experience

**Result:** Clean separation with seamless integration! 🎉

---

**Updated:** May 2, 2026  
**Version:** 2.0.0  
**Status:** ✅ All domains properly configured
