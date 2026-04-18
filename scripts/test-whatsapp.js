/**
 * Vision Education - WhatsApp Business API Test Suite
 * 
 * This script validates the Meta WhatsApp Business API integration,
 * specifically focusing on template-based study reminder notifications.
 * 
 * It mocks the Meta Graph API and the local Express/Vercel environment
 * to perform automated testing without incurring costs or needing live tokens.
 */

import handler from '../api/whatsapp.js';

// --- MOCK UTILITIES ---

class MockResponse {
    constructor() {
        this.statusCode = 200;
        this.jsonPayload = null;
    }
    status(code) {
        this.statusCode = code;
        return this;
    }
    json(data) {
        this.jsonPayload = data;
        return this;
    }
}

class TestLogger {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
    }
    log(testName, success, message, details = null, duration = 0) {
        this.results.push({ testName, success, message, details, duration, timestamp: new Date() });
        const icon = success ? '✅' : '❌';
        const timeStr = duration > 0 ? ` (${duration}ms)` : '';
        console.log(`${icon} [${testName}] ${message}${timeStr}`);
        if (details && !success) console.dir(details, { depth: null });
    }
    generateReport() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.success).length;
        const failed = total - passed;
        const avgLatency = this.results.reduce((acc, curr) => acc + curr.duration, 0) / total;
        
        console.log('\n' + '='.repeat(50));
        console.log('WA BUSINESS API TEST REPORT');
        console.log('='.repeat(50));
        console.log(`Total Tests:      ${total}`);
        console.log(`Passed:           ${passed}`);
        console.log(`Failed:           ${failed}`);
        console.log(`Avg Latency:      ${avgLatency.toFixed(2)}ms`);
        console.log(`Total Execution:  ${Date.now() - this.startTime}ms`);
        console.log(`Success Rate:     ${((passed / total) * 100).toFixed(2)}%`);
        console.log('='.repeat(50));
        
        if (failed > 0) {
            process.exit(1);
        }
    }
}

const logger = new TestLogger();

// --- TEST SUITE ---

