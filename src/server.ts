import express from 'express';
import { config } from '../config';
import {
    handleIncomingCall,
    handleSpeechInput,
    handleCallStatus,
    getActiveSessionsCount
} from './Services/VoiceWebhookHandler';
import { deepgramService } from './Services/DeepgramService';
import { isReady as isTwilioReady } from './Services/TwilioService';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    const services = {
        twilio: isTwilioReady(),
        deepgram: deepgramService.isReady(),
        webhook: true
    };

    const allReady = Object.values(services).every(ready => ready);

    res.json({
        status: allReady ? 'healthy' : 'degraded',
        services,
        timestamp: new Date().toISOString(),
        activeSessions: getActiveSessionsCount()
    });
});

// Voice AI Call Flow Webhook Endpoints
// The flow works as follows:
// 1. Caller speaks → Twilio streams audio → Deepgram transcribes
// 2. Transcript → Node server → AI generates a text reply
// 3. Next Twilio <Say> block plays the AI reply to the caller
// 4. Twilio <Redirect> loops the flow → user can speak again

app.post('/webhook/speech', async (req, res) => {
    await handleSpeechInput(req, res);
});

app.post('/webhook/status', async (req, res) => {
    await handleCallStatus(req, res);
});

// Twilio webhook endpoints matching your configuration
app.post('/ai-voice/placeholder', async (req, res) => {
    await handleIncomingCall(req, res);
});

app.post('/call-status/placeholder', async (req, res) => {
    await handleCallStatus(req, res);
});

// Test endpoint to verify TwiML generation
app.get('/test/twiml', (req, res) => {
    const testTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="${config.call.voice}" language="${config.call.language}">This is a test message.</Say>
    <Gather input="speech" action="/webhook/speech" method="POST" 
            speechTimeout="${config.call.speech.speechTimeout}" language="${config.call.speech.language}" 
            speechModel="${config.call.speech.model}" enhanced="${config.call.speech.enhanced}"
            timeout="${config.call.speech.timeout}">
    </Gather>
    <Say voice="${config.call.voice}" language="${config.call.language}">I didn't hear anything. Let me try again.</Say>
    <Gather input="speech" action="/webhook/speech" method="POST" 
            speechTimeout="${config.call.speech.speechTimeout}" language="${config.call.speech.language}" 
            speechModel="${config.call.speech.model}" enhanced="${config.call.speech.enhanced}"
            timeout="${config.call.speech.timeout}">
        <Say voice="${config.call.voice}" language="${config.call.language}">Please speak now.</Say>
    </Gather>
    <Say voice="${config.call.voice}" language="${config.call.language}">Thank you for calling. Goodbye!</Say>
    <Hangup/>
</Response>`;

    res.type('text/xml');
    res.send(testTwiml);
});

// Start server
const PORT = config.webhook.port;

app.listen(PORT, () => {
    console.log(`🚀 Voice AI Webhook Server running on port ${PORT}`);
    console.log(`📞 Twilio webhook endpoints:`);
    console.log(`   - Voice: ${config.webhook.baseUrl}/ai-voice/placeholder`);
    console.log(`   - Speech: ${config.webhook.baseUrl}/webhook/speech`);
    console.log(`   - Status: ${config.webhook.baseUrl}/webhook/status`);
    console.log(`🔧 Health check: ${config.webhook.baseUrl}/health`);

    // Check service status
    console.log(`\n📊 Service Status:`);
    console.log(`   - Twilio: ${isTwilioReady() ? '✅ Ready' : '❌ Not configured'}`);
    console.log(`   - Deepgram AI: ${deepgramService.isReady() ? '✅ Ready' : '❌ Not configured'}`);

    if (!isTwilioReady()) {
        console.log(`\n⚠️  To enable Twilio calls, set these environment variables:`);
        console.log(`   - TWILIO_ACCOUNT_SID`);
        console.log(`   - TWILIO_AUTH_TOKEN`);
        console.log(`   - TWILIO_PHONE_NUMBER`);
    }

    if (!deepgramService.isReady()) {
        console.log(`\n⚠️  To enable Deepgram AI conversations, set this environment variable:`);
        console.log(`   - DEEPGRAM_API_KEY`);
    }
});

export default app;
