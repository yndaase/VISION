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
  const token = req.body;
  const { payload: decoded } = await jose.jwtVerify(token, JWKS, { issuer: 'https://accounts.google.com/', audience: process.env.GOOGLE_CLIENT_ID });
  const current = await getBlacklist();
  const events = decoded.events || {};

  if (events['https://schemas.openid.net/secevent/risc/event-type/account-disabled']) {
    const subject = events['https://schemas.openid.net/secevent/risc/event-type/account-disabled'].subject || {};
    if (subject.sub && !current.revokedSubs.includes(subject.sub)) current.revokedSubs.push(subject.sub);
    await put(BLACKLIST_PATH, JSON.stringify(current), { access: 'public', addRandomSuffix: false });
  }
  return res.status(202).json({ status: 'Accepted' });
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
  const { localUsers } = data;
  const cloudUsers = await getGlobalUsers();
  
  // Merge Strategy: Unique by Email
  const userMap = new Map();
  // 1. Load Cloud
  cloudUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));
  // 2. Merge Local
  localUsers.forEach(u => {
    const email = u.email.toLowerCase();
    if (!userMap.has(email)) userMap.set(email, u);
    else userMap.set(email, { ...userMap.get(email), ...u });
  });

  // 3. ADMIN OVERRIDE (Permanent PRO)
  const adminEmail = 'gisgreat308@gmail.com';
  if (userMap.has(adminEmail)) {
    userMap.get(adminEmail).role = 'pro';
  } else {
    userMap.set(adminEmail, { email: adminEmail, role: 'pro', name: 'Vision Admin', provider: 'google' });
  }

  const finalUsers = Array.from(userMap.values());
  await put(USERS_PATH, JSON.stringify(finalUsers), { access: 'public', addRandomSuffix: false });
  
  return res.status(200).json({ users: finalUsers });
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
