# ✨ Vision AI - Clean URLs Reference

## 🌐 URL Structure

Vision AI uses **clean URLs** without file extensions for a professional look.

---

## ✅ Correct URLs (Use These)

### Public Pages
```
https://ai.visionedu.online/          ← Homepage
https://ai.visionedu.online/login     ← Login page
https://ai.visionedu.online/chat      ← Chat interface
```

### API Endpoint
```
https://ai.visionedu.online/api/chat  ← API endpoint
```

---

## ❌ Incorrect URLs (Don't Use These)

```
https://ai.visionedu.online/login.html     ❌ Wrong
https://ai.visionedu.online/chat.html      ❌ Wrong
https://ai.visionedu.online/index.html     ❌ Wrong
```

---

## 🔧 How It Works

The `vercel.json` configuration automatically rewrites clean URLs:

```json
{
  "rewrites": [
    { "source": "/chat", "destination": "/chat.html" },
    { "source": "/login", "destination": "/login.html" }
  ]
}
```

**What this means:**
- User visits: `/chat`
- Vercel serves: `/chat.html`
- URL stays clean: `/chat`

---

## 📋 For Google OAuth Configuration

When adding authorized redirect URIs in Google Cloud Console, use:

```
https://ai.visionedu.online/login
https://ai.visionedu.online/chat
https://ai.visionedu.online
```

**NOT:**
```
https://ai.visionedu.online/login.html  ❌
https://ai.visionedu.online/chat.html   ❌
```

---

## 🔗 Internal Links

When linking between pages, always use clean URLs:

### ✅ Correct
```html
<a href="/chat">Go to Chat</a>
<a href="/login">Login</a>
<a href="/">Home</a>
```

### ❌ Incorrect
```html
<a href="/chat.html">Go to Chat</a>     ❌
<a href="/login.html">Login</a>         ❌
<a href="/index.html">Home</a>          ❌
```

---

## 🧪 Testing

Test all URLs work correctly:

```bash
# Homepage
curl -I https://ai.visionedu.online/
# Should return: 200 OK

# Login page
curl -I https://ai.visionedu.online/login
# Should return: 200 OK

# Chat page
curl -I https://ai.visionedu.online/chat
# Should return: 200 OK

# API endpoint
curl -X POST https://ai.visionedu.online/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"test","sessionId":"test"}'
# Should return: JSON response
```

---

## 📱 User Experience

Clean URLs provide:
- ✅ Professional appearance
- ✅ Easy to remember
- ✅ Better for SEO
- ✅ Shareable links
- ✅ No technical file extensions

---

## 🎯 Quick Reference

| Page | Clean URL | File |
|------|-----------|------|
| Homepage | `/` | `index.html` |
| Login | `/login` | `login.html` |
| Chat | `/chat` | `chat.html` |
| API | `/api/chat` | `api/chat.js` |

---

**Remember:** Always use clean URLs like `/chat` and `/login` (no `.html`)!