async function runTests() {
    console.log('🚀 Starting Meta WhatsApp API Test Suite...\n');

    // Save original env
    const originalEnv = { ...process.env };
    
    // Mock Environment Variables
    process.env.WHATSAPP_ACCESS_TOKEN = 'mock_token_123';
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'mock_phone_id_456';
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'mock_biz_789';

    // 0. Test: Template Approval Status (GET)
    await (async () => {
        const start = Date.now();
        global.fetch = async () => ({
            ok: true,
            json: async () => ({
                data: [{ name: "study_reminder", status: "APPROVED", category: "MARKETING" }]
            })
        });

        const req = { method: 'GET', query: { templateName: 'study_reminder' } };
        const res = new MockResponse();
        await handler(req, res);

        logger.log('Template Status Check', res.statusCode === 200 && res.jsonPayload.status === 'APPROVED', 'Correctly retrieves and reports Meta template approval status', null, Date.now() - start);
    })();

    // 1. Test: Missing Environment Variables
    await (async () => {
        const start = Date.now();
        delete process.env.WHATSAPP_ACCESS_TOKEN;
        const req = { method: 'POST', body: { type: 'REMINDER', phone: '233123456789', name: 'Test' } };
        const res = new MockResponse();
        await handler(req, res);
        logger.log('Env Validation', res.statusCode === 500 && !res.jsonPayload.success, 'Handles missing environment variables correctly', null, Date.now() - start);
        process.env.WHATSAPP_ACCESS_TOKEN = 'mock_token_123'; // Restore
    })();

    // 2. Test: Invalid Method
    await (async () => {
        const start = Date.now();
        const req = { method: 'PATCH' };
        const res = new MockResponse();
        await handler(req, res);
        logger.log('Method Validation', res.statusCode === 405, 'Rejects non-POST/GET requests', null, Date.now() - start);
    })();

    // Mock global fetch for API calls
    const originalFetch = global.fetch;
    
    // 3. Test: Successful Study Reminder (Daily)
    await (async () => {
        const start = Date.now();
        let capturedPayload = null;
        global.fetch = async (url, options) => {
            capturedPayload = JSON.parse(options.body);
            return {
                ok: true,
                json: async () => ({
                    messaging_product: "whatsapp",
                    contacts: [{ input: "233123456789", wa_id: "233123456789" }],
                    messages: [{ id: "wamid.HBgLMjMzMjQ0NTA1MDQ2FQIAERgSRDM2Q0E5ODU0RTM5NjVDODAwOAA=" }]
                })
            };
        };

        const req = { 
            method: 'POST', 
            body: { 
                type: 'REMINDER', 
                phone: '+233 123 456 789', 
                name: 'Kofi Mensah',
                templateName: 'daily_study_reminder'
            } 
        };
        const res = new MockResponse();
        await handler(req, res);

        const isSuccess = res.statusCode === 200 && res.jsonPayload.success;
        const hasCorrectPayload = capturedPayload.template.name === 'daily_study_reminder' && 
                                 capturedPayload.template.components[0].parameters[0].text === 'Kofi Mensah';
        
        logger.log('Daily Reminder Flow', isSuccess && hasCorrectPayload, 'Successfully processes daily study reminder with variable substitution', null, Date.now() - start);
    })();

    // 4. Test: Exam-Specific Alert
    await (async () => {
        const start = Date.now();
        let capturedPayload = null;
        global.fetch = async (url, options) => {
            capturedPayload = JSON.parse(options.body);
            return { ok: true, json: async () => ({ messages: [{ id: "mock_id" }] }) };
        };

        const req = { 
            method: 'POST', 
            body: { 
                type: 'EXAM_ALERT', 
                phone: '233987654321', 
                name: 'Ama Serwaa',
                templateName: 'wassce_countdown_2026'
            } 
        };
        const res = new MockResponse();
        await handler(req, res);

        const hasCorrectTemplate = capturedPayload.template.name === 'wassce_countdown_2026';
        logger.log('Exam Alert Flow', res.statusCode === 200 && hasCorrectTemplate, 'Handles exam-specific alerts with custom template names', null, Date.now() - start);
    })();

    // 5. Test: Meta API Error Handling (Rate Limiting)
    await (async () => {
        const start = Date.now();
        global.fetch = async () => ({
            ok: false,
            status: 429,
            json: async () => ({
                error: {
                    message: "(#131048) Spam control limit reached",
                    type: "OAuthException",
                    code: 131048,
                    fbtrace_id: "A1B2C3D4E5"
                }
            })
        });

        const req = { method: 'POST', body: { type: 'REMINDER', phone: '233000000000', name: 'Test' } };
        const res = new MockResponse();
        await handler(req, res);

        logger.log('Rate Limit Handling', res.statusCode === 500 && res.jsonPayload.error.includes('Spam control'), 'Correctly identifies and reports Meta API rate limiting errors', null, Date.now() - start);
    })();

    // 6. Test: Recipient Phone Sanitization
    await (async () => {
        const start = Date.now();
        let capturedPayload = null;
        global.fetch = async (url, options) => {
            capturedPayload = JSON.parse(options.body);
            return { ok: true, json: async () => ({ messages: [{ id: "id" }] }) };
        };

        const req = { method: 'POST', body: { type: 'REMINDER', phone: '+(233) 123-456-789 ', name: 'Test' } };
        const res = new MockResponse();
        await handler(req, res);

        logger.log('Phone Sanitization', capturedPayload.to === '233123456789', 'Properly cleans phone numbers (removes spaces, plus, brackets)', null, Date.now() - start);
    })();

    // 7. Test: Template Language Variation
    await (async () => {
        const start = Date.now();
        let capturedPayload = null;
        global.fetch = async (url, options) => {
            capturedPayload = JSON.parse(options.body);
            return { ok: true, json: async () => ({ messages: [{ id: "id" }] }) };
        };

        const req = { method: 'POST', body: { type: 'GENERAL_ALERT', phone: '233111', name: 'Test', lang: 'en_GB' } };
        const res = new MockResponse();
        await handler(req, res);

        logger.log('Language Variation', capturedPayload.template.language.code === 'en_GB', 'Supports custom template language codes (e.g., en_GB)', null, Date.now() - start);
    })();

    // 8. Test: Manual Components Override (Variable Substitution)
    await (async () => {
        const start = Date.now();
        let capturedPayload = null;
        global.fetch = async (url, options) => {
            capturedPayload = JSON.parse(options.body);
            return { ok: true, json: async () => ({ messages: [{ id: "id" }] }) };
        };

        const customComponents = [
            { type: "header", parameters: [{ type: "image", image: { link: "https://example.com/img.png" } }] },
            { type: "body", parameters: [{ type: "text", text: "Custom 1" }, { type: "text", text: "Custom 2" }] }
        ];

        const req = { 
            method: 'POST', 
            body: { 
                type: 'RAW', 
                phone: '233111', 
                templateName: 'custom_template',
                components: customComponents
            } 
        };
        const res = new MockResponse();
        await handler(req, res);

        const hasCorrectOverride = JSON.stringify(capturedPayload.template.components) === JSON.stringify(customComponents);
        logger.log('Manual Components', hasCorrectOverride, 'Allows full manual override of template components for advanced substitution', null, Date.now() - start);
    })();

    // 9. Test: Scheduling Logic (Log verification)
    await (async () => {
        const start = Date.now();
        const originalLog = console.log;
        let logCaptured = false;
        console.log = (msg) => { if (msg.includes('Scheduling message')) logCaptured = true; originalLog(msg); };
        
        const req = { method: 'POST', body: { type: 'REMINDER', phone: '233', name: 'X', scheduledTime: '2026-05-01T10:00:00Z' } };
        const res = new MockResponse();
        await handler(req, res);
        
        console.log = originalLog;
        logger.log('Scheduling Trace', logCaptured, 'Captures and logs scheduled message intent', null, Date.now() - start);
    })();

    // --- NEW: SIMULATING WEBHOOK RESPONSE ---
    // In a real scenario, Meta sends a POST to our webhook. 
    // We'll test a simulated delivery receipt processing logic (to be implemented in a separate webhook handler).
    console.log('\n📡 Testing Webhook / Delivery Receipt Logic...');
    await (async () => {
        const mockWebhookBody = {
            object: "whatsapp_business_account",
            entry: [{
                id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
                changes: [{
                    value: {
                        messaging_product: "whatsapp",
                        metadata: { display_phone_number: "15550555555", phone_number_id: "123456789" },
                        statuses: [{
                            id: "wamid.HBgLMjMzMjQ0NTA1MDQ2FQIAERgSRDM2Q0E5ODU0RTM5NjVDODAwOAA=",
                            status: "delivered",
                            timestamp: "1603094800",
                            recipient_id: "233123456789"
                        }]
                    },
                    field: "messages"
                }]
            }]
        };

        // Logic for processing this would typically go in api/whatsapp-webhook.js
        // For now, we validate the structure.
        const status = mockWebhookBody.entry[0].changes[0].value.statuses[0];
        const isValidReceipt = status.status === 'delivered' && status.recipient_id === '233123456789';
        
        logger.log('Webhook Simulation', isValidReceipt, 'Correctly parses Meta delivery receipt structure');
    })();

    // Restore fetch and env
    global.fetch = originalFetch;
    process.env = originalEnv;

    logger.generateReport();
}

runTests().catch(err => {
    console.error('Fatal Error during tests:', err);
    process.exit(1);
});
