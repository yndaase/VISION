import { put } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { from, to, threadId, text, timestamp } = req.body || {};

  if (!from || !to || !threadId || !text) {
    return res.status(400).json({ error: "Missing required fields: from, to, threadId, text" });
  }

  const ts = timestamp || Date.now();
  const msgId = `${ts}_${Math.random().toString(36).slice(2, 8)}`;

  const message = {
    id: msgId,
    from,
    to,
    threadId,
    text,
    timestamp: ts,
  };

  try {
    // Store each message as an individual blob for fast append
    // Path: chat/<threadId>/<timestamp>_<random>.json
    const blobPath = `chat/${threadId}/${msgId}.json`;

    await put(blobPath, JSON.stringify(message), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    return res.status(200).json({ success: true, id: msgId });
  } catch (err) {
    console.error("[chat/send] Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
