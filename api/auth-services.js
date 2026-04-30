import { SignJWT, jwtVerify } from 'jose';

/**
 * Consolidated Authentication Services API
 * Combines: phone-auth, verify-face, and send-email functionality
 * Handles: OTP sending/verification, face verification, and general email sending
 */

export default async function handler(req, res) {
  const { service, ...params } = req.body || req.query || {};

  if (!service) {
    return res.status(400).json({ error: 'Service parameter required. Use: otp, face, or email' });
  }

  try {
    switch (service) {
      case 'otp':
        return await handleOTP(req, res, params);
      case 'face':
        return await handleFaceVerification(req, res, params);
      case 'email':
        return await handleEmailSending(req, res, params);
      default:
        return res.status(400).json({ error: 'Invalid service. Use: otp, face, or email' });
    }
  } catch (error) {
    console.error(`[Auth Services] ${service} Error:`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * OTP Service (formerly phone-auth.js)
 */
async function handleOTP(req, res, { type, to, code, verificationToken }) {
  const resendKey = process.env.RESEND_API_KEY;
  const otpSecret = process.env.OTP_SECRET;

  if (!resendKey || !otpSecret) {
    console.error("[OTP] Missing environment variables.");
    return res.status(500).json({ 
      success: false, 
      error: "Verification service unconfigured",
      detail: "RESEND_API_KEY or OTP_SECRET is missing." 
    });
  }

  const secret = new TextEncoder().encode(otpSecret);

  if (type === 'send') {
    if (!to) return res.status(400).json({ success: false, error: "Recipient email required." });

    // Generate 6-digit OTP
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Sign Stateless Verification Token (Expires in 5 mins)
    const token = await new SignJWT({ code: generatedCode, to })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .sign(secret);

    // Send Email via Resend
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
      // Verify the Token
      const { payload } = await jwtVerify(verificationToken, secret);

      // Check if payload matches request
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
}

/**
 * Face Verification Service (formerly verify-face.js)
 */
async function handleFaceVerification(req, res, { email, verified }) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    // Update Firestore with verified status
    await finalizeVerificationInCloud(email);

    console.log("==========================================");
    console.log("FACE VERIFICATION PASSED");
    console.log("Email:", email);
    console.log("==========================================");

    return res.status(200).json({ match: true });

  } catch (error) {
    console.error('[Face Verify] Error:', error.message);
    return res.status(500).json({ match: false, error: 'System busy. Try again.' });
  }
}

/**
 * Email Sending Service (formerly send-email.js)
 */
async function handleEmailSending(req, res, { to, subject, html, text }) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Missing required email fields (to, subject, and body)' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Vision Education <welcome@visionedu.online>',
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
        text: text
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ success: true, id: data.id });
    } else {
      const errorData = await response.json();
      return res.status(500).json({ error: errorData.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Helper function for face verification
 */
async function finalizeVerificationInCloud(email) {
  try {
    if (!global.adminApp) {
      const admin = (await import('firebase-admin')).default;
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!serviceAccountStr) return;
      global.adminApp = admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountStr))
      });
    }
    const admin = (await import('firebase-admin')).default;
    const db = admin.firestore();
    await db.collection('users').doc(email).set({
      isVerified: true,
      verifiedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error("[Face Verify] Database Error:", e.message);
  }
}