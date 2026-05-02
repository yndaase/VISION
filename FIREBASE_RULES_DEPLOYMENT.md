# Firebase Security Rules Deployment Guide

## 🔥 Issue: Missing or Insufficient Permissions

You're seeing this error because the Firestore security rules haven't been deployed yet:
```
[Firebase] fbSaveVisionAIMessage failed: Missing or insufficient permissions.
[Firebase] fbLoadVisionAIHistory failed: Missing or insufficient permissions.
[Firebase] fbGetVisionAISessions failed: Missing or insufficient permissions.
```

---

## Quick Fix: Deploy Rules via Firebase Console

### Method 1: Firebase Console (Easiest)

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com
   - Select project: `vision-education-8a794`

2. **Navigate to Firestore:**
   - Click "Firestore Database" in left sidebar
   - Click "Rules" tab at the top

3. **Copy the Rules:**
   - Open `firestore.rules` file in your project
   - Copy ALL the content

4. **Paste in Console:**
   - Delete existing rules in the console
   - Paste the new rules from `firestore.rules`

5. **Publish:**
   - Click "Publish" button
   - Wait for confirmation (~10 seconds)

6. **Test:**
   - Go to https://ai.visionedu.online/chat
   - Send a message
   - Check browser console - errors should be gone

---

## Method 2: Firebase CLI (Recommended for Future)

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Login to Firebase

```bash
firebase login
```

### Initialize Firebase (First Time Only)

```bash
# In your project root directory
firebase init firestore

# Select:
# - Use existing project: vision-education-8a794
# - Firestore rules file: firestore.rules
# - Firestore indexes file: firestore.indexes.json
```

### Deploy Rules

```bash
firebase deploy --only firestore:rules
```

**Expected Output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/vision-education-8a794/overview
```

---

## Verify Rules Are Deployed

### Check in Firebase Console

1. **Go to Firestore Rules:**
   - https://console.firebase.google.com/project/vision-education-8a794/firestore/rules

2. **Verify You See:**
   ```
   // Vision AI Chat History
   match /vision_ai_chats/{email}/sessions/{sessionId} {
     allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
     
     match /messages/{messageId} {
       allow read, write: if isSignedIn() && request.auth.token.email.toLowerCase() == email.toLowerCase();
     }
   }
   ```

3. **Check Published Date:**
   - Should show recent timestamp
   - Example: "Published May 2, 2026 at 3:45 PM"

---

## Test After Deployment

### 1. Clear Browser Cache

```
Chrome/Edge: Ctrl + Shift + Delete
Firefox: Ctrl + Shift + Delete
Safari: Cmd + Option + E
```

Or use Incognito/Private mode

### 2. Test Chat

1. Go to: https://ai.visionedu.online/chat
2. Log in with Google
3. Send a test message: "Hello"
4. Open browser console (F12)
5. Check for errors

**✅ Success (No Errors):**
```
[Firebase] Vision AI message saved
[Firebase] Loaded X messages for session session_abc123
```

**❌ Still Failing:**
```
[Firebase] fbSaveVisionAIMessage failed: Missing or insufficient permissions.
```

If still failing, continue to troubleshooting below.

---

## Troubleshooting

### Issue 1: Rules Not Taking Effect

**Cause:** Browser cache or Firebase cache

**Solution:**
1. Wait 1-2 minutes for rules to propagate
2. Hard refresh browser (Ctrl + Shift + R)
3. Clear browser cache completely
4. Try incognito/private mode
5. Check Firebase Console shows latest rules

### Issue 2: User Not Authenticated

**Cause:** Firebase Auth not initialized

**Solution:**
1. Check you're logged in with Google
2. Check browser console for auth errors
3. Verify `request.auth` is not null in rules
4. Try logging out and back in

### Issue 3: Email Mismatch

**Cause:** Email case sensitivity

**Solution:**
The rules use `.toLowerCase()` to handle this:
```javascript
request.auth.token.email.toLowerCase() == email.toLowerCase()
```

This should work, but verify:
1. Your email in Firebase Auth
2. The email being used in the path
3. Both are lowercase in Firestore

### Issue 4: Wrong Firebase Project

**Cause:** Multiple Firebase projects

**Solution:**
1. Verify you're in the correct project
2. Check project ID: `vision-education-8a794`
3. Check in Firebase Console URL
4. Check in `firebase-config.js`

---

## Understanding the Rules

### Vision AI Chat Rules Explained

```javascript
// Main chat collection
match /vision_ai_chats/{email}/sessions/{sessionId} {
  // Users can only access their own chats
  // {email} must match their authenticated email
  allow read, write: if isSignedIn() && 
                        request.auth.token.email.toLowerCase() == email.toLowerCase();
  
  // Messages subcollection
  match /messages/{messageId} {
    // Same permission - users can only access their own messages
    allow read, write: if isSignedIn() && 
                          request.auth.token.email.toLowerCase() == email.toLowerCase();
  }
}
```

### What This Means:

- ✅ User `john@example.com` can read/write `/vision_ai_chats/john@example.com/...`
- ❌ User `john@example.com` CANNOT read/write `/vision_ai_chats/jane@example.com/...`
- ✅ Authenticated users only (must be logged in)
- ✅ Case-insensitive email matching

---

## Firestore Structure

### How Chat History is Stored

```
vision_ai_chats/
  └── {userEmail}/
      └── sessions/
          └── {sessionId}/
              ├── lastMessage: "Hello..."
              ├── lastUpdated: "2026-05-02T..."
              ├── messageCount: 5
              └── messages/
                  ├── {messageId1}/
                  │   ├── role: "user"
                  │   ├── content: "Hello"
                  │   ├── timestamp: 1234567890
                  │   └── savedAt: "2026-05-02T..."
                  └── {messageId2}/
                      ├── role: "assistant"
                      ├── content: "Hi! How can I help?"
                      ├── source: "groq-ai"
                      ├── timestamp: 1234567891
                      └── savedAt: "2026-05-02T..."
