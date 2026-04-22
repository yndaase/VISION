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
            if (err || !files.selfie) {
                res.status(400).json({ error: 'Selfie is required.' });
                return resolve();
            }

            const compreFaceUrl = (process.env.COMPREFACE_URL || "http://your-server-ip:8000").trim();
            const apiKey = (process.env.COMPREFACE_DETECTION_API_KEY || process.env.COMPREFACE_API_KEY || "").trim();

            try {
                console.log("[CompreFace] Detecting face...");
                const formData = new FormData();
                const selfieBuffer = fs.readFileSync(files.selfie[0].filepath);
                formData.append('file', new Blob([selfieBuffer], { type: 'image/jpeg' }));

                const response = await fetch(`${compreFaceUrl}/api/v1/detection/detect`, {
                    method: 'POST',
                    headers: { 'x-api-key': apiKey },
                    body: formData
                });

                const data = await response.json();
                
                if (data.result && data.result.length > 0) {
                    // Face detected!
                    res.status(200).json({ match: true });
                } else {
                    res.status(400).json({ match: false, error: "No face detected. Please look directly at the camera." });
                }
                resolve();
            } catch (error) {
                console.error('[CompreFace] Error:', error.message);
                res.status(500).json({ error: 'Verification server offline.' });
                resolve();
            }
        });
    });
}
