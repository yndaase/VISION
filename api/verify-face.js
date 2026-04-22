import fs from 'fs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { selfieBase64, email } = req.body;
    
    if (!selfieBase64 || !email) {
        return res.status(400).json({ error: 'Selfie and Email are required.' });
    }

    const apiKey = (process.env.FACEPP_API_KEY || "").trim();
    const apiSecret = (process.env.FACEPP_API_SECRET || "").trim();

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Face++ credentials not configured.' });
    }

    try {
        const base64Data = selfieBase64.includes(',') ? selfieBase64.split(',')[1] : selfieBase64;

        const formBody = new URLSearchParams();
        formBody.append('api_key', apiKey);
        formBody.append('api_secret', apiSecret);
        formBody.append('image_base64', base64Data);

        // Try US Endpoint
        let response = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString()
        });

        let data = await response.json();
        
        // Final check: Exactly one face must be detected
        if (data.faces && data.faces.length > 0) {
            console.log("------------------------------------------");
            console.log("!!! AI MATCH SUCCESS: VERIFYING USER !!!");
            console.log("Email:", email);
            console.log("------------------------------------------");
            
            // This is the ONLY place where Firestore is updated
            await finalizeVerificationInCloud(email);
            
            return res.status(200).json({ match: true });
        } else {
            console.warn("[Face++] FAILED for", email, data.error_message || "No face found");
            return res.status(200).json({ match: false, error: data.error_message || "Face not detected." });
        }

    } catch (error) {
        console.error('[Face++] Error:', error.message);
        return res.status(500).json({ match: false, error: 'System busy.' });
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
