// ─── Lark Scholar Auto-Provisioning ────────────────────────────────────────
// Calls Lark's Contacts API directly (no AnyCross middleman).
// Required Vercel env vars:
//   LARK_APP_ID      — from open-jp.larksuite.com/app → your app → Credentials
//   LARK_APP_SECRET  — same location
//   LARK_DEPT_ID     — department ID for scholars (use "0" for root org)

const LARK_BASE = "https://open-jp.larksuite.com/open-apis";

// Human-readable messages for common Lark error codes
const LARK_ERRORS = {
  40004: "App has no authority over this department. In Lark Admin → App Management → your app → set 'Scope of Data Access' to all employees.",
  41059: "Invalid employee type. Your Lark tenant does not support this employee category — contact your Lark admin to verify allowed workforce types.",
  99991663: "App permissions not approved yet. Ask your Lark admin to approve the app.",
  99991400: "That email prefix is already taken. Please choose a different one.",
  99991672: "Invalid department ID. Check your LARK_DEPT_ID environment variable.",
  99992402: "Field validation failed. Check that name and email prefix are valid.",
};

async function getLarkToken() {
  const res = await fetch(`${LARK_BASE}/auth/v3/app_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.LARK_APP_ID,
      app_secret: process.env.LARK_APP_SECRET,
    }),
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Token fetch failed: ${data.msg} (code ${data.code})`);
  }
  return data.app_access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, prefix, school, statement, personalEmail } = req.body;

  // Validate required fields
  if (!name || !prefix || !personalEmail) {
    return res.status(400).json({ error: "Missing required fields: name, prefix, and personalEmail" });
  }

  // Sanitize prefix — lowercase, strip anything not a letter/number/dot/hyphen/underscore
  const cleanPrefix = prefix.trim().toLowerCase().replace(/[^a-z0-9.\-_]/g, "");
  if (!cleanPrefix) {
    return res.status(400).json({ error: "Invalid email prefix after sanitization." });
  }

  const email = `${cleanPrefix}@edu.visionedu.online`;
  const deptId = process.env.LARK_DEPT_ID || "0";

  console.log(`[onboard] Provisioning scholar: ${name} → ${email}`);

  try {
    // ── Step 1: Get a fresh app access token ──────────────────────────────
    const token = await getLarkToken();

    // ── Step 2: Create the user via Lark Contacts API ─────────────────────
    const createRes = await fetch(`${LARK_BASE}/contact/v3/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        // enterprise_email → appears as "Business email" in Lark (Lark Mail inbox)
        enterprise_email: email,
        // email (work email) → used by Lark for login & activation notifications
        // Using personal email here so the scholar receives the invite in an inbox they can access
        email: personalEmail,
        department_ids: [deptId],
        // employee_type: 1=Regular, 2=Intern, 3=Outsourcing, 4=Contractor, 5=Consultant
        employee_type: 1,
      }),
    });

    const result = await createRes.json();
    console.log("[onboard] Lark Contacts API response:", JSON.stringify(result, null, 2));

    if (result.code === 0) {
      // ── Send activation email to personal inbox ──────────────────────────
      const activationHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4fc;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4fc;padding:40px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <!-- Header -->
      <tr><td style="background:#1a1a2e;padding:32px 40px;border-bottom:3px solid #fbbf24">
        <div style="display:inline-block;background:#fbbf24;border-radius:10px;padding:6px 14px;font-size:20px;font-weight:900;color:#1a1a2e;letter-spacing:-1px">V</div>
        <span style="color:#ffffff;font-size:18px;font-weight:700;margin-left:12px;vertical-align:middle">Vision Education</span>
        <p style="color:#fbbf24;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:8px 0 0">Scholar Fellowship Program</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:40px">
        <h1 style="color:#1a1a2e;font-size:26px;font-weight:800;margin:0 0 8px">Welcome to the Cohort, ${name.trim()}!</h1>
        <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 32px">Your exclusive Vision Scholar account has been provisioned. Follow the steps below to activate it and set your password.</p>
        <!-- Email badge -->
        <div style="background:#f4f4fc;border:1.5px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:32px">
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin:0 0 6px">Your Institutional Email</p>
          <p style="font-size:22px;font-weight:800;color:#1a1a2e;margin:0">${email}</p>
          <p style="font-size:12px;color:#9ca3af;margin:6px 0 0">Powered by Lark Suite &bull; 100 GB Storage</p>
        </div>
        <!-- Steps -->
        <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#fbbf24;margin:0 0 20px">How to Activate &amp; Log In</h2>
        ${[
          ['1', 'Visit the Portal', 'Go to <a href="https://open.larksuite.com" style="color:#6366f1">open.larksuite.com</a> or open the Lark mobile app'],
          ['2', 'Use Personal Email', `<strong style="color:#b91c1c">CRITICAL:</strong> You MUST enter your personal email here (the one you applied with).`],
          ['3', 'Enter Access Code', 'Lark will instantly email a 6-digit access code to your personal inbox. Enter it.'],
          ['4', 'Unlock Workspace', 'You are in! Your Vision inbox is now accessible. (Set a password later in Settings).'],
        ].map(([n, t, d]) => `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
          <tr>
            <td width="36" valign="top"><div style="width:28px;height:28px;background:#fbbf24;border-radius:50%;text-align:center;line-height:28px;font-weight:800;font-size:13px;color:#1a1a2e">${n}</div></td>
            <td style="padding-left:12px"><strong style="color:#1a1a2e;font-size:14px">${t}</strong><br><span style="color:#6b7280;font-size:13px">${d}</span></td>
          </tr>
        </table>`).join('')}
        <div style="margin-top:32px;padding:16px 20px;background:#fffbeb;border-left:4px solid #fbbf24;border-radius:6px">
          <p style="margin:0;font-size:13px;color:#92400e"><strong>Tip:</strong> Logging in with a verification code is the fastest and most secure way to access your account for the first time.</p>
        </div>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#1a1a2e;padding:20px 40px;text-align:center">
        <p style="color:#6b7280;font-size:11px;margin:0">&copy; 2026 Vision Education &bull; Scholar Fellowship &bull; Accra, Ghana</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

      // Fire-and-forget the email — don't block the main response
      fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: personalEmail,
          subject: `🎓 Your Vision Scholar Account is Ready — ${email}`,
          html: activationHtml,
        }),
      }).catch(err => console.warn('[onboard] Activation email failed (non-fatal):', err.message));

      // ── Success response ──────────────────────────────────────────────────
      return res.status(200).json({
        success: true,
        email,
        user_id: result.data?.user?.user_id,
      });
    } else {
      // ── Known Lark error ─────────────────────────────────────────────────
      const friendlyMsg = LARK_ERRORS[result.code] || result.msg || "Unknown Lark error";
      console.error(`[onboard] Lark error ${result.code}: ${friendlyMsg}`, result);
      return res.status(400).json({
        error: friendlyMsg,
        lark_code: result.code,
        detail: result,
      });
    }
  } catch (err) {
    console.error("[onboard] Internal error:", err);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}

