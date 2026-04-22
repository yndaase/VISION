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
    console.log("[Blob] Request type:", request.headers['x-vercel-id'] ? 'Completion Callback' : 'Token Request');
    
    const jsonResponse = await handleUpload({
      body: request.body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        console.log("[Blob] Generating token for:", pathname);
        return {
          allowedContentTypes: [
            'application/pdf', 
            'video/mp4', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 
            'image/png',
            'application/octet-stream'
          ],
          tokenPayload: JSON.stringify({
            title: decodeURIComponent(request.headers['x-mat-title'] || 'Untitled'),
            subject: request.headers['x-mat-subject'] || 'general',
            type: request.headers['x-mat-type'] || 'PDF'
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('[Blob] Upload finished. Starting Firebase link...');
        
        try {
          const { title, subject, type } = JSON.parse(tokenPayload);
          const matId = 'mat-' + Date.now();
          
          const entry = {
            id: matId,
            subject: subject,
            title: title,
            type: type,
            url: blob.url,
            uploadedAt: new Date().toISOString().split("T")[0],
            uploadedBy: "admin",
            source: "atomic-sync"
          };

          await db.collection('learning_materials').doc(matId).set(entry);
          console.log('[Firebase] Successfully linked:', title);
        } catch (err) {
          console.error('[Firebase Sync Error]:', err.message);
          // Even if Firebase fails, we don't throw an error here 
          // to prevent the client from looping.
        }
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error("[Vercel Blob Error]:", error.message);
    return response.status(400).json({ error: error.message });
  }
}
