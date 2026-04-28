import zlib from 'zlib';
import crypto from 'crypto';
import { SignedXml } from 'xml-crypto';

// Lazy Firebase Admin initializer
let _adminAuth = null;
async function getAdminAuth() {
    if (_adminAuth) return _adminAuth;
    const admin = (await import('firebase-admin')).default;
    if (!admin.apps.length) {
        const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing.');
        admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
    }
    _adminAuth = admin.auth();
    return _adminAuth;
}

// Extract ACS URL and Request ID from decoded SAMLRequest XML
function parseSAMLRequest(xml) {
    const idMatch  = xml.match(/ID=["']([^"']+)["']/);
    const acsMatch = xml.match(/AssertionConsumerServiceURL=["']([^"']+)["']/);
    return {
        id:     idMatch  ? idMatch[1]  : '_missing',
        acsUrl: acsMatch ? acsMatch[1] : ''
    };
}

// Decode SAMLRequest — handles both deflated (redirect binding) and plain (POST binding)
function decodeSAMLRequest(encoded) {
    try {
        const buf = Buffer.from(encoded, 'base64');
        return zlib.inflateRawSync(buf).toString('utf8');
    } catch (_) {
        return Buffer.from(encoded, 'base64').toString('utf8');
    }
}

// Build unsigned SAML Response XML using template literals — no xmlbuilder needed
function buildSAMLResponse({ responseId, assertionId, issueInstant, notBefore, notOnOrAfter, acsUrl, inResponseTo, issuer, email }) {
    return `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${responseId}" Version="2.0" IssueInstant="${issueInstant}" Destination="${acsUrl}" InResponseTo="${inResponseTo}"><saml:Issuer>${issuer}</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ID="${assertionId}" Version="2.0" IssueInstant="${issueInstant}"><saml:Issuer>${issuer}</saml:Issuer><saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${email}</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData InResponseTo="${inResponseTo}" NotOnOrAfter="${notOnOrAfter}" Recipient="${acsUrl}"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="${notBefore}" NotOnOrAfter="${notOnOrAfter}"><saml:AudienceRestriction><saml:Audience>zoho.com</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="${issueInstant}" SessionIndex="${assertionId}"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement></saml:Assertion></samlp:Response>`;
}

