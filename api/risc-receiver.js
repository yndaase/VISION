import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { put, list } from '@vercel/blob';

// Google RISC Configuration
const RISC_CONFIG = {
  issuer: 'https://accounts.google.com/',
  jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
};

// Initialize JWKS client for Google
const client = jwksClient({
  jwksUri: RISC_CONFIG.jwksUri,
  cache: true,
  rateLimit: true,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Helper to manage Revocation List in Vercel Blob
const BLACKLIST_PATH = 'security/risc_blacklist.json';

async function getBlacklist() {
  try {
    // Vercel Blob - Find the blob by its pathname prefix
    const { blobs } = await list({ prefix: BLACKLIST_PATH });
    if (blobs.length === 0) return { revokedSubs: [], revokedEmails: [], processedJtis: [] };
    
    // Fetch the actual content from the blob URL
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
      current.revokedSubs = current.revokedSubs.filter(s => s !== entry.sub);
      changed = true;
    }
    if (entry.email) {
      current.revokedEmails = current.revokedEmails.filter(e => e !== entry.email);
      changed = true;
    }
  }

  if (entry.jti && !current.processedJtis.includes(entry.jti)) {
    current.processedJtis.push(entry.jti);
    // Keep list manageable
    if (current.processedJtis.length > 500) current.processedJtis.shift();
    changed = true;
  }

  if (changed) {
    await put(BLACKLIST_PATH, JSON.stringify(current), { access: 'public', addRandomSuffix: false });
  }
}

export default async function handler(req, res) {
  // 1. Method Check First
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
    // 3. Validate and Decode the SET
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        issuer: RISC_CONFIG.issuer,
        audience: googleClientId, 
        ignoreExpiration: true,
      }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    console.log('[RISC] Received Valid Security Event:', decoded.jti);

    // 2. Event De-duplication Check
    const blacklist = await getBlacklist();
    if (blacklist.processedJtis.includes(decoded.jti)) {
      console.log('[RISC] Duplicate Event Ignored:', decoded.jti);
      return res.status(202).json({ status: 'Accepted' });
    }

    // 3. Handle Events
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
        const sub = subject.sub;
        const email = subject.email;
        
        console.warn(`[RISC] Security Action Required for ${email || sub}: ${type}`);
        await modifyBlacklist('add', { sub, email, jti: decoded.jti });
      }
    }

    // Credential Change Required (Security Audit)
    if (events['https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required']) {
      // Just log de-duplication for now as it doesn't require immediate lockout
      await modifyBlacklist('none', { jti: decoded.jti });
    }

    return res.status(202).json({ status: 'Accepted' });

  } catch (error) {
    console.error('[RISC] Validation Failed:', error.message);
    return res.status(400).json({ error: 'Invalid Security Event Token' });
  }
}
