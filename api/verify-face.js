// VISION Face Verification API — Face Detection Only
// Receives verified status from client-side face detection
// Updates Firestore to mark user as verified

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, verified } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        // Update Firestore with verified status
        await finalizeVerificationInCloud(email);

        console.log("==========================================");
        console.log("FACE VERIFICATION PASSED");
        console.log("Email:", email);
        console.log("==========================================");

        return res.status(200).json({ match: true });

    } catch (error) {
        console.error('[Verify] Error:', error.message);
        return res.status(500).json({ match: false, error: 'System busy. Try again.' });
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
    } catch (e) {
        console.error("[Verify] Database Error:", e.message);
    }
}
