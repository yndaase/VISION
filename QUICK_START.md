# WAEC Past Questions - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- ✅ Vercel account
- ✅ Node.js installed
- ✅ Git repository connected to Vercel
- ✅ `@vercel/blob` package (already in package.json)

### Step 1: Set Up Vercel Blob Storage (2 minutes)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Storage** tab
4. Click **Create Database** → **Blob**
5. Name it: `waec-questions`
6. Copy the `BLOB_READ_WRITE_TOKEN`

### Step 2: Add Environment Variable (1 minute)

1. In Vercel Dashboard, go to **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: (paste your token)
   - **Environment**: Production, Preview, Development
3. Click **Save**

### Step 3: Deploy (1 minute)

```bash
# Commit the new files
git add .
git commit -m "Add WAEC Past Questions feature"
git push origin main
```

Vercel will automatically deploy!

### Step 4: Test (1 minute)

1. Visit `https://your-domain.com/waec-past-questions`
2. You should see the page with mock data
3. Visit `https://your-domain.com/admin-waec-upload` (admin only)
4. Try uploading a test PDF

## 🎯 Quick Test Checklist

- [ ] Student page loads
- [ ] Filters work
- [ ] Admin page loads (admin only)
- [ ] Can upload PDF
- [ ] Can download PDF
- [ ] Mobile view works

## 📝 First Upload

1. Log in as admin
2. Go to `/admin-waec-upload`
3. Fill in:
   - Subject: Mathematics
   - Year: 2024
   - Paper Type: Objective
   - Duration: 2 hours
   - Questions: 50
4. Upload a PDF file
5. Click "Upload to Vercel Blob"
6. Check student page to see it appear!

## 🔧 Troubleshooting

### "Unauthorized" error
- Check `BLOB_READ_WRITE_TOKEN` is set correctly
- Verify token has read-write permissions

### Upload fails
- Check file is PDF format
- Verify file size < 50MB
- Check browser console for errors

### Questions not showing
- Check API endpoint: `/api/waec-questions`
- Verify authentication token
- Check Vercel logs

## 📚 Next Steps

1. **Upload Real Questions**: Add authentic WAEC past questions
2. **Customize Subjects**: Edit subject list in HTML files
3. **Add Analytics**: Implement download tracking
4. **Test Mobile**: Verify mobile responsiveness
5. **Monitor Usage**: Check Vercel analytics

## 🎓 File Locations

```
project/
├── waec-past-questions.html      # Student page
├── waec-past-questions.js        # Student logic
├── admin-waec-upload.html        # Admin page
├── admin-waec-upload.js          # Admin logic
├── api/
│   ├── waec-questions.js         # Main API
│   └── waec-questions-download.js # Download API
└── docs/
    ├── WAEC_BLOB_SETUP.md        # Full setup guide
    ├── DEPLOYMENT_CHECKLIST.md   # Deployment steps
    ├── WAEC_FEATURE_SUMMARY.md   # Feature overview
    └── WAEC_VISUAL_GUIDE.md      # UI guide
```

## 🌐 URLs

- **Student Page**: `/waec-past-questions`
- **Admin Upload**: `/admin-waec-upload`
- **API Endpoint**: `/api/waec-questions`
- **Download API**: `/api/waec-questions/download/:id`

## 💡 Pro Tips

1. **Organize Files**: Use consistent naming for PDFs
   - Format: `subject_year_papertype.pdf`
   - Example: `mathematics_2024_objective.pdf`

2. **Compress PDFs**: Reduce file sizes before upload
   - Use online tools or Adobe Acrobat
   - Target: < 5MB per file

3. **Batch Upload**: Upload multiple years at once
   - Prepare all PDFs in advance
   - Use consistent metadata

4. **Test Downloads**: Verify PDFs open correctly
   - Test on different devices
   - Check mobile compatibility

5. **Monitor Storage**: Keep track of Blob usage
   - Check Vercel dashboard regularly
   - Plan for storage limits

## 🎨 Customization

### Change Colors
Edit CSS variables in `waec-past-questions.html`:
```css
--primary: #6366f1;  /* Main color */
--success: #22c55e;  /* Success messages */
--error: #ef4444;    /* Error messages */
```

### Add Subjects
Edit subject pills in HTML:
```html
<div class="subject-pill" data-subject="history">History</div>
```

### Modify Filters
Edit year options in HTML:
```html
<option value="2025">2025</option>
```

## 📊 Monitor Performance

### Vercel Dashboard
- Check deployment status
- View function logs
- Monitor Blob storage usage

### Browser DevTools
- Network tab for API calls
- Console for JavaScript errors
- Performance tab for load times

## 🆘 Get Help

1. **Check Documentation**:
   - `WAEC_BLOB_SETUP.md` - Full setup
   - `DEPLOYMENT_CHECKLIST.md` - Deployment
   - `WAEC_VISUAL_GUIDE.md` - UI reference

2. **Check Logs**:
   - Vercel function logs
   - Browser console
   - Network requests

3. **Common Issues**:
   - Authentication: Check session token
   - Upload: Verify file format and size
   - Download: Check blob URL validity

## ✅ Success Indicators

You'll know it's working when:
- ✅ Student page loads without errors
- ✅ Filters update the question list
- ✅ Admin can upload PDFs successfully
- ✅ Students can download PDFs
- ✅ Mobile view is responsive
- ✅ No console errors

## 🎉 You're Done!

Your WAEC Past Questions feature is now live! Students can access past questions, and admins can manage uploads easily.

### What's Next?
- Upload more past questions
- Announce to students
- Gather feedback
- Plan Phase 2 features

---

**Need Help?** Check the full documentation or contact the development team.

**Happy Teaching! 📚**
