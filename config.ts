import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
    // Twilio Configuration
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
        twimlAppSid: process.env.TWILIO_TWIML_APP_SID || '',
    },

    // Telegram Bot Configuration
    bot: {
        token: process.env.BOT_TOKEN || "8336245975:AAEoM8byQhs2I5xAyKJh_HwnSN3SlI04R9k",
    },

    // Deepgram Configuration
    deepgram: {
        apiKey: process.env.DEEPGRAM_API_KEY || '',
        model: process.env.DEEPGRAM_MODEL || 'nova-2',
        language: process.env.DEEPGRAM_LANGUAGE || 'en-US',
        smartFormat: true,
        punctuate: true,
        diarize: true,
        utterances: true,
        interimResults: false,
    },

    // Call Configuration
    call: {
        // Default timeout for calls (in seconds) - increased for longer conversations
        timeout: 300, // 5 minutes instead of 30 seconds
        // Default recording setting
        record: false,
        // Default voice for text-to-speech
        voice: 'Polly.Amy',
        // Default language for text-to-speech
        language: 'en-US',
        // Speech recognition settings
        speech: {
            timeout: 10,              // Speech timeout in seconds
            language: 'en-US',        // Speech recognition language
            model: 'phone_call',      // Speech recognition model
            enhanced: true,           // Use enhanced speech recognition
            speechTimeout: 'auto'     // Auto speech timeout
        }
    },

    // Webhook Configuration
    webhook: {
        port: parseInt(process.env.PORT || '8080'),
        baseUrl: process.env.BASE_URL || 'http://localhost:8080',
    },

    // Email Configuration
    email: {
        // SMTP Configuration
        smtp: {
            host: process.env.SMTP_HOST || '',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
        // Gmail Configuration (alternative to SMTP)
        gmail: {
            user: process.env.GMAIL_USER || '',
            appPassword: process.env.GMAIL_APP_PASSWORD || '',
        },
        // Email addresses
        fromEmail: process.env.FROM_EMAIL || 'mudulichinmay5@gmail.com',
        adminEmail: process.env.ADMIN_EMAIL || '',
        userEmail: process.env.USER_EMAIL || '',
    },

    // Google API Configuration
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/google/auth/callback',
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    }
};

// Validation function to check if Twilio config is complete
export const validateTwilioConfig = (): boolean => {
    const { accountSid, authToken, phoneNumber } = config.twilio;
    return !!(accountSid && authToken && phoneNumber);
};

// Validation function to check if Deepgram config is complete
export const validateDeepgramConfig = (): boolean => {
    const { apiKey } = config.deepgram;
    return !!apiKey;
}; 