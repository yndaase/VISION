import fs from 'fs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { selfieBase64, email } = req.body;
    
    if (!selfieBase64) {
        return res.status(400).json({ error: 'Selfie data is required.' });
    }

    const compreFaceUrl = (process.env.COMPREFACE_URL || "http://your-server-ip:8000").trim();
    const apiKey = (process.env.COMPREFACE_DETECTION_API_KEY || process.env.COMPREFACE_API_KEY || "").trim();

    try {
        console.log("[CompreFace] Detecting face via Base64...");
        
        // Remove the data:image/jpeg;base64, prefix
        const base64Data = selfieBase64.split(',')[1] || selfieBase64;
        const buffer = Buffer.from(base64Data, 'base64');

        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: 'image/jpeg' }));

        const response = await fetch(`${compreFaceUrl}/api/v1/detection/detect`, {
            method: 'POST',
            headers: { 'x-api-key': apiKey },
            body: formData
        });

        const data = await response.json();
        console.log(`[CompreFace Debug] Status: ${response.status}`, data);
        
        if (data.result && data.result.length > 0) {
            console.log("[CompreFace] Face detected with confidence:", data.result[0].face_probability);
            
            // SUCCESS: Update user in Firestore
            await finalizeVerificationInCloud(email);
            
            return res.status(200).json({ match: true });
        } else {
            return res.status(400).json({ match: false, error: data.message || "No face detected. Please ensure your face is clear and well-lit." });
        }

    } catch (error) {
        console.error('[CompreFace] Error:', error.message);
        return res.status(500).json({ error: 'Verification server is currently unavailable.' });
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
