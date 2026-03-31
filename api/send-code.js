export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, code, type, name } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured on Vercel.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const subject = type === '2fa' ? 'Vision 2FA Identity Code' : 'Vision Password Reset Code';
  const title = type === '2fa' ? 'Identity Verification' : 'Password Reset Request';
  const message = type === '2fa' 
    ? 'A secondary security sign-in was requested from your account.' 
    : 'You requested to reset your password for the Vision Education platform.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Outfit', sans-serif; background-color: #050608; color: #f1f5f9; padding: 40px; }
        .card { background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 40px; max-width: 500px; margin: auto; }
        .logo { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 30px; text-align: center; }
        .accent { color: #6366f1; }
        .title { font-size: 20px; font-weight: 700; margin-bottom: 10px; }
        .code-box { background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 20px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #818cf8; margin: 30px 0; }
        .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">Vision <span class="accent">Education</span></div>
        <div class="title">${title}</div>
        <p>Hi ${name || 'Student'},</p>
        <p>${message}</p>
        <div class="code-box">${code}</div>
        <p>This code will expire in 10 minutes. If you did not request this, please ignore this email or contact support.</p>
        <div class="footer">
          © 2026 Vision Education Platform · WASSCE Excellence
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vision Education <onboarding@resend.dev>',
        to: email,
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, id: data.id });
    } else {
      console.error('Resend API error:', data);
      return res.status(response.status).json({ error: data.message || 'Failed to send email' });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
