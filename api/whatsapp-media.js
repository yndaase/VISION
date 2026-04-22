export default async function handler(req, res) {
  const { mediaId } = req.query;
  const token = process.env.WHATSAPP_TOKEN;

  if (!mediaId || !token) {
    return res.status(400).json({ error: 'Missing Media ID or Token' });
  }

  try {
    // 1. Get the Media URL from Meta
    const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const metaData = await metaResponse.json();
    if (!metaData.url) {
      return res.status(404).json({ error: 'Media URL not found' });
    }

    // 2. Fetch the actual binary audio file
    const mediaFile = await fetch(metaData.url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // 3. Stream it back to the browser
    const contentType = mediaFile.headers.get('content-type') || 'audio/ogg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    const buffer = await mediaFile.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error("[Media Proxy Error]:", error);
    return res.status(500).json({ error: 'Failed to fetch media' });
  }
}
