// VISION Face Verification API — ID Face vs Selfie Comparison

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { selfieBase64, idBase64, email } = req.body;
    
    if (!selfieBase64 || !idBase64 || !email) {
        return res.status(400).json({ error: 'Selfie, ID photo and email are required.' });
    }

    const apiKey = (process.env.FACEPP_API_KEY || "").trim();
    const apiSecret = (process.env.FACEPP_API_SECRET || "").trim();

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Face++ credentials not configured.' });
    }

    try {
        const idData = idBase64.includes(',') ? idBase64.split(',')[1] : idBase64;
        const selfieData = selfieBase64.includes(',') ? selfieBase64.split(',')[1] : selfieBase64;

        // ═══════════════════════════════════════════════════
        // Face Compare — Match ID card face with selfie face
        // ═══════════════════════════════════════════════════
        console.log("[Verify] Comparing ID face vs selfie for:", email);

        const compareForm = new URLSearchParams();
        compareForm.append('api_key', apiKey);
        compareForm.append('api_secret', apiSecret);
        compareForm.append('image_base64_1', idData);
        compareForm.append('image_base64_2', selfieData);

        const compareRes = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: compareForm.toString()
        });

        const data = await compareRes.json();

        // Handle API errors
        if (data.error_message) {
            console.warn("[Verify] Face++ Error:", data.error_message);
            
            // Specific error handling
            if (data.error_message.includes('NO_FACE_FOUND')) {
                // Determine which image had no face
                const noFaceDetail = data.error_message.includes('image_best1') 
                    ? 'No face detected on your ID card. Please upload a clearer photo.'
                    : 'No face detected in your selfie. Ensure good lighting and face the camera.';
                return res.status(200).json({ match: false, phase: 'compare', error: noFaceDetail });
            }
            
            return res.status(200).json({ match: false, phase: 'compare', error: 'Could not process images. Please try clearer photos.' });
        }

        const confidence = data.confidence || 0;
        const threshold = data.thresholds?.['1e-4'] || 76; // Use the 1-in-10,000 threshold

        console.log("[Verify] Confidence:", confidence, "| Threshold:", threshold);

        if (confidence >= threshold) {
            console.log("==========================================");
            console.log("!!! FACE MATCH SUCCESS !!!");
            console.log("Email:", email);
            console.log("Confidence:", confidence, "/ Threshold:", threshold);
            console.log("==========================================");
            
            await finalizeVerificationInCloud(email);
            
            return res.status(200).json({ match: true, confidence: Math.round(confidence) });
        } else {
            console.warn("[Verify] FACE MISMATCH for", email, "- Confidence:", confidence);
            return res.status(200).json({ 
                match: false, 
                phase: 'compare',
                confidence: Math.round(confidence),
                error: 'Face on ID does not match your selfie. Please ensure you upload YOUR ID card and take a clear selfie.'
            });
        }

    } catch (error) {
        console.error('[Verify] System Error:', error.message);
        return res.status(500).json({ match: false, error: 'Verification system busy. Please try again.' });
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
