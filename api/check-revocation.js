import { get } from '@vercel/blob';

const BLACKLIST_PATH = 'security/risc_blacklist.json';

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sub, email } = req.body || {};

  try {
    const listJson = await get(BLACKLIST_PATH);
    const blacklist = JSON.parse(listJson);

    const isRevoked = 
      (sub && blacklist.revokedSubs.includes(sub)) || 
      (email && blacklist.revokedEmails.includes(email));

    return res.status(200).json({ revoked: !!isRevoked });
  } catch (e) {
    // If blacklist doesn't exist, nobody is revoked yet
    return res.status(200).json({ revoked: false });
  }
}
