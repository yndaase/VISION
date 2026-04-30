/**
 * Vision Education - RISC Verification Trigger
 * 
 * Instructions:
 * 1. Place your Google Service Account JSON in the root as 'service-account.json'
 * 2. Run: node scripts/verify-risc.js
 */

import fs from 'fs';
import * as jose from 'jose';

const SERVICE_ACCOUNT_FILE = './service-account.json';
const STATUS_PAGE_URL = 'https://www.visionedu.online/api/risc-receiver';

async function verify() {
  console.log('--- Vision Education: RISC Stream Verification Trigger ---');

  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.error('Error: service-account.json not found in root directory.');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
  const clientEmail = credentials.client_email;
  const privateKeyRaw = credentials.private_key;

  // 1. Import Private Key
  console.log('Importing Service Account Private Key...');
  const privateKey = await jose.importPKCS8(privateKeyRaw, 'RS256');

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

  // 3. Call Google RISC Verify API
  const stateString = `acid-test-${Math.random().toString(36).substring(7)}`;
  console.log(`Triggering Verification with state: ${stateString}`);
  
  try {
    const response = await fetch('https://risc.googleapis.com/v1beta/stream:verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ state: stateString })
    });

    if (response.status === 204 || response.ok) {
      console.log('SUCCESS: Verification token requested!');
      console.log('---');
      console.log(`Please visit your status page in 30-60 seconds to see the results:`);
      console.log(STATUS_PAGE_URL);
    } else {
      const error = await response.json();
      console.error('FAILED to trigger verification:', error);
    }
  } catch (err) {
    console.error('Network Error:', err.message);
  }
}

verify();
