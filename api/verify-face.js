import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: { bodyParser: false },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const form = formidable();
    
    return new Promise((resolve) => {
        form.parse(req, async (err, fields, files) => {
            if (err || !files.idCard || !files.selfie) {
                res.status(400).json({ error: 'Both ID Card and Selfie are required.' });
                return resolve();
            }

            const compreFaceUrl = (process.env.COMPREFACE_URL || "http://your-server-ip:8000").trim();
            const apiKey = (process.env.COMPREFACE_API_KEY || "").trim();

            if (!apiKey) {
                res.status(500).json({ error: 'Verification service is not configured (Missing API Key).' });
                return resolve();
            }

            try {
                console.log("[CompreFace] Starting verification matching...");

                // 1. Prepare FormData for CompreFace Verification API
                const formData = new FormData();
                
                const idBuffer = fs.readFileSync(files.idCard[0].filepath);
                const selfieBuffer = fs.readFileSync(files.selfie[0].filepath);

                formData.append('source_image', new Blob([idBuffer], { type: 'image/jpeg' }));
                formData.append('target_image', new Blob([selfieBuffer], { type: 'image/jpeg' }));

                // 2. Call CompreFace Verification Service
                const response = await fetch(`${compreFaceUrl}/api/v1/verification/verify`, {
                    method: 'POST',
                    headers: { 'x-api-key': apiKey },
                    body: formData
                });

                const data = await response.json();
                console.log("[CompreFace] Result:", JSON.stringify(data));

                if (data.result && data.result.length > 0) {
                    const match = data.result[0];
                    const similarity = match.face_matches?.[0]?.similarity || 0;

                    // Standard threshold for identity matching is 0.8 (80%)
                    if (similarity >= 0.8) {
                        res.status(200).json({ match: true, similarity });
                    } else {
                        res.status(200).json({ match: false, error: "Identity mismatch. Please ensure you are holding your own ID." });
                    }
                } else {
                    res.status(400).json({ match: false, error: "No faces detected in one or both images." });
                }
                resolve();

            } catch (error) {
                console.error('[CompreFace] Error:', error.message);
                res.status(500).json({ error: 'Connection error to verification server.' });
                resolve();
            }
        });
    });
}
