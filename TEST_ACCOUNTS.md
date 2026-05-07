# Test Accounts for Vision Education Platform 🧪

## Overview
This document contains all test accounts for testing different roles and features across the Vision Education platform.

---

## 🎓 REGULAR STUDENT ACCOUNTS

### 1. Pro Student Account
- **Email:** `student@visionedu.online`
- **Password:** `Vision@2026`
- **Role:** `pro` (Premium Student)
- **Login Portal:** `/login.html`
- **Dashboard:** `/dashboard.html`
- **Features:**
  - ✅ Access to all premium features
  - ✅ Extended quiz time
  - ✅ Advanced analytics
  - ✅ Certificate generation
  - ❌ Cannot access enterprise portal

### 2. Bertina (Permanent Pro)
- **Email:** `bertina@vision.edu`
- **Password:** `BERTINA123`
- **Role:** `pro` (Permanent Premium)
- **Login Portal:** `/login.html`
- **Dashboard:** `/dashboard.html`
- **Features:**
  - ✅ Lifetime premium access
  - ✅ All pro features
  - ✅ Linked to parent account
  - ❌ Cannot access enterprise portal

---

## 🏢 ENTERPRISE ACCOUNTS

### 3. Enterprise Admin (School Administrator)
- **Email:** `school@visionedu.online`
- **Password:** `Vision@2026`
- **Role:** `enterprise`
- **Institution Code:** `VISION-2026`
- **School Name:** Vision Academy
- **Login Portal:** `/enterprise-login.html` (Select "Enterprise Admin")
- **Dashboard:** `/enterprise-dashboard.html`
- **Features:**
  - ✅ Manage students and teachers
  - ✅ View institutional analytics
  - ✅ Create classes
  - ✅ Upload materials for institution
  - ✅ Access all enterprise features
  - ❌ Cannot access regular student portal

**Login Steps:**
1. Go to `/enterprise-login.html`
2. Click "Enterprise Admin" role
3. Enter institution code: `VISION-2026`
4. Email: `school@visionedu.online`
5. Password: `Vision@2026`
6. Click "Sign In"

### 4. Teacher Account
- **Email:** `teacher@visionedu.online`
- **Password:** `Vision@2026`
- **Role:** `teacher`
- **Institution Code:** `VISION-2026` (required for enterprise login)
- **Login Portal:** `/enterprise-login.html` (Select "Teacher")
- **Dashboard:** `/teacher-dashboard.html`
- **Features:**
  - ✅ Manage classes
  - ✅ Track student progress
  - ✅ Enter grades
  - ✅ Create quizzes
  - ✅ View student analytics
  - ❌ Cannot access student portal
  - ❌ Cannot access enterprise admin features

**Login Steps:**
1. Go to `/enterprise-login.html`
2. Click "Teacher" role
3. Enter institution code: `VISION-2026`
4. Email: `teacher@visionedu.online`
5. Password: `Vision@2026`
6. Click "Sign In"

---

## 🎒 ENTERPRISE STUDENT ACCOUNT (TO BE CREATED)

### 5. Enterprise Student
**Note:** This account needs to be created manually or through the enterprise admin dashboard.

**Recommended Test Account:**
- **Email:** `student.enterprise@vision.edu`
- **Password:** `Student@2026`
- **Role:** `enterprise-student`
- **Institution Code:** `VISION-2026`
- **School Name:** Vision Academy
- **Login Portal:** `/enterprise-login.html` (Select "Enterprise Student")
- **Dashboard:** `/dashboard.html?enterprise=true`
- **Features:**
  - ✅ Access student dashboard with "ENTERPRISE" badge
  - ✅ See institution branding
  - ✅ Access institution-specific materials
  - ✅ Take quizzes and track progress
  - ❌ Cannot access regular student portal
  - ❌ Cannot access enterprise admin features

**How to Create:**
You'll need to create this account through Firebase or the enterprise admin dashboard once that feature is implemented.

**Manual Creation (via Firebase Console):**
```javascript
{
  email: "student.enterprise@vision.edu",
  name: "Enterprise Student",
  role: "enterprise-student",
  institutionId: "VISION-2026",
  schoolName: "Vision Academy",
  provider: "email",
  createdAt: [timestamp]
}
```

---

## 👨‍💼 SYSTEM ADMIN ACCOUNT

### 6. System Administrator
- **Email:** `admin@visionedu.online`
- **Password:** `Ndaase@2009`
- **Role:** `admin`
- **Phone:** `+233267208336` (2FA required)
- **Login Portal:** `/login.html` or `/admin.html`
- **Dashboard:** `/admin.html`
- **Features:**
  - ✅ Full system access
  - ✅ Manage all users
  - ✅ Upload WAEC questions
  - ✅ Manage materials
  - ✅ View all analytics
  - ✅ System configuration
  - ✅ Can access any dashboard

---

## 👪 PARENT ACCOUNT

