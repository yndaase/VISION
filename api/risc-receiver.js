import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { put, head, get } from '@vercel/blob';

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
    const listJson = await get(BLACKLIST_PATH);
    return JSON.parse(listJson);
  } catch (e) {
    return { revokedSubs: [], revokedEmails: [] };
  }
}

async function updateBlacklist(newEntry) {
  const current = await getBlacklist();
  if (newEntry.sub && !current.revokedSubs.includes(newEntry.sub)) {
    current.revokedSubs.push(newEntry.sub);
  }
  if (newEntry.email && !current.revokedEmails.includes(newEntry.email)) {
    current.revokedEmails.push(newEntry.email);
  }
  await put(BLACKLIST_PATH, JSON.stringify(current), { access: 'public', addRandomSuffix: false });
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

    // 2. Handle Events
    const events = decoded.events || {};
    
    // Check for Verification Event
    if (events['https://schemas.openid.net/secevent/risc/event-type/verification']) {
      console.log('[RISC] Verification Event Received. State:', events['https://schemas.openid.net/secevent/risc/event-type/verification'].state);
      return res.status(202).json({ status: 'Accepted' });
    }

    // Check for Critical Security Events
    const criticalEvents = [
      'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
      'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked',
      'https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked'
    ];

    for (const type of criticalEvents) {
      if (events[type]) {
        const subject = events[type].subject || {};
        const sub = subject.sub; // Google Account ID
        const email = subject.email;
        
        console.warn(`[RISC] Security Action Required for ${email || sub}: ${type}`);
        
        // Add to persistent blacklist
        await updateBlacklist({ sub, email });
        
        // Note: Real-time session revocation would happen here if we used a backend session store.
        // For local sessions, the Dashboard/Login guards must check this blacklist.
      }
    }

    return res.status(202).json({ status: 'Accepted' });

  } catch (error) {
    console.error('[RISC] Validation Failed:', error.message);
    return res.status(400).json({ error: 'Invalid Security Event Token' });
  }
}
