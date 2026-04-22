import { handleUpload } from '@vercel/blob/client';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const jsonResponse = await handleUpload({
      body: request.body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // We can enforce security here, but since the admin portal is protected
        // we'll allow standard document and media types.
        return {
          allowedContentTypes: [
            'application/pdf', 
            'video/mp4', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg', 
            'image/png',
            'application/octet-stream'
          ],
          tokenPayload: JSON.stringify({
            title: decodeURIComponent(request.headers['x-mat-title'] || ''),
            subject: request.headers['x-mat-subject'],
            type: request.headers['x-mat-type']
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Blob upload completed:', blob.url);
        
        try {
          const { title, subject, type } = JSON.parse(tokenPayload);
          const matId = 'mat-' + Date.now();
          
          const entry = {
            id: matId,
            subject: subject || 'general',
            title: title || 'Untitled Resource',
            type: type || 'PDF',
            url: blob.url,
            uploadedAt: new Date().toISOString().split("T")[0],
            uploadedBy: "admin",
            source: "vercel-blob-atomic"
          };

          // ATOMIC LINKING: Save directly to Firebase from the server
          await db.collection('learning_materials').doc(matId).set(entry);
          console.log('[Firebase] Material linked successfully via Server Strategy:', title);
        } catch (err) {
          console.error('[Firebase Sync Error]:', err.message);
        }
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Vercel Blob Upload Error:", error);
    return response.status(400).json({ error: error.message });
  }
}
