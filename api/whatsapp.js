/**
 * Meta WhatsApp Business API Gateway for Vision Portal
 * Requires:
 * - WHATSAPP_ACCESS_TOKEN (System User Token)
 * - WHATSAPP_PHONE_NUMBER_ID
 */

export default async function handler(req, res) {
    if (req.method === 'GET') {
        // --- NEW: Template Approval Status Checker ---
        const { templateName } = req.query;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const businessId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

        if (!accessToken || !businessId) {
            return res.status(500).json({ success: false, error: "Missing config for template lookup" });
        }

        try {
            const safeName = (templateName || '').toString().trim();
            const url = `https://graph.facebook.com/v25.0/${businessId}/message_templates?name=${encodeURIComponent(safeName)}&fields=name,status,category,language`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error?.message || "Failed to fetch template status");
            
            const templates = Array.isArray(data.data) ? data.data : [];
            const template = templates[0];
            return res.status(200).json({ 
                success: true, 
                name: safeName,
                status: template?.status || "NOT_FOUND",
                category: template?.category,
                language: template?.language || null,
                matches: templates.map(t => ({
                    name: t?.name || null,
                    status: t?.status || null,
                    category: t?.category || null,
                    language: t?.language || null
                }))
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, type, phone, name, templateName, lang, components, scheduledTime, message } = req.body;

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
        let recipientPhone = phone.toString().replace(/\D/g, ''); // Ensure only numbers
        const fbUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
        
        // If an approved template name is explicitly provided, use template mode
        const hasExplicitTemplate = templateName && templateName.trim() && templateName.trim() !== 'hello_world';
        
        let payload;

        if (hasExplicitTemplate) {
            // ── TEMPLATE MODE ──
            // Use when the admin has a Meta-approved template
            const requestedLang = (lang || "").toString().trim();
            payload = {
                messaging_product: "whatsapp",
                to: recipientPhone,
                type: "template",
                template: {
                    name: templateName.trim(),
                    language: { code: requestedLang || "en_US" }
                }
            };

            // Attach components if provided
            if (components) {
                payload.template.components = components;
            } else if (name) {
                // Default: pass name as first body parameter
                payload.template.components = [{
                    type: "body",
                    parameters: [{ type: "text", text: name || "Student" }]
                }];
            }
        } else {
            // ── FREE-FORM TEXT MODE ──
            // Works within 24hr customer service window (after user messages first)
            // No Meta template approval needed
            let messageText = message || "";

            if (!messageText) {
                // Build message based on notification type
                const studentName = name || "Student";
                
                switch(type) {
                    case "REMINDER":
                        messageText = `📚 *Vision Education - Study Reminder*\n\nHi ${studentName}! 👋\n\nThis is your daily reminder to keep studying. Consistent practice is the key to WASSCE success!\n\n✅ Complete today's mock exam\n✅ Review your weak topics\n✅ Aim for at least 30 minutes of focused practice\n\n_\"Success is the sum of small efforts repeated day in and day out.\"_\n\n🌐 visionedu.online`;
                        break;
                    case "NEW_MATERIAL":
                        const title = req.body.title || "New Resource";
                        const subject = req.body.subject || "your subject";
                        messageText = `📖 *Vision Education - New Material Alert*\n\nHi ${studentName}! 🎉\n\nA new study resource has just been uploaded:\n\n📄 *${title}*\nSubject: ${subject}\n\nLog in now to access it and stay ahead of your WASSCE preparation!\n\n🌐 visionedu.online`;
                        break;
                    case "EXAM_ALERT":
                        messageText = `🚨 *Vision Education - WASSCE 2026 Alert*\n\nHi ${studentName}!\n\nImportant exam update! Make sure you're staying on track with your preparation.\n\n📝 Take a practice mock today\n📊 Review your performance dashboard\n🎯 Focus on your weak areas\n\nYour future self will thank you!\n\n🌐 visionedu.online`;
                        break;
                    case "PERFORMANCE_UPDATE":
                        messageText = `🏆 *Vision Education - Performance Update*\n\nHi ${studentName}! 🌟\n\nGreat progress on Vision Education! Keep pushing your limits.\n\nCheck your latest scores and performance trends on your dashboard.\n\n🌐 visionedu.online`;
                        break;
                    case "GENERAL_ALERT":
                        messageText = `📢 *Vision Education - Update*\n\nHi ${studentName}!\n\nThere's an important update from Vision Education. Log in to check the latest announcements.\n\n🌐 visionedu.online`;
                        break;
                    default:
                        messageText = `👋 Hi ${studentName}!\n\nThis is a message from Vision Education.\n\n🌐 visionedu.online`;
                }
            }

            payload = {
                messaging_product: "whatsapp",
                to: recipientPhone,
                type: "text",
                text: { 
                    preview_url: true,
                    body: messageText 
                }
            };
        }

        console.log(`[Meta WA] Sending ${hasExplicitTemplate ? 'template' : 'text'} message to ${recipientPhone}`);

        const response = await fetch(fbUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("[Meta WA] Message sent successfully. ID:", data.messages?.[0]?.id);
            return res.status(200).json({ success: true, messageId: data.messages?.[0]?.id });
        }

        // Handle specific Meta errors
        const errCode = data?.error?.code;
        const errMsg = data?.error?.message || "Meta API request failed.";
        console.error("[Meta API Error]:", data);

        // Error 131047: Re-engagement message — user hasn't messaged in 24hrs, needs template
        if (errCode === 131047 && !hasExplicitTemplate) {
            return res.status(400).json({
                success: false,
                error: "This student hasn't messaged Vision Education on WhatsApp yet. Ask them to send any message to your WhatsApp Business number first, then you can message them within 24 hours.",
                code: errCode
            });
        }

        throw new Error(errMsg);

    } catch (error) {
        console.error("[Meta WhatsApp Gateway Failure]:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
