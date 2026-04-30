// API endpoint for downloading WAEC past questions
// Generates secure download URLs from Vercel Blob Storage

import { head } from '@vercel/blob';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get question ID from URL path
    const { questionId } = req.query;

    if (!questionId) {
      return res.status(400).json({ error: 'Question ID required' });
    }

    // Mock questions data (same as in waec-questions.js)
    const mockQuestions = [
      {
        id: 'waec-math-2024-obj',
        subject: 'Mathematics',
        year: 2024,
        paperType: 'objective',
        blobUrl: 'https://blob.vercel-storage.com/waec-questions/waec-math-2024-obj.pdf'
      },
      {
        id: 'waec-math-2024-theory',
        subject: 'Mathematics',
        year: 2024,
        paperType: 'theory',
        blobUrl: 'https://blob.vercel-storage.com/waec-questions/waec-math-2024-theory.pdf'
      },
      {
        id: 'waec-english-2024-obj',
        subject: 'English',
        year: 2024,
        paperType: 'objective',
        blobUrl: 'https://blob.vercel-storage.com/waec-questions/waec-english-2024-obj.pdf'
      },
      {
        id: 'waec-physics-2023-obj',
        subject: 'Physics',
        year: 2023,
        paperType: 'objective',
        blobUrl: 'https://blob.vercel-storage.com/waec-questions/waec-physics-2023-obj.pdf'
      },
      {
        id: 'waec-chemistry-2023-theory',
        subject: 'Chemistry',
        year: 2023,
        paperType: 'theory',
        blobUrl: 'https://blob.vercel-storage.com/waec-questions/waec-chemistry-2023-theory.pdf'
      },
      {
        id: 'waec-biology-2023-practical',
        subject: 'Biology',
        year: 2023,
        paperType: 'practical',
        blobUrl: 'https://blob.vercel-storage.com/waec-questions/waec-biology-2023-practical.pdf'
      },
      {
        id: 'waec-economics-2022-obj',
        subject: 'Economics',
        year: 2022,
        paperType: 'objective',
        blobUrl: 'https://blob.vercel-storage.com/waec-questions/waec-economics-2022-obj.pdf'
      },
      {
        id: 'waec-geography-2022-theory',
        subject: 'Geography',
        year: 2022,
        paperType: 'theory',
        blobUrl: 'https://blob.vercel-storage.com/waec-questions/waec-geography-2022-theory.pdf'
      },
      {
        id: 'waec-literature-2021-obj',
        subject: 'Literature',
        year: 2021,
        paperType: 'objective',
        blobUrl: 'https://blob.vercel-storage.com/waec-questions/waec-literature-2021-obj.pdf'
      }
    ];

    // Find the question
    const question = mockQuestions.find(q => q.id === questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // In production with actual Vercel Blob:
    // const blobInfo = await head(question.blobUrl);
    // const downloadUrl = blobInfo.url;

    // For now, return the blob URL directly
    const downloadUrl = question.blobUrl;

    // Generate expiry time (1 hour from now)
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    return res.status(200).json({
      success: true,
      downloadUrl: downloadUrl,
      expiresAt: expiresAt,
      fileName: `${question.subject}_${question.year}_${question.paperType}.pdf`,
      metadata: {
        subject: question.subject,
        year: question.year,
        paperType: question.paperType
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate download URL',
      message: error.message 
    });
  }
}
