# Implementation Plan: Enterprise Student Separation

## Overview

This implementation separates enterprise (institutional) students from regular (individual) students by introducing a new user role (`enterprise-student`), updating authentication flows, and ensuring proper data isolation. The feature maintains backward compatibility while enabling institution-specific access controls and tracking.

## Tasks

- [x] 1. Update auth.js to support enterprise-student role
  - Add `enterprise-student` to the role validation logic in `verifyUserSchema()`
  - Update `isProUser()` to recognize enterprise-student as having pro-level access
  - Add new helper function `isEnterpriseStudent(user)` to check if user has enterprise-student role
  - Ensure enterprise-student users require `institutionId` or `schoolCode` field
  - Update `goToDashboard()` to redirect enterprise-student users appropriately
  - _Requirements: New role support, role validation, dashboard routing_

- [x] 2. Update enterprise-login.html role selector
  - [x] 2.1 Add "Enterprise Student" option to role selector
    - Add new button in `.ent-role-selector` for enterprise-student role
    - Update button styling to match existing admin/teacher buttons
    - Add appropriate icon (student/graduation cap SVG)
    - _Requirements: UI for enterprise student login_
  
  - [x] 2.2 Update institution code field visibility logic
    - Modify `selectRole()` to show institution code field for all three roles (admin, teacher, enterprise-student)
    - Update field label to be role-appropriate ("Institution Code" for all)
    - _Requirements: Institution code required for all enterprise users_

- [x] 3. Update enterprise-login.js authentication logic
  - [x] 3.1 Add enterprise-student role handling
    - Update `handleEnterpriseLogin()` to accept 'enterprise-student' as valid role
    - Add validation to ensure enterprise-student accounts have institutionId/schoolCode
    - Update role verification logic to check for 'enterprise-student' role
    - _Requirements: Authentication for enterprise students_
  
  - [x] 3.2 Update dashboard redirection logic
    - Modify success redirect to send enterprise-student users to student dashboard
    - Ensure enterprise-student users see enterprise-branded dashboard
    - Add query parameter or session flag to indicate enterprise context
    - _Requirements: Proper routing for enterprise students_
  
  - [x] 3.3 Update verifyUserSchema for enterprise-student
    - Ensure enterprise-student role is preserved (not downgraded to 'student')
    - Add logic to maintain enterprise-student role even if subscription expires
    - Verify institutionId/schoolCode is present for enterprise-student users
    - _Requirements: Role persistence, data validation_

- [x] 4. Update dashboard.js for enterprise student support
  - [x] 4.1 Detect enterprise-student role on dashboard load
    - Check if session.role === 'enterprise-student'
    - Add visual indicator (badge/banner) for enterprise students
    - Apply institution-specific branding if available
    - _Requirements: Enterprise student identification, branding_
  
  - [x] 4.2 Add enterprise student badge to UI
    - Create "Enterprise" or institution-specific badge in welcome section
    - Add badge to navigation user chip
    - Style badge to differentiate from PRO badge
    - _Requirements: Visual differentiation for enterprise students_
  
  - [x] 4.3 Implement data isolation checks
    - Verify enterprise students only see institution-specific content
    - Filter materials/quizzes by institutionId if applicable
    - Add institution context to all data queries
    - _Requirements: Data isolation, institution-specific content_

- [x] 5. Update login.html to prevent enterprise student access
  - [x] 5.1 Add detection for enterprise student accounts
    - Check if user attempting regular login has enterprise-student role
    - Check if user has institutionId/schoolCode field
    - _Requirements: Portal separation enforcement_
  
  - [x] 5.2 Add redirect logic for enterprise students
    - If enterprise-student detected, show message and redirect to /enterprise-login.html
    - Display friendly error: "Enterprise students must use the institutional portal"
    - Add link to enterprise login page
    - _Requirements: User guidance, proper routing_

- [x] 6. Update Firebase/Firestore integration
  - [x] 6.1 Update fbSaveUser to handle enterprise-student role
    - Ensure enterprise-student role is saved to Firestore
    - Validate institutionId/schoolCode is included in user document
    - Add institution field to user schema if missing
    - _Requirements: Cloud data persistence_
    - _Status: VERIFIED - firebase.js already handles enterprise-student role preservation_
  
  - [x] 6.2 Update fbGetUser to preserve enterprise-student role
    - Ensure enterprise-student role is not downgraded when fetching from Firestore
    - Maintain institutionId/schoolCode in returned user object
    - _Requirements: Data integrity, role preservation_
    - _Status: VERIFIED - firebase.js preserves all user fields including role and institutionId_
  
  - [x] 6.3 Update Firestore security rules (firestore.rules)
    - Add rules to allow enterprise-student users to read/write their own data
    - Ensure enterprise students can only access data from their institution
    - Add institutionId-based access control rules
    - _Requirements: Security, data isolation_
    - _Status: VERIFIED - firestore.rules has comprehensive enterprise student support with isEnterpriseStudent() helper_

