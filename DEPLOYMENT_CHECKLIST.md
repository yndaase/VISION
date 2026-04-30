# WAEC Past Questions - Deployment Checklist

## Pre-Deployment

- [ ] Verify `@vercel/blob` is installed (v2.3.2 or higher)
- [ ] Set up Vercel Blob Storage in dashboard
- [ ] Copy `BLOB_READ_WRITE_TOKEN` from Vercel
- [ ] Add token to environment variables

## Environment Variables

Add these to your Vercel project settings:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxxxxxxx
```

## Files to Deploy

### New Files Created
- ✅ `waec-past-questions.html` - Student interface
- ✅ `waec-past-questions.js` - Client logic
- ✅ `admin-waec-upload.html` - Admin upload page
- ✅ `admin-waec-upload.js` - Admin upload logic
- ✅ `api/waec-questions.js` - Main API endpoint
- ✅ `api/waec-questions-download.js` - Download endpoint
- ✅ `WAEC_BLOB_SETUP.md` - Setup documentation

## Vercel Configuration

Ensure your `vercel.json` includes these routes:

```json
{
  "rewrites": [
    {
      "source": "/waec-past-questions",
      "destination": "/waec-past-questions.html"
    },
    {
      "source": "/admin-waec-upload",
      "destination": "/admin-waec-upload.html"
    },
    {
      "source": "/api/waec-questions",
      "destination": "/api/waec-questions.js"
    },
    {
      "source": "/api/waec-questions/download/:questionId",
      "destination": "/api/waec-questions-download.js"
    }
  ]
}
```

## Post-Deployment Testing

### 1. Test Student Access
- [ ] Navigate to `/waec-past-questions`
- [ ] Verify page loads correctly
- [ ] Test subject filter pills
- [ ] Test year/paper type dropdowns
- [ ] Test sort functionality
- [ ] Verify mock data displays

### 2. Test Admin Upload
- [ ] Navigate to `/admin-waec-upload` (admin only)
- [ ] Fill in all form fields
- [ ] Upload a test PDF (< 50MB)
- [ ] Verify success message
- [ ] Check Vercel Blob dashboard for file

### 3. Test Download Flow
- [ ] Click "Download PDF" on a question card
- [ ] Verify download starts
- [ ] Check downloaded file opens correctly
- [ ] Verify analytics tracking (if implemented)

### 4. Test API Endpoints

**GET Questions:**
```bash
curl https://your-domain.com/api/waec-questions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Upload Question:**
```bash
curl -X POST https://your-domain.com/api/waec-questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subject": "Mathematics",
    "year": 2024,
    "paperType": "objective",
    "fileData": "base64_data_here",
    "fileName": "test.pdf"
  }'
```

**Get Download URL:**
```bash
curl https://your-domain.com/api/waec-questions/download/waec-math-2024-obj \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Navigation Updates

Add to dashboard navigation (`dashboard.html`):

```html
<a href="/waec-past-questions" class="nav-item">
  <span class="nav-item-icon">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
  </span>
  <span>Past Questions</span>
</a>
```

Add to admin panel (`admin.html`):

```html
<a href="/admin-waec-upload" class="admin-card">
  <div class="admin-card-icon">📄</div>
  <h3>Upload Past Questions</h3>
  <p>Manage WAEC past question PDFs</p>
</a>
```

## Security Checklist

- [ ] Verify authentication on all endpoints
- [ ] Test admin-only access to upload page
- [ ] Check file size limits (50MB max)
- [ ] Verify PDF-only file type restriction
- [ ] Test download URL expiration (1 hour)
- [ ] Check CORS headers are correct

## Performance Optimization

- [ ] Enable Vercel Edge caching for static assets
- [ ] Compress PDF files before upload
- [ ] Implement lazy loading for question cards
- [ ] Add pagination if > 50 questions
- [ ] Optimize images and icons

## Monitoring

Set up monitoring for:
- [ ] API response times
- [ ] Blob storage usage
- [ ] Download success rate
- [ ] Error rates
- [ ] User engagement metrics

## Rollback Plan

If issues occur:
1. Revert to previous deployment
2. Check Vercel logs for errors
3. Verify environment variables
4. Test API endpoints individually
5. Check Blob storage permissions

## Success Criteria

✅ Students can browse and filter questions
✅ Students can download PDFs successfully
✅ Admins can upload new questions
✅ Files are stored in Vercel Blob
✅ Download links expire after 1 hour
✅ All API endpoints respond correctly
✅ Mobile responsive design works
✅ Authentication is enforced

## Next Steps After Deployment

1. Upload initial set of past questions
2. Announce feature to students
3. Monitor usage and feedback
4. Plan for answer keys feature
5. Consider adding video solutions
6. Implement analytics dashboard

## Support Resources

- Vercel Blob Docs: https://vercel.com/docs/storage/vercel-blob
- API Reference: See `WAEC_BLOB_SETUP.md`
- Troubleshooting: Check Vercel logs and browser console

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Version:** 1.0.0
