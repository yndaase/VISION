// VISION Face Verification API — Dual Check: ID Name OCR + Face Detection

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { selfieBase64, idBase64, email, name } = req.body;
    
    if (!selfieBase64 || !idBase64 || !email || !name) {
        return res.status(400).json({ error: 'Selfie, ID photo, email and name are required.' });
    }

    const apiKey = (process.env.FACEPP_API_KEY || "").trim();
    const apiSecret = (process.env.FACEPP_API_SECRET || "").trim();

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Face++ credentials not configured.' });
    }

    try {
        // ═══════════════════════════════════════════════════
        // PHASE 1: OCR — Extract text from National ID card
        // ═══════════════════════════════════════════════════
        console.log("[Verify] Phase 1: OCR scan for", email);
        
        const idData = idBase64.includes(',') ? idBase64.split(',')[1] : idBase64;
        
        const ocrForm = new URLSearchParams();
        ocrForm.append('api_key', apiKey);
        ocrForm.append('api_secret', apiSecret);
        ocrForm.append('image_base64', idData);

        const ocrResponse = await fetch('https://api-us.faceplusplus.com/imagepp/v1/recognizetext', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: ocrForm.toString()
        });

        const ocrData = await ocrResponse.json();
        
        if (ocrData.error_message) {
            console.warn("[OCR] Face++ Error:", ocrData.error_message);
            return res.status(200).json({ 
                match: false, 
                phase: 'id',
                error: 'Could not read ID card. Please take a clearer photo.' 
            });
        }

        // Extract all text from OCR result
        const extractedTexts = (ocrData.result || []).map(r => (r.value || '').trim());
        const fullOcrText = extractedTexts.join(' ').toUpperCase();
        
        console.log("[OCR] Extracted text:", fullOcrText.substring(0, 200));

        // Name matching: split account name into words, check if ANY word matches
        const accountNames = name.toUpperCase().split(/\s+/).filter(w => w.length >= 2);
        const nameMatched = accountNames.some(word => fullOcrText.includes(word));
        
        if (!nameMatched) {
            console.warn("[Verify] NAME MISMATCH for", email);
            console.warn("[Verify] Account names:", accountNames);
            console.warn("[Verify] OCR text:", fullOcrText.substring(0, 300));
            return res.status(200).json({ 
                match: false, 
                phase: 'id',
                error: 'Name on ID does not match your account. Ensure the name on your ID matches your Vision Education profile.' 
            });
        }

        console.log("[Verify] ✓ Phase 1 PASSED — Name matched:", accountNames.filter(w => fullOcrText.includes(w)));

        // ═══════════════════════════════════════════════════
        // PHASE 2: Face Detection — Verify selfie has a face
        // ═══════════════════════════════════════════════════
        console.log("[Verify] Phase 2: Face detection for", email);
        
        const selfieData = selfieBase64.includes(',') ? selfieBase64.split(',')[1] : selfieBase64;

        const faceForm = new URLSearchParams();
        faceForm.append('api_key', apiKey);
        faceForm.append('api_secret', apiSecret);
        faceForm.append('image_base64', selfieData);

        const faceResponse = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: faceForm.toString()
        });

        const faceData = await faceResponse.json();
        
        if (!faceData.faces || faceData.faces.length === 0) {
            console.warn("[Verify] FACE NOT DETECTED for", email);
            return res.status(200).json({ 
                match: false, 
                phase: 'face',
                error: faceData.error_message || 'No face detected in selfie. Ensure good lighting and look directly at the camera.' 
            });
        }

        // ═══════════════════════════════════════════════════
        // BOTH CHECKS PASSED — Verify the user
        // ═══════════════════════════════════════════════════
        console.log("==========================================");
        console.log("!!! DUAL VERIFICATION SUCCESS !!!");
        console.log("Email:", email);
        console.log("Name Match: ✓ | Face Detect: ✓");
        console.log("==========================================");
        
        await finalizeVerificationInCloud(email);
        
        return res.status(200).json({ match: true });

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
