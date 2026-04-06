import * as jose from 'jose';
import { put, list } from '@vercel/blob';

// Google RISC Configuration
const RISC_CONFIG = {
  issuer: 'https://accounts.google.com/',
  jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
};

// Initialize Remote JWK Set for Google
const JWKS = jose.createRemoteJWKSet(new URL(RISC_CONFIG.jwksUri));

// Helper to manage Revocation List in Vercel Blob
const BLACKLIST_PATH = 'security/risc_blacklist.json';

async function getBlacklist() {
  try {
    const { blobs } = await list({ prefix: BLACKLIST_PATH });
    if (blobs.length === 0) return { revokedSubs: [], revokedEmails: [], processedJtis: [] };
    const response = await fetch(blobs[0].url);
    return await response.json();
  } catch (e) {
    console.warn('[RISC] Blacklist fetch error:', e.message);
    return { revokedSubs: [], revokedEmails: [], processedJtis: [] };
  }
}

async function modifyBlacklist(action, entry) {
  const current = await getBlacklist();
  let changed = false;

  if (action === 'add') {
    if (entry.sub && !current.revokedSubs.includes(entry.sub)) {
      current.revokedSubs.push(entry.sub);
      changed = true;
    }
    if (entry.email && !current.revokedEmails.includes(entry.email)) {
      current.revokedEmails.push(entry.email);
      changed = true;
    }
  } else if (action === 'remove') {
    if (entry.sub) {
      current.revokedSubs = (current.revokedSubs || []).filter(s => s !== entry.sub);
      changed = true;
    }
    if (entry.email) {
      current.revokedEmails = (current.revokedEmails || []).filter(e => e !== entry.email);
      changed = true;
    }
  }

  if (entry.jti && !current.processedJtis.includes(entry.jti)) {
    current.processedJtis.push(entry.jti);
    if (current.processedJtis.length > 500) current.processedJtis.shift();
    changed = true;
  }

  if (changed) {
    await put(BLACKLIST_PATH, JSON.stringify(current), { access: 'public', addRandomSuffix: false });
  }
}

export default async function handler(req, res) {
  // 1. Method Check
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed', message: 'The RISC endpoint only accepts POST requests from Google.' });
  }

  // 2. Critical Env Check
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    console.error('[RISC] Missing GOOGLE_CLIENT_ID environment variable.');
    return res.status(500).json({ error: 'Server Configuration Error' });
  }

  const token = req.body; 
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid Token Format', detail: 'Expected a raw JWT string.' });
  }

  try {
    // 3. Validate and Decode the SET using jose
    const { payload: decoded } = await jose.jwtVerify(token, JWKS, {
      issuer: RISC_CONFIG.issuer,
      audience: googleClientId,
    });

    console.log('[RISC] Received Valid Security Event:', decoded.jti);

    // 4. Event De-duplication Check
    const blacklist = await getBlacklist();
    if (blacklist.processedJtis.includes(decoded.jti)) {
      return res.status(202).json({ status: 'Accepted (Duplicate)' });
    }

    // 5. Handle Events
    const events = decoded.events || {};
    
    // Verification Event
    if (events['https://schemas.openid.net/secevent/risc/event-type/verification']) {
      return res.status(202).json({ status: 'Accepted' });
    }

    // Account Enabled (Recovery)
    if (events['https://schemas.openid.net/secevent/risc/event-type/account-enabled']) {
      const subject = events['https://schemas.openid.net/secevent/risc/event-type/account-enabled'].subject || {};
      console.log('[RISC] Account Enabled. Restoring Access for:', subject.email || subject.sub);
      await modifyBlacklist('remove', { sub: subject.sub, email: subject.email, jti: decoded.jti });
      return res.status(202).json({ status: 'Accepted' });
    }

    // Account Disabled / Session Revoked
    const disableEvents = [
      'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
      'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked',
      'https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked'
    ];

    for (const type of disableEvents) {
      if (events[type]) {
        const subject = events[type].subject || {};
        console.warn(`[RISC] Security Action Required for ${subject.email || subject.sub}: ${type}`);
        await modifyBlacklist('add', { sub: subject.sub, email: subject.email, jti: decoded.jti });
      }
    }

    // Credential Change Required (Security Audit)
    if (events['https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required']) {
      await modifyBlacklist('none', { jti: decoded.jti });
    }

    return res.status(202).json({ status: 'Accepted' });

  } catch (error) {
    console.error('[RISC] Validation Failed:', error.message);
    return res.status(400).json({ error: 'Invalid Security Token', detail: error.message });
  }
}