export default async function handler(req, res) {
    // Always return JSON on errors so the frontend can display them
    res.setHeader('Access-Control-Allow-Origin', '*');

    // ── GET: redirect to login page ───────────────────────────────────────────
    if (req.method === 'GET') {
        const { SAMLRequest, RelayState } = req.query;
        if (!SAMLRequest) return res.status(400).json({ error: 'Missing SAMLRequest' });
        return res.redirect(302,
            `/saml-login.html?SAMLRequest=${encodeURIComponent(SAMLRequest)}&RelayState=${encodeURIComponent(RelayState || '')}`
        );
    }

    // ── POST: generate & sign SAML Response ───────────────────────────────────
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { SAMLRequest, RelayState, idToken } = req.body;

        if (!idToken)     return res.status(401).json({ error: 'Authentication required. Please sign in first.' });
        if (!SAMLRequest) return res.status(400).json({ error: 'Missing SAMLRequest parameter.' });

        // Step 1: Verify Firebase ID token — this proves the user is who they say they are
        let verifiedEmail;
        try {
            const adminAuth = await getAdminAuth();
            const decoded   = await adminAuth.verifyIdToken(idToken);
            verifiedEmail   = decoded.email;
            if (!verifiedEmail) return res.status(401).json({ error: 'Token does not contain an email address.' });
        } catch (tokenErr) {
            console.error('[SAML] Token verification failed:', tokenErr.message);
            return res.status(401).json({ error: 'Invalid or expired login session. Please sign in again.' });
        }

        // Step 2: Allowlist check — only whitelisted emails can get a SAML assertion
        const allowedRaw = process.env.SAML_ALLOWED_EMAILS || '';
        if (allowedRaw.trim()) {
            const allowed = allowedRaw.split(',').map(e => e.trim().toLowerCase());
            if (!allowed.includes(verifiedEmail.toLowerCase())) {
                console.warn(`[SAML] Blocked unauthorised SAML attempt by: ${verifiedEmail}`);
                return res.status(403).json({ error: `Access denied. ${verifiedEmail} is not authorised for SSO.` });
            }
        }

        const email = verifiedEmail;
        console.log(`[SAML] Issuing assertion for verified user: ${email}`);

        // Load certs from env vars
        const privateKeyRaw = (process.env.SAML_PRIVATE_KEY || '').replace(/\\n/g, '\n');
        const certRaw       = (process.env.SAML_CERT || '').replace(/\\n/g, '\n');

        if (!privateKeyRaw || !certRaw) {
            console.error('[SAML] Missing SAML_PRIVATE_KEY or SAML_CERT');
            return res.status(500).json({ error: 'SAML certificates not configured on server.' });
        }

        // Decode the SAMLRequest
        const samlXml = decodeSAMLRequest(SAMLRequest);
        const { id: inResponseTo, acsUrl } = parseSAMLRequest(samlXml);

        if (!acsUrl) {
            return res.status(400).json({ error: 'Could not find AssertionConsumerServiceURL in SAMLRequest. Make sure Zoho sent a valid SAML AuthnRequest.' });
        }

        // Build XML
        const now           = new Date();
        const issueInstant  = now.toISOString();
        const notBefore     = new Date(now.getTime() - 5000).toISOString();
        const notOnOrAfter  = new Date(now.getTime() + 5 * 60000).toISOString();
        const responseId    = '_' + crypto.randomBytes(16).toString('hex');
        const assertionId   = '_' + crypto.randomBytes(16).toString('hex');
        const issuer        = 'https://visionedu.online/api/saml-idp';

        const unsignedXml = buildSAMLResponse({
            responseId, assertionId, issueInstant, notBefore, notOnOrAfter,
            acsUrl, inResponseTo, issuer, email
        });

        // Sign the whole Response element (simpler, avoids namespace context loss with Assertion-only signing)
        const cleanCert = certRaw
            .replace('-----BEGIN CERTIFICATE-----', '')
            .replace('-----END CERTIFICATE-----', '')
            .replace(/[\r\n\s]/g, '');

        const sig = new SignedXml({
            privateKey:                privateKeyRaw,
            canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
            signatureAlgorithm:        'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
            idAttributes:              ['ID']
        });
        sig.addReference({
            xpath:           `//*[@ID="${responseId}"]`,
            transforms:      [
                'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
                'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
            ],
            digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
        });
        sig.keyInfoProvider = {
            getKeyInfo: () => `<X509Data><X509Certificate>${cleanCert}</X509Certificate></X509Data>`
        };
        sig.computeSignature(unsignedXml, {
            location: { reference: `//*[@ID="${responseId}"]/*[local-name()='Issuer']`, action: 'after' }
        });

        const signedXml      = sig.getSignedXml();
        const base64Response = Buffer.from(signedXml).toString('base64');

        // Return auto-submitting HTML form to Zoho's ACS endpoint
        const formHtml = `<!DOCTYPE html>
<html>
<head><title>Signing in...</title></head>
<body onload="document.forms[0].submit()" style="font-family:sans-serif;background:#05080f;color:white;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center">
    <div style="font-size:2rem;font-weight:900;margin-bottom:1rem;">✓ Authenticated</div>
    <p style="color:#10b981;">Redirecting to your inbox...</p>
  </div>
  <form method="POST" action="${acsUrl}" style="display:none;">
    <input type="hidden" name="SAMLResponse" value="${base64Response}" />
    ${RelayState ? `<input type="hidden" name="RelayState" value="${RelayState}" />` : ''}
    <noscript><input type="submit" value="Continue to Zoho Mail" /></noscript>
  </form>
</body>
</html>`;

        return res.status(200).setHeader('Content-Type', 'text/html').send(formHtml);

    } catch (err) {
        console.error('[SAML IdP Error]:', err);
        return res.status(500).json({ error: `Server error: ${err.message}` });
    }
}
