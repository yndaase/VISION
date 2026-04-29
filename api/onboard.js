export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const LARK_URL = "https://open-jp.larksuite.com/anycross/trigger/callback/MDUxZWUwY2Q2OTBlYTljOTVhMTFmYzc4NDE0Mzc5M2Q1";

  try {
    const response = await fetch(LARK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'Lark Error', detail: errorText });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
}
