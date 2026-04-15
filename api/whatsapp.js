/**
 * Meta WhatsApp Business API Gateway for Vision Portal
 * Requires:
 * - WHATSAPP_ACCESS_TOKEN (System User Token)
 * - WHATSAPP_PHONE_NUMBER_ID
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, type, phone, name, templateName } = req.body;

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
        return res.status(500).json({ 
            success: false, 
            error: "Meta WhatsApp gateway unconfigured.",
            detail: "Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in Environment Variables."
        });
    }

    try {
        let recipientPhone = phone.replace(/\D/g, ''); // Ensure only numbers
        
        /**
         * META TEMPLATE SYSTEM
         * Official notifications MUST use approved templates.
         */
        let payload = {
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "template",
            template: {
                name: templateName || "hello_world", // Default placeholder
                language: { code: "en_US" }
            }
        };

        // Custom Logic for specific types
        if (type === "REMINDER") {
            // We expect an approved template called 'study_reminder' with 1 parameter (name)
            payload.template.name = templateName || "study_reminder";
            payload.template.components = [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: name || "Student" }
                    ]
                }
            ];
        }

        const fbUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
        
        console.log(`[Meta WA] Routing to ${recipientPhone} via ${fbUrl}`);

        const response = await fetch(fbUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[Meta API Error Response]:", data);
            throw new Error(data.error?.message || "Meta API request failed.");
        }

        console.log("[Meta WA] Message dispatched successfully. ID:", data.messages?.[0]?.id);

        return res.status(200).json({ 
            success: true, 
            messageId: data.messages?.[0]?.id 
        });

    } catch (error) {
        console.error("[Meta WhatsApp Gateway Failure]:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
