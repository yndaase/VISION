const secretKey = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { type, email, amount, reference, metadata } = req.body;

  try {
    switch (type) {
      case 'init': return await handleInit(email, amount, metadata, res);
      case 'verify': return await handleVerify(reference, res);
      default: return res.status(400).json({ error: 'Invalid Payment request type' });
    }
  } catch (error) {
    console.error(`[Payment Hub Error - ${type}]:`, error);
    return res.status(500).json({ error: `Payment System Error: ${error.message}` });
  }
}

// --- Handlers ---

async function handleInit(email, amount, metadata, res) {
  if (!email || !amount) return res.status(400).json({ error: "Email and amount are required" });
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount: Math.round(amount * 100), currency: "GHS", metadata })
  });
  const data = await response.json();
  return res.status(data.status ? 200 : 400).json(data.status ? data.data : { error: data.message });
}

async function handleVerify(reference, res) {
  if (!reference) return res.status(400).json({ error: "Reference is required" });
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  const data = await response.json();
  if (data.status && data.data.status === "success") {
    return res.status(200).json({ success: true, detail: data.data });
  } else {
    return res.status(400).json({ success: false, error: data.message || "Transaction failed" });
  }
}
