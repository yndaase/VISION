import { put } from '@vercel/blob';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
  if (rawKey.startsWith('"') && rawKey.endsWith('"')) rawKey = rawKey.slice(1, -1);
  const serviceAccount = JSON.parse(rawKey);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

export const config = {
  api: { bodyParser: false } // We handle the stream manually
};

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  try {
    const title = decodeURIComponent(request.headers['x-mat-title'] || 'Untitled');
    const subject = request.headers['x-mat-subject'] || 'general';
    const type = request.headers['x-mat-type'] || 'PDF';
    const filename = request.headers['x-filename'] || 'upload.pdf';

    console.log(`[Upload] Receiving: ${title} (${filename})`);

    // 1. Upload to Vercel Blob (Server-side)
    const blob = await put(filename, request, {
      access: 'public',
      contentType: request.headers['content-type']
    });

    console.log(`[Blob] Uploaded: ${blob.url}`);

    // 2. Link to Firebase
    const matId = 'mat-' + Date.now();
    const entry = {
      id: matId,
      subject,
      title,
      type,
      url: blob.url,
      uploadedAt: new Date().toISOString().split("T")[0],
      uploadedBy: "admin",
      source: "direct-server-sync"
    };

    await db.collection('learning_materials').doc(matId).set(entry);
    console.log('[Firebase] Linked successfully');

    return response.status(200).json({ success: true, url: blob.url });
  } catch (error) {
    console.error("[Upload Error]:", error.message);
    return response.status(500).json({ error: error.message });
  }
}
