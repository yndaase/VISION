/**
 * Vision Education - RISC Registration Utility (ESM/jose version)
 * 
 * Instructions:
 * 1. Place your Google Service Account JSON in the root as 'service-account.json'
 * 2. Run: node scripts/register-risc.js
 */

import fs from 'fs';
import * as jose from 'jose';

const SERVICE_ACCOUNT_FILE = './service-account.json';
const RECEIVER_URL = 'https://www.visionedu.online/api/risc-receiver';

async function register() {
  console.log('--- Vision Education: RISC Stream Registration (ESM) ---');

  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.error('Error: service-account.json not found in root directory.');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
  const clientEmail = credentials.client_email;

  // 1. Import Private Key
  console.log('Importing Service Account Private Key...');
  const privateKey = await jose.importPKCS8(credentials.private_key, 'RS256');

  // 2. Generate Auth Token
  console.log('Generating Authorization Token...');
  const token = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: credentials.private_key_id })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience('https://risc.googleapis.com/google.identity.risc.v1beta.RiscManagementService')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);

  // 3. Call Google RISC API
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
