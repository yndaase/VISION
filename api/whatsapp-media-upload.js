import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }, // Disable body parser to handle multipart/form-data
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  // Use your real phone number ID from Meta
  const phoneId = process.env.WHATSAPP_PHONE_ID || "1032433326630998"; 

  const form = formidable();

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Form parse error' });
        return resolve();
      }

      const audioFile = files.audio[0];
      if (!audioFile) {
        res.status(400).json({ error: 'No audio file provided' });
        return resolve();
      }

      try {
        const fileData = fs.readFileSync(audioFile.filepath);
        const formData = new FormData();
        
        // WhatsApp requires the messaging_product to be set
        formData.append('messaging_product', 'whatsapp');
        formData.append('type', 'audio/ogg');
        
        const blob = new Blob([fileData], { type: 'audio/ogg' });
        formData.append('file', blob, 'voice_note.ogg');

        const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/media`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const metaData = await metaResponse.json();
        console.log("[Media Upload Debug]:", metaData);

        if (metaData.id) {
          res.status(200).json({ mediaId: metaData.id });
        } else {
          res.status(500).json({ error: 'Meta upload failed', details: metaData });
        }
        resolve();
      } catch (uploadErr) {
        console.error("[Media Upload Error]:", uploadErr);
        res.status(500).json({ error: 'Internal upload error' });
        resolve();
      }
    });
  });
}
