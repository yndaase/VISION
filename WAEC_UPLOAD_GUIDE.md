# WAEC Past Questions Upload Guide

## Current Status
The WAEC Past Questions feature is displaying **mock data** with no actual PDF files uploaded yet. This is why you see "not_found" errors when trying to download.

## How to Upload PDFs

### Option 1: Use the Admin Upload Page (Recommended)
1. Go to `/admin-waec-upload.html`
2. Log in with admin credentials
3. Fill in the form:
   - **Subject**: Select from dropdown
   - **Year**: Enter year (e.g., 2024)
   - **Paper Type**: objective, theory, or practical
   - **Title**: Auto-generated or custom
   - **Duration**: e.g., "3 hours"
   - **Number of Questions**: e.g., 50
   - **PDF File**: Select the PDF file
4. Click "Upload Question"
5. The PDF will be uploaded to Vercel Blob Storage

### Option 2: Manual API Upload
Use the API endpoint directly:

```javascript
const formData = {
  subject: 'Mathematics',
  year: 2024,
  paperType: 'objective',
  title: 'WAEC Mathematics 2024 - Objective',
  duration: '2 hours',
  questions: 50,
  fileData: base64EncodedPDF,
  fileName: 'waec-math-2024-obj.pdf'
};

fetch('/api/waec-questions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify(formData)
});
```

## What Happens Now

### Before Upload:
- ❌ Users see: "PDF not available yet. Please check back later."
- ❌ Download button shows error notification
- ✅ Questions are listed but can't be downloaded

### After Upload:
- ✅ PDF is stored in Vercel Blob Storage
- ✅ Download button works
- ✅ Users can download the PDF
- ✅ Analytics track downloads

## Mock Questions Currently Available

The system shows these mock questions (no PDFs yet):

1. **Mathematics 2024** - Objective & Theory
2. **English 2024** - Objective
3. **Physics 2023** - Objective
4. **Chemistry 2023** - Theory
5. **Biology 2023** - Practical
6. **Economics 2022** - Objective
7. **Geography 2022** - Theory
8. **Literature 2021** - Objective

## Error Messages

### User-Friendly Messages:
- **"PDF not available yet"** - No file uploaded for this question
- **"PDF file not found in storage"** - File was deleted or moved
- **"Failed to download"** - Network or permission error

### Admin Messages:
- Check Vercel Blob Storage dashboard
- Verify BLOB_READ_WRITE_TOKEN is set
- Check file permissions (should be 'public')

## Next Steps

1. **Collect PDF Files**: Gather actual WAEC past question PDFs
2. **Upload via Admin Panel**: Use `/admin-waec-upload.html`
3. **Test Downloads**: Verify PDFs download correctly
4. **Update Mock Data**: Replace mock questions with real metadata

## Vercel Blob Storage Setup

Ensure these environment variables are set:
```
BLOB_READ_WRITE_TOKEN=your_token_here
```

Files are stored at:
```
waec-questions/{id}/{filename}.pdf
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify authentication token
3. Check Vercel Blob Storage dashboard
4. Contact admin for upload permissions
