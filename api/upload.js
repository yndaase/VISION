import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import admin from 'firebase-admin';

// Initialize Cloudflare R2 (S3 Client)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'vision-edu-materials';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) rawKey = rawKey.slice(1, -1);
    const serviceAccount = JSON.parse(rawKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.error('Firebase Admin Init Error:', err.message);
  }
}
const db = admin.firestore();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if R2 is configured
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      console.error('[Upload API] R2 environment variables not configured');
      return res.status(500).json({ 
        error: 'Storage not configured. Please set R2 environment variables.' 
      });
    }

    const { action } = req.query;

    // 1. GET: Generate pre-signed URL for upload
    if (req.method === 'GET' && action === 'get-upload-url') {
      const { fileKey, contentType } = req.query;
      if (!fileKey) return res.status(400).json({ error: 'fileKey required' });

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        ContentType: contentType || 'application/octet-stream',
      });

      const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
      return res.status(200).json({ uploadUrl, fileKey });
    }

    // 2. GET: Secure download proxy
    if (req.method === 'GET' && action === 'download') {
      const { materialId } = req.query;
      if (!materialId) return res.status(400).send('Material ID required');

      const doc = await db.collection('learning_materials').doc(materialId).get();
      if (!doc.exists) return res.status(404).send('Material not found');
      
      const material = doc.data();
      if (!material.url) return res.status(404).send('File URL missing');

      const commandParams = {
        Bucket: BUCKET_NAME,
        Key: material.url,
      };

      // Force download for materials if requested
      const filename = `${material.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      commandParams.ResponseContentDisposition = `inline; filename="${filename}"`;
      commandParams.ResponseContentType = 'application/pdf';

      const command = new GetObjectCommand(commandParams);
      const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

      return res.redirect(302, presignedUrl);
    }

    // 3. POST: Save metadata to Firestore
    if (req.method === 'POST') {
      const metadata = req.body;
      if (!metadata.id || !metadata.title) {
        return res.status(400).json({ error: 'Incomplete metadata' });
      }

      await db.collection('learning_materials').doc(metadata.id).set({
        ...metadata,
        uploadedAt: metadata.uploadedAt || new Date().toISOString().split("T")[0],
        uploadedBy: "admin",
        source: "r2-sync"
      });

      return res.status(200).json({ success: true, id: metadata.id });
    }

    // 4. DELETE: Remove material from R2
    if (req.method === 'DELETE') {
      const { materialId } = req.query;
      if (!materialId) return res.status(400).json({ error: 'Material ID required' });

      const doc = await db.collection('learning_materials').doc(materialId).get();
      if (!doc.exists) return res.status(404).json({ error: 'Material not found' });

      const material = doc.data();
      if (material.url) {
        try {
          const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: material.url,
          });
          await r2Client.send(command);
        } catch (r2Err) {
          console.error('Error deleting from R2:', r2Err);
        }
      }

      await db.collection('learning_materials').doc(materialId).delete();
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("[Materials API Error]:", error.message);
    return res.status(500).json({ error: error.message });
  }
}

