# WAEC Past Questions - Vercel Blob Storage Setup

This guide explains how to set up and use the WAEC Past Questions feature with Vercel Blob Storage.

## Features

- ✅ Upload WAEC past question PDFs to Vercel Blob Storage
- ✅ Filter by subject, year, and paper type
- ✅ Secure download links with expiration
- ✅ Admin panel for managing uploads
- ✅ Student-friendly interface with search and filters
- ✅ Analytics tracking for downloads

## Files Created

### Frontend
- `waec-past-questions.html` - Main student-facing page
- `waec-past-questions.js` - Client-side logic for filtering and downloads
- `admin-waec-upload.html` - Admin upload interface
- `admin-waec-upload.js` - Admin upload logic

### Backend API
- `api/waec-questions.js` - Main API for CRUD operations
- `api/waec-questions-download.js` - Download URL generation

## Setup Instructions

### 1. Install Vercel Blob Package

```bash
npm install @vercel/blob
```

### 2. Configure Environment Variables

Add these to your `.env` file or Vercel project settings:

```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

To get your Vercel Blob token:
1. Go to your Vercel dashboard
2. Navigate to Storage → Blob
3. Create a new Blob store or use existing
4. Copy the read-write token

### 3. Update API Routes

The API routes are already set up in the `api/` folder. Make sure your `vercel.json` includes:

```json
{
  "rewrites": [
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

### 4. Add Navigation Links

Update your dashboard navigation to include the Past Questions link:

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

## Usage

### For Admins

1. Navigate to `/admin-waec-upload`
2. Fill in the question details:
   - Subject
   - Year
   - Paper Type (Objective/Theory/Practical)
   - Duration
   - Number of questions
3. Upload the PDF file (max 50MB)
4. Click "Upload to Vercel Blob"

### For Students

1. Navigate to `/waec-past-questions`
2. Use filters to find specific questions:
   - Subject pills for quick filtering
   - Year dropdown
   - Paper type dropdown
   - Sort options
3. Click "Download PDF" to get the question paper
4. Click preview icon to view before downloading

## API Endpoints

### GET `/api/waec-questions`
Fetch all questions with optional filters

**Query Parameters:**
- `subject` - Filter by subject (optional)
- `year` - Filter by year (optional)
- `paperType` - Filter by paper type (optional)

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "waec-math-2024-obj",
      "subject": "Mathematics",
      "year": 2024,
      "title": "WAEC Mathematics 2024 - Objective",
      "paperType": "objective",
      "duration": "2 hours",
      "questions": 50,
      "blobUrl": "https://...",
      "uploadedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### POST `/api/waec-questions`
Upload a new question PDF

**Request Body:**
```json
{
  "subject": "Mathematics",
  "year": 2024,
  "paperType": "objective",
  "title": "WAEC Mathematics 2024 - Objective",
  "duration": "2 hours",
  "questions": 50,
  "fileData": "base64_encoded_pdf_data",
  "fileName": "math_2024_obj.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Question uploaded successfully",
  "question": { ... },
  "blobUrl": "https://..."
}
```

### GET `/api/waec-questions/download/:questionId`
Get secure download URL for a question

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://...",
  "expiresAt": "2024-01-15T11:00:00Z",
  "fileName": "Mathematics_2024_objective.pdf",
  "metadata": {
    "subject": "Mathematics",
    "year": 2024,
    "paperType": "objective"
  }
}
```

### DELETE `/api/waec-questions?id=:questionId`
Delete a question (admin only)

**Response:**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

## Blob Storage Structure

Files are organized in Vercel Blob with this structure:

```
waec-questions/
├── waec-math-2024-obj/
│   └── mathematics_2024_objective.pdf
├── waec-english-2024-obj/
│   └── english_2024_objective.pdf
└── ...
```

## Security Features

1. **Authentication Required** - All endpoints require valid session token
2. **Admin-Only Uploads** - Only admin users can upload/delete questions
3. **Signed URLs** - Download links expire after 1 hour
4. **File Validation** - Only PDF files up to 50MB accepted
5. **CORS Protection** - API endpoints have proper CORS headers

## Analytics

Download events are tracked with:
- Question ID
- User ID
- Timestamp
- Subject/Year/Paper Type

Access analytics via `/api/analytics/track` endpoint.

## Troubleshooting

### Upload fails with "Failed to upload"
- Check that `BLOB_READ_WRITE_TOKEN` is set correctly
- Verify file size is under 50MB
- Ensure file is a valid PDF

### Downloads not working
- Check browser console for errors
- Verify blob URLs are accessible
- Check token expiration

### Questions not showing
- Check API response in Network tab
- Verify authentication token is valid
- Check filter settings

## Future Enhancements

- [ ] Add answer keys storage
- [ ] Implement question preview without download
- [ ] Add bulk upload feature
- [ ] Create marking schemes section
- [ ] Add video solutions integration
- [ ] Implement search functionality
- [ ] Add favorites/bookmarks
- [ ] Create study progress tracking

## Support

For issues or questions, contact the development team or check the main documentation.
