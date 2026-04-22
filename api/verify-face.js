// VISION Face Verification API — Firestore Update Endpoint
// Face comparison is done client-side via face-api.js
// This endpoint only updates Firestore with the verification result

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, verified } = req.body;
    
    if (!email || !verified) {
        return res.status(400).json({ error: 'Email and verification status required.' });
    }

    try {
        console.log("[Verify] Updating verification for:", email);
        await finalizeVerificationInCloud(email);
        return res.status(200).json({ match: true });
    } catch (error) {
        console.error('[Verify] Error:', error.message);
        return res.status(500).json({ match: false, error: 'Failed to update verification status.' });
    }
}

async function finalizeVerificationInCloud(email) {
    try {
        if (!global.adminApp) {
            const admin = (await import('firebase-admin')).default;
            const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (!serviceAccountStr) return;
            global.adminApp = admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(serviceAccountStr))
            });
        }
        const admin = (await import('firebase-admin')).default;
        const db = admin.firestore();
        await db.collection('users').doc(email).set({
            isVerified: true,
            verifiedAt: new Date().toISOString()
        }, { merge: true });
        console.log("[Verify] Firestore updated for:", email);
    } catch (e) {
        console.error("[Verify] Database Error:", e.message);
    }
}
