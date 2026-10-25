/**
 * Diagnostic endpoint to check environment variables
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const envCheck = {
    GROQ_API_KEY: {
      exists: !!process.env.GROQ_API_KEY,
      prefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 7) + '...' : 'NOT SET',
      length: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0
    },
    activeModel: 'openai/gpt-oss-120b',
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL: process.env.VERCEL || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    VERCEL_URL: process.env.VERCEL_URL || 'not set'
  };

  return res.status(200).json({
    status: 'Environment check',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    message: envCheck.GROQ_API_KEY.exists 
      ? '✅ GROQ_API_KEY is configured' 
      : '❌ GROQ_API_KEY is NOT configured - Add it in Vercel project settings'
  });
}
