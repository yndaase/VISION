/**
 * Quick script to send a test WhatsApp notification to +233267208336
 * Run: node scripts/send-test.js
 */

async function sendTest() {
    const phone = '+233267208336';
    const name = 'Yaw';

    console.log(`[Test] Sending WhatsApp notification to ${phone}...`);

    try {
        // Use the production API endpoint
        const response = await fetch('https://visionedu.online/api/whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: phone,
                type: 'REMINDER',
                name: name,
                templateName: 'study_reminder'
            })
        });

        const result = await response.json();
        console.log('Response:', result);

        if (result.success) {
            console.log(`✅ Message sent! ID: ${result.messageId}`);
        } else {
            console.error(`❌ Error: ${result.error}`);
            if (result.detail) console.error(`Detail: ${result.detail}`);
        }
    } catch (error) {
        console.error('Network error:', error.message);
    }
}

sendTest();
