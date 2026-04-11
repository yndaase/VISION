import fs from 'fs';
import * as jose from 'jose';

// Configuration
const SERVICE_ACCOUNT_KEY_PATH = process.argv[2] || './client_secret.json'; // Path to your downloaded service account key
const RECEIVER_ENDPOINT = process.argv[3] || 'https://your-app.vercel.app/api/auth-core?type=risc-receiver'; 

async function makeBearerToken() {
    try {
        if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
            console.error(`❌ Error: Service account key not found at: ${SERVICE_ACCOUNT_KEY_PATH}`);
            console.log("Usage: node register-risc.js <path-to-service-account.json> <receiver-endpoint-url>");
            process.exit(1);
        }

        const creds = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_PATH, 'utf8'));
        const clientEmail = creds.client_email;
        const privateKey = creds.private_key;
        const keyId = creds.private_key_id;

        const importedKey = await jose.importPKCS8(privateKey, 'RS256');

        const jwt = await new jose.SignJWT({})
            .setProtectedHeader({ alg: 'RS256', kid: keyId })
            .setIssuer(clientEmail)
            .setSubject(clientEmail)
            .setAudience('https://risc.googleapis.com/google.identity.risc.v1beta.RiscManagementService')
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(importedKey);

        return jwt;
    } catch (e) {
        console.error("❌ Failed to generate Google Bearer Token:", e.message);
        process.exit(1);
    }
}

async function configureEventStream() {
    console.log(`🔒 Starting Google Cross-Account Protection (RISC) Registration...`);
    console.log(`📡 Receiver Endpoint: ${RECEIVER_ENDPOINT}`);
    
    const authToken = await makeBearerToken();

    const eventsRequested = [
        "https://schemas.openid.net/secevent/risc/event-type/account-disabled",
        "https://schemas.openid.net/secevent/risc/event-type/sessions-revoked",
        "https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked",
        "https://schemas.openid.net/secevent/oauth/event-type/token-revoked",
        "https://schemas.openid.net/secevent/risc/event-type/verification"
    ];

    const payload = {
        delivery: {
            delivery_method: "https://schemas.openid.net/secevent/risc/delivery-method/push",
            url: RECEIVER_ENDPOINT
        },
        events_requested: eventsRequested
    };

    try {
        const response = await fetch("https://risc.googleapis.com/v1beta/stream:update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("\n✅ Success! Your RISC event stream is configured.");
            console.log(`Subscribed to ${eventsRequested.length} security event types.`);
            console.log("Next Step: Test your configuration by sending a verification token.");
        } else {
            const error = await response.json();
            console.error("\n❌ Registration Failed. API returned error:", response.status);
            console.error(error);
        }
    } catch (err) {
        console.error("\n❌ Network Error during registration:", err.message);
    }
}

configureEventStream();
