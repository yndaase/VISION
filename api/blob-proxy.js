// Blob Proxy API - Adds CORS headers to Vercel Blob requests
// This fixes CORS issues when accessing blob storage from the frontend

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    // Validate that it's a Vercel Blob URL
    if (!url.startsWith('https://blob.vercel-storage.com/')) {
      return res.status(400).json({ error: 'Invalid blob URL' });
    }

    // Fetch the blob
    const blobResponse = await fetch(url);

    if (!blobResponse.ok) {
      return res.status(blobResponse.status).json({ 
        error: 'Failed to fetch blob',
        status: blobResponse.status 
      });
    }

    // Get the content type
    const contentType = blobResponse.headers.get('content-type') || 'application/octet-stream';
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Stream the response
    const buffer = await blobResponse.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Blob proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
