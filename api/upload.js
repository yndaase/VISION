import { handleUpload } from '@vercel/blob/client';
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

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  try {
    const jsonResponse = await handleUpload({
      body: request.body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN || process.env.PUBLIC_BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        return {
          tokenPayload: JSON.stringify({
            title: decodeURIComponent(request.headers['x-mat-title'] || 'Untitled'),
            subject: request.headers['x-mat-subject'] || 'general',
            type: request.headers['x-mat-type'] || 'PDF'
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const { title, subject, type } = JSON.parse(tokenPayload);
          const matId = 'mat-' + Date.now();
          const entry = {
            id: matId,
            subject,
            title,
            type,
            url: blob.url,
            uploadedAt: new Date().toISOString().split("T")[0],
            uploadedBy: "admin",
            source: "large-file-sync"
          };
          await db.collection('learning_materials').doc(matId).set(entry);
        } catch (err) {
          console.error('[Firebase Sync Error]:', err.message);
        }
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error("[Vercel Blob Error]:", error.message);
    return response.status(400).json({ error: error.message });
  }
}
