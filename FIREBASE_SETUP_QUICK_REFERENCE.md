# Firebase Setup - Quick Reference Card

## 🎯 Project: vision-education-main

---

## ✅ Step-by-Step Checklist

### 1️⃣ GCP Resource Location
**URL:** https://console.firebase.google.com/project/vision-education-main/settings/general

- [ ] Opened URL
- [ ] Found "Default GCP resource location"
- [ ] Selected `europe-west1` (if not already set)
- [ ] Clicked "Done"
- [ ] Waited 2 minutes

**Status:** _______________

---

### 2️⃣ Firestore Database
**URL:** https://console.firebase.google.com/project/vision-education-main/firestore

- [ ] Opened URL
- [ ] Clicked "Create database" (if needed)
- [ ] Selected "Production mode"
- [ ] Clicked "Enable"
- [ ] Database created successfully

**Status:** _______________

---

### 3️⃣ Firestore Rules
**URL:** https://console.firebase.google.com/project/vision-education-main/firestore/rules

- [ ] Opened URL
- [ ] Clicked "Rules" tab
- [ ] Deleted old rules
- [ ] Pasted new rules from guide
- [ ] Clicked "Publish"
- [ ] Saw "Rules published successfully"

**Status:** _______________

---

### 4️⃣ Authentication
**URL:** https://console.firebase.google.com/project/vision-education-main/authentication

- [ ] Opened URL
- [ ] Clicked "Get started" (if needed)
- [ ] Enabled Email/Password provider
- [ ] Enabled Google provider
- [ ] Added authorized domains
- [ ] Saved changes

**Status:** _______________

---

### 5️⃣ Storage
**URL:** https://console.firebase.google.com/project/vision-education-main/storage

- [ ] Opened URL
- [ ] Clicked "Get started" (if needed)
- [ ] Selected "Production mode"
- [ ] Clicked "Done"
- [ ] Storage enabled successfully

**Status:** _______________

---

### 6️⃣ Storage Rules
**URL:** https://console.firebase.google.com/project/vision-education-main/storage/rules

- [ ] Opened URL
- [ ] Clicked "Rules" tab
- [ ] Deleted old rules
- [ ] Pasted new rules from guide
- [ ] Clicked "Publish"
- [ ] Saw "Rules published successfully"

**Status:** _______________

---

### 7️⃣ Google Cloud Verification
**URL:** https://console.cloud.google.com/

- [ ] Opened URL
- [ ] Found "vision-education-main" in project list
- [ ] Selected project
- [ ] Verified APIs enabled
- [ ] No errors shown

**Status:** _______________

---

### 8️⃣ Testing
**URL:** https://visionedu.online/dashboard

- [ ] Cleared browser cache (Ctrl+Shift+Delete)
- [ ] Opened dashboard
- [ ] Opened DevTools (F12)
- [ ] Checked console for errors
- [ ] No permission errors ✅
- [ ] Vision AI still works ✅

**Status:** _______________

---

## 🎯 Quick URLs

| Service | URL |
|---------|-----|
| Firebase Console | https://console.firebase.google.com/project/vision-education-main |
| Settings | https://console.firebase.google.com/project/vision-education-main/settings/general |
| Firestore | https://console.firebase.google.com/project/vision-education-main/firestore |
| Authentication | https://console.firebase.google.com/project/vision-education-main/authentication |
| Storage | https://console.firebase.google.com/project/vision-education-main/storage |
| Google Cloud | https://console.cloud.google.com/home/dashboard?project=vision-education-main |

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Can't create database | Set GCP location first (Step 1) |
| Permission errors | Wait 2 min, clear cache, try incognito |
| APIs not enabled | Enable in Google Cloud Console |
| Vision AI broken | Check it uses `vision-edu-491909` |

---

## 📊 Expected Console Output

**BEFORE (Errors):**
```
❌ Firebase Session Registration blocked: Missing or insufficient permissions
❌ [Firebase] syncStateToCloud failed: Missing or insufficient permissions
```

**AFTER (Success):**
```
✅ [Sessions] Session registered successfully
✅ [Firebase] Stats synced for user@example.com
```

---

## 🎯 Success Criteria

All of these should be true:

- ✅ GCP resource location is set
- ✅ Firestore database exists
- ✅ Firestore rules published
- ✅ Email & Google auth enabled
- ✅ Storage enabled
- ✅ Storage rules published
- ✅ Project visible in Google Cloud
- ✅ No console errors on dashboard
- ✅ Vision AI still works

---

**Time Required:** 15-20 minutes  
**Difficulty:** Easy (just follow steps)  
**Risk:** Zero (Vision AI protected)

---

## 📞 Where Are You?

**Current Step:** _______________

**What You See:** _______________

**Any Errors:** _______________

---

**Start with Step 1 and work through each step in order!** 🚀
