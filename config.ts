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

    // Call Configuration
    call: {
        // Default timeout for calls (in seconds)
        timeout: 30,
        // Default recording setting
        record: false,
        // Default voice for text-to-speech
        voice: 'alice',
        // Default language for text-to-speech
        language: 'en-US'
    }
};

// Validation function to check if Twilio config is complete
export const validateTwilioConfig = (): boolean => {
    const { accountSid, authToken, phoneNumber } = config.twilio;
    return !!(accountSid && authToken && phoneNumber);
};