import { put, list } from '@vercel/blob';
import * as jose from 'jose';

const BLACKLIST_PATH = 'security/risc_blacklist.json';
const USERS_PATH = 'users/vision_v2_users.json';
const JWKS = jose.createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export default async function handler(req, res) {
  const { type } = req.body || req.query || {};

  try {
    switch (type || (req.method==='GET'?'risc-get':null)) {
      case 'send-code': return await handleSendCode(req.body, res);
      case 'check-revocation': return await handleCheckRevocation(req.body, res);
      case 'sync-users': return await handleSyncUsers(req.body, res);
      case 'get-pro-users': return await handleGetProUsers(req, res);
      case 'risc-receiver': return await handleRiscReceiver(req, res);
      case 'risc-get': return await handleRiscGet(req, res);
      default: return res.status(400).json({ error: 'Invalid Auth request type' });
    }
  } catch (error) {
    console.error(`[Auth Hub Error - ${type}]:`, error);
    return res.status(500).json({ error: `Auth System Error: ${error.message}` });
  }
}

// --- Handlers ---

async function handleSendCode(data, res) {
  const { email, code, authType, name } = data;
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "auth@visionedu.online";
  const subject = authType === "2fa" ? "Vision Identity Verification" : "Vision Password Reset";
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `Vision Education <${fromEmail}>`,
      to: [email],
      subject,
      html: `<html><body style="font-family:sans-serif; background:#0f172a; color:#f8fafc; padding:2rem;"><h2 style="color:#38bdf8;">${subject} Code</h2><p>Hi ${name || 'Explorer'},</p><div style="font-size:32px; font-weight:bold; letter-spacing:8px; background:rgba(56,189,248,0.1); padding:1rem; border-radius:8px; text-align:center; color:#38bdf8;">${code}</div><p>This code expires in 10 minutes.</p></body></html>`
    }),
  });
  const resData = await response.json();
  return res.status(200).json({ success: response.ok, id: resData.id });
}

async function handleCheckRevocation(data, res) {
  const { sub, email } = data;
  const { blobs } = await list({ prefix: BLACKLIST_PATH });
  if (blobs.length === 0) return res.status(200).json({ revoked: false });
  const response = await fetch(blobs[0].url);
  const blacklist = await response.json();
  const isRevoked = (sub && (blacklist.revokedSubs || []).includes(sub)) || (email && (blacklist.revokedEmails || []).includes(email));
  return res.status(200).json({ revoked: !!isRevoked });
}

