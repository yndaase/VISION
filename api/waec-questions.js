// API endpoint for WAEC Past Questions with Vercel Blob Storage
// This handles fetching, uploading, and managing past question PDFs

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import admin from 'firebase-admin';

// Initialize Cloudflare R2 (S3 Client)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'vision-edu-materials';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) rawKey = rawKey.slice(1, -1);
    const serviceAccount = JSON.parse(rawKey);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (err) {
    console.error('Firebase admin init error:', err);
  }
}
const db = admin.apps.length ? admin.firestore() : null;

// Mock data for development - Replace with actual Vercel Blob queries in production
const mockQuestions = [
  {
    id: 'waec-math-2024-obj',
    subject: 'Mathematics',
    year: 2024,
    title: 'WAEC Mathematics 2024 - Objective',
    paperType: 'objective',
    duration: '2 hours',
    questions: 50,
    blobUrl: null,
    uploadedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'waec-math-2024-theory',
    subject: 'Mathematics',
    year: 2024,
    title: 'WAEC Mathematics 2024 - Theory',
    paperType: 'theory',
    duration: '3 hours',
    questions: 13,
    blobUrl: null,
    uploadedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'waec-english-2024-obj',
    subject: 'English',
    year: 2024,
    title: 'WAEC English Language 2024 - Objective',
    paperType: 'objective',
    duration: '2 hours',
    questions: 60,
    blobUrl: null,
    uploadedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'waec-physics-2023-obj',
    subject: 'Physics',
    year: 2023,
    title: 'WAEC Physics 2023 - Objective',
    paperType: 'objective',
    duration: '2 hours',
    questions: 50,
    blobUrl: null,
    uploadedAt: '2023-05-20T10:00:00Z'
  },
  {
    id: 'waec-chemistry-2023-theory',
    subject: 'Chemistry',
    year: 2023,
    title: 'WAEC Chemistry 2023 - Theory',
    paperType: 'theory',
    duration: '3 hours',
    questions: 8,
    blobUrl: null,
    uploadedAt: '2023-05-20T10:00:00Z'
  },
  {
    id: 'waec-biology-2023-practical',
    subject: 'Biology',
    year: 2023,
    title: 'WAEC Biology 2023 - Practical',
    paperType: 'practical',
    duration: '2 hours 30 minutes',
    questions: 3,
    blobUrl: null,
    uploadedAt: '2023-05-20T10:00:00Z'
  },
  {
    id: 'waec-economics-2022-obj',
    subject: 'Economics',
    year: 2022,
    title: 'WAEC Economics 2022 - Objective',
    paperType: 'objective',
    duration: '2 hours',
    questions: 50,
    blobUrl: null,
    uploadedAt: '2022-06-10T10:00:00Z'
  },
  {
    id: 'waec-geography-2022-theory',
    subject: 'Geography',
    year: 2022,
    title: 'WAEC Geography 2022 - Theory',
    paperType: 'theory',
    duration: '3 hours',
    questions: 6,
    blobUrl: null,
    uploadedAt: '2022-06-10T10:00:00Z'
  },
  {
    id: 'waec-literature-2021-obj',
    subject: 'Literature',
    year: 2021,
    title: 'WAEC Literature in English 2021 - Objective',
    paperType: 'objective',
    duration: '2 hours',
    questions: 50,
    blobUrl: null,
    uploadedAt: '2021-07-15T10:00:00Z'
  }
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Light auth check — only block on writes; reads are open to any session holder
    const authHeader = req.headers.authorization || (req.query.token ? `Bearer ${req.query.token}` : null);
    const isWrite = req.method === 'POST' || req.method === 'DELETE';
    const isGetUploadUrl = req.method === 'GET' && req.query.action === 'get-upload-url';
    
    const hasValidAuth = authHeader && authHeader.trim() !== 'Bearer' && authHeader.trim() !== 'Bearer null';
    if ((isWrite || isGetUploadUrl) && !hasValidAuth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isGetUploadUrl) {
      return await handleGetUploadUrl(req, res);
    }

    if (req.method === 'GET' && req.query.action === 'download') {
      return await handleProxyDownload(req, res);
    }

    // Check if this is a download request (has questionId in query for GET)
    const { questionId } = req.query;
    
    // Route handling
    if (req.method === 'GET' && !req.query.action) {
      // List questions request
      return await handleGetQuestions(req, res);
    } else if (req.method === 'POST') {
      return await handleUploadQuestion(req, res);
    } else if (req.method === 'DELETE') {
      return await handleDeleteQuestion(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// GET: Fetch all questions from Firestore
async function handleGetQuestions(req, res) {
  try {
    const { subject, year, paperType } = req.query;

    let questions = [];
    if (db) {
      const snapshot = await db.collection('waec_questions').get();
      snapshot.forEach(doc => {
        questions.push(doc.data());
      });
    } else {
      questions = [...mockQuestions]; // Fallback if DB not connected
    }

    // Apply filters
    if (subject && subject !== 'all') {
      questions = questions.filter(q => 
        q.subject.toLowerCase() === subject.toLowerCase()
      );
    }

    if (year && year !== 'all') {
      questions = questions.filter(q => q.year === parseInt(year));
    }

    if (paperType && paperType !== 'all') {
      questions = questions.filter(q => q.paperType === paperType);
    }

    return res.status(200).json({
      success: true,
      questions: questions,
      total: questions.length
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch questions',
      message: error.message 
    });
  }
}

// GET: Generate pre-signed URL for client upload to Cloudflare R2
async function handleGetUploadUrl(req, res) {
  try {
    const { fileKey, contentType } = req.query;
    if (!fileKey) return res.status(400).json({ error: 'fileKey required' });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType || 'application/pdf',
    });

    // URL expires in 1 hour
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    
    return res.status(200).json({ uploadUrl, fileKey });
  } catch (error) {
    console.error('R2 pre-signed URL generation error:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}

// POST: Upload a new question PDF metadata to database
async function handleUploadQuestion(req, res) {
  try {
    const { 
      subject, 
      year, 
      paperType, 
      title, 
      duration, 
      questions: questionCount,
      fileData,
      blobUrl,
      fileName 
    } = req.body;

    // Validate required fields
    if (!subject || !year || !paperType || !fileName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['subject', 'year', 'paperType', 'fileName']
      });
    }

    // Generate unique ID
    const id = `waec-${subject.toLowerCase()}-${year}-${paperType}`;

    let finalBlobUrl = blobUrl || `waec-questions/${id}/${fileName}`;

    // Fallback for base64 (if someone uses old method)
    if (fileData) {
      const buffer = Buffer.from(fileData, 'base64');
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: finalBlobUrl,
        Body: buffer,
        ContentType: 'application/pdf'
      });
      await r2Client.send(command);
    }

    // Create question metadata
    const questionMetadata = {
      id,
      subject,
      year: parseInt(year),
      title: title || `WAEC ${subject} ${year} - ${paperType}`,
      paperType,
      duration: duration || '3 hours',
      questions: questionCount || null,
      blobUrl: finalBlobUrl,
      uploadedAt: new Date().toISOString()
    };

    // Save metadata to database
    if (db) {
      await db.collection('waec_questions').doc(id).set(questionMetadata);
    }

    return res.status(201).json({
      success: true,
      message: 'Question uploaded successfully',
      question: questionMetadata,
      blobUrl: finalBlobUrl
    });
  } catch (error) {
    console.error('Error uploading question:', error);
    return res.status(500).json({ 
      error: 'Failed to upload question',
      message: error.message,
      stack: error.stack,
      details: 'Check Vercel logs or if token is valid'
    });
  }
}

