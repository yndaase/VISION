import zlib from 'zlib';
import crypto from 'crypto';
import { create } from 'xmlbuilder';
import { SignedXml } from 'xml-crypto';

// Initialize Firebase Admin lazily if needed to verify token
async function verifyFirebaseToken(token) {
    if (!global.adminApp) {
        const admin = (await import('firebase-admin')).default;
        const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccountStr) return null;
        global.adminApp = admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccountStr))
        });
    }
    const admin = (await import('firebase-admin')).default;
    return await admin.auth().verifyIdToken(token);
}

// Extract ACS URL and Request ID from SAMLRequest
function parseSAMLRequest(samlReqBuffer) {
    const xml = samlReqBuffer.toString();
    const idMatch = xml.match(/ID="([^"]+)"/);
    const acsMatch = xml.match(/AssertionConsumerServiceURL="([^"]+)"/);
    return {
        id: idMatch ? idMatch[1] : '',
        acsUrl: acsMatch ? acsMatch[1] : ''
    };
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    if (req.method === 'GET') {
        const { SAMLRequest, RelayState } = req.query;
        if (!SAMLRequest) return res.status(400).send('Missing SAMLRequest');
        
        // Redirect to login page on visionedu.online
        return res.redirect(302, `/saml-login.html?SAMLRequest=${encodeURIComponent(SAMLRequest)}&RelayState=${encodeURIComponent(RelayState || '')}`);
    }
    
    if (req.method === 'POST') {
        const { SAMLRequest, RelayState, idToken, email } = req.body;
        
        let userEmail = email;
        if (idToken) {
            try {
                const decoded = await verifyFirebaseToken(idToken);
                if (decoded) userEmail = decoded.email;
            } catch(e) {
                return res.status(401).json({ error: 'Invalid Firebase token' });
            }
        }
        
        if (!userEmail) return res.status(401).json({ error: 'Email required' });
        
        // Decode SAMLRequest (Base64 + Inflate usually for redirect binding)
        let xmlBuffer;
        try {
            const buf = Buffer.from(SAMLRequest, 'base64');
            xmlBuffer = zlib.inflateRawSync(buf);
        } catch(e) {
            // If it wasn't deflated, just base64 decoded
            xmlBuffer = Buffer.from(SAMLRequest, 'base64');
        }
        
        const { id, acsUrl } = parseSAMLRequest(xmlBuffer);
        if (!acsUrl) return res.status(400).json({ error: 'Could not find ACS URL in SAMLRequest' });
        
        // Generate SAML Response XML
        const issueInstant = new Date().toISOString();
        const notBefore = new Date(Date.now() - 5000).toISOString();
        const notOnOrAfter = new Date(Date.now() + 5 * 60000).toISOString();
        const responseId = '_' + crypto.randomBytes(16).toString('hex');
        const assertionId = '_' + crypto.randomBytes(16).toString('hex');
        const issuer = 'https://visionedu.online/api/saml-idp';
        
        const xml = create('samlp:Response', { headless: true })
            .att('xmlns:samlp', 'urn:oasis:names:tc:SAML:2.0:protocol')
            .att('xmlns:saml', 'urn:oasis:names:tc:SAML:2.0:assertion')
            .att('ID', responseId)
            .att('Version', '2.0')
            .att('IssueInstant', issueInstant)
            .att('Destination', acsUrl)
            .att('InResponseTo', id)
            .ele('saml:Issuer', issuer).up()
            .ele('samlp:Status')
                .ele('samlp:StatusCode', { Value: 'urn:oasis:names:tc:SAML:2.0:status:Success' }).up()
            .up()
            .ele('saml:Assertion', { ID: assertionId, Version: '2.0', IssueInstant: issueInstant })
                .ele('saml:Issuer', issuer).up()
                .ele('saml:Subject')
                    .ele('saml:NameID', { Format: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress' }, userEmail).up()
                    .ele('saml:SubjectConfirmation', { Method: 'urn:oasis:names:tc:SAML:2.0:cm:bearer' })
                        .ele('saml:SubjectConfirmationData', { InResponseTo: id, NotOnOrAfter: notOnOrAfter, Recipient: acsUrl }).up()
                    .up()
                .up()
                .ele('saml:Conditions', { NotBefore: notBefore, NotOnOrAfter: notOnOrAfter })
                    .ele('saml:AudienceRestriction')
                        .ele('saml:Audience', 'zoho.com').up()
                    .up()
                .up()
                .ele('saml:AuthnStatement', { AuthnInstant: issueInstant, SessionIndex: assertionId })
                    .ele('saml:AuthnContext')
                        .ele('saml:AuthnContextClassRef', 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport').up()
                    .up()
                .up()
            .up()
            .end();
            
        // Sign the Assertion — load certs from env vars (Vercel safe)
        const privateKey = (process.env.SAML_PRIVATE_KEY || '').replace(/\\n/g, '\n');
        const cert = (process.env.SAML_CERT || '').replace(/\\n/g, '\n');
        if (!privateKey || !cert) {
            console.error('[SAML] Missing SAML_PRIVATE_KEY or SAML_CERT env vars');
            return res.status(500).json({ error: 'SAML certificates not configured on server.' });
        }
        const cleanCert = cert.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\r|\n/g, '');
        
        const sig = new SignedXml();
        sig.addReference(`//*[@ID="${assertionId}"]`, [
            "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
            "http://www.w3.org/2001/10/xml-exc-c14n#"
        ], "http://www.w3.org/2001/04/xmlenc#sha256");
        sig.signingKey = privateKey;
        sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
        sig.keyInfoProvider = {
            getKeyInfo: () => `<X509Data><X509Certificate>${cleanCert}</X509Certificate></X509Data>`
        };
        sig.computeSignature(xml, {
            location: { reference: "//*[local-name(.)='Issuer']", action: "after" }
        });
        
        const signedXml = sig.getSignedXml();
        const base64Response = Buffer.from(signedXml).toString('base64');
        
        // Auto-submit form HTML
        const formHtml = `
            <!DOCTYPE html>
            <html>
            <head><title>Authenticating...</title></head>
            <body onload="document.forms[0].submit()" style="font-family:sans-serif; background:#05080f; color:white; display:flex; align-items:center; justify-content:center; height:100vh;">
                <h2>Authenticating Securely...</h2>
                <form method="POST" action="${acsUrl}" style="display:none;">
                    <input type="hidden" name="SAMLResponse" value="${base64Response}" />
                    ${RelayState ? `<input type="hidden" name="RelayState" value="${RelayState}" />` : ''}
                    <noscript><input type="submit" value="Continue" /></noscript>
                </form>
            </body>
            </html>
        `;
        
        return res.status(200).send(formHtml);
    }
}
