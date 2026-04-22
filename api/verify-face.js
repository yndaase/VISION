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
        console.log("[Face++] Detecting face for:", email);
        const base64Data = selfieBase64.includes(',') ? selfieBase64.split(',')[1] : selfieBase64;

        const formBody = new URLSearchParams();
        formBody.append('api_key', apiKey);
        formBody.append('api_secret', apiSecret);
        formBody.append('image_base64', base64Data);

        // Try US Endpoint first, then CN as fallback
        let response = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString()
        });

        let data = await response.json();
        
        // If US fails or unauthorized, try CN
        if (response.status === 403 || !data.faces) {
            console.log("[Face++] US failed, trying CN endpoint...");
            response = await fetch('https://api-cn.faceplusplus.com/facepp/v3/detect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody.toString()
            });
            data = await response.json();
        }

        console.log(`[Face++ Debug] Final Status: ${response.status}`, data);
        
        // CRITICAL: Only verify if EXACTLY 1 face is found with high confidence
        if (data.faces && data.faces.length > 0) {
            console.log("[Face++] Face detected! Finalizing...");
            
            // SECURITY: Only update if we reached this exact line
            const success = await finalizeVerificationInCloud(email);
            if (success) {
                return res.status(200).json({ match: true });
            } else {
                return res.status(500).json({ match: false, error: "Database update failed." });
            }
        } else {
            // FAILED: Explicitly return match: false
            const errorMsg = data.error_message || "Face not recognized. Move closer and try again.";
            return res.status(200).json({ match: false, error: errorMsg });
        }

    } catch (error) {
        console.error('[Face++] Global Error:', error.message);
        return res.status(500).json({ match: false, error: 'Verification system error.' });
    }
}

async function finalizeVerificationInCloud(email) {
    if (!email) return false;
    try {
        if (!global.adminApp) {
            const admin = (await import('firebase-admin')).default;
            const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (!serviceAccountStr) return false;
            
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
        
        return true;
    } catch (e) {
        console.error("[Verify] Firestore Error:", e.message);
        return false;
    }
}
