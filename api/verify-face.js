/**
 * VISION AI - Face Verification Endpoint
 * 
 * Uses Face++ Detect API to confirm a real human face is present.
 * Single selfie verification — no ID comparison needed.
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { selfieBase64 } = req.body;

    if (!selfieBase64) {
        return res.status(400).json({ error: 'Missing selfie image.' });
    }

    const apiKey = (process.env.FACEPP_API_KEY || "").trim();
    const apiSecret = (process.env.FACEPP_API_SECRET || "").trim();

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Face verification service is not configured.' });
    }

    try {
        const selfieData = selfieBase64.includes(',') ? selfieBase64.split(',')[1] : selfieBase64;

        // Use Face++ Detect API to confirm a real face exists
        const formBody = new URLSearchParams();
        formBody.append('api_key', apiKey);
        formBody.append('api_secret', apiSecret);
        formBody.append('image_base64', selfieData);
        formBody.append('return_attributes', 'headpose,blur,eyestatus');

        console.log("[Face++] Detecting face...");

        const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString()
        });

        const data = await response.json();

        if (data.error_message) {
            console.error('[Face++] API Error:', data.error_message);
            return res.status(400).json({ success: false, error: data.error_message });
        }

        if (!data.faces || data.faces.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No face detected. Please ensure good lighting and look directly at the camera.'
            });
        }

        // A real face was detected — verification passed
        const face = data.faces[0];
        const attrs = face.attributes || {};

        // Optional quality checks
        const blur = attrs.blur?.blurness?.value || 0;
        if (blur > 50) {
            return res.status(400).json({
                success: false,
                error: 'Image is too blurry. Please hold still and try again.'
            });
        }

        return res.status(200).json({
            success: true,
            verified: true,
            message: 'Face detected and verified successfully!',
            faceToken: face.face_token
        });

    } catch (error) {
        console.error('[Face++] Error:', error.message);
        return res.status(500).json({ success: false, error: 'Connection error: ' + error.message });
    }
}
