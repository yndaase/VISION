export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, amount, metadata } = req.body || {};

  if (!email || !amount) {
    return res.status(400).json({ error: "Email and amount are required" });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("[paystack-init] PAYSTACK_SECRET_KEY is missing.");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to GHS pesewas/NGN kobo
        currency: "GHS",
        metadata,
      }),
    });

    const data = await response.json();
    if (data.status) {
      return res.status(200).json(data.data);
    } else {
      return res.status(400).json({ error: data.message });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to initialize transaction", detail: err.message });
  }
}
