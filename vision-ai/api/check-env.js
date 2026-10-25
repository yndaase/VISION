/**
 * Diagnostic endpoint to check environment variables and test Groq API
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables (without exposing full values)
  const envCheck = {
    GROQ_API_KEY: {
      exists: !!process.env.GROQ_API_KEY,
      prefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 7) + '...' : 'NOT SET',
      length: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0
    },
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL: process.env.VERCEL || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    VERCEL_URL: process.env.VERCEL_URL || 'not set'
  };

  // Test Groq directly with both models
  let groqVersatile = null;
  let groqSpecdec = null;

  if (process.env.GROQ_API_KEY) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10
        })
      });
      const data = await resp.json();
      groqVersatile = { status: resp.status, ok: resp.ok, data };
    } catch (err) {
      groqVersatile = { error: err.message };
    }

    try {
      const resp2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-specdec',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10
        })
      });
      const data2 = await resp2.json();
      groqSpecdec = { status: resp2.status, ok: resp2.ok, data: data2 };
    } catch (err) {
      groqSpecdec = { error: err.message };
    }
  }

  return res.status(200).json({
    status: 'Environment and Groq Check',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    groqVersatile,
    groqSpecdec
  });
}
