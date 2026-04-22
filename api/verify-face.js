/**
 * VISION AI - Face Verification Endpoint
 * 
 * This endpoint proxies requests to the self-hosted CompreFace server.
 * It compares a "selfie" with a "verification photo" (ID).
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { selfieBase64, idBase64 } = req.body;
    const apiKey = process.env.AZURE_FACE_KEY;
    const endpoint = process.env.AZURE_FACE_ENDPOINT;

    if (!selfieBase64 || !idBase64) {
        return res.status(400).json({ error: 'Missing images. Please ensure you captured both ID and Selfie.' });
    }

    try {
        // Step 1: Detect Face in ID Photo and Selfie to get faceIds
        async function detectFace(base64) {
            const buffer = Buffer.from(base64.split(',')[1], 'base64');
            const res = await fetch(`${endpoint}/face/v1.0/detect?returnFaceId=true&recognitionModel=recognition_04`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'Content-Type': 'application/octet-stream'
                },
                body: buffer
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Face detection failed');
            if (data.length === 0) throw new Error('No face detected in one of the images');
            return data[0].faceId;
        }

        console.log("[Azure] Detecting faces...");
        const faceId1 = await detectFace(idBase64);
        const faceId2 = await detectFace(selfieBase64);

        // Step 2: Verify if the two faceIds belong to the same person
        console.log("[Azure] Verifying match...");
        const verifyRes = await fetch(`${endpoint}/face/v1.0/verify`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ faceId1, faceId2 })
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
            throw new Error(verifyData.error?.message || 'Verification failed');
        }

        return res.status(200).json({
            success: true,
            match: verifyData.isIdentical,
            confidence: verifyData.confidence,
            message: verifyData.isIdentical ? 'Identity Verified' : 'Faces do not match'
        });

    } catch (error) {
        console.error('[Azure Face] Error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
