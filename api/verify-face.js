import fs from 'fs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { selfieBase64, email } = req.body;
    
    if (!selfieBase64) {
        return res.status(400).json({ error: 'Selfie data is required.' });
    }

    const apiKey = (process.env.FACEPP_API_KEY || "").trim();
    const apiSecret = (process.env.FACEPP_API_SECRET || "").trim();

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Face++ credentials not configured.' });
    }

    try {
        console.log("[Face++] Detecting face via Base64...");
        
        const base64Data = selfieBase64.includes(',') ? selfieBase64.split(',')[1] : selfieBase64;

        // Face++ Detect API expects application/x-www-form-urlencoded
        const formBody = new URLSearchParams();
        formBody.append('api_key', apiKey);
        formBody.append('api_secret', apiSecret);
        formBody.append('image_base64', base64Data);
        formBody.append('return_attributes', 'headpose,blur');

        const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString()
        });

        const data = await response.json();
        console.log(`[Face++ Debug] Status: ${response.status}`);
        
        if (data.faces && data.faces.length > 0) {
            console.log("[Face++] Face detected! Token:", data.faces[0].face_token);
            
            // SUCCESS: Update user in Firestore
            await finalizeVerificationInCloud(email);
            
            return res.status(200).json({ match: true });
        } else {
            const errorMsg = data.error_message || "No face detected. Please ensure good lighting.";
            return res.status(400).json({ match: false, error: errorMsg });
        }

    } catch (error) {
        console.error('[Face++] Error:', error.message);
        return res.status(500).json({ error: 'Face++ connection error.' });
    }
}

async function finalizeVerificationInCloud(email) {
    if (!email) return;
    try {
        if (!global.adminApp) {
            const admin = (await import('firebase-admin')).default;
            const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (!serviceAccountStr) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT");
            
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
        
        console.log(`[Verify] User ${email} marked as verified in Firestore.`);
    } catch (e) {
        console.error("[Verify] Firestore Update Error:", e.message);
    }
}