// DELETE: Remove a question from Vercel Blob
async function handleDeleteQuestion(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Question ID required' });
    }

    let blobUrlToDelete = null;

    if (db) {
      const doc = await db.collection('waec_questions').doc(id).get();
      if (doc.exists) {
        blobUrlToDelete = doc.data().blobUrl;
        await db.collection('waec_questions').doc(id).delete();
      }
    }

    // Delete from R2
    if (blobUrlToDelete) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: blobUrlToDelete
        });
        await r2Client.send(command);
      } catch (r2Err) {
        console.error('Error deleting from R2:', r2Err);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ 
      error: 'Failed to delete question',
      message: error.message 
    });
  }
}

// GET: Proxy download for private R2 blobs (generates pre-signed URL and redirects)
async function handleProxyDownload(req, res) {
  try {
    const { questionId, download } = req.query;

    if (!questionId) {
      return res.status(400).send('Question ID required');
    }

    let question = null;
    if (db) {
      const doc = await db.collection('waec_questions').doc(questionId).get();
      if (doc.exists) question = doc.data();
    } else {
      question = mockQuestions.find(q => q.id === questionId);
    }

    if (!question || !question.blobUrl) {
      return res.status(404).send('File not found or not yet uploaded');
    }

    // Generate pre-signed URL for Cloudflare R2
    const commandParams = {
      Bucket: BUCKET_NAME,
      Key: question.blobUrl,
    };

    if (download === '1') {
      const filename = `${question.subject}_${question.year}_${question.paperType}.pdf`;
      commandParams.ResponseContentDisposition = `attachment; filename="${filename}"`;
    } else {
      commandParams.ResponseContentDisposition = `inline`;
      commandParams.ResponseContentType = 'application/pdf';
    }

    const command = new GetObjectCommand(commandParams);
    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    // Redirect user to the pre-signed R2 URL (offloads bandwidth to Cloudflare)
    return res.redirect(302, presignedUrl);
  } catch (error) {
    console.error('Proxy download error:', error);
    return res.status(500).send('Failed to serve download');
  }
}

// End of file
