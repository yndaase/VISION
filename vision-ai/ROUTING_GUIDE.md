# Vision AI - Routing Guide

## 🗺️ URL Structure

### Public Routes (No Authentication Required)

#### **Homepage** - `/` or `https://ai.visionedu.online/`
- **File:** `index.html`
- **Purpose:** Landing page with features and CTA
- **Content:**
  - Hero section with logo
  - Feature cards
  - Statistics
  - Call-to-action buttons
- **Actions:**
  - "Start Learning" → Redirects to `/chat`
  - "Main Platform" → Links to `https://visionedu.online`

#### **Login** - `/login` or `https://ai.visionedu.online/login`
- **File:** `login.html`
- **Purpose:** Authentication page
- **Features:**
  - Google OAuth sign-in
  - Email/password login
  - Session management
- **Redirects:**
  - After successful login → `/chat`
  - If already logged in → `/chat`

### Protected Routes (Authentication Required)

#### **Chat Interface** - `/chat` or `https://ai.visionedu.online/chat`
- **File:** `chat.html`
- **Purpose:** Main AI chat interface
- **Auth Guard:** Redirects to `/login` if not authenticated
- **Features:**
  - AI chat interface
  - Subject filtering
  - User profile
  - Chat history
  - Logout option

---

## 🔄 User Flow

### New User Journey
```
1. Visit ai.visionedu.online
   ↓
2. See homepage with features
   ↓
3. Click "Start Learning"
   ↓
4. Redirected to /login
   ↓
5. Sign in with Google or Email
   ↓
6. Redirected to /chat
   ↓
7. Start using Vision AI
```

### Returning User Journey
```
1. Visit ai.visionedu.online
   ↓
2. See homepage
   ↓
3. Click "Start Learning"
   ↓
4. Redirected to /chat (session exists)
   ↓
5. Start using Vision AI immediately
```

### Direct Chat Access
```
1. Visit ai.visionedu.online/chat
   ↓
2. Auth guard checks session
   ↓
3a. If logged in → Show chat interface
3b. If not logged in → Redirect to /login
   ↓
4. After login → Return to /chat
```

---

## 🛠️ Technical Implementation

### Vercel Routes (`vercel.json`)

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/chat",
      "dest": "/chat.html"
    },
    {
      "src": "/login",
      "dest": "/login.html"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### Auth Guard (`chat.html`)

```javascript
(function() {
  const SESSION_KEY = "waec_session";
  const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!session) {
    window.location.href = "/login";
  }
})();
```

### Login Redirect (`login.js`)

```javascript
// After successful login
window.location.href = '/chat';

// If already logged in
if (session) {
  window.location.href = '/chat';
}
```

---

## 📱 Navigation Links

### From Homepage (`index.html`)
- **Start Learning** → `/chat`
- **Main Platform** → `https://visionedu.online`

### From Login Page (`login.html`)
- **Create Account** → `https://visionedu.online/login`
- **Forgot Password** → `https://visionedu.online/login`
- **Back to Main Site** → `https://visionedu.online`

### From Chat Interface (`chat.html`)
- **Dashboard** → `https://visionedu.online/dashboard`
- **AI Learning Hub** → `https://visionedu.online/ai-learning`
- **Logout** → Clears session, redirects to `/login`

---

## 🔒 Session Management

### Storage
- **sessionStorage:** Cleared when browser tab closes
- **localStorage:** Persists across browser sessions

### Session Key
```javascript
const SESSION_KEY = "waec_session";
```

### Session Data
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "picture": "https://...",
  "provider": "google",
  "role": "student"
}
```

### Logout Process
```javascript
function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '/login';
}
```

---

## 🧪 Testing Routes

### Test Homepage
```bash
curl https://ai.visionedu.online/
# Should return: index.html (landing page)
```

### Test Login
```bash
curl https://ai.visionedu.online/login
# Should return: login.html
```

### Test Chat (No Auth)
```bash
curl https://ai.visionedu.online/chat
# Should return: chat.html with redirect script
```

### Test API
```bash
curl -X POST https://ai.visionedu.online/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"Hello","sessionId":"test"}'
# Should return: JSON response
```

---

## 🐛 Troubleshooting

### Issue: Homepage shows 404
**Solution:** Ensure `index.html` exists in root of `vision-ai/` folder

### Issue: /chat redirects to /login.html (404)
**Solution:** Update redirect to `/login` (without .html)

### Issue: After login, redirects to / instead of /chat
**Solution:** Update `login.js` to redirect to `/chat`

### Issue: /chat shows blank page
**Solution:** Check browser console for JavaScript errors

### Issue: Session not persisting
**Solution:** Check if cookies/localStorage are enabled

---

## 📊 Route Summary

| Route | File | Auth Required | Purpose |
|-------|------|---------------|---------|
| `/` | `index.html` | No | Landing page |
| `/login` | `login.html` | No | Authentication |
| `/chat` | `chat.html` | Yes | Chat interface |
| `/api/chat` | `api/chat.js` | No | API endpoint |

---

## 🎯 Best Practices

1. **Always use clean URLs** - `/chat` not `/chat.html`
2. **Handle auth redirects** - Store intended destination
3. **Clear error messages** - Help users understand issues
4. **Preserve session** - Use both sessionStorage and localStorage
5. **Graceful fallbacks** - Handle missing sessions properly

---

## 🔄 Future Enhancements

### Planned Routes
- `/about` - About Vision AI
- `/help` - Help and documentation
- `/settings` - User settings
- `/history` - Chat history
- `/subjects` - Subject-specific pages

### Planned Features
- Remember intended destination before login
- Deep linking to specific topics
- Share chat conversations
- Bookmark favorite responses

---

**Updated:** May 2, 2026  
**Version:** 2.0.0  
**Status:** ✅ Routes Fixed and Working
