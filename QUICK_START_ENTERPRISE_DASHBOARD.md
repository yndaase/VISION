# Quick Start: Enterprise Student Dashboard

## 🚀 Get Started in 5 Minutes

This guide will help you quickly set up and test the enterprise student dashboard.

## Step 1: Verify Files (30 seconds)

Check that these files exist in your project root:

```bash
✓ enterprise-student-dashboard.html
✓ enterprise-student-dashboard.js
✓ enterprise-student-dashboard.css
```

## Step 2: Create Test Account (2 minutes)

### Option A: Using Firebase Console

1. Go to Firebase Console → Authentication
2. Add new user:
   ```
   Email: test.student@testschool.edu
   Password: Test123!
   ```

3. Go to Firestore → users collection
4. Add document with ID matching the email:
   ```json
   {
     "email": "test.student@testschool.edu",
     "emailLower": "test.student@testschool.edu",
     "name": "Test Student",
     "role": "enterprise-student",
     "institutionId": "TESTSCHOOL001",
     "institutionName": "Test High School",
     "schoolCode": "TESTSCHOOL001",
     "provider": "email",
     "createdAt": 1715184000000,
     "status": "active"
   }
   ```

### Option B: Using Enterprise Admin Dashboard

1. Login as enterprise admin
2. Go to Students section
3. Click "Add Student"
4. Fill in:
   - Name: Test Student
   - Email: test.student@testschool.edu
   - Password: Test123!
   - Class: Form 3A

## Step 3: Test Login (1 minute)

1. Open browser to `/enterprise-login.html`
2. Select "Enterprise Student"
3. Enter credentials:
   - Email: test.student@testschool.edu
   - Password: Test123!
   - Institution Code: TESTSCHOOL001
4. Click "Login"

**Expected Result**: Redirect to `/enterprise-student-dashboard.html`

## Step 4: Verify Dashboard (1 minute)

Check that these elements appear:

### ✅ Institution Branding
- [ ] Institution name: "Test High School"
- [ ] Institution logo (letter "T")
- [ ] "ENTERPRISE" badge in navigation

### ✅ Welcome Section
- [ ] "Welcome, Test" heading
- [ ] Institution context in welcome badge
- [ ] Stats grid (Answered, Correct, Accuracy, Subjects)
- [ ] Streak widget

### ✅ Quick Actions
- [ ] 4 action cards (Practice, Mocks, AI Learning, Planner)
- [ ] Cards are clickable
- [ ] Hover effects work

### ✅ Subjects
- [ ] 8 subject cards displayed
- [ ] Each card has icon, name, description
- [ ] Cards link to practice pages

### ✅ Materials
- [ ] Materials section visible
- [ ] Shows "No materials" message (if none uploaded)
- [ ] OR shows institution materials (if uploaded)

## Step 5: Test Features (30 seconds)

### Navigation
- [ ] Click different nav items
- [ ] Check mobile bottom nav (resize browser)
- [ ] Test user dropdown menu

### Theme
- [ ] Click theme toggle button
- [ ] Verify dark/light mode switch

### Logout
- [ ] Click user dropdown
- [ ] Click "Logout"
- [ ] Verify redirect to login page

## 🎉 Success!

If all checks pass, your enterprise student dashboard is working correctly!

## 🐛 Troubleshooting

### Issue: Dashboard not loading

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Session data in localStorage/sessionStorage

**Fix:**
```javascript
// Clear session and try again
sessionStorage.clear();
localStorage.clear();
// Reload page
```

### Issue: Institution branding not showing

**Check:**
1. Session has `institutionName` field
2. Session has `institutionId` field

**Fix:**
```javascript
// In browser console
const session = JSON.parse(sessionStorage.getItem('waec_session'));
console.log(session);
// Verify institutionName and institutionId exist
```

### Issue: Materials not loading

**Check:**
1. Firestore security rules allow read
2. Materials have correct `institutionId`

**Fix:**
```javascript
// Check Firestore rules
// Verify materials collection structure
```

## 📝 Quick Test Script

Run this in browser console to verify setup:

```javascript
// Check session
const session = JSON.parse(sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session'));
console.log('Session:', session);

// Verify role
console.log('Role:', session?.role);
console.log('Is Enterprise Student:', session?.role === 'enterprise-student');

// Check institution
console.log('Institution ID:', session?.institutionId);
console.log('Institution Name:', session?.institutionName);

// Check page elements
console.log('Institution Name Element:', document.getElementById('institutionName')?.textContent);
console.log('Welcome Name Element:', document.getElementById('welcomeName')?.textContent);
console.log('Stats Answered:', document.getElementById('statAnswered')?.textContent);
```

## 🔗 Next Steps

### For Development
1. Read [ENTERPRISE_STUDENT_DASHBOARD.md](./ENTERPRISE_STUDENT_DASHBOARD.md)
2. Review [DASHBOARD_COMPARISON.md](./DASHBOARD_COMPARISON.md)
3. Check code comments in JS files

### For Deployment
1. Follow [ENTERPRISE_STUDENT_DEPLOYMENT.md](./ENTERPRISE_STUDENT_DEPLOYMENT.md)
2. Update Firestore security rules
3. Create production test accounts
4. Monitor initial usage

### For Customization
1. Update institution branding logic
2. Add custom themes
3. Implement additional features
4. Optimize performance

## 📚 Additional Resources

- **Full Documentation**: ENTERPRISE_STUDENT_DASHBOARD.md
- **Deployment Guide**: ENTERPRISE_STUDENT_DEPLOYMENT.md
- **Comparison Guide**: DASHBOARD_COMPARISON.md
- **Summary**: ENTERPRISE_DASHBOARD_SUMMARY.md

## 💬 Need Help?

- **Technical Issues**: Check browser console
- **Setup Questions**: Review deployment guide
- **Feature Requests**: Contact development team
- **Bug Reports**: Include console errors and steps to reproduce

---

**Time to Complete**: ~5 minutes
**Difficulty**: Easy
**Prerequisites**: Firebase setup, test account
**Status**: Ready to use
