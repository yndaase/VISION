# Enterprise Student Dashboard - Deployment Guide

## Pre-Deployment Checklist

### 1. File Verification
Ensure all required files are in place:

```bash
# Core dashboard files
✓ enterprise-student-dashboard.html
✓ enterprise-student-dashboard.js
✓ enterprise-student-dashboard.css

# Supporting files (should already exist)
✓ auth.js (with enterprise-student role support)
✓ firebase.js (with Firestore integration)
✓ materials.js (with institution filtering)
✓ theme.js (for dark/light mode)
✓ dashboard.css (base styles)
✓ theme.css (theme variables)
```

### 2. Dependencies Check
Verify these dependencies are available:

- **Firebase SDK**: Authentication and Firestore
- **Google Fonts**: Outfit and JetBrains Mono
- **Existing Auth System**: `auth.js` with role support
- **Materials System**: `materials.js` for content management

### 3. Configuration Verification

#### Firebase Configuration
```javascript
// In firebase.js - verify these are set
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

#### Firestore Security Rules
```javascript
// Verify enterprise student rules exist
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Enterprise students can read their own data
      allow read: if request.auth != null && 
                     request.auth.token.email == resource.data.email &&
                     resource.data.role == 'enterprise-student';
    }
    
    match /materials/{materialId} {
      // Enterprise students can read materials from their institution
      allow read: if request.auth != null &&
                     (resource.data.institutionId == request.auth.token.institutionId ||
                      resource.data.institutionId == null);
    }
  }
}
```

## Deployment Steps

### Step 1: Upload Files

#### Option A: Manual Upload
1. Upload `enterprise-student-dashboard.html` to root directory
2. Upload `enterprise-student-dashboard.js` to root directory
3. Upload `enterprise-student-dashboard.css` to root directory

#### Option B: Git Deployment
```bash
git add enterprise-student-dashboard.html
git add enterprise-student-dashboard.js
git add enterprise-student-dashboard.css
git add ENTERPRISE_STUDENT_DASHBOARD.md
git add ENTERPRISE_STUDENT_DEPLOYMENT.md

git commit -m "Add enterprise student dashboard"
git push origin main
```

### Step 2: Update Navigation Links

#### In `enterprise-login.html`
Update success redirect:
```javascript
// After successful enterprise student login
if (user.role === 'enterprise-student') {
  window.location.href = '/enterprise-student-dashboard.html';
}
```

#### In `dashboard.html`
Add redirect for enterprise students:
```javascript
// At the top of dashboard.html
const session = getSession();
if (session && session.role === 'enterprise-student') {
  window.location.href = '/enterprise-student-dashboard.html';
}
```

### Step 3: Update Firestore Rules

Deploy updated security rules:
```bash
firebase deploy --only firestore:rules
```

Or manually update in Firebase Console:
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click "Rules" tab
4. Add enterprise student rules
5. Click "Publish"

### Step 4: Test Deployment

#### Create Test Account
```javascript
// Test account data
{
  email: "test.student@testschool.edu",
  name: "Test Student",
  role: "enterprise-student",
  institutionId: "TESTSCHOOL001",
  institutionName: "Test High School",
  schoolCode: "TESTSCHOOL001",
  provider: "email",
  createdAt: Date.now()
}
```

#### Test Checklist
- [ ] Login with test account
- [ ] Verify redirect to enterprise student dashboard
- [ ] Check institution branding displays
- [ ] Verify materials are filtered correctly
- [ ] Test all navigation links
- [ ] Check responsive design on mobile
- [ ] Test theme switching
- [ ] Verify logout works

### Step 5: Monitor Initial Usage

#### Key Metrics to Track
- Login success rate for enterprise students
- Dashboard load time
- Material access patterns
- Error rates
- User engagement

#### Logging Setup
```javascript
// Add to enterprise-student-dashboard.js
console.log('[Enterprise Student] Dashboard loaded:', {
  institutionId: session.institutionId,
  timestamp: new Date().toISOString()
});
```

## Post-Deployment Tasks

### 1. User Communication

#### Email Template for Institutions
```
Subject: New Enterprise Student Dashboard Available

Dear [Institution Name],

We're excited to announce the launch of our new Enterprise Student Dashboard, 
designed specifically for your students.

Key Features:
- Institution-specific branding
- Curated learning materials
- Progress tracking
- WAEC exam preparation

Login Instructions:
1. Visit: https://visionedu.online/enterprise-login.html
2. Select "Enterprise Student"
3. Enter student credentials
4. Use institution code: [INSTITUTION_CODE]

For support, contact: support@visionedu.online

