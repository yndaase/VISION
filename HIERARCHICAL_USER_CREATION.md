# Hierarchical User Creation System

## Overview
The system now supports a hierarchical user creation model where:
1. **System Admin** creates institutional admins (enterprise accounts)
2. **Institutional Admins** create teachers and students for their school

This eliminates the need for manual Firebase Console configuration.

## User Hierarchy

```
System Admin (admin@visionedu.online)
    ↓
Enterprise Admin (school@example.com)
    ↓
    ├── Teachers (teacher1@example.com, teacher2@example.com)
    └── Students (student1@example.com, student2@example.com)
```

## How It Works

### 1. System Admin Creates Enterprise Account

**Location:** `/admin` portal

**Steps:**
1. Login as system admin (`admin@visionedu.online`)
2. Navigate to "Learners" section
3. Fill in the "Create New Account" form:
   - **Name:** School administrator name
   - **Email:** Admin email address
   - **Password:** Temporary password (min 6 characters)
   - **Role:** Select "Enterprise (School Admin)"
4. Click "Create Account"
5. System will prompt for:
   - **School/Institution Name:** e.g., "Vision Academy"
6. System automatically generates:
   - **Institution ID:** Unique identifier (uses email)
   - **School Code:** Shareable code for joining (e.g., "VISIONACAD-1234")

**What Happens:**
- Firebase Auth account is created
- Firestore document is created in `users` collection
- Institution details are automatically set
- School code is generated for teachers/students to join

**Success Message:**
```
🏫 ENTERPRISE ACCOUNT CREATED

School: Vision Academy
Admin Email: school@example.com
School Code: VISIONACAD-1234

📋 NEXT STEPS:
1. Share the school code with teachers and students
2. They can use it to join your institution
3. Login at /enterprise-login.html to manage your school
```

### 2. Enterprise Admin Creates Teachers

**Location:** `/enterprise-dashboard.html`

**Steps:**
1. Login as enterprise admin at `/enterprise-login.html`
2. Navigate to "Teachers" section
3. Click "Add Teacher" button
4. Enter teacher details via prompts:
   - **Full Name:** Teacher's name
   - **Email:** Teacher's email address
   - **Password:** Temporary password (min 6 characters)
   - **Subject:** Subject they teach (e.g., "Mathematics")
5. System automatically:
   - Creates Firebase Auth account
   - Saves to Firestore with institution linkage
   - Sets role as `teacher`
   - Links to institution via `institutionId` and `schoolCode`

**What Happens:**
- Teacher account is created with `role: 'teacher'`
- Automatically linked to the institution
- Teacher can login at `/teacher-login.html`
- Teacher has access to institutional resources

**Success Message:**
```
✅ Teacher account created successfully!

Name: John Doe
Email: john.doe@example.com
Subject: Mathematics
Password: temp123

📧 Share these credentials with the teacher.
```

### 3. Enterprise Admin Creates Students

**Location:** `/enterprise-dashboard.html`

**Steps:**
1. Login as enterprise admin at `/enterprise-login.html`
2. Navigate to "Students" section
3. Click "Add Student" button
4. Enter student details via prompts:
   - **Full Name:** Student's name
   - **Email:** Student's email address
   - **Password:** Temporary password (min 6 characters)
   - **Class:** Student's class (e.g., "Form 3A")
5. System automatically:
   - Creates Firebase Auth account
   - Saves to Firestore with institution linkage
   - Sets role as `enterprise-student`
   - Links to institution via `institutionId` and `schoolCode`

**What Happens:**
- Student account is created with `role: 'enterprise-student'`
- Automatically linked to the institution
- Student can login at `/enterprise-login.html`
- Student has access to institutional resources and pro features

**Success Message:**
```
✅ Student account created successfully!

Name: Jane Smith
Email: jane.smith@example.com
Class: Form 3A
Password: temp123

📧 Share these credentials with the student.
```

## User Roles

### System Admin (`admin`)
- **Access:** Full system access
- **Portal:** `/admin`
- **Capabilities:**
  - Create enterprise accounts
  - Manage all users
  - View system-wide analytics
  - Configure system settings

### Enterprise Admin (`enterprise`)
- **Access:** Institution-level access
- **Portal:** `/enterprise-dashboard.html`
- **Login:** `/enterprise-login.html`
- **Capabilities:**
  - Create teachers for their institution
  - Create students for their institution
  - View institutional analytics
  - Manage classes and assignments
  - Configure school settings

### Teacher (`teacher`)
- **Access:** Class-level access
- **Portal:** `/teacher-dashboard.html`
- **Login:** `/teacher-login.html`
- **Capabilities:**
  - View students in their classes
  - Create and grade assignments
  - View student performance
  - Access institutional resources

### Enterprise Student (`enterprise-student`)
- **Access:** Student-level access with pro features
- **Portal:** `/dashboard.html`
- **Login:** `/enterprise-login.html`
- **Capabilities:**
  - Access all learning materials
  - Take quizzes and exams
  - View personal analytics
  - Access AI tutoring
  - Pro-level features included

