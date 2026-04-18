/**
 * Vision Education - WhatsApp Messaging Service
 * 
 * A frontend utility to interact with the Meta WhatsApp Business API gateway.
 * Used for study reminders, exam alerts, and performance updates.
 */

const WhatsAppService = {
    /**
     * Sends a WhatsApp notification using a template.
     * @param {Object} options 
     * @param {string} options.phone - Recipient's phone number (e.g., 233244123456)
     * @param {string} options.type - Type of notification (REMINDER, EXAM_ALERT, NEW_MATERIAL, etc.)
     * @param {string} options.name - Recipient's name for variable substitution
     * @param {string} [options.templateName] - Optional custom template name
     * @param {string} [options.lang] - Optional language code (defaults to en_US)
     * @param {Object} [options.extraParams] - Any additional data needed for the specific template
     */
    async sendNotification({ phone, type, name, templateName, lang, ...extraParams }) {
        try {
            const response = await fetch('/api/whatsapp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone,
                    type,
                    name,
                    templateName,
                    lang,
                    ...extraParams
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to send WhatsApp notification');
            }

            console.log(`[WhatsApp Service] Notification sent successfully: ${type}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('[WhatsApp Service] Error sending notification:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Checks the approval status of a Meta WhatsApp template.
     * @param {string} templateName 
     */
    async checkTemplateStatus(templateName) {
        try {
            const response = await fetch(`/api/whatsapp?templateName=${encodeURIComponent(templateName)}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to check template status');
            }

            return result;
        } catch (error) {
            console.error('[WhatsApp Service] Error checking template status:', error);
            return { success: false, error: error.message };
        }
    }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.WhatsAppService = WhatsAppService;
}
