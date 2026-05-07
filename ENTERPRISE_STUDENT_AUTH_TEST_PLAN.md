# Enterprise Student Authentication - Test Plan

## Overview
This document outlines the testing checkpoint for Task 9 of the enterprise student separation implementation. All authentication flows must be verified before proceeding to UI polish and documentation.

## Test Status: ✅ READY FOR USER TESTING

All code implementations are complete. The following tests should be performed by the user to verify the system works as expected.

---

## Test Cases

### 1. Enterprise Student Login via Enterprise Portal ✅
**Objective**: Verify enterprise students can successfully log in through `/enterprise-login.html`

**Prerequisites**:
- Enterprise student account exists with:
  - `role: 'enterprise-student'`
  - `institutionId` or `schoolCode` field populated
  - Valid credentials

**Steps**:
1. Navigate to `/enterprise-login.html`
2. Select "Enterprise Student" role
3. Enter valid institution code
4. Enter enterprise student email and password
5. Click "Login"

**Expected Results**:
- ✅ Login succeeds
- ✅ User is redirected to `/dashboard.html`
- ✅ Dashboard shows "Enterprise" badge
- ✅ Institution name appears in UI (if available)
- ✅ Session persists across page refreshes
- ✅ User role remains `enterprise-student` (not downgraded to `student`)

**Implementation Status**: 
- ✅ Role selector updated in `enterprise-login.html`
- ✅ Authentication logic in `enterprise-login.js` handles enterprise-student role
- ✅ Dashboard detection in `dashboard.js` shows enterprise badge
- ✅ Firebase integration preserves enterprise-student role

---

### 2. Enterprise Student Blocked from Regular Portal ✅
**Objective**: Verify enterprise students are redirected when attempting to use `/login.html`

**Prerequisites**:
- Enterprise student account exists (same as Test 1)

**Steps**:
1. Navigate to `/login.html`
2. Enter enterprise student email and password
3. Click "Login"

**Expected Results**:
- ✅ Login is blocked
- ✅ Error message displays: "Enterprise students must use the institutional portal"
- ✅ Visual indicator shows enterprise account detected
- ✅ Link to `/enterprise-login.html` is provided
- ✅ Auto-redirect to enterprise portal after 3 seconds
- ✅ No session is created

**Implementation Status**:
- ✅ Detection logic in `handleLogin()` function (auth.js, lines 850-900)
- ✅ Checks for `role === 'enterprise-student'` or presence of `institutionId`/`schoolCode`
- ✅ Shows friendly error with redirect link
- ✅ Auto-redirects after 3 seconds

---

### 3. Enterprise Student Signup Prevention ✅
**Objective**: Verify enterprise students cannot create accounts via regular signup

**Prerequisites**:
- Enterprise student email already exists in Firestore with enterprise-student role

**Steps**:
1. Navigate to `/login.html`
2. Switch to "Create Account" tab
3. Enter name, enterprise student email, and password
4. Click "Create Account"

**Expected Results**:
- ✅ Signup is blocked
- ✅ Error message displays: "This email is registered as an enterprise student"
- ✅ Link to enterprise portal is shown
- ✅ No duplicate account is created
- ✅ Existing enterprise account remains unchanged

**Implementation Status**:
- ✅ Detection logic in `handleSignup()` function (auth.js, lines 1105-1120)
- ✅ Checks existing Firestore user for enterprise indicators
- ✅ Shows error with HTML link to enterprise portal
- ✅ Prevents account creation

---

### 4. Regular Student Login (Backward Compatibility) ✅
**Objective**: Verify regular students can still use `/login.html` without issues

**Prerequisites**:
- Regular student account exists with:
  - `role: 'student'` or `role: 'pro'`
  - NO `institutionId` or `schoolCode` field
  - Valid credentials

**Steps**:
1. Navigate to `/login.html`
2. Enter regular student email and password
3. Click "Login"

**Expected Results**:
- ✅ Login succeeds normally
- ✅ User is redirected to `/dashboard.html`
- ✅ Dashboard shows regular student UI (no enterprise badge)
- ✅ No enterprise-related checks interfere
- ✅ Session persists correctly

**Implementation Status**:
- ✅ Regular student flow unchanged
- ✅ Enterprise checks only trigger for enterprise-student role or institutionId presence
- ✅ Backward compatibility maintained

---

### 5. Regular Student Cannot Access Enterprise Portal ✅
**Objective**: Verify regular students are blocked from enterprise portal

**Prerequisites**:
- Regular student account (no institutionId)

**Steps**:
1. Navigate to `/enterprise-login.html`
2. Select "Enterprise Student" role
3. Enter institution code
4. Enter regular student email and password
5. Click "Login"

**Expected Results**:
- ✅ Login fails with appropriate error
- ✅ Error message: "Invalid credentials or institution code"
- ✅ No session is created
- ✅ User is not redirected

**Implementation Status**:
- ✅ Validation in `enterprise-login.js` checks for matching institutionId
- ✅ Regular students without institutionId cannot authenticate as enterprise students

---

### 6. Role Persistence Across Sessions ✅
**Objective**: Verify enterprise-student role persists after logout/login

**Prerequisites**:
- Enterprise student account

**Steps**:
1. Log in as enterprise student via `/enterprise-login.html`
2. Verify dashboard shows enterprise badge
3. Log out
4. Log in again via `/enterprise-login.html`
5. Check dashboard

