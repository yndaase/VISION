// API endpoint for WAEC Past Questions with Vercel Blob Storage
// This handles fetching, uploading, and managing past question PDFs

import { put, list, head } from '@vercel/blob';

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
    // Authentication check (basic)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Route handling
    if (req.method === 'GET') {
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

// GET: Fetch all questions from Vercel Blob
async function handleGetQuestions(req, res) {
  try {
    const { subject, year, paperType } = req.query;

    // In production, fetch from Vercel Blob
    // const { blobs } = await list({ prefix: 'waec-questions/' });
    
    // For now, return mock data
    let questions = [...mockQuestions];

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

// POST: Upload a new question PDF to Vercel Blob
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
      fileName 
    } = req.body;

    // Validate required fields
    if (!subject || !year || !paperType || !fileData || !fileName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['subject', 'year', 'paperType', 'fileData', 'fileName']
      });
    }

    // Generate unique ID
    const id = `waec-${subject.toLowerCase()}-${year}-${paperType}`;

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Upload to Vercel Blob
    const blob = await put(`waec-questions/${id}/${fileName}`, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/pdf'
    });

    // Create question metadata
    const questionMetadata = {
      id,
      subject,
      year: parseInt(year),
      title: title || `WAEC ${subject} ${year} - ${paperType}`,
      paperType,
      duration: duration || '3 hours',
      questions: questionCount || null,
      blobUrl: blob.url,
      uploadedAt: new Date().toISOString()
    };

    // In production, save metadata to database
    // await saveQuestionMetadata(questionMetadata);

    return res.status(201).json({
      success: true,
      message: 'Question uploaded successfully',
      question: questionMetadata,
      blobUrl: blob.url
    });
  } catch (error) {
    console.error('Error uploading question:', error);
    return res.status(500).json({ 
      error: 'Failed to upload question',
      message: error.message 
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

    // In production, delete from Vercel Blob
    // await del(blobUrl);

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

// Helper: Get download URL for a specific question
export async function getDownloadUrl(questionId) {
  try {
    // Find question metadata
    const question = mockQuestions.find(q => q.id === questionId);
    
    if (!question) {
      throw new Error('Question not found');
    }

    // In production, get signed URL from Vercel Blob
    // const { url } = await head(question.blobUrl);
    
    // For now, return mock URL
    return {
      downloadUrl: question.blobUrl || `https://blob.vercel-storage.com/waec-questions/${questionId}.pdf`,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
    };
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
}
