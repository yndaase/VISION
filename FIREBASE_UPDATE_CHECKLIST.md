# Firebase Config Update Checklist

## 🔒 PROTECTED - DO NOT TOUCH (Vision AI)

These files use `vision-edu-491909` and will remain unchanged:

```
✅ vision-ai/firebase.js
✅ vision-ai/login.js  
✅ vision-ai/app.js
✅ vision-ai/chat-app.js
✅ vision-ai/engine/ai-engine.js
✅ vision-ai/api/chat.js
✅ All other files in vision-ai/ folder
```

---

## 🔄 WILL UPDATE (Main Site)

These files currently use `vision-education-8a794` and will be updated:

### 1. `/firebase.js` (Line 30-37)
**Current:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCCLvmFR4NU6aIbDc-75EsBL-K9pqlNa5E",
  authDomain: "vision-education-8a794.firebaseapp.com",
  projectId: "vision-education-8a794",
  storageBucket: "vision-education-8a794.appspot.com",
  messagingSenderId: "324420775871",
  appId: "1:324420775871:web:b0371a1561be77b085fb0a",
  measurementId: "G-CCQSKNZKKW"
};
```
**Will Replace With:** Your new config

---

### 2. `/sessions.js` (Line 15-22)
**Current:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCCLvmFR4NU6aIbDc-75EsBL-K9pqlNa5E",
  authDomain: "vision-education-8a794.firebaseapp.com",
  projectId: "vision-education-8a794",
  storageBucket: "vision-education-8a794.appspot.com",
  messagingSenderId: "324420775871",
  appId: "1:324420775871:web:b0371a1561be77b085fb0a",
  measurementId: "G-CCQSKNZKKW"
};
```
**Will Replace With:** Your new config

---

### 3. `/saml-login.html` (Line 130-136)
**Current:**
```javascript
const app  = initializeApp({
    apiKey:            "AIzaSyCCLvmFR4NU6aIbDc-75EsBL-K9pqlNa5E",
    authDomain:        "vision-education-8a794.firebaseapp.com",
    projectId:         "vision-education-8a794",
    storageBucket:     "vision-education-8a794.appspot.com",
    messagingSenderId: "324420775871",
    appId:             "1:324420775871:web:b0371a1561be77b085fb0a"
});
```
**Will Replace With:** Your new config

---

## 📋 Files That Import Firebase (No Direct Update Needed)

These files import from the above files, so they'll automatically use the new config:

```
✅ /auth.js                    → Imports from firebase.js
✅ /dashboard.js               → Imports from firebase.js
✅ /dashboard.html             → Loads firebase.js via <script>
✅ /admin.html                 → Loads firebase.js via <script>
✅ /materials.js               → Uses window.fbGetMaterials()
✅ /waec-past-questions.js     → Uses window.fbGetUser()
```

---

## 🎯 Summary

**Total Files to Update:** 3
- `/firebase.js`
- `/sessions.js`
- `/saml-login.html`

**Total Files Protected:** All files in `vision-ai/` folder

**Risk of Breaking Vision AI:** 0% (completely separate)

---

## Ready to Update?

Once you create your new Firebase project and provide the config, just say:

**"Here's my new Firebase config: [paste config]"**

And I'll update all 3 files instantly while keeping Vision AI completely safe! 🚀