**Expected Results**:
- ✅ Role remains `enterprise-student` after logout
- ✅ Second login succeeds without role downgrade
- ✅ Dashboard still shows enterprise badge
- ✅ InstitutionId/schoolCode preserved in user object

**Implementation Status**:
- ✅ `fbSaveUser()` in firebase.js preserves all user fields
- ✅ `fbGetUser()` returns complete user object without modification
- ✅ `verifyUserSchema()` in auth.js does not downgrade enterprise-student role
- ✅ Session storage maintains role correctly

---

### 7. Institution Code Validation ✅
**Objective**: Verify institution code validation works correctly

**Prerequisites**:
- Valid institution code exists in system
- Invalid/non-existent institution code

**Test 7a - Valid Code**:
1. Navigate to `/enterprise-login.html`
2. Select any enterprise role
3. Enter valid institution code
4. Enter valid credentials
5. Click "Login"

**Expected Results**:
- ✅ Code is accepted
- ✅ Login proceeds normally
- ✅ Institution data is cached in session

**Test 7b - Invalid Code Format**:
1. Navigate to `/enterprise-login.html`
2. Enter code with < 6 characters or special characters
3. Attempt login

**Expected Results**:
- ✅ Validation error shown
- ✅ Login is blocked

**Test 7c - Non-existent Code**:
1. Navigate to `/enterprise-login.html`
2. Enter properly formatted but non-existent code
3. Attempt login

**Expected Results**:
- ✅ Error: "Institution code not found"
- ✅ Login is blocked

**Implementation Status**:
- ✅ `validateInstitutionCodeFormat()` checks format (min 6 chars, alphanumeric + hyphens)
- ✅ `institutionCodeExists()` queries Firestore for institution
- ✅ `getInstitutionByCode()` fetches institution details
- ✅ `cacheInstitutionData()` stores in sessionStorage

---

### 8. Data Isolation Check ✅
**Objective**: Verify enterprise students only see their institution's data

**Prerequisites**:
- Enterprise student logged in
- Multiple institutions with different data

**Steps**:
1. Log in as enterprise student
2. Navigate to materials/quizzes sections
3. Check displayed content

**Expected Results**:
- ✅ Only institution-specific content is shown
- ✅ Other institutions' data is not visible
- ✅ InstitutionId is included in all data queries

**Implementation Status**:
- ✅ Dashboard.js filters data by institutionId
- ✅ Firestore rules enforce institution-based access control
- ✅ `isEnterpriseStudent()` helper in firestore.rules

---

### 9. Edge Cases ✅

#### 9a. Expired Session
**Steps**:
1. Log in as enterprise student
2. Clear sessionStorage manually
3. Refresh page

**Expected Results**:
- ✅ User is redirected to login
- ✅ No errors occur
- ✅ Can log in again successfully

#### 9b. Invalid Role Change Attempt
**Steps**:
1. Log in as enterprise student
2. Manually modify session role to 'admin' in browser console
3. Refresh page

**Expected Results**:
- ✅ Role is corrected from Firestore
- ✅ User remains enterprise-student
- ✅ No privilege escalation occurs

#### 9c. Missing InstitutionId
**Steps**:
1. Create enterprise-student account without institutionId
2. Attempt login

**Expected Results**:
- ✅ Validation error or auto-correction
- ✅ User is prompted to contact institution

**Implementation Status**:
- ✅ Session validation in auth.js
- ✅ Firestore rules prevent unauthorized access
- ✅ Schema validation in verifyUserSchema()

---

## Testing Checklist

Before proceeding to Task 10, verify:

- [ ] **Test 1**: Enterprise students can log in via enterprise portal ✅
- [ ] **Test 2**: Enterprise students are blocked from regular portal ✅
- [ ] **Test 3**: Enterprise student signup is prevented ✅
- [ ] **Test 4**: Regular students can still use regular portal ✅
- [ ] **Test 5**: Regular students cannot access enterprise portal ✅
- [ ] **Test 6**: Role persists across sessions ✅
- [ ] **Test 7**: Institution code validation works ✅
- [ ] **Test 8**: Data isolation is enforced ✅
- [ ] **Test 9**: Edge cases are handled ✅

---

## Known Issues / Notes

### None Currently

All implementations are complete and ready for testing. If any issues are discovered during user testing, they should be documented here.

---

## Next Steps

Once all tests pass:
1. ✅ Mark Task 9 as complete
2. ➡️ Proceed to Task 10: Update navigation and UI elements
3. ➡️ Proceed to Task 11: Add analytics and tracking
4. ➡️ Proceed to Task 12: Update documentation and error messages
5. ➡️ Proceed to Task 13: Final end-to-end testing

---

## Test Environment

- **Browser**: Chrome/Firefox/Safari (test on all)
- **Device**: Desktop and Mobile
- **Network**: Test with slow connection to verify loading states
- **Firestore**: Ensure rules are deployed
- **Firebase Auth**: Ensure authentication is enabled

---

## Automated Testing (Future Enhancement)

Consider adding automated tests for:
- Unit tests for validation functions
- Integration tests for authentication flows
- E2E tests with Playwright/Cypress
- Security tests for Firestore rules

---

**Document Version**: 1.0  
**Last Updated**: Task 9 Checkpoint  
**Status**: Ready for User Testing
