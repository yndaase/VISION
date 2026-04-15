import { SignJWT, jwtVerify } from 'jose';

/**
 * Admin Email OTP Handler for Vision Portal
 * Uses the Resend API for "Free & Instant" delivery.
 * Uses Stateless JWT-based verification.
 */

export default async function handler(req, res) {
  const { type, to, code, verificationToken } = req.body || req.query || {};

  const resendKey = process.env.RESEND_API_KEY;
  const otpSecret = process.env.OTP_SECRET;

  if (!resendKey || !otpSecret) {
    console.error("[Email Auth] Missing environment variables.");
    return res.status(500).json({ 
      success: false, 
      error: "Verification service unconfigured",
      detail: "RESEND_API_KEY or OTP_SECRET is missing." 
    });
  }

  const secret = new TextEncoder().encode(otpSecret);

  try {
    if (type === 'send') {
      if (!to) return res.status(400).json({ success: false, error: "Recipient email required." });

      // 1. Generate 6-digit OTP
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Sign Stateless Verification Token (Expires in 5 mins)
      const token = await new SignJWT({ code: generatedCode, to })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('5m')
        .sign(secret);

      // 3. Send Email via Resend
      const fromEmail = process.env.RESEND_FROM_EMAIL || "auth@visionedu.online";
      
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Vision Admin <${fromEmail}>`,
          to: to,
          subject: `Security Code: ${generatedCode}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 400px;">
              <h2 style="color: #6366f1;">Vision Admin Portal</h2>
              <p>Hello, use the security code below to complete your login. It is valid for 5 minutes.</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; border-radius: 8px;">
                ${generatedCode}
              </div>
              <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `
        })
      });

      const resendData = await resendRes.json();

      if (!resendRes.ok) {
        console.error("[Resend Error]:", resendData);
        return res.status(resendRes.status).json({ success: false, error: resendData.message || "Failed to send email." });
      }

      return res.status(200).json({ 
        success: true, 
        verificationToken: token,
        status: "sent"
      });

    } else if (type === 'check') {
      if (!to || !code || !verificationToken) {
        return res.status(400).json({ success: false, error: "Missing parameters for verification." });
      }

      try {
        // 1. Verify the Token
        const { payload } = await jwtVerify(verificationToken, secret);

        // 2. Check if payload matches request
        const isMatch = payload.code === code && payload.to === to;

        if (isMatch) {
          return res.status(200).json({ success: true, valid: true });
        } else {
          return res.status(200).json({ success: true, valid: false, error: "Invalid code." });
        }
      } catch (err) {
        return res.status(200).json({ success: true, valid: false, error: "Security session expired. Please try again." });
      }

    } else {
      return res.status(400).json({ error: "Invalid action. Use 'send' or 'check'." });
    }
  } catch (error) {
    console.error("[Email Auth API Error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
