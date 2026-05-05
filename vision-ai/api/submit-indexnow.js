/**
 * Vercel Serverless Function to Submit URLs to IndexNow
 * This bypasses CORS restrictions by making the request server-side
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = 'e65d13f8505645a4adebfc3b905bc240';
  const HOST = 'ai.visionedu.online';
  const KEY_LOCATION = `https://${HOST}/${API_KEY}.txt`;

  const urls = [
    `https://${HOST}/`,
    `https://${HOST}/features`,
    `https://${HOST}/about`,
    `https://${HOST}/login`,
    `https://${HOST}/chat`
  ];

  const payload = {
    host: HOST,
    key: API_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  };

  try {
    // Submit to IndexNow API
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    // Check response status
    if (response.ok || response.status === 200 || response.status === 202) {
      return res.status(200).json({
        success: true,
        message: 'All URLs submitted successfully to IndexNow',
        urls: urls,
        status: response.status,
        statusText: response.statusText
      });
    } else if (response.status === 400) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format - please check the URL format'
      });
    } else if (response.status === 403) {
      return res.status(403).json({
        success: false,
        error: 'API key not valid - please verify the key file is accessible',
        keyLocation: KEY_LOCATION
      });
    } else if (response.status === 422) {
      return res.status(422).json({
        success: false,
        error: 'URLs don\'t belong to the host or key mismatch'
      });
    } else if (response.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests - please wait a few minutes and try again'
      });
    } else {
      return res.status(response.status).json({
        success: false,
        error: `Unexpected response: ${response.status} ${response.statusText}`
      });
    }
  } catch (error) {
    console.error('IndexNow submission error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit to IndexNow'
    });
  }
}