```

### Example Paths:

```
/vision_ai_chats/student@school.com/sessions/session_abc123
/vision_ai_chats/student@school.com/sessions/session_abc123/messages/msg_001
/vision_ai_chats/student@school.com/sessions/session_xyz789
```

---

## Alternative: Temporary Open Rules (NOT RECOMMENDED)

**⚠️ WARNING: Only use for testing, NOT for production!**

If you need to test quickly, you can temporarily open the rules:

```javascript
// Vision AI Chat History - TEMPORARY OPEN ACCESS
match /vision_ai_chats/{email}/sessions/{sessionId} {
  allow read, write: if true; // ⚠️ INSECURE - Anyone can access
  
  match /messages/{messageId} {
    allow read, write: if true; // ⚠️ INSECURE - Anyone can access
  }
}
```

**After testing, IMMEDIATELY revert to secure rules!**

---

## Firebase CLI Commands Reference

### Deploy Only Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Rules and Indexes
```bash
firebase deploy --only firestore
```

### View Current Rules
```bash
firebase firestore:rules get
```

### Test Rules Locally
```bash
firebase emulators:start --only firestore
```

---

## Checklist

Before testing, ensure:

- [ ] Firestore rules deployed (via Console or CLI)
- [ ] Rules include `vision_ai_chats` collection
- [ ] Rules published successfully
- [ ] Waited 1-2 minutes for propagation
- [ ] Browser cache cleared
- [ ] Logged in with Google OAuth
- [ ] Using correct Firebase project (`vision-education-8a794`)
- [ ] No console errors about authentication
- [ ] Test message sent in chat
- [ ] Check console for Firebase success messages

---

## Success Indicators

You'll know rules are working when:

✅ No "Missing or insufficient permissions" errors  
✅ Console shows: `[Firebase] Vision AI message saved`  
✅ Console shows: `[Firebase] Loaded X messages for session...`  
✅ Chat history persists after page refresh  
✅ Sidebar shows previous chat sessions  
✅ Can click on history items to load old chats  

---

## Quick Deploy Script

Save this as `deploy-rules.sh`:

```bash
#!/bin/bash
echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules
echo "Done! Rules deployed successfully."
echo "Wait 1-2 minutes for changes to propagate."
```

Make executable and run:
```bash
chmod +x deploy-rules.sh
./deploy-rules.sh
```

---

## Need Help?

### Firebase Support
- **Console:** https://console.firebase.google.com
- **Docs:** https://firebase.google.com/docs/firestore/security
- **Support:** https://firebase.google.com/support

### Check Status
- **Firebase Status:** https://status.firebase.google.com
- **Firestore Status:** Check for any ongoing issues

### Common Resources
- **Rules Reference:** https://firebase.google.com/docs/firestore/security/rules-structure
- **Testing Rules:** https://firebase.google.com/docs/firestore/security/test-rules-emulator
- **Best Practices:** https://firebase.google.com/docs/firestore/security/rules-conditions

---

**Last Updated:** May 2, 2026  
**Firebase Project:** vision-education-8a794  
**Rules File:** `firestore.rules`
