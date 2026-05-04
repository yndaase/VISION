/**
 * Supabase Configuration API
 * Provides Supabase credentials to the client
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Supabase Config] Missing environment variables');
      return res.status(500).json({ 
        error: 'Supabase not configured',
        message: 'Please add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel environment variables'
      });
    }

    // Return configuration
    return res.status(200).json({
      url: supabaseUrl,
      anonKey: supabaseAnonKey
    });
  } catch (error) {
    console.error('[Supabase Config] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
