export default async function handler(req, res) {
  // 1. Meta Webhook Verification (GET)
  // TEMPORARY FORCE VERIFY - Let Meta in!
  if (req.method === 'GET') {
    const challenge = req.query['hub.challenge'];
    console.log('[Webhook] Force-verifying challenge:', challenge);
    return res.status(200).send(challenge);
  }

  // 2. Handle Incoming Messages (POST)
  if (req.method === 'POST') {
    // Only initialize Firebase when we actually receive a message
    let db;
    try {
        const admin = (await import('firebase-admin')).default;
        if (!admin.apps.length) {
          let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT;
          if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
          if (rawKey.startsWith('"') && rawKey.endsWith('"')) rawKey = rawKey.slice(1, -1);
          const serviceAccount = JSON.parse(rawKey);
          admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        }
        db = admin.firestore();
    } catch (fErr) {
        console.error("[Webhook Firebase Init Error]:", fErr.message);
    }


    try {
      const body = req.body;

      if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
        const message = body.entry[0].changes[0].value.messages[0];
        const contact = body.entry[0].changes[0].value.contacts[0];
        
        const from = message.from; // Phone number
        const name = contact.profile.name || 'Student';
        const text = message.text ? message.text.body : '[Media/Other]';
        const msgId = message.id;

        console.log(`[Webhook] New message from ${name} (${from}): ${text}`);

        // Save to Firebase Support Chats
        const chatRef = db.collection('support_chats').doc(from);
        
        await chatRef.set({
          lastMessage: text,
          lastUpdated: new Date().toISOString(),
          studentName: name,
          phone: from,
          status: 'unread'
        }, { merge: true });

        // Append to messages sub-collection
        await chatRef.collection('messages').add({
          text,
          from: 'student',
          timestamp: new Date().toISOString(),
          msgId
        });
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('[Webhook Error]:', error.message);
      return res.status(200).send('EVENT_RECEIVED'); // Always return 200 to Meta
    }
  }

  return res.status(405).send('Method Not Allowed');
}
