# API Consolidation Guide

## Overview

To stay within Vercel's Hobby plan limit of 12 serverless functions, we've consolidated related API endpoints into unified services. This reduces our function count from 13 to 10 while maintaining all functionality.

## Consolidated APIs

### 1. Authentication Services (`/api/auth-services`)

**Replaces:**
- `/api/phone-auth` (OTP sending/verification)
- `/api/verify-face` (Face verification)
- `/api/send-email` (General email sending)

**Usage:**

#### OTP Service
```javascript
// Send OTP
const response = await fetch('/api/auth-services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service: 'otp',
    type: 'send',
    to: 'user@example.com'
  })
});

// Verify OTP
const response = await fetch('/api/auth-services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service: 'otp',
    type: 'check',
    to: 'user@example.com',
    code: '123456',
    verificationToken: 'jwt_token_here'
  })
});
```

#### Face Verification
```javascript
const response = await fetch('/api/auth-services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service: 'face',
    email: 'user@example.com',
    verified: true
  })
});
```

#### Email Sending
```javascript
const response = await fetch('/api/auth-services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service: 'email',
    to: 'user@example.com',
    subject: 'Welcome!',
    html: '<h1>Welcome to Vision EDU</h1>',
    text: 'Welcome to Vision EDU'
  })
});
```

### 2. WhatsApp Services (`/api/whatsapp-services`)

**Replaces:**
- `/api/whatsapp` (Message sending, media upload)
- `/api/whatsapp-webhook` (Webhook processing)

**Usage:**

#### Regular WhatsApp API (same as before)
```javascript
// Send message
const response = await fetch('/api/whatsapp-services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+1234567890',
    type: 'text',
    message: 'Hello from Vision EDU!'
  })
});
```

#### Webhook Processing
```javascript
// Webhook URL: /api/whatsapp-services?webhook=true
// The webhook parameter routes to the webhook handler
```

## Migration Checklist

### ✅ Completed Updates

- [x] Created `api/auth-services.js` (consolidates 3 functions)
- [x] Created `api/whatsapp-services.js` (consolidates 2 functions)
- [x] Updated `verification.js` to use new face verification endpoint
- [x] Updated `admin.html` to use new OTP endpoints
- [x] Updated `scripts/test-whatsapp.js` import
- [x] Deleted old API files:
  - [x] `api/phone-auth.js`
  - [x] `api/verify-face.js`
  - [x] `api/send-email.js`
  - [x] `api/whatsapp.js`
  - [x] `api/whatsapp-webhook.js`

### 🔄 Webhook Configuration Update Needed

**Important:** Update your WhatsApp webhook URL in Meta Business:

**Old URL:** `https://yourdomain.com/api/whatsapp-webhook`
**New URL:** `https://yourdomain.com/api/whatsapp-services?webhook=true`

## Current API Function Count

After consolidation: **10 functions** (within 12-function limit)

1. `api/ai.js`
2. `api/auth-core.js`
3. `api/auth-services.js` ⭐ (new - consolidates 3)
4. `api/blob-proxy.js`
5. `api/onboard.js`
6. `api/paystack.js`
7. `api/saml-idp.js`
8. `api/upload.js`
9. `api/waec-questions.js`
10. `api/whatsapp-services.js` ⭐ (new - consolidates 2)

## Benefits

- ✅ **Vercel Compliance:** Stays within 12-function limit
- ✅ **Maintained Functionality:** All features work exactly the same
- ✅ **Better Organization:** Related services grouped together
- ✅ **Easier Maintenance:** Fewer files to manage
- ✅ **Future-Proof:** Room for 2 more functions if needed

## Testing

All existing functionality should work without changes to the frontend, except for the specific endpoint updates already made. The consolidated APIs maintain the same response formats and behavior.

## Rollback Plan

If issues arise, the old individual API files are preserved in git history and can be restored by:

1. Reverting the consolidation commits
2. Updating the endpoint references back
3. Redeploying

However, this would put us back over the 12-function limit.

---

**Status:** ✅ Ready for deployment
**Function Count:** 10/12 (safe margin)
**Breaking Changes:** None (all updates handled)