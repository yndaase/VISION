/**
 * Vision Education - RISC Registration Utility
 * 
 * Instructions:
 * 1. Place your Google Service Account JSON in the root as 'service-account.json'
 * 2. Run: node scripts/register-risc.js
 */

import fs from 'fs';
import jwt from 'jsonwebtoken';

const SERVICE_ACCOUNT_FILE = './service-account.json';
const RECEIVER_URL = 'https://www.visionedu.online/api/risc-receiver';

async function register() {
  console.log('--- Vision Education: RISC Stream Registration ---');

  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.error('Error: service-account.json not found in root directory.');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
  const clientEmail = credentials.client_email;
  const privateKey = credentials.private_key;

  // 1. Generate Auth Token
  console.log('Generating Authorization Token...');
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign({
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://risc.googleapis.com/google.identity.risc.v1beta.RiscManagementService',
    iat: now,
    exp: now + 3600
  }, privateKey, { algorithm: 'RS256', keyid: credentials.private_key_id });

  // 2. Call Google RISC API
  console.log('Registering Receiver URL:', RECEIVER_URL);
  try {
    const response = await fetch('https://risc.googleapis.com/v1beta/stream:update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        delivery: {
          delivery_method: 'https://schemas.openid.net/secevent/risc/delivery-method/push',
          url: RECEIVER_URL
        },
        events_requested: [
          'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
          'https://schemas.openid.net/secevent/risc/event-type/account-enabled',
          'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked',
          'https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required',
          'https://schemas.openid.net/secevent/risc/event-type/verification'
        ]
      })
    });

    if (response.ok) {
      console.log('SUCCESS: Your security event stream is now configured!');
    } else {
      const error = await response.json();
      console.error('FAILED to configure stream:', error);
    }
  } catch (err) {
    console.error('Network Error:', err.message);
  }
}

register();
