import twilio from 'twilio';
import { config, validateTwilioConfig } from '../../config';
import { voiceWebhookHandler } from './VoiceWebhookHandler';

export interface CallOptions {
    to: string;
    message?: string;
    timeout?: number;
    record?: boolean;
    statusCallback?: string;
}

export interface CallResult {
    success: boolean;
    callSid?: string;
    error?: string;
    status?: string;
}

// Internal state for Twilio client
let twilioClient: twilio.Twilio | null = null;
let isConfigured = false;

/**
 * Initialize the Twilio service with configuration
 */
const initializeTwilioService = (): void => {
    isConfigured = validateTwilioConfig();

    if (isConfigured) {
        twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
    } else {
        twilioClient = null;
        console.warn(
            '⚠️ Twilio configuration incomplete. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
        );
    }
};

/**
 * Get the Twilio client instance, initializing if needed
 */
const getTwilioClient = (): twilio.Twilio | null => {
    if (twilioClient === null && !isConfigured) {
        initializeTwilioService();
    }
    return twilioClient;
};

/**
 * Normalize phone number to E.164 format (default +91 for India)
 */
const formatPhoneNumber = (phoneNumber: string): string | null => {
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.length === 10) {
        return `+91${cleaned}`; // Assume Indian number if 10 digits
    }
    if (cleaned.length > 10 && !phoneNumber.startsWith('+')) {
        return `+${cleaned}`;
    }
    if (phoneNumber.startsWith('+')) {
        return phoneNumber;
    }

    return null;
};

/**
 * Create TwiML for voice response
 */
// export const createTwiML = (message: string, additionalActions?: string): string => {
//     return `<?xml version="1.0" encoding="UTF-8"?>
// <Response>
//   <Say voice="${config.call.voice}" language="${config.call.language}">${message}</Say>
//   ${additionalActions || ''}
// </Response>`;
// };
// const generateTwiMLUrl = (message: string): string => {
//     // For production, you'd want to host your own TwiML endpoint
//     // For now, we'll use Twilio's hosted TwiML with Say verb
//     const encodedMessage = encodeURIComponent(message);
//     return `http://twimlets.com/message?Message%5B0%5D=${encodedMessage}&Voice=${config.call.voice}`;
// };

/**
 * Make a call with Twilio
 */
export const makeCall = async (options: CallOptions): Promise<CallResult> => {
    const client = getTwilioClient();

    if (!isConfigured || !client) {
        return { success: false, error: 'Twilio service not properly configured' };
    }

    try {
        const formattedNumber = formatPhoneNumber(options.to);
        if (!formattedNumber) {
            return { success: false, error: 'Invalid phone number format' };
        }

        const message = options.message || 'Hello! You have a meeting request. Please stay on the line to speak with our AI assistant.';

        let call;

        // Store the message first, then create the call
        if (options.message) {
            // Generate a temporary call SID to store the message
            const tempCallSid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            voiceWebhookHandler.setCallMessage(tempCallSid, options.message);

            // Create webhook URL with the message as a parameter
            const webhookUrl = `${config.webhook.baseUrl}/ai-voice/placeholder?message=${encodeURIComponent(options.message)}&tempSid=${tempCallSid}`;

            call = await client.calls.create({
                to: formattedNumber,
                from: config.twilio.phoneNumber,
                url: webhookUrl,
                timeout: options.timeout || config.call.timeout,
                record: options.record ?? config.call.record,
                statusCallback: options.statusCallback,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                statusCallbackMethod: 'POST'
            });

            // Now store the message with the actual call SID
            voiceWebhookHandler.setCallMessage(call.sid, options.message);
            // Remove the temporary entry
            voiceWebhookHandler.removeCallMessage(tempCallSid);
        } else {
            const webhookUrl = `${config.webhook.baseUrl}/ai-voice/placeholder`;

            call = await client.calls.create({
                to: formattedNumber,
                from: config.twilio.phoneNumber,
                url: webhookUrl,
                timeout: options.timeout || config.call.timeout,
                record: options.record ?? config.call.record,
                statusCallback: options.statusCallback,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                statusCallbackMethod: 'POST'
            });
        }
        console.log(`✅ Call initiated successfully. SID: ${call.sid}`);

        return { success: true, callSid: call.sid, status: call.status };
    } catch (error) {
        console.error('❌ Error making call:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

/**
 * Fetch call status by SID
 */
export const getCallStatus = async (callSid: string) => {
    const client = getTwilioClient();
    if (!isConfigured || !client) {
        throw new Error('Twilio service not properly configured');
    }

    try {
        const call = await client.calls(callSid).fetch();
        return {
            sid: call.sid,
            status: call.status,
            duration: call.duration,
            direction: call.direction,
            startTime: call.startTime,
            endTime: call.endTime
        };
    } catch (error) {
        console.error('❌ Error fetching call status:', error);
        throw error;
    }
};

/**
 * Terminate an active call
 */
export const endCall = async (
    callSid: string
): Promise<{ success: boolean; error?: string }> => {
    const client = getTwilioClient();
    if (!isConfigured || !client) {
        return { success: false, error: 'Twilio service not properly configured' };
    }

    try {
        await client.calls(callSid).update({ status: 'completed' });
        console.log(`✅ Call ${callSid} terminated successfully`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error ending call:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

/**
 * Check if Twilio service is ready
 */
export const isReady = (): boolean => {
    if (twilioClient === null && !isConfigured) {
        initializeTwilioService();
    }
    return isConfigured;
};

// Initialize on load
initializeTwilioService();
