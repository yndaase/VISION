export default async function handler(req, res) {
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
