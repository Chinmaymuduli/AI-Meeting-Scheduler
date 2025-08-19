import twilio from 'twilio';
import { config, validateTwilioConfig } from '../../config';

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
        console.warn('⚠️ Twilio configuration incomplete. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
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
 * Format phone number to E.164 format
 * @param phoneNumber Raw phone number
 * @returns Formatted phone number or null if invalid
 */
const formatPhoneNumber = (phoneNumber: string): string | null => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If it starts with country code, use as is
    if (cleaned.length >= 10 && cleaned.length <= 15) {
        //write for india also
        if (cleaned.length === 10 && !cleaned.startsWith('91')) {
            return `+91${cleaned}`; // Assume Indian number if 10 digits
        }
        // Add + if not present and assume it needs country code
        // if (cleaned.length === 10 && !cleaned.startsWith('1')) {
        //     return `+1${cleaned}`; // Assume US number if 10 digits
        // }
        if (cleaned.length > 10 && !phoneNumber.startsWith('+')) {
            return `+${cleaned}`;
        }
        if (phoneNumber.startsWith('+')) {
            return phoneNumber;
        }
        return `+${cleaned}`;
    }

    return null;
};

/**
 * Generate TwiML URL for the call message
 * @param message Message to speak during the call
 * @returns TwiML URL string
 */
const generateTwiMLUrl = (message: string): string => {
    // For production, you'd want to host your own TwiML endpoint
    // For now, we'll use Twilio's hosted TwiML with Say verb
    const encodedMessage = encodeURIComponent(message);
    return `http://twimlets.com/message?Message%5B0%5D=${encodedMessage}&Voice=${config.call.voice}`;
};

/**
 * Make an automated call to a phone number
 * @param options Call configuration options
 * @returns Promise<CallResult>
 */
export const makeCall = async (options: CallOptions): Promise<CallResult> => {
    const client = getTwilioClient();

    if (!isConfigured || !client) {
        return {
            success: false,
            error: 'Twilio service not properly configured'
        };
    }

    try {
        // Format phone number to E.164 format if not already
        const formattedNumber = formatPhoneNumber(options.to);

        if (!formattedNumber) {
            return {
                success: false,
                error: 'Invalid phone number format'
            };
        }

        // Default message for the call
        const message = options.message || 'Hello! You have a meeting request. Please stay on the line to speak with our AI assistant.';

        // Create TwiML for the call
        const twimlUrl = generateTwiMLUrl(message);

        console.log(`📞 Initiating call to ${formattedNumber}...`);

        const call = await client.calls.create({
            to: formattedNumber,
            from: config.twilio.phoneNumber,
            url: twimlUrl,
            timeout: options.timeout || config.call.timeout,
            record: options.record || config.call.record,
            statusCallback: options.statusCallback,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallbackMethod: 'POST'
        });

        console.log(`✅ Call initiated successfully. SID: ${call.sid}`);

        return {
            success: true,
            callSid: call.sid,
            status: call.status
        };

    } catch (error) {
        console.error('❌ Error making call:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

/**
 * Get call status by SID
 * @param callSid The call SID to check
 * @returns Promise with call status
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
        console.error('Error fetching call status:', error);
        throw error;
    }
};

/**
 * Create a custom TwiML response for more advanced call flows
 * @param message Message to speak
 * @param additionalActions Additional TwiML actions
 * @returns TwiML string
 */
export const createTwiML = (message: string, additionalActions?: string): string => {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="${config.call.voice}" language="${config.call.language}">${message}</Say>
    ${additionalActions || ''}
</Response>`;

    return twiml;
};

/**
 * Check if Twilio service is properly configured
 * @returns boolean indicating if service is ready
 */
export const isReady = (): boolean => {
    if (twilioClient === null && !isConfigured) {
        initializeTwilioService();
    }
    return isConfigured;
};

// Initialize the service when the module loads
initializeTwilioService();