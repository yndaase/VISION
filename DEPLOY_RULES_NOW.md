# Deploy Firestore Rules - Copy & Paste Method

## Quick Instructions (2 minutes)

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select: **vision-education-main**
   - Click: **Firestore Database** → **Rules** tab

2. **Select All Current Rules**
   - Click in the rules editor
   - Press `Ctrl+A` (Windows) or `Cmd+A` (Mac) to select all
   - Press `Delete` to clear

3. **Copy the Rules Below**
   - Select all the text in the code block below
   - Copy it (`Ctrl+C` or `Cmd+C`)

4. **Paste into Firebase Console**
   - Click in the empty rules editor
   - Paste (`Ctrl+V` or `Cmd+V`)

5. **Publish**
   - Click **Publish** button (top right)
   - Wait for "Rules published successfully"

6. **Test**
   - Refresh student dashboard
   - Materials should appear! ✅

---

## Copy This Entire Block ⬇️

\`\`\`
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isSignedIn() && 
             exists(/databases/$(database)/documents/users/$(request.auth.token.email)) &&
             get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{email} {
      // Users can read/write their own document (case-insensitive email match)
      allow read, write: if isSignedIn() && 
        (request.auth.token.email == email || 
         request.auth.token.email.lower() == email.lower());
      
      // Admins can read all users
      allow read: if isAdmin();
      
      // Admins can update any user
      allow update: if isAdmin();
      
      // User sessions subcollection
      match /sessions/{sessionId} {
        allow read, write: if isSignedIn() && 
          (request.auth.token.email == email || 
           request.auth.token.email.lower() == email.lower());
      }
    }

    // Parent Users collection
    match /parent_users/{email} {
      allow read, write: if isSignedIn() && 
        (request.auth.token.email == email || 
         request.auth.token.email.lower() == email.lower());
      allow read: if isAdmin();
    }
    
    // Materials collection (metadata only - files in R2)
    match /materials/{materialId} {
      allow read: if true;  // Public read - educational content
      allow create, update, delete: if isAdmin();
    }
    
    // Learning Materials collection (metadata only - files in R2)
    match /learning_materials/{materialId} {
      allow read: if true;  // Public read - educational content
      allow create, update, delete: if isAdmin();
    }
    
    // WAEC Past Questions collection (metadata only - files in R2)
    match /waec_questions/{questionId} {
      allow read: if true;  // Public read - educational content
      allow create, update, delete: if isAdmin();
    }
    
    // Analytics collection
    match /analytics/{docId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.token.email;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.token.email;
      allow read: if isAdmin();
    }
    
    // Study planner collection
    match /study_plans/{userId} {
      allow read, write: if isSignedIn() && userId == request.auth.token.email;
      allow read: if isAdmin();
    }
    
    // Mock exam results
    match /mock_results/{resultId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.token.email;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.token.email;
      allow read: if isAdmin();
    }

    // Student Stats collection
    match /student_stats/{email} {
      allow read, write: if isSignedIn() && 
        (request.auth.token.email == email || 
         request.auth.token.email.lower() == email.lower());
      allow read: if isAdmin();
    }

    // Student Links (Parent Linking)
    match /student_links/{code} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && 
        (request.resource.data.email == request.auth.token.email ||
         request.resource.data.email.lower() == request.auth.token.email.lower());
      allow delete: if isAdmin();
    }
    
    // System broadcasts
    match /broadcasts/{broadcastId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // Vision AI Chat History
    match /vision_ai_chats/{email}/sessions/{sessionId} {
      allow read, write: if isSignedIn() && 
        (request.auth.token.email == email || 
         request.auth.token.email.lower() == email.lower());
      
      match /messages/{messageId} {
        allow read, write: if isSignedIn() && 
          (request.auth.token.email == email || 
           request.auth.token.email.lower() == email.lower());
      }
    }
    
    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
\`\`\`

---

## Key Changes (What Makes Materials Work)

These three sections now have `allow read: if true`:

1. **materials** - Public read ✅
2. **learning_materials** - Public read ✅  
3. **waec_questions** - Public read ✅

This allows students to see materials without Firebase Auth.

## After Publishing

1. **Verify in Firebase Console**
   - Check "Last deployed" timestamp is recent
   - Look for these lines in the rules:
     ```
     match /learning_materials/{materialId} {
       allow read: if true;  // ← Should see this
     ```

2. **Test on Student Dashboard**
   - Open: https://www.visionedu.online/dashboard
   - Materials should appear immediately
   - No page refresh needed (but refresh anyway to be sure)

3. **Run Diagnostic (Optional)**
   Open browser console (F12) and run:
   ```javascript
   const materials = await window.fbGetMaterials();
   console.log('Materials found:', materials.length);
   ```
   
   Should see: `Materials found: 1` (or however many you uploaded)

## Troubleshooting

### Issue: "Syntax error" when publishing

**Solution:** Make sure you copied the ENTIRE block including the first and last lines:
- First line: `rules_version = '2';`
- Last line: `}`

### Issue: Materials still don't show

**Solution:** 
1. Check if materials exist in Firestore:
   - Firebase Console → Firestore → Data tab
   - Look for `learning_materials` collection
   - Should see documents there

2. If no documents, upload a test material from admin portal

### Issue: "Rules published successfully" but materials still don't show

**Solution:**
1. Hard refresh student dashboard: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Try incognito/private window

---

## Summary

**What to do:** Copy the rules above and paste into Firebase Console

**Time required:** 2 minutes

**Expected result:** Materials appear on student dashboard immediately

**Next step:** Do it now! 🚀
