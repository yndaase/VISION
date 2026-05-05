# Firebase Project Separation Plan

## Current Setup

### Vision AI Site (vision-ai/ folder) ✅ KEEP AS IS
- **Firebase Project:** `vision-edu-491909`
- **Status:** Working correctly, DO NOT TOUCH
- **Files:**
  - `vision-ai/firebase.js`
  - `vision-ai/login.js`
  - All files in `vision-ai/` folder

### Main Site (root folder) ⚠️ NEEDS NEW FIREBASE
- **Current Firebase Project:** `vision-education-8a794` (PROBLEMATIC)
- **Status:** Permission errors, needs replacement
- **Files to Update:**
  - `firebase.js` (root)
  - `sessions.js` (root)
  - `saml-login.html` (root)

---

## Action Plan

### Phase 1: Create New Firebase Project (Manual)

Follow `NEW_FIREBASE_SETUP_GUIDE.md` to:
1. Create new Firebase project (e.g., `vision-education-main-2026`)
2. Enable Authentication (Email/Password + Google)
3. Create Firestore Database
4. Deploy Firestore Rules
5. Enable Storage
6. Deploy Storage Rules
7. **Copy the new Firebase config**

### Phase 2: Update Main Site Files (Automated)

Once you provide the new Firebase config, I will update:

#### Files to Update:
1. ✅ `firebase.js` - Main site Firebase initialization
2. ✅ `sessions.js` - Session management
3. ✅ `saml-login.html` - SAML authentication page

#### Files to NOT Touch:
- ❌ `vision-ai/firebase.js` - Vision AI config (different project)
- ❌ `vision-ai/login.js` - Vision AI auth
- ❌ Any file in `vision-ai/` folder

### Phase 3: Clear Cache & Test

1. Clear browser cache (Ctrl+Shift+Delete)
2. Test main site login
3. Verify no permission errors
4. Test Vision AI separately (should still work)

---

## File Mapping

### Main Site Files (WILL UPDATE)
```
/firebase.js                    → New config
/sessions.js                    → New config
/saml-login.html               → New config
/auth.js                       → No config (uses firebase.js)
/dashboard.html                → No config (uses firebase.js)
/dashboard.js                  → No config (uses firebase.js)
```

### Vision AI Files (WILL NOT TOUCH)
```
/vision-ai/firebase.js         → Keep existing (vision-edu-491909)
/vision-ai/login.js            → Keep existing
/vision-ai/app.js              → Keep existing
/vision-ai/chat-app.js         → Keep existing
```

---

## Safety Checks

Before updating any file, I will:
1. ✅ Verify it's NOT in the `vision-ai/` folder
2. ✅ Check it doesn't import from `vision-ai/firebase.js`
3. ✅ Confirm it's part of the main site
4. ✅ Create backup of original config

---

## Next Steps

**Please provide your new Firebase config in this format:**

```javascript
const firebaseConfig = {
  apiKey: "YOUR-NEW-API-KEY",
  authDomain: "your-new-project.firebaseapp.com",
  projectId: "your-new-project-id",
  storageBucket: "your-new-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx",
  measurementId: "G-XXXXXXXXXX"
};
```

Once you provide this, I will:
1. Update ONLY the 3 main site files
2. Leave Vision AI completely untouched
3. Clear version cache parameters
4. Test for conflicts

---

## Verification Checklist

After deployment:
- [ ] Main site login works
- [ ] Main site has no Firebase errors
- [ ] Vision AI login still works (unchanged)
- [ ] Vision AI chat still works (unchanged)
- [ ] No cross-contamination between projects
- [ ] Both sites can run simultaneously

---

**Status:** Waiting for new Firebase config
**Risk Level:** Low (Vision AI protected)
**Estimated Time:** 5 minutes after config provided