Best regards,
Vision Education Team
```

### 2. Documentation Updates

Update these documents:
- [ ] Main README.md
- [ ] User guide
- [ ] Admin documentation
- [ ] API documentation (if applicable)

### 3. Training Materials

Create training resources:
- [ ] Video walkthrough
- [ ] Screenshot guide
- [ ] FAQ document
- [ ] Troubleshooting guide

## Rollback Plan

If issues arise, follow this rollback procedure:

### Step 1: Disable New Dashboard
```javascript
// In enterprise-login.html, temporarily redirect to old dashboard
if (user.role === 'enterprise-student') {
  window.location.href = '/dashboard.html'; // Old dashboard
}
```

### Step 2: Notify Users
Send communication about temporary reversion:
```
Subject: Temporary Dashboard Update

We've temporarily reverted to the previous dashboard while we address 
some technical issues. We'll notify you when the new dashboard is 
available again.

Thank you for your patience.
```

### Step 3: Investigate Issues
- Check error logs
- Review user feedback
- Test in staging environment
- Fix identified issues

### Step 4: Re-deploy
Once issues are resolved:
1. Test thoroughly in staging
2. Re-deploy to production
3. Monitor closely
4. Notify users of restoration

## Monitoring and Maintenance

### Daily Checks
- [ ] Check error logs
- [ ] Monitor login success rates
- [ ] Review user feedback
- [ ] Check system performance

### Weekly Tasks
- [ ] Analyze usage patterns
- [ ] Review material access
- [ ] Check for broken links
- [ ] Update documentation

### Monthly Reviews
- [ ] Performance optimization
- [ ] Feature usage analysis
- [ ] User satisfaction survey
- [ ] Security audit

## Performance Optimization

### Caching Strategy
```javascript
// Cache institution data
const CACHE_KEY = 'institution_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function cacheInstitutionData(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: data,
    timestamp: Date.now()
  }));
}

function getCachedInstitutionData() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  
  return data;
}
```

### Image Optimization
- Use WebP format for images
- Implement lazy loading
- Compress institution logos
- Use CDN for static assets

### Code Splitting
```javascript
// Load materials only when needed
async function loadMaterials() {
  const { getMaterials } = await import('./materials.js');
  return getMaterials();
}
```

## Security Considerations

### 1. Session Management
- Verify session on every page load
- Implement session timeout
- Use secure session storage
- Clear session on logout

### 2. Data Validation
```javascript
// Validate institution ID format
function validateInstitutionId(id) {
  return /^[A-Z0-9]{6,20}$/.test(id);
}

// Sanitize user input
function sanitizeInput(input) {
  return input.replace(/[<>]/g, '');
}
```

### 3. API Security
- Use HTTPS only
- Implement rate limiting
- Validate all requests
- Log security events

## Troubleshooting Guide

### Issue: Dashboard Not Loading

**Symptoms**: Blank page or infinite loading

**Solutions**:
1. Check browser console for errors
2. Verify JavaScript files are loaded
3. Check network tab for failed requests
4. Clear browser cache
5. Verify session data exists

### Issue: Institution Branding Not Showing

**Symptoms**: Generic branding instead of institution-specific

**Solutions**:
1. Verify `institutionName` in session
2. Check `applyInstitutionBranding()` function
3. Inspect DOM elements
4. Check CSS is loaded
5. Verify session data structure

### Issue: Materials Not Loading

**Symptoms**: Empty materials section

**Solutions**:
1. Check Firestore security rules
2. Verify `institutionId` in materials
3. Check `getMaterials()` function
4. Inspect network requests
5. Verify user permissions

### Issue: Login Redirect Loop

**Symptoms**: Continuous redirects between pages

**Solutions**:
1. Check role validation logic
2. Verify session persistence
3. Clear all cookies and storage
4. Check redirect conditions
5. Review auth guard logic

## Support Contacts

### Technical Issues
- **Email**: tech@visionedu.online
- **Phone**: +233 XX XXX XXXX
- **Hours**: 24/7 support

### Institution Support
- **Email**: institutions@visionedu.online
- **Phone**: +233 XX XXX XXXX
- **Hours**: Mon-Fri, 8am-6pm GMT

### Emergency Contacts
- **On-Call Engineer**: +233 XX XXX XXXX
- **System Admin**: +233 XX XXX XXXX

## Success Criteria

### Launch Success Metrics
- [ ] 95%+ login success rate
- [ ] < 3 second page load time
- [ ] Zero critical bugs
- [ ] Positive user feedback
- [ ] All institutions onboarded

### Long-term Success Metrics
- [ ] 80%+ daily active users
- [ ] 90%+ user satisfaction
- [ ] < 1% error rate
- [ ] Increasing engagement
- [ ] Growing institution adoption

## Conclusion

The Enterprise Student Dashboard is now ready for deployment. Follow this guide carefully to ensure a smooth rollout. Monitor closely during the first week and be prepared to address any issues quickly.

For questions or concerns, contact the development team.

---

**Deployment Date**: [To be filled]
**Deployed By**: [To be filled]
**Version**: 1.0.0
**Status**: Ready for Production
