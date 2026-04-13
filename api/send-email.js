export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, html, text } = req.body;

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Missing required email fields (to, subject, and body)' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Vision Education <welcome@visionedu.online>',
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
        text: text
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ success: true, id: data.id });
    } else {
      const errorData = await response.json();
      return res.status(500).json({ error: errorData.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