async function handleRiscReceiver(req, res) {
  try {
    // Depending on Next.js/Vercel body parsing for custom content-types, extract raw token
    let token = req.body;
    if (typeof token === 'object') {
      // If parsed as JSON incorrectly, attempt to extract token or raw symbols
      if (Object.keys(token).length === 1 && typeof Object.keys(token)[0] === 'string' && Object.keys(token)[0].startsWith('eyJ')) {
        token = Object.keys(token)[0];
      } else {
        token = JSON.stringify(token); // Fallback
      }
    }

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com';
    const { payload: decoded } = await jose.jwtVerify(token, JWKS, { 
      issuer: 'https://accounts.google.com/', 
      audience: CLIENT_ID 
    });

    const events = decoded.events || {};
    
    // Check if it's just a verification event
    if (events['https://schemas.openid.net/secevent/risc/event-type/verification']) {
      return res.status(202).json({ status: 'Accepted' });
    }

    const current = await getBlacklist();
    const jti = decoded.jti;

    if (jti) {
      if (!current.processedJtis) current.processedJtis = [];
      if (current.processedJtis.includes(jti)) {
        return res.status(202).json({ status: 'Already processed' });
      }
      current.processedJtis.push(jti);
      if (current.processedJtis.length > 500) current.processedJtis.shift();
    }

    let shouldRevoke = false;
    let revokedSub = null;

    // Check multiple revocation events
    const disabledEvent = events['https://schemas.openid.net/secevent/risc/event-type/account-disabled'];
    const sessionsRevokedEvent = events['https://schemas.openid.net/secevent/risc/event-type/sessions-revoked'];
    const tokensRevokedEvent = events['https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked'];
    const tokenRevokedEvent = events['https://schemas.openid.net/secevent/oauth/event-type/token-revoked'];

    if (disabledEvent) {
      revokedSub = disabledEvent.subject?.sub;
      shouldRevoke = true;
    } else if (sessionsRevokedEvent) {
      revokedSub = sessionsRevokedEvent.subject?.sub;
      shouldRevoke = true;
    } else if (tokensRevokedEvent) {
      revokedSub = tokensRevokedEvent.subject?.sub;
      shouldRevoke = true;
    } else if (tokenRevokedEvent) {
      // Usually handles specific refresh tokens but we do a full sub blacklist for safety
      revokedSub = tokenRevokedEvent.subject?.sub;
      shouldRevoke = true;
    }

    if (shouldRevoke && revokedSub && !current.revokedSubs.includes(revokedSub)) {
      current.revokedSubs.push(revokedSub);
      await put(BLACKLIST_PATH, JSON.stringify(current), { access: 'public', addRandomSuffix: false });
    }

    return res.status(202).json({ status: 'Accepted' });
  } catch (err) {
    console.error("[RISC Receiver Error]:", err);
    // As per JWT sec event docs, if token is malformed, we must return 400
    // If it's another error, return 500
    if (err.code === 'ERR_JWT_VERIFICATION_FAILED' || err.code === 'ERR_JWS_INVALID' || err.code === 'ERR_JWT_EXPIRED') {
      return res.status(400).json({ error: 'Token validation failed' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function handleRiscGet(req, res) {
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send('<html><body style="background:#0f172a; color:#38bdf8; font-family:sans-serif; padding:4rem; text-align:center;"><h1>Vision Shield Activated</h1><p>Monitoring security events for 2026 WASSCE candidates.</p></body></html>');
}

async function getBlacklist() {
  const { blobs } = await list({ prefix: BLACKLIST_PATH });
  if (blobs.length === 0) return { revokedSubs: [], revokedEmails: [], processedJtis: [] };
  const response = await fetch(blobs[0].url);
  return await response.json();
}

/**
 * Universal Sync Logic: Merges Local & Cloud DBs
 */
async function handleSyncUsers(data, res) {
  const { localUsers = [] } = data;
  const cloudUsers = await getGlobalUsers();
  
  console.log(`[Auth Sync] Start. Local: ${localUsers.length}, Cloud: ${cloudUsers.length}`);

  // Merge Strategy: Unique by Email
  const userMap = new Map();
  
  // 1. Load Cloud first
  cloudUsers.forEach(u => {
    if (u && u.email) userMap.set(u.email.toLowerCase(), u);
  });

  // 2. Merge Local (Local overrides cloud if newer, except for roles)
  localUsers.forEach(u => {
    if (!u || !u.email) return;
    const email = u.email.toLowerCase();
    if (!userMap.has(email)) {
        userMap.set(email, u);
    } else {
        // Merge but preserve existing Pro roles from cloud
        const existing = userMap.get(email);
        const finalRole = (existing.role === 'admin' || u.role === 'admin') ? 'admin' :
                         (existing.role === 'enterprise' || u.role === 'enterprise') ? 'enterprise' :
                         (existing.role === 'pro' || u.role === 'pro') ? 'pro' : u.role;
                         
        userMap.set(email, { 
          ...existing, 
          ...u, 
          role: finalRole,
          institutionId: u.institutionId || existing.institutionId,
          institutionName: u.institutionName || existing.institutionName,
          subscriptionExpiry: Math.max(existing.subscriptionExpiry || 0, u.subscriptionExpiry || 0),
          trialStartedAt: Math.max(existing.trialStartedAt || 0, u.trialStartedAt || 0)
        });
    }
  });

  // 3. ADMIN OVERRIDE (Permanent PRO)
  const adminEmail = 'gisgreat308@gmail.com';
  const adminAccount = userMap.get(adminEmail) || { email: adminEmail, name: 'Vision Admin', provider: 'google' };
  adminAccount.role = 'pro';
  userMap.set(adminEmail, adminAccount);

  const finalUsers = Array.from(userMap.values());
  
  console.log(`[Auth Sync] Completed. Final Global Count: ${finalUsers.length}`);

  // Push to Cloud
  await put(USERS_PATH, JSON.stringify(finalUsers), { 
    access: 'public', 
    addRandomSuffix: false,
    contentType: 'application/json'
  });
  
  return res.status(200).json({ 
    success: true, 
    users: finalUsers,
    totalCount: finalUsers.length 
  });
}

async function handleGetProUsers(req, res) {
  const users = await getGlobalUsers();
  const proOnes = users.filter(u => u.role === 'pro');
  return res.status(200).json({ proUsers: proOnes.map(u => u.email) });
}

async function getGlobalUsers() {
  try {
    const { blobs } = await list({ prefix: USERS_PATH });
    if (blobs.length === 0) return [];
    const response = await fetch(blobs[0].url);
    return await response.json();
  } catch (err) {
    return [];
  }
}
