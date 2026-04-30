import * as samlify from 'samlify';
import * as validator from '@authenio/samlify-node-xmllint';
import fs from 'fs';
import path from 'path';

samlify.setSchemaValidator(validator);

// Load keys
const privateKey = fs.readFileSync(path.join(process.cwd(), 'saml.pem'), 'utf8');
const publicKey = fs.readFileSync(path.join(process.cwd(), 'saml.crt'), 'utf8');

// Define our Identity Provider (Vision)
const idp = samlify.IdentityProvider({
  entityID: 'https://edu.visionedu.online/sso', // This must match exactly what you put in Lark Admin Console -> Issuer
  privateKey: privateKey,
  signingCert: publicKey,
  isAssertionEncrypted: false,
});

// Define Lark as the Service Provider
const sp = samlify.ServiceProvider({
  entityID: 'https://www.larksuite.com',
  assertionConsumerService: [{
    Binding: samlify.Constants.namespace.post,
    Location: 'https://www.larksuite.com/suite/passport/authentication/idp/saml/call_back'
  }]
});

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use the email passed from the frontend, or a default for testing
  // In a real app, you'd extract this from the verified Firebase Auth token
  const email = req.body.email || req.query.email;

  if (!email || !email.endsWith('@edu.visionedu.online')) {
    return res.status(400).send('Missing or invalid Vision email address.');
  }

  try {
    // Generate an IdP-initiated SAML Response
    const { id, context } = await idp.createLoginResponse(sp, null, 'post', {
      extract: {
        principalName: email,
      }
    });

    // samlify returns the raw XML in `context`. We need to base64 encode it.
    const samlResponseBase64 = Buffer.from(context).toString('base64');

    // Create an auto-submitting HTML form to send the SAML Response to Lark
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Logging into Lark Workspace...</title>
        <style>
          body { background: #1a1a2e; color: white; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .loader { border: 4px solid rgba(255,255,255,0.1); border-left-color: #fbbf24; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body onload="document.forms[0].submit()">
        <div class="loader"></div>
        <h2>Authenticating with Vision Workspace...</h2>
        <p>Please wait while we log you into Lark.</p>
        <form method="post" action="https://www.larksuite.com/suite/passport/authentication/idp/saml/call_back" style="display: none;">
          <input type="hidden" name="SAMLResponse" value="${samlResponseBase64}" />
          <!-- RelayState is optional but good to have if you want to redirect to a specific Lark app -->
          <input type="hidden" name="RelayState" value="/" />
          <input type="submit" value="Submit" />
        </form>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('SAML Generation Error:', error);
    res.status(500).send('Failed to generate SAML response: ' + error.message);
  }
}
