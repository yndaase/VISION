// Vision AI Paystack Payment Handler
// Handles payment initialization and verification

const secretKey = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { type, email, amount, reference, metadata } = req.body;

  try {
    switch (type) {
      case 'init':
        return await handleInit(email, amount, metadata, res);
      case 'verify':
        return await handleVerify(reference, res);
      default:
        return res.status(400).json({ error: 'Invalid request type' });
    }
  } catch (error) {
    console.error(`[Vision AI Payment Error - ${type}]:`, error);
    return res.status(500).json({ error: `Payment error: ${error.message}` });
  }
}

// Initialize payment
async function handleInit(email, amount, metadata, res) {
  if (!email || !amount) {
    return res.status(400).json({ error: 'Email and amount are required' });
  }

  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        amount: Math.round(amount * 100), // Convert to pesewas
        currency: 'GHS',
        callback_url: 'https://ai.visionedu.online/pricing.html',
        metadata: metadata || {}
      })
    });

    const data = await response.json();

    if (data.status) {
      return res.status(200).json(data.data);
    } else {
      return res.status(400).json({ error: data.message || 'Payment initialization failed' });
    }
  } catch (error) {
    console.error('Paystack init error:', error);
    return res.status(500).json({ error: 'Failed to initialize payment' });
  }
}

// Verify payment
async function handleVerify(reference, res) {
  if (!reference) {
    return res.status(400).json({ error: 'Reference is required' });
  }

  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    });

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      return res.status(200).json({
        success: true,
        detail: data.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.message || 'Transaction failed'
      });
    }
  } catch (error) {
    console.error('Paystack verify error:', error);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
}
