import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }, 
};

const VISION_TEMPLATE = "vision_study_update";

/**
 * Consolidated WhatsApp Services API
 * Combines: whatsapp.js and whatsapp-webhook.js functionality
 * Handles: Message sending, media upload, and webhook processing
 */

export default async function handler(req, res) {
    console.log(`[WhatsApp Services] ${req.method} request received at ${new Date().toISOString()}`);
    
    const { webhook } = req.query;
    
    // Route to webhook handler if webhook=true
    if (webhook === 'true') {
        return await handleWebhook(req, res);
    }
    
    // Otherwise handle regular WhatsApp API
    return await handleWhatsAppAPI(req, res);
}

/**
 * WhatsApp API Handler (formerly whatsapp.js)
 */
async function handleWhatsAppAPI(req, res) {
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
        const { phone, type, mediaId, message, name, templateName, lang, mimeType: incomingMime } = body;
        const recipient = phone.toString().replace(/\D/g, '');
        const fbUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

        try {
            let payload;
            if (type === 'audio') {
                const mimeType = incomingMime || 'audio/mp4';
                const ext = mimeType.includes('webm') ? 'webm' : 'm4a';
                payload = { 
                    messaging_product: "whatsapp", 
                    to: recipient, 
                    type: "document", 
                    document: { 
                        id: mediaId,
                        filename: `Voice_Note.${ext}`
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

/**
 * WhatsApp Webhook Handler (formerly whatsapp-webhook.js)
 */
async function handleWebhook(req, res) {
  const method = req.method;
  const body = req.body;

  console.log(`[Webhook Debug] Method: ${method}`);
  
  if (method === 'GET') {
    const challenge = req.query['hub.challenge'];
    return res.status(200).send(challenge);
  }

  if (method === 'POST') {
    if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const value = body.entry[0].changes[0].value;
      const message = value.messages[0];
      const contact = (value.contacts && value.contacts[0]) ? value.contacts[0] : {};
      
      const from = message.from; 
      const name = (contact.profile && contact.profile.name) ? contact.profile.name : 'Student';
      const msgId = message.id;
      
      let text = '[Media]';
      let type = 'text';
      let mediaId = null;

      if (message.type === 'text') {
        text = message.text.body;
      } else if (message.type === 'audio' || message.type === 'voice') {
        text = '🎤 Voice Message';
        type = 'audio';
        mediaId = message.audio ? message.audio.id : (message.voice ? message.voice.id : null);
      }

      console.log(`[Webhook Debug] Received ${type} from ${name}`);

      // Initialize Firebase
      let db;
      try {
          const admin = await import('firebase-admin');
          const adminApp = admin.default || admin;
          if (!adminApp.apps.length) {
            let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
            if (rawKey.startsWith('"') && rawKey.endsWith('"')) rawKey = rawKey.slice(1, -1);
            adminApp.initializeApp({ credential: adminApp.credential.cert(JSON.parse(rawKey)) });
          }
          db = adminApp.firestore();
      } catch (fErr) {
          console.error("[Webhook Debug] Firebase Error:", fErr.message);
          return res.status(200).send('EVENT_RECEIVED_FB_ERR');
      }

      try {
        const chatRef = db.collection('support_chats').doc(from);
        await chatRef.set({
          lastMessage: text,
          lastUpdated: new Date().toISOString(),
          studentName: name,
          phone: from,
          status: 'unread'
        }, { merge: true });

        await chatRef.collection('messages').add({
          text,
          type,
          mediaId,
          from: 'student',
          timestamp: new Date().toISOString(),
          msgId
        });
      } catch (saveErr) {
        console.error("[Webhook Debug] Save Error:", saveErr.message);
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.status(405).send('Method Not Allowed');
}