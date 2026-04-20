/**
 * Meta WhatsApp Business API Gateway for Vision Portal
 * Requires:
 * - WHATSAPP_ACCESS_TOKEN (System User Token)
 * - WHATSAPP_PHONE_NUMBER_ID
 * - WHATSAPP_BUSINESS_ACCOUNT_ID (for template management)
 */

// Vision Education's template name
const VISION_TEMPLATE = "vision_study_update";

export default async function handler(req, res) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    // ── GET: Check template status or create default template ──
    if (req.method === 'GET') {
        const { templateName, action } = req.query;

        if (!accessToken || !businessId) {
            return res.status(500).json({ success: false, error: "Missing config for template lookup" });
        }

        // action=create-default → auto-create the Vision template
        if (action === 'create-default') {
            return await createDefaultTemplate(accessToken, businessId, res);
        }

        try {
            const safeName = (templateName || VISION_TEMPLATE).toString().trim();
            const url = `https://graph.facebook.com/v21.0/${businessId}/message_templates?name=${encodeURIComponent(safeName)}&fields=name,status,category,language`;
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

    // ── POST: Send message ──
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, type, phone, name, templateName, lang, components, message } = req.body;

    if (!accessToken || !phoneNumberId) {
        return res.status(500).json({ 
            success: false, 
            error: "Meta WhatsApp gateway unconfigured.",
            detail: "Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in Environment Variables."
        });
    }

    if (!phone) {
        return res.status(400).json({ success: false, error: "No phone number provided." });
    }

    try {
        let recipientPhone = phone.toString().replace(/\D/g, '');
        const fbUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
        const studentName = name || "Student";
        
        // Determine which template to use
        const explicitTemplate = templateName && templateName.trim() && templateName.trim() !== 'hello_world' 
            ? templateName.trim() 
            : null;

        // ── Attempt 1: Template Message ──
        // Templates can reach users proactively (no 24hr window needed)
        const templateToUse = explicitTemplate || VISION_TEMPLATE;
        
        const templatePayload = {
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "template",
            template: {
                name: templateToUse,
                language: { code: (lang || "en_US").toString().trim() }
            }
        };

        // Add components
        if (components) {
            templatePayload.template.components = components;
        } else {
            templatePayload.template.components = [{
                type: "body",
                parameters: [{ type: "text", text: studentName }]
            }];
        }

        console.log(`[Meta WA] Attempt 1: Template '${templateToUse}' to ${recipientPhone}`);
        
        const templateRes = await fetch(fbUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(templatePayload)
        });
        const templateData = await templateRes.json();

        if (templateRes.ok) {
            console.log("[Meta WA] Template message sent. ID:", templateData.messages?.[0]?.id);
            return res.status(200).json({ success: true, messageId: templateData.messages?.[0]?.id, method: "template" });
        }

        // Template failed — log and try free-form text
        const templateErrCode = templateData?.error?.code;
        const templateErrMsg = templateData?.error?.message || "";
        console.warn(`[Meta WA] Template failed (code ${templateErrCode}): ${templateErrMsg}`);

        // ── Attempt 2: Free-form Text Message ──
        // Only works if user has messaged the business within 24hrs
        let messageText = message || "";
        if (!messageText) {
            switch(type) {
                case "REMINDER":
                    messageText = `📚 *Vision Education - Study Reminder*\n\nHi ${studentName}! 👋\n\nThis is your daily reminder to keep studying. Consistent practice is the key to WASSCE success!\n\n✅ Complete today's mock exam\n✅ Review your weak topics\n✅ Aim for at least 30 minutes of focused practice\n\n_\"Success is the sum of small efforts repeated day in and day out.\"_\n\n🌐 visionedu.online`;
                    break;
                case "NEW_MATERIAL":
                    messageText = `📖 *Vision Education - New Material*\n\nHi ${studentName}! 🎉\n\nA new study resource *${req.body.title || "New Resource"}* is now available for ${req.body.subject || "your subject"}.\n\nLog in now to access it!\n\n🌐 visionedu.online`;
                    break;
                case "EXAM_ALERT":
                    messageText = `🚨 *Vision Education - WASSCE 2026 Alert*\n\nHi ${studentName}!\n\nImportant exam update! Make sure you're on track.\n\n📝 Take a practice mock today\n📊 Review your dashboard\n🎯 Focus on weak areas\n\n🌐 visionedu.online`;
                    break;
                case "PERFORMANCE_UPDATE":
                    messageText = `🏆 *Vision Education*\n\nHi ${studentName}! Great progress! Check your latest scores on the dashboard.\n\n🌐 visionedu.online`;
                    break;
                default:
                    messageText = `📢 *Vision Education*\n\nHi ${studentName}! There's an update for you. Log in to check.\n\n🌐 visionedu.online`;
            }
        }

        const textPayload = {
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "text",
            text: { preview_url: true, body: messageText }
        };

        console.log(`[Meta WA] Attempt 2: Free-form text to ${recipientPhone}`);

        const textRes = await fetch(fbUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(textPayload)
        });
        const textData = await textRes.json();

        if (textRes.ok) {
            console.log("[Meta WA] Text message sent. ID:", textData.messages?.[0]?.id);
            return res.status(200).json({ success: true, messageId: textData.messages?.[0]?.id, method: "text" });
        }

        // Both failed — return helpful error
        const textErrCode = textData?.error?.code;
        console.error("[Meta WA] Both attempts failed. Template:", templateErrMsg, "| Text:", textData?.error?.message);

        // ── Attempt 3: Absolute Fallback (hello_world) ──
        // If the number hasn't messaged within 24hrs AND custom template isn't approved,
        // we can try the Meta-default 'hello_world' template just to verify connectivity.
        if (textErrCode === 131047) {
            console.log(`[Meta WA] Attempt 3: 'hello_world' fallback to ${recipientPhone}`);
            const helloPayload = {
                messaging_product: "whatsapp",
                to: recipientPhone,
                type: "template",
                template: { name: "hello_world", language: { code: "en_US" } }
            };
            const helloRes = await fetch(fbUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(helloPayload)
            });
            const helloData = await helloRes.json();
            if (helloRes.ok) {
                console.log("[Meta WA] hello_world sent successfully. ID:", helloData.messages?.[0]?.id);
                return res.status(200).json({ 
                    success: true, 
                    messageId: helloData.messages?.[0]?.id, 
                    method: "hello_world_fallback",
                    warning: "Custom template not approved yet. Sent Meta's default 'hello_world' testing template."
                });
            }
            console.error("[Meta WA] hello_world also failed:", helloData.error?.message);
            // If hello_world fails, it's a test number sync issue
            if (helloData.error?.code === 131030 || helloData.error?.code === 131026) {
                 return res.status(400).json({ 
                    success: false, 
                    error: "Recipient phone number not allowed. If you're using a Meta Developer Test Number, you must verify the recipient's phone number exactly in the Meta App Dashboard first." 
                });
            }
        }

        let userError = textData?.error?.message || templateErrMsg || "Message delivery failed.";
        
        if (templateErrCode === 131047 || textErrCode === 131047) {
            userError = `Message could not be delivered. The student needs to send a message to your WhatsApp Business number first, OR create an approved template named '${VISION_TEMPLATE}' in Meta Business Manager.`;
        } else if (templateErrCode === 131058 || templateErrMsg.includes("131058")) {
            userError = `Template '${templateToUse}' is not approved yet. Visit your API endpoint with ?action=create-default to auto-create it, or create it manually in Meta Business Manager as a UTILITY template named '${VISION_TEMPLATE}'.`;
        }

        return res.status(400).json({ success: false, error: userError });

    } catch (error) {
        console.error("[Meta WhatsApp Gateway Failure]:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Auto-create the default Vision Education template in Meta Business Manager.
 * UTILITY templates with simple text typically get auto-approved in minutes.
 */
async function createDefaultTemplate(accessToken, businessId, res) {
    try {
        const url = `https://graph.facebook.com/v21.0/${businessId}/message_templates`;
        
        const templatePayload = {
            name: VISION_TEMPLATE,
            category: "UTILITY",
            language: "en_US",
            components: [
                {
                    type: "HEADER",
                    format: "TEXT",
                    text: "Vision Education"
                },
                {
                    type: "BODY",
                    text: "Hi {{1}}! 📚 You have updates on Vision Education. Log in to check your latest mock results, study materials, and practice questions. Keep up the great work! 🌟\n\nvisionedu.online",
                    example: {
                        body_text: [["Student"]]
                    }
                },
                {
                    type: "FOOTER",
                    text: "Vision Education - WASSCE 2026 Prep"
                }
            ]
        };

        console.log("[Meta WA] Creating template:", VISION_TEMPLATE);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(templatePayload)
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ 
                success: true, 
                message: `Template '${VISION_TEMPLATE}' submitted for approval. UTILITY templates are usually auto-approved within minutes.`,
                templateId: data.id,
                status: data.status || "PENDING"
            });
        }

        // Template might already exist
        if (data?.error?.code === 2388023 || (data?.error?.message || "").includes("already exists")) {
            return res.status(200).json({ 
                success: true, 
                message: `Template '${VISION_TEMPLATE}' already exists. Check its approval status.`,
                alreadyExists: true
            });
        }

        throw new Error(data?.error?.message || "Failed to create template");

    } catch (error) {
        console.error("[Meta WA] Template creation failed:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
