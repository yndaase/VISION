export default async function handler(req, res) {
  const { mediaId } = req.query;
  const token = process.env.WHATSAPP_TOKEN;

  console.log(`[Media Debug] Fetching Media ID: ${mediaId}`);

  if (!mediaId) return res.status(400).json({ error: 'Missing Media ID' });
  if (!token) {
    console.error("[Media Debug] CRITICAL: WHATSAPP_TOKEN is not set in Vercel!");
    return res.status(500).json({ error: 'Server token missing' });
  }

  try {
    // 1. Get the Media Metadata from Meta
    const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const metaData = await metaResponse.json();
    console.log(`[Media Debug] Meta Metadata Response: ${JSON.stringify(metaData)}`);

    if (!metaData.url) {
      return res.status(404).json({ error: 'Media URL not found in Meta response' });
    }

    // 2. Fetch the actual binary audio file
    console.log(`[Media Debug] Downloading from Meta URL: ${metaData.url.substring(0, 50)}...`);
    const mediaFile = await fetch(metaData.url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!mediaFile.ok) {
      const errText = await mediaFile.text();
      console.error(`[Media Debug] Download failed: ${mediaFile.status} - ${errText}`);
      return res.status(500).json({ error: 'Meta rejected the download' });
    }

    // 3. Stream it back
    const contentType = mediaFile.headers.get('content-type') || 'audio/ogg';
    console.log(`[Media Debug] Success! Streaming content-type: ${contentType}`);
    
    res.setHeader('Content-Type', contentType);
    const buffer = await mediaFile.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error("[Media Debug] Catch Error:", error.message);
    return res.status(500).json({ error: 'Internal fetch error' });
  }
}
