import express from 'express';
import { google } from 'googleapis';
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

// Google OAuth authorization URL generator
app.get('/google/auth', (req, res) => {
    try {
        const auth = new google.auth.OAuth2(
            config.google.clientId,
            config.google.clientSecret,
            config.google.redirectUri
        );

        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];

        const authUrl = auth.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent' // Force consent screen to ensure refresh token
        });

        res.json({
            success: true,
            authUrl: authUrl,
            message: 'Click the URL below to authorize your application:',
            instructions: [
                '1. Click the authUrl to open Google authorization',
                '2. Sign in with your Google account',
                '3. Grant calendar permissions',
                '4. You will be redirected back with a refresh token'
            ]
        });
    } catch (error) {
        console.error('❌ Error generating auth URL:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate authorization URL',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Google OAuth callback endpoint
app.get('/google/auth/callback', async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).send('Authorization code not provided');
        }

        // Create OAuth2 client
        const auth = new google.auth.OAuth2(
            config.google.clientId,
            config.google.clientSecret,
            config.google.redirectUri
        );

        // Exchange authorization code for tokens
        const { tokens } = await auth.getToken(code as string);

        console.log('✅ Successfully obtained tokens:');
        console.log('Access Token:', tokens.access_token ? '✅ Present' : '❌ Missing');
        console.log('Refresh Token:', tokens.refresh_token ? '✅ Present' : '❌ Missing');
        console.log('Expires In:', (tokens as any).expires_in ? `${(tokens as any).expires_in} seconds` : '❌ Missing');

        if (tokens.refresh_token) {
            console.log('\n🔑 REFRESH TOKEN (Copy this to your .env file):');
            console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
            console.log('\n⚠️  Keep this token secure and never commit it to version control!');
        }

        res.send(`
            <html>
                <head><title>OAuth Success</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
                    <h1 style="color: #34A853;">✅ OAuth Authorization Successful!</h1>
                    <p>Your application has been successfully authorized to access Google Calendar.</p>
                    
                    ${tokens.refresh_token ? `
                    <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 20px 0;">
                        <h3>🔑 Refresh Token Generated</h3>
                        <p><strong>Copy this to your .env file:</strong></p>
                        <code style="background: #e9ecef; padding: 10px; display: block; border-radius: 3px; word-break: break-all;">
                            GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
                        </code>
                        <p style="color: #dc3545; font-size: 14px;">
                            ⚠️ Keep this token secure and never commit it to version control!
                        </p>
                    </div>
                    ` : `
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                        <h3>⚠️ No Refresh Token</h3>
                        <p>No refresh token was provided. This might be because:</p>
                        <ul>
                            <li>You've already authorized this application before</li>
                            <li>The OAuth consent screen is not configured for offline access</li>
                        </ul>
                        <p>If you need a new refresh token, try revoking access and re-authorizing.</p>
                    </div>
                    `}
                    
                    <p>You can now close this window and return to your application.</p>
                </body>
            </html>
        `);

    } catch (error) {
        console.error('❌ OAuth callback error:', error);
        res.status(500).send(`
            <html>
                <head><title>OAuth Error</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
                    <h1 style="color: #dc3545;">❌ OAuth Authorization Failed</h1>
                    <p>An error occurred during the authorization process:</p>
                    <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto;">${error instanceof Error ? error.message : 'Unknown error'}</pre>
                    <p>Please try again or check your configuration.</p>
                </body>
            </html>
        `);
    }
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
