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
    
    // Fallback for local dev if .env isn't loading automatically
    const apiKey = process.env.COMPREFACE_API_KEY || "aa0edaa5-95f7-4420-953d-1b9e6449cf5b";
    const comprefaceUrl = process.env.COMPREFACE_URL || "http://172.25.42.254:8000";

    if (!selfieBase64 || !idBase64) {
        return res.status(400).json({ error: 'Missing images. Please ensure you captured both ID and Selfie.' });
    }

    try {
        // CompreFace expects multipart/form-data.
        // We convert base64 strings to Buffers for Node.js compatibility.
        const selfieBuffer = Buffer.from(selfieBase64.split(',')[1], 'base64');
        const idBuffer = Buffer.from(idBase64.split(',')[1], 'base64');

        const formData = new FormData();
        
        // We use Blobs created from Buffers for the native Fetch API
        formData.append('source_image', new Blob([idBuffer], { type: 'image/jpeg' }), 'id_photo.jpg');
        formData.append('target_image', new Blob([selfieBuffer], { type: 'image/jpeg' }), 'selfie.jpg');

        console.log(`[Verify] Proxying request to: ${comprefaceUrl}`);

        const comprefaceRes = await fetch(`${comprefaceUrl}/api/v1/verification/verify`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey
            },
            body: formData
        });

        const data = await comprefaceRes.json();

        if (!comprefaceRes.ok) {
            console.error('[Verify] CompreFace Error:', data);
            return res.status(comprefaceRes.status).json({ 
                success: false, 
                error: data.message || 'CompreFace verification failed' 
            });
        }

        const similarity = data.result?.[0]?.similarity || 0;
        const isMatch = similarity > 0.9;

        return res.status(200).json({
            success: true,
            match: isMatch,
            similarity: similarity,
            message: isMatch ? 'Faces match successfully' : 'Faces do not match'
        });

    } catch (error) {
        console.error('[Verify Face] Fatal Error:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: `Internal server error: ${error.message}` 
        });
    }
}
