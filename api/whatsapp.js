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

    const { email, type, phone, name, templateName, lang, components, scheduledTime } = req.body;

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
        
        /**
         * META TEMPLATE SYSTEM
         * Official notifications MUST use approved templates.
         */
        const normalizedTemplateName = (templateName || "").toString().trim() || "hello_world";
        const requestedLang = (lang || "").toString().trim();

        let payload = {
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "template",
            template: {
                name: normalizedTemplateName, // Default placeholder
                language: { code: requestedLang || "en_US" }
            }
        };

        // Support for scheduled messages (if platform supports it)
        // Note: Meta doesn't have a direct 'scheduledTime' in the /messages payload for Cloud API, 
        // it's usually handled by a separate scheduler or a business service provider.
        // However, we can track it for our internal logs.
        if (scheduledTime) {
            console.log(`[Meta WA] Scheduling message for ${scheduledTime}`);
            // This would normally be queued in a database or a worker.
        }

        // Custom Logic for specific types or raw components override
        if (components) {
            // Full manual override for advanced use cases
            payload.template.components = components;
        } else if (type === "REMINDER") {
            // We expect an approved template called 'study_reminder' with 1 parameter (name)
            payload.template.name = normalizedTemplateName || "study_reminder";
            payload.template.components = [
                {
                    type: "body",
                    parameters: [ { type: "text", text: name || "Student" } ]
                }
            ];
        } else if (type === "NEW_MATERIAL") {
            // We expect an approved template called 'new_material_alert' with 3 parameters: name, title, subject
            payload.template.name = templateName || "new_material_alert";
            payload.template.components = [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: name || "Student" },
                        { type: "text", text: req.body.title || "New Resource" },
                        { type: "text", text: req.body.subject || "Mission Prep" }
                    ]
                }
            ];
        } else if (type === "EXAM_ALERT") {
             payload.template.name = templateName || "exam_countdown_2026";
             payload.template.components = [{
                 type: "body",
                 parameters: [ { type: "text", text: name || "Student" } ]
             }];
        } else if (type === "PERFORMANCE_UPDATE") {
             payload.template.name = templateName || "performance_milestone";
             payload.template.components = [{
                 type: "body",
                 parameters: [ { type: "text", text: name || "Student" } ]
             }];
        } else if (type === "GENERAL_ALERT") {
             payload.template.name = templateName || "general_system_update";
             payload.template.components = [{
                 type: "body",
                 parameters: [ { type: "text", text: name || "Student" } ]
             }];
        }

        const fbUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
        
        console.log(`[Meta WA] Routing to ${recipientPhone} via ${fbUrl}`);

        const sendOnce = async (langCode) => {
            const nextPayload = {
                ...payload,
                template: {
                    ...payload.template,
                    language: { code: langCode }
                }
            };

            const response = await fetch(fbUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nextPayload)
            });

            const data = await response.json();
            return { response, data, usedLang: langCode };
        };

        const primaryLang = requestedLang || "en_US";
        const fallbackLangs = requestedLang ? [] : ["en_GB", "en"];
        const attemptLangs = [primaryLang, ...fallbackLangs].filter((v, i, a) => v && a.indexOf(v) === i);

        let lastError = null;
        let lastData = null;
        let usedLang = primaryLang;

        for (const attemptLang of attemptLangs) {
            const { response, data, usedLang: langUsed } = await sendOnce(attemptLang);
            usedLang = langUsed;
            lastData = data;

            if (response.ok) {
                console.log("[Meta WA] Message dispatched successfully. ID:", data.messages?.[0]?.id);
                return res.status(200).json({ success: true, messageId: data.messages?.[0]?.id, lang: usedLang });
            }

            const errCode = data?.error?.code;
            const errMsg = data?.error?.message || "Meta API request failed.";
            console.error("[Meta API Error Response]:", data);

            lastError = new Error(errMsg);

            if (errCode !== 132001) {
                break;
            }
        }
        throw lastError || new Error(lastData?.error?.message || "Meta API request failed.");

    } catch (error) {
        console.error("[Meta WhatsApp Gateway Failure]:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
