import twilio from 'twilio';

/**
 * WhatsApp Messaging Gateway for Vision Portal
 * Requires:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER (e.g. +14155238886)
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, type, phone, name } = req.body;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
        return res.status(500).json({ 
            success: false, 
            error: "WhatsApp gateway unconfigured.",
            detail: "Missing TWILIO_ACCOUNT_SID, AUTH_TOKEN, or PHONE_NUMBER."
        });
    }

    const client = twilio(accountSid, authToken);

    try {
        let messageBody = "";
        let targetPhone = phone;

        // In a production app, we would fetch the phone from Firestore here using the email.
        // For now, we expect the phone to be passed if available.
        if (!targetPhone) {
             return res.status(400).json({ success: false, error: "Recipient phone number required." });
        }

        if (type === "REMINDER") {
            messageBody = `Hi ${name || 'Student'}, this is Vision Education. Just a reminder to check your dashboard for new study goals and materials. Keep pushing! 🚀`;
        } else if (type === "NEW_MATERIAL") {
            messageBody = `Notification: New study material has been uploaded to your Vision Portal. Log in now to stay ahead of the syllabus. 📚`;
        } else {
            messageBody = req.body.message || "Message from Vision Education.";
        }

        // WhatsApp formatting: Twilio requires 'whatsapp:' prefix
        const to = targetPhone.startsWith('whatsapp:') ? targetPhone : `whatsapp:${targetPhone}`;
        const from = fromPhone.startsWith('whatsapp:') ? fromPhone : `whatsapp:${fromPhone}`;

        const message = await client.messages.create({
            body: messageBody,
            from: from,
            to: to
        });

        console.log("[WhatsApp] Message sent successfully. SID:", message.sid);

        return res.status(200).json({ 
            success: true, 
            sid: message.sid 
        });

    } catch (error) {
        console.error("[WhatsApp API Error]:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
