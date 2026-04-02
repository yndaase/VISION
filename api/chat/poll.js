import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { threadId, after } = req.query;

  if (!threadId) {
    return res.status(400).json({ error: "threadId is required" });
  }

  const afterTs = parseInt(after) || 0;

  try {
    // List all blobs under this thread prefix
    const prefix = `chat/${threadId}/`;
    const { blobs } = await list({ prefix });

    if (!blobs || blobs.length === 0) {
      return res.status(200).json({ messages: [] });
    }

    // Fetch message contents — only messages newer than 'after'
    // Filter by blob pathname which contains timestamp
    const messages = [];

    // Fetch all blob contents in parallel (max 50 to avoid overload)
    const recentBlobs = blobs.slice(-50); // Last 50 messages max

    const fetches = recentBlobs.map(async (blob) => {
      try {
        const response = await fetch(blob.downloadUrl);
        const msg = await response.json();
        if (msg.timestamp > afterTs) {
          messages.push(msg);
        }
      } catch (e) {
        // Skip corrupted blobs
        console.warn("[chat/poll] Failed to read blob:", blob.pathname, e.message);
      }
    });

    await Promise.all(fetches);

    // Sort by timestamp ascending
    messages.sort((a, b) => a.timestamp - b.timestamp);

    return res.status(200).json({ messages });
  } catch (err) {
    console.error("[chat/poll] Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
