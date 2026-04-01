export default async function handler(req, res) {
  //  CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, code, type, name } = req.body || {};

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "[send-code] RESEND_API_KEY is not set in Vercel environment variables.",
    );
    return res
      .status(500)
      .json({ error: "Server configuration error: missing RESEND_API_KEY" });
  }

  const subject =
    type === "2fa"
      ? "Vision  Identity Verification Code"
      : "Vision  Password Reset Code";
  const title =
    type === "2fa" ? "Identity Verification" : "Password Reset Request";
  const message =
    type === "2fa"
      ? "A Two-Factor Authentication sign-in was requested from your account."
      : "You requested to reset your password for the Vision Education platform.";

  // Use verified domain sender. Override via RESEND_FROM_EMAIL env var if needed.
  const fromEmail = process.env.RESEND_FROM_EMAIL || "auth@visionedu.online";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #050608; color: #f1f5f9; margin: 0; padding: 40px 20px; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 40px; max-width: 480px; margin: 0 auto; }
    .logo { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 24px; text-align: center; }
    .accent { color: #6366f1; }
    .title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .code-box {
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.35);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      font-size: 36px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #818cf8;
      margin: 28px 0;
      font-family: 'Courier New', monospace;
    }
    p { color: #94a3b8; line-height: 1.6; }
    .footer { font-size: 11px; color: #475569; text-align: center; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Vision <span class="accent">Education</span></div>
    <div class="title">${title}</div>
    <p>Hi ${name || "Student"},</p>
    <p>${message}</p>
    <div class="code-box">${code}</div>
    <p>This code expires in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email. Your account remains secure.</p>
    <div class="footer">
       2026 Vision Education Platform &middot; WASSCE Excellence &middot; St. Augustine's College
    </div>
  </div>
</body>
</html>`;

  try {
    console.log(
      `[send-code] Sending ${type} code to: ${email} from: ${fromEmail}`,
    );

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Vision Education <${fromEmail}>`,
        to: [email],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[send-code] Email sent successfully. ID: ${data.id}`);
      return res.status(200).json({ success: true, id: data.id });
    } else {
      console.error(
        `[send-code] Resend rejected: status=${response.status}`,
        JSON.stringify(data),
      );
      return res.status(response.status).json({
        success: false,
        error: data.message || "Resend rejected the request",
        name: data.name,
        detail: data,
      });
    }
  } catch (err) {
    console.error("[send-code] Network/fetch error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      detail: err.message,
    });
  }
}