### 7. Bertina's Parent/Guardian
- **Email:** `bertina.parent@vision.edu`
- **Password:** `PARENT123`
- **Role:** `parent`
- **Linked Student:** Bertina (`bertina@vision.edu`)
- **Login Portal:** `/login.html` → Parent Portal
- **Dashboard:** `/parent-portal`
- **Features:**
  - ✅ View child's progress
  - ✅ Track performance
  - ✅ Receive notifications
  - ✅ View certificates
  - ❌ Cannot access student features

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Regular Student Tries Enterprise Portal
**Expected Result:** ❌ BLOCKED
1. Login as `student@visionedu.online` at `/login.html`
2. Try to access `/enterprise-login.html`
3. Try to login with enterprise credentials
4. **Result:** Error message: "Regular student accounts cannot access the enterprise portal"

### Scenario 2: Enterprise Student Tries Regular Portal
**Expected Result:** ❌ BLOCKED
1. Try to login as enterprise student at `/login.html`
2. **Result:** Redirected to `/enterprise-login.html` with message

### Scenario 3: Enterprise Admin Access
**Expected Result:** ✅ SUCCESS
1. Go to `/enterprise-login.html`
2. Select "Enterprise Admin"
3. Enter code: `VISION-2026`
4. Login as `school@visionedu.online`
5. **Result:** Access to enterprise dashboard with student/teacher management

### Scenario 4: Teacher Access
**Expected Result:** ✅ SUCCESS
1. Go to `/enterprise-login.html`
2. Select "Teacher"
3. Enter code: `VISION-2026`
4. Login as `teacher@visionedu.online`
5. **Result:** Access to teacher dashboard with class management

### Scenario 5: Cross-Portal Security
**Expected Result:** ❌ BLOCKED
1. Login as regular student
2. Manually navigate to `/enterprise-dashboard.html`
3. **Result:** Alert + redirect to `/login.html` + session cleared

---

## 🔐 SECURITY TESTING

### Test 1: Role Validation
- [ ] Regular student cannot access enterprise portal
- [ ] Enterprise student cannot access regular portal
- [ ] Teacher cannot access enterprise admin features
- [ ] Enterprise admin can access enterprise dashboard

### Test 2: Institution Code Validation
- [ ] Wrong institution code rejected
- [ ] Missing institution code rejected
- [ ] Correct institution code accepted

### Test 3: Session Management
- [ ] Unauthorized access clears session
- [ ] Correct role maintains session
- [ ] Remember me works correctly

### Test 4: Dashboard Access
- [ ] Regular student → `/dashboard.html`
- [ ] Enterprise student → `/dashboard.html?enterprise=true`
- [ ] Teacher → `/teacher-dashboard.html`
- [ ] Enterprise admin → `/enterprise-dashboard.html`
- [ ] System admin → `/admin.html`
- [ ] Parent → `/parent-portal`

---

## 📝 QUICK REFERENCE

### Institution Codes
- **Vision Academy:** `VISION-2026`
- **St. Augustine College:** `STAUGUSTINE2026` (example)

### Password Pattern
Most test accounts use: `Vision@2026`
- Admin: `Ndaase@2009`
- Bertina: `BERTINA123`
- Parent: `PARENT123`

### Portal URLs
- **Regular Login:** `/login.html`
- **Enterprise Login:** `/enterprise-login.html`
- **Teacher Login:** `/enterprise-login.html` (select Teacher)
- **Admin Portal:** `/admin.html`
- **Parent Portal:** `/parent-portal`

---

## 🚀 CREATING NEW TEST ACCOUNTS

### For Enterprise Students:
You can create new enterprise student accounts by:

1. **Through Firebase Console:**
   - Add to `users` collection
   - Set `role: "enterprise-student"`
   - Set `institutionId: "VISION-2026"`
   - Set `schoolName: "Vision Academy"`

2. **Through Enterprise Dashboard (Future):**
   - Login as enterprise admin
   - Go to Students section
   - Click "Add Student"
   - Fill in details

3. **Programmatically:**
   ```javascript
   const newStudent = {
     email: "newstudent@vision.edu",
     name: "New Student",
     role: "enterprise-student",
     institutionId: "VISION-2026",
     schoolName: "Vision Academy",
     hash: await sha256("password123"),
     provider: "email",
     createdAt: Date.now()
   };
   
   // Save to localStorage
   const users = JSON.parse(localStorage.getItem('waec_users') || '[]');
   users.push(newStudent);
   localStorage.setItem('waec_users', JSON.stringify(users));
   
   // Save to Firebase
   await window.fbSaveUser(newStudent);
   ```

---

## 📞 SUPPORT

If you encounter issues with test accounts:
1. Check browser console for errors
2. Verify Firebase Auth is working
3. Confirm Firestore rules are deployed
4. Clear browser cache and try again
5. Contact: support@visionedu.site

---

**Last Updated:** 2026-05-07
**Version:** 1.0.0
**Status:** ✅ Active Test Accounts
