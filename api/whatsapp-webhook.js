export default async function handler(req, res) {
  const method = req.method;
  const body = req.body;

  console.log(`[Webhook Debug] Method: ${method}`);
  console.log(`[Webhook Debug] Query: ${JSON.stringify(req.query)}`);
  
  // 1. Meta Webhook Verification (GET)
  if (method === 'GET') {
    const challenge = req.query['hub.challenge'];
    const token = req.query['hub.verify_token'];
    console.log(`[Webhook Debug] Verification attempt with token: ${token}`);
    return res.status(200).send(challenge);
  }

  // 2. Handle Incoming Data (POST)
  if (method === 'POST') {
    console.log(`[Webhook Debug] Body: ${JSON.stringify(body)}`);

    // Only process if it's a valid WhatsApp message structure
    if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const value = body.entry[0].changes[0].value;
      const message = value.messages[0];
      const contact = (value.contacts && value.contacts[0]) ? value.contacts[0] : {};
      
      const from = message.from; 
      const name = (contact.profile && contact.profile.name) ? contact.profile.name : 'Student';
      const text = message.text ? message.text.body : '[Media/Other]';
      const msgId = message.id;

      console.log(`[Webhook Debug] Extracted - From: ${from}, Name: ${name}, Text: ${text}`);

      // Initialize Firebase
      let db;
      try {
          const admin = await import('firebase-admin');
          const adminApp = admin.default || admin;
          
          if (!adminApp.apps.length) {
            let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
            if (rawKey.startsWith('"') && rawKey.endsWith('"')) rawKey = rawKey.slice(1, -1);
            const serviceAccount = JSON.parse(rawKey);
            adminApp.initializeApp({ credential: adminApp.credential.cert(serviceAccount) });
          }
          db = adminApp.firestore();
      } catch (fErr) {
          console.error("[Webhook Debug] Firebase Init Error:", fErr.message);
          return res.status(200).send('EVENT_RECEIVED_FB_ERR');
      }

      try {
        const chatRef = db.collection('support_chats').doc(from);
        
        // Update the main chat summary
        await chatRef.set({
          lastMessage: text,
          lastUpdated: new Date().toISOString(),
          studentName: name,
          phone: from,
          status: 'unread'
        }, { merge: true });

        // Add the specific message to history
        await chatRef.collection('messages').add({
          text,
          from: 'student',
          timestamp: new Date().toISOString(),
          msgId
        });
        
        console.log("[Webhook Debug] Success: Saved to Firestore");
      } catch (saveErr) {
        console.error("[Webhook Debug] Firestore Save Error:", saveErr.message);
      }
    } else {
      console.log("[Webhook Debug] Ignored: Not a message event (possibly a status update)");
    }

    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.status(405).send('Method Not Allowed');
}