## Technical Implementation

### User Object Structure

#### Enterprise Admin
```javascript
{
  name: "School Administrator",
  email: "school@example.com",
  emailLower: "school@example.com",
  hash: "sha256_hash",
  role: "enterprise",
  institutionId: "school@example.com",
  schoolCode: "VISIONACAD-1234",
  schoolName: "Vision Academy",
  schoolLogo: "V",
  provider: "email",
  createdAt: 1746633600000,
  status: "active",
  isVerified: false,
  twoFAEnabled: false,
  lastUpdated: "2026-05-07T12:00:00.000Z"
}
```

#### Teacher
```javascript
{
  name: "John Doe",
  email: "john.doe@example.com",
  emailLower: "john.doe@example.com",
  hash: "sha256_hash",
  role: "teacher",
  institutionId: "school@example.com",
  institutionName: "Vision Academy",
  schoolName: "Vision Academy",
  schoolCode: "VISIONACAD-1234",
  subject: "Mathematics",
  provider: "email",
  createdAt: 1746633600000,
  status: "active",
  isVerified: false,
  twoFAEnabled: false,
  lastUpdated: "2026-05-07T12:00:00.000Z"
}
```

#### Enterprise Student
```javascript
{
  name: "Jane Smith",
  email: "jane.smith@example.com",
  emailLower: "jane.smith@example.com",
  hash: "sha256_hash",
  role: "enterprise-student",
  institutionId: "school@example.com",
  institutionName: "Vision Academy",
  schoolCode: "VISIONACAD-1234",
  class: "Form 3A",
  provider: "email",
  createdAt: 1746633600000,
  status: "active",
  isVerified: false,
  twoFAEnabled: false,
  lastUpdated: "2026-05-07T12:00:00.000Z"
}
```

### Firestore Security Rules

The Firestore rules automatically enforce the hierarchy:

```javascript
// Enterprise admins can read users from their institution
allow read: if isEnterpriseAdmin() && 
  exists(/databases/$(database)/documents/users/$(email)) &&
  sameInstitution(get(/databases/$(database)/documents/users/$(email)).data.institutionId);

// Teachers can read students from their institution
allow read: if isTeacher() && 
  exists(/databases/$(database)/documents/users/$(email)) &&
  sameInstitution(get(/databases/$(database)/documents/users/$(email)).data.institutionId);
```

## Benefits

### 1. No Manual Firebase Configuration
- No need to manually create users in Firebase Console
- No need to manually create Firestore documents
- Everything is automated through the UI

### 2. Automatic Institution Linking
- All users are automatically linked to their institution
- Institution ID and school code are set automatically
- Firestore rules enforce data isolation

### 3. Scalable
- System admin can create unlimited enterprise accounts
- Each enterprise admin can create unlimited teachers and students
- No manual intervention required

### 4. Secure
- Password hashing with SHA-256
- Firebase Auth integration
- Firestore security rules enforce access control
- Each institution's data is isolated

### 5. User-Friendly
- Simple prompts for data entry
- Clear success messages with credentials
- Automatic UI updates after creation

## Testing the System

### Test Scenario 1: Create Enterprise Account
1. Login as system admin
2. Create enterprise account for "Test School"
3. Note the school code generated
4. Verify account appears in users list
5. Logout and login as the new enterprise admin

### Test Scenario 2: Create Teacher
1. Login as enterprise admin
2. Navigate to Teachers section
3. Click "Add Teacher"
4. Create teacher account
5. Verify teacher appears in teachers list
6. Logout and login as the new teacher

### Test Scenario 3: Create Student
1. Login as enterprise admin
2. Navigate to Students section
3. Click "Add Student"
4. Create student account
5. Verify student appears in students list
6. Logout and login as the new student

## Troubleshooting

### Issue: "Firebase Auth creation failed"
**Solution:** This is a warning, not an error. The account is still created in Firestore and localStorage. Firebase Auth will be synced on next login.

### Issue: "User already exists"
**Solution:** Check if the email is already registered. Each email can only be used once across the entire system.

### Issue: "Institution information not found"
**Solution:** Logout and login again. The session may not have the latest institution details.

### Issue: "Permission denied" in Firestore
**Solution:** Ensure the admin is logged into Firebase Auth. The system automatically handles this, but if issues persist, logout and login again.

## Future Enhancements

1. **Bulk Import:** Upload Excel/CSV files to create multiple users at once
2. **Email Invitations:** Send automated email invitations with credentials
3. **Password Reset:** Allow users to reset their own passwords
4. **User Management:** Edit and delete users from the UI
5. **Role Changes:** Change user roles (e.g., promote student to teacher)
6. **Advanced Modals:** Replace prompts with proper modal dialogs
7. **Validation:** More robust email and password validation
8. **Audit Log:** Track all user creation activities

## Summary

The hierarchical user creation system provides a complete, automated solution for managing institutional users. System admins create enterprise accounts, and enterprise admins create teachers and students—all without touching Firebase Console. The system handles Firebase Auth, Firestore, and security rules automatically.