- [x] 7. Add institution code validation
  - [x] 7.1 Create institution code validation function
    - Add function to verify institution code format (e.g., uppercase, min length)
    - Add function to check if institution code exists in system
    - Implement in both auth.js and enterprise-login.js
    - _Requirements: Institution code validation_
    - _Status: COMPLETE - validateInstitutionCodeFormat() and institutionCodeExists() implemented in auth.js_
  
  - [x] 7.2 Add institution lookup functionality
    - Create function to fetch institution details by code
    - Return institution name, branding, settings
    - Cache institution data in session for performance
    - _Requirements: Institution metadata retrieval_
    - _Status: COMPLETE - getInstitutionByCode(), cacheInstitutionData(), getCachedInstitutionData() implemented_

- [x] 8. Update user signup flow for enterprise students
  - [x] 8.1 Prevent enterprise student signup via regular portal
    - Add check in handleSignup() to reject emails with institutionId
    - Show message directing users to contact their institution
    - _Requirements: Signup flow separation_
    - _Status: COMPLETE - Added enterprise student detection in handleSignup() with redirect to enterprise portal_
  
  - [ ] 8.2 Add enterprise student creation endpoint (optional)
    - Create API endpoint for institutions to bulk-create student accounts
    - Validate institution admin credentials
    - Auto-assign enterprise-student role and institutionId
    - _Requirements: Bulk student provisioning_
    - _Status: OPTIONAL - Can be implemented later if needed_

- [x] 9. Checkpoint - Test authentication flows
  - Verify enterprise students can log in via /enterprise-login.html
  - Verify enterprise students are redirected from /login.html
  - Verify regular students cannot access enterprise portal
  - Verify role persistence across sessions
  - Ensure all tests pass, ask the user if questions arise.
  - _Status: READY FOR TESTING - See ENTERPRISE_STUDENT_AUTH_TEST_PLAN.md for detailed test cases_

- [x] 10. Update navigation and UI elements
  - [x] 10.1 Add enterprise context to navigation
    - Show institution name in header for enterprise students
    - Add institution logo if available
    - Update page title to include institution name
    - _Requirements: Enterprise branding_
    - _Status: COMPLETE - Enhanced applyInstitutionBranding() in dashboard.js_
  
  - [x] 10.2 Update settings modal for enterprise students
    - Disable certain settings for enterprise students (e.g., subscription management)
    - Show institution contact info instead of individual support
    - Add "Managed by [Institution Name]" indicator
    - _Requirements: Enterprise-specific settings_
    - _Status: COMPLETE - Added enterprise logic to openSettings() in settings-handler.js_

- [ ] 11. Add analytics and tracking
  - [ ] 11.1 Track enterprise student usage separately
    - Add institutionId to analytics events
    - Differentiate enterprise vs individual student metrics
    - Track login source (enterprise portal vs regular portal)
    - _Requirements: Usage analytics, reporting_
  
  - [ ] 11.2 Add institution-level reporting (optional)
    - Create aggregated stats by institution
    - Track student progress per institution
    - Enable export for institution admins
    - _Requirements: Institution reporting_

- [ ] 12. Update documentation and error messages
  - [ ] 12.1 Add user-facing documentation
    - Create help text explaining enterprise vs regular student accounts
    - Add FAQ section for enterprise students
    - Document institution code usage
    - _Requirements: User documentation_
  
  - [ ] 12.2 Update error messages
    - Add specific error messages for enterprise student authentication failures
    - Improve institution code error messages
    - Add helpful hints for common issues
    - _Requirements: Error handling, user experience_

- [ ] 13. Final checkpoint - End-to-end testing
  - Test complete enterprise student journey (login → dashboard → features)
  - Verify data isolation between institutions
  - Test edge cases (expired sessions, invalid codes, role changes)
  - Verify backward compatibility with existing users
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks focus on code implementation and can be completed by a coding agent
- Enterprise student role is distinct from regular student role but has similar access levels
- Institution code is required for all enterprise users (students, teachers, admins)
- Data isolation is critical - enterprise students should only see their institution's content
- Backward compatibility must be maintained for existing regular students
- The implementation uses JavaScript to match the existing codebase
- Firebase/Firestore integration is required for cloud data persistence
- Security rules must enforce institution-based access control

## Implementation Order

1. **Phase 1 (Tasks 1-3)**: Core authentication and role support
2. **Phase 2 (Tasks 4-6)**: Dashboard and data layer updates
3. **Phase 3 (Tasks 7-8)**: Institution management and validation
4. **Phase 4 (Tasks 9)**: Testing checkpoint
5. **Phase 5 (Tasks 10-12)**: UI polish and documentation
6. **Phase 6 (Task 13)**: Final testing and validation
