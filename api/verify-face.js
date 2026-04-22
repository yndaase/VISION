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
                console.log(`[CompreFace Debug] Status: ${response.status}`, data);
                
                if (data.result && data.result.length > 0) {
                    console.log("[CompreFace] Face detected with confidence:", data.result[0].face_probability);
                    res.status(200).json({ match: true });
                } else if (data.message) {
                    console.error("[CompreFace API Error]:", data.message);
                    res.status(400).json({ match: false, error: data.message });
                } else {
                    res.status(400).json({ match: false, error: "No face detected. Please ensure your face is clear and well-lit." });
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
