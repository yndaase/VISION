// Vision AI Paystack Proxy
// Proxies payment requests to main visionedu.online API

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Forward request to main API
    const response = await fetch('https://visionedu.online/api/paystack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    // Return the response
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Paystack proxy error:', error);
    return res.status(500).json({ 
      error: 'Payment system error',
      message: error.message 
    });
  }
}
