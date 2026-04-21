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
    const apiKey = process.env.COMPREFACE_API_KEY;
    const comprefaceUrl = process.env.COMPREFACE_URL;

    if (!selfieBase64 || !idBase64) {
        return res.status(400).json({ error: 'Missing required parameters (selfieBase64, idBase64)' });
    }

    if (!apiKey || !comprefaceUrl) {
        return res.status(500).json({ error: 'Verification server is not configured. (Check .env)' });
    }

    try {
        // CompreFace expects multipart/form-data for image files.
        // We need to convert base64 to Blob/Buffer and use FormData.
        
        // Note: In a Vercel environment, we might need a library like 'form-data'.
        // For simplicity, we'll use a fetch-compatible approach if possible, 
        // or just assume standard Node.js environment.
        
        const formData = new FormData();
        
        // Convert base64 to Blobs
        const selfieBlob = await (await fetch(selfieBase64)).blob();
        const idBlob = await (await fetch(idBase64)).blob();

        formData.append('source_image', idBlob, 'id_photo.jpg');
        formData.append('target_image', selfieBlob, 'selfie.jpg');

        const comprefaceRes = await fetch(`${comprefaceUrl}/api/v1/verification/verify`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey
            },
            body: formData
        });

        const data = await comprefaceRes.json();

        if (!comprefaceRes.ok) {
            return res.status(comprefaceRes.status).json({ 
                success: false, 
                error: data.message || 'CompreFace verification failed' 
            });
        }

        // CompreFace returns similarity. Usually > 0.9 is a good match.
        const similarity = data.result?.[0]?.similarity || 0;
        const isMatch = similarity > 0.9;

        return res.status(200).json({
            success: true,
            match: isMatch,
            similarity: similarity,
            message: isMatch ? 'Faces match successfully' : 'Faces do not match'
        });

    } catch (error) {
        console.error('[Verify Face] Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error during verification' });
    }
}
