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

  const { name, prefix, school, statement } = req.body;

  // Validate required fields
  if (!name || !prefix) {
    return res.status(400).json({ error: "Missing required fields: name and prefix" });
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
        email: email,
        department_ids: [deptId],
        // employee_type: 1=Regular, 2=Intern, 3=Outsourcing, 4=Contractor, 5=Consultant
        // 0 is NOT a valid value per Lark Contacts API — use 1 (Regular) for scholars
        employee_type: 1,
        // Lark will send a welcome/set-password email automatically
      }),
    });

    const result = await createRes.json();
    console.log("[onboard] Lark Contacts API response:", JSON.stringify(result, null, 2));

    if (result.code === 0) {
      // ── Success ──────────────────────────────────────────────────────────
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

