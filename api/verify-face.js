/**
 * VISION AI - Face Verification Endpoint
 * 
 * Uses Face++ (Megvii) Compare API.
 * Free tier, no credit card, works immediately.
 * Endpoint: https://api-us.faceplusplus.com/facepp/v3/compare
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { selfieBase64, idBase64 } = req.body;

    if (!selfieBase64 || !idBase64) {
        return res.status(400).json({ error: 'Missing images. Please capture both ID and Selfie.' });
    }

    const apiKey = (process.env.FACEPP_API_KEY || "").trim();
    const apiSecret = (process.env.FACEPP_API_SECRET || "").trim();

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Face verification service is not configured.' });
    }

    try {
        // Extract raw base64 data (remove the "data:image/jpeg;base64," prefix)
        const idData = idBase64.includes(',') ? idBase64.split(',')[1] : idBase64;
        const selfieData = selfieBase64.includes(',') ? selfieBase64.split(',')[1] : selfieBase64;

        // Face++ Compare API accepts base64 images directly via form data
        const formBody = new URLSearchParams();
        formBody.append('api_key', apiKey);
        formBody.append('api_secret', apiSecret);
        formBody.append('image_base64_1', idData);
        formBody.append('image_base64_2', selfieData);

        console.log("[Face++] Comparing faces...");

        const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody.toString()
        });

        const data = await response.json();

        if (data.error_message) {
            console.error('[Face++] API Error:', data.error_message);

            let userMsg = data.error_message;
            if (data.error_message.includes('NO_FACE_FOUND')) {
                userMsg = 'No face detected. Please ensure good lighting and a clear photo.';
            }

            return res.status(400).json({ success: false, error: userMsg });
        }

        // Face++ returns a confidence score (0-100)
        const confidence = data.confidence || 0;
        const threshold = data.thresholds?.["1e-5"] || 73; // Use the strictest threshold
        const isMatch = confidence >= threshold;

        return res.status(200).json({
            success: true,
            match: isMatch,
            confidence: Math.round(confidence * 100) / 100,
            message: isMatch
                ? `Identity Verified (${Math.round(confidence)}% confidence)`
                : `Faces do not match (${Math.round(confidence)}% confidence)`
        });

    } catch (error) {
        console.error('[Face++] Error:', error.message);
        return res.status(500).json({ success: false, error: 'Connection error: ' + error.message });
    }
}
