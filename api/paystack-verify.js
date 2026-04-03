export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reference } = req.body || {};

  if (!reference) {
    return res.status(400).json({ error: "Reference is required" });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("[paystack-verify] PAYSTACK_SECRET_KEY is missing.");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();
    if (data.status && data.data.status === "success") {
      return res.status(200).json({ success: true, detail: data.data });
    } else {
      return res.status(400).json({ success: false, error: data.message || "Transaction failed" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to verify transaction", detail: err.message });
  }
}
