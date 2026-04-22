import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }, 
};

const VISION_TEMPLATE = "vision_study_update";

export default async function handler(req, res) {
    console.log(`[API ENTRY] ${req.method} request received at ${new Date().toISOString()}`);
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1032433326630998";
    const method = req.method;

    // --- 1. MEDIA PLAYBACK (GET) ---
    if (method === 'GET' && req.query.action === 'media') {
        const { mediaId } = req.query;
        try {
            const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            const metaData = await metaRes.json();
            if (!metaData.url) return res.status(404).json({ error: 'URL not found' });
            const mediaFile = await fetch(metaData.url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            res.setHeader('Content-Type', mediaFile.headers.get('content-type') || 'audio/ogg');
            const buffer = await mediaFile.arrayBuffer();
            return res.status(200).send(Buffer.from(buffer));
        } catch (e) { return res.status(500).json({ error: e.message }); }
    }

    // --- 2. POST HANDLER (UPLOAD OR SEND) ---
    if (method === 'POST') {
        const contentType = req.headers['content-type'] || '';
        
        // A. Handle Voice Recording Upload
        if (contentType.includes('multipart/form-data')) {
            const form = formidable();
            return new Promise((resolve) => {
                form.parse(req, async (err, fields, files) => {
                    if (err || !files.audio) { res.status(400).json({ error: 'No file' }); return resolve(); }
                    try {
                        const fileData = fs.readFileSync(files.audio[0].filepath);
                        const mimeType = files.audio[0].mimetype || 'audio/mp4';
                        const ext = mimeType.includes('mp4') ? 'mp4' : (mimeType.includes('ogg') ? 'ogg' : 'webm');
                        
                        const formData = new FormData();
                        formData.append('messaging_product', 'whatsapp');
                        
                        const blob = new Blob([fileData], { type: mimeType });
                        formData.append('file', blob, `voice_note.${ext}`);
                        formData.append('type', mimeType);
                        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/media`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${accessToken}` },
                            body: formData
                        });
                        const data = await metaRes.json();
                        console.log("[Meta Upload Debug]:", data);
                        res.status(200).json({ mediaId: data.id });
                        resolve();
                    } catch (e) { res.status(500).json({ error: e.message }); resolve(); }
                });
            });
        }

        // B. Handle Sending Messages (Text, Audio, or Template)
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const { phone, type, mediaId, message, name, templateName, lang } = body;
        const recipient = phone.toString().replace(/\D/g, '');
        const fbUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

        try {
            let payload;
            if (type === 'audio') {
                payload = { 
                    messaging_product: "whatsapp", 
                    to: recipient, 
                    type: "document", 
                    document: { 
                        id: mediaId,
                        filename: "Voice_Note.m4a"
                    } 
                };
            } else if (templateName) {
                payload = { 
                    messaging_product: "whatsapp", 
                    to: recipient, 
                    type: "template", 
                    template: { name: templateName, language: { code: lang || "en_US" }, components: [{ type:"body", parameters:[{type:"text", text: name || "Student"}]}] } 
                };
            } else {
                payload = { messaging_product: "whatsapp", to: recipient, type: "text", text: { body: message || "Vision Education Update" } };
            }

            console.log(`[Meta WA Debug] Sending Payload:`, JSON.stringify(payload));

            const response = await fetch(fbUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            
            console.log(`[Meta WA Debug] Response Status: ${response.status}`);
            console.log(`[Meta WA Debug] Response Body:`, JSON.stringify(result));

            if (response.ok) {
                return res.status(200).json({ success: true, messageId: result.messages?.[0]?.id });
            } else {
                return res.status(response.status).json({ success: false, error: result.error?.message, details: result });
            }
        } catch (err) { 
            console.error("[Meta WA Debug] Crash:", err.message);
            return res.status(500).json({ error: err.message }); 
        }
    }

    return res.status(405).send('Not Allowed');
}
