import { createClient } from '@deepgram/sdk';
import { config, validateDeepgramConfig } from '../../config';
import { endCall } from './TwilioService';

export interface ConversationContext {
    agentPrompt: string;
    conversationHistory: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
    }>;
    isOutOfContext: boolean;
}

export interface ConversationResponse {
    response: string;
    isOutOfContext: boolean;
    confidence: number;
    shouldEndCall?: boolean;
}

export interface SpeechRecognitionResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
    language?: string;
}


let deepgramClient: any = null;
let isConfigured: boolean = false;

// Initialize Deepgram configuration
const initializeDeepgram = (): void => {
    isConfigured = validateDeepgramConfig();
    if (isConfigured) {
        deepgramClient = createClient({
            key: config.deepgram.apiKey,
        });
    } else {
        console.warn('⚠️ Deepgram configuration incomplete. Please set DEEPGRAM_API_KEY environment variable.');
    }
};

// Initialize on module load
initializeDeepgram();

export const checkIfOutOfContext = (userInput: string, agentPrompt: string): { isOutOfContext: boolean; confidence: number } => {
    const inputLower = userInput.toLowerCase();
    const promptLower = agentPrompt.toLowerCase();

    // Extract key topics from agent prompt
    const promptWords = promptLower.split(/\s+/).filter(word => word.length > 3);

    // Check if user input contains any relevant keywords
    const hasRelevantKeywords = promptWords.some(word => inputLower.includes(word));

    // Check for common out-of-context indicators
    const outOfContextIndicators = [
        'weather', 'sports', 'politics', 'entertainment', 'gossip', 'joke',
        'riddle', 'game', 'personal question', 'unrelated', 'different topic'
    ];

    const hasOutOfContextIndicators = outOfContextIndicators.some(indicator =>
        inputLower.includes(indicator)
    );

    if (hasOutOfContextIndicators && !hasRelevantKeywords) {
        return { isOutOfContext: true, confidence: 0.7 };
    }

    return { isOutOfContext: false, confidence: 0.6 };
};

/**
 * Check if the input contains any date (should end call)
 */
// const isSpecificDateTime = (input: string): boolean => {
//     const inputLower = input.toLowerCase();

//     // Patterns that indicate specific date and time (should end call)
//     const specificDateTimePatterns = [
//         // Date with specific time ranges
//         /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\s+to\s+\d{1,2}\s*(am|pm)\b/i, // 25th august 3 to 4 pm
//         /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\s*-\s*\d{1,2}\s*(am|pm)\b/i, // 25th august 3-4 pm
//         /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\s+until\s+\d{1,2}\s*(am|pm)\b/i, // 25th august 3 until 4 pm
//         /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\s+through\s+\d{1,2}\s*(am|pm)\b/i, // 25th august 3 through 4 pm

//         // Abbreviated month with specific time ranges
//         /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}\s+to\s+\d{1,2}\s*(am|pm)\b/i, // 25th aug 3 to 4 pm
//         /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}\s*-\s*\d{1,2}\s*(am|pm)\b/i, // 25th aug 3-4 pm
//         /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}\s+until\s+\d{1,2}\s*(am|pm)\b/i, // 25th aug 3 until 4 pm
//         /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}\s+through\s+\d{1,2}\s*(am|pm)\b/i, // 25th aug 3 through 4 pm

//         // Specific time ranges with dates
//         /\b\d{1,2}:\d{2}\s+to\s+\d{1,2}:\d{2}\s*(am|pm)?\s+on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // 3:00 to 4:00 pm on monday
//         /\b\d{1,2}:\d{2}\s+to\s+\d{1,2}:\d{2}\s*(am|pm)?\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // 3:00 to 4:00 pm monday
//         /\b\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s*(am|pm)?\s+on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // 3:00-4:00 pm on monday

//         // Additional flexible patterns with specific times
//         /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+around\s+\d{1,2}\s*(am|pm)\b/i, // 25th august around 3 pm
//         /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+around\s+\d{1,2}\s*(am|pm)\b/i, // 25th aug around 3 pm
//         /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\s+between\s+\d{1,2}\s+and\s+\d{1,2}\s*(am|pm)\b/i, // august 25th between 3 and 4 pm
//         /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(st|nd|rd|th)?\s+between\s+\d{1,2}\s+and\s+\d{1,2}\s*(am|pm)\b/i, // aug 25th between 3 and 4 pm

//         // Standard specific date-time patterns
//         /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+at\s+\d{1,2}:\d{2}\s*(am|pm)\b/i, // 25th august at 3:00 pm
//         /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\s+at\s+\d{1,2}:\d{2}\s*(am|pm)\b/i, // august 25th at 3:00 pm
//         /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+\d{1,2}:\d{2}\s*(am|pm)\b/i, // monday at 3:00 pm
//         /\b\d{1,2}:\d{2}\s*(am|pm)\s+on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // 3:00 pm on monday
//     ];

//     return specificDateTimePatterns.some(pattern => pattern.test(inputLower));
// };

/**
 * Check if the input contains any date (should end call)
 */
const isSpecificDateTime = (input: string): boolean => {
    const inputLower = input.toLowerCase();

    // Patterns that indicate any date input (should end call)
    const datePatterns = [
        // Date with day and month (various formats)
        /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/i, // 25th august, 25 august
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\b/i, // august 25th, august 25

        // Abbreviated month formats
        /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i, // 25th aug, 25 aug
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(st|nd|rd|th)?\b/i, // aug 25th, aug 25

        // Date with comma format
        /\b\d{1,2}(st|nd|rd|th)?\s*,\s*(january|february|march|april|may|june|july|august|september|october|november|december)\b/i, // 25, august
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\s*,\s*\d{4}\b/i, // august 25, 2025

        // Date with year
        /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i, // 25 august 2025
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\s+\d{4}\b/i, // august 25 2025

        // Abbreviated month with year
        /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}\b/i, // 25 aug 2025
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(st|nd|rd|th)?\s+\d{4}\b/i, // aug 25 2025

        // Weekdays
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // monday, tuesday, etc.
        /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // next monday
        /\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // this monday

        // Relative dates
        /\btoday\b/i,
        /\btomorrow\b/i,
        /\byesterday\b/i,
        /\bnext\s+week\b/i,
        /\bthis\s+week\b/i,
        /\bnext\s+month\b/i,
        /\bthis\s+month\b/i
    ];

    return datePatterns.some(pattern => pattern.test(inputLower));
};


/**
 * Check if the input contains a general date/time (should ask for specific time)
 */
// const isGeneralDateTime = (input: string): boolean => {
//     const inputLower = input.toLowerCase();

//     // Patterns that indicate general date/time (should ask for specific time)
//     const generalDateTimePatterns = [
//         // Date ranges without specific times
//         /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\s+to\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\b/i, // august 25th to september 1st
//         /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(st|nd|rd|th)?\s+to\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(st|nd|rd|th)?\b/i, // aug 25th to sep 1st
//         /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\s+to\s+\d{1,2}(st|nd|rd|th)?\b/i, // august 25th to 30th
//         /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(st|nd|rd|th)?\s+to\s+\d{1,2}(st|nd|rd|th)?\b/i, // aug 25th to 30th

//         // Week ranges
//         /\bnext\s+week\b/i, // next week
//         /\bthis\s+week\b/i, // this week
//         /\bweek\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i, // week of august 25

//         // General time slots without specific times
//         /\b(morning|afternoon|evening|night)\s+on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // morning on monday
//         /\b(morning|afternoon|evening|night)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // morning monday
//         /\b(morning|afternoon|evening|night)\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i, // morning of august 25

//         // General dates without specific times
//         /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/i, // 25th august
//         /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\b/i, // august 25th
//         /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(st|nd|rd|th)?\b/i, // aug 25th

//         // Date with comma format (e.g., "25, August 2025")
//         /\b\d{1,2}(st|nd|rd|th)?\s*,\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i, // 25, August 2025
//         /\b\d{1,2}(st|nd|rd|th)?\s*,\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}\b/i, // 25, Aug 2025
//         /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\s*,\s*\d{4}\b/i, // August 25, 2025
//         /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(st|nd|rd|th)?\s*,\s*\d{4}\b/i, // Aug 25, 2025

//         // Additional date formats without specific times
//         /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i, // 25 August 2025
//         /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\s+\d{4}\b/i, // August 25 2025
//         /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(st|nd|rd|th)?\s+\d{4}\b/i, // Aug 25 2025
//         /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}\b/i, // 25th Aug 2025

//         // General weekdays
//         /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // next monday
//         /\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, // this monday

//         // General times without dates
//         /\b\d{1,2}:\d{2}\s*(am|pm)\b/i, // 3:00 PM
//     ];

//     return generalDateTimePatterns.some(pattern => pattern.test(inputLower));
// };

/**
 * Generate contextual response based on user input and conversation context
 */
const generateContextualResponse = (userInput: string, context: ConversationContext): string => {
    const inputLower = userInput.toLowerCase();

    // Check if input contains any date (should end call)
    if (isSpecificDateTime(userInput)) {
        return "Perfect! I've confirmed that date for you. Thank you for your time. Have a great day!";
    }

    // Meeting scheduling responses
    if (inputLower.includes('schedule') || inputLower.includes('meeting') || inputLower.includes('appointment')) {
        if (inputLower.includes('when') || inputLower.includes('time')) {
            return "I'd be happy to help you schedule a meeting. What time would work best for you?";
        }
        if (inputLower.includes('where') || inputLower.includes('location')) {
            return "The default location for meetings is Google Meet. Would you like me to set it up there?";
        }

        return "I can help you schedule that meeting. What day and time would work best for you?";
    }


    // Calendar management responses
    if (inputLower.includes('calendar') || inputLower.includes('available') || inputLower.includes('free')) {
        return "Let me check your calendar availability. What date are you looking for?";
    }

    // Confirmation responses
    if (inputLower.includes('yes') || inputLower.includes('confirm') || inputLower.includes('okay')) {
        return "Perfect! What date and time would work best for you?";
    }

    // Negative responses - should end call
    if (inputLower.includes('no') || inputLower.includes('not') || inputLower.includes('nope') ||
        inputLower.includes('negative') || inputLower.includes('decline') || inputLower.includes('cancel') ||
        inputLower.includes("don't think") || inputLower.includes("i'll pass") || inputLower.includes("maybe later") || inputLower.includes("no thankyou")) {
        return "Thank you for your time. Have a great day!";
    }

    // Cancellation responses
    if (inputLower.includes('cancel') || inputLower.includes('reschedule') || inputLower.includes('change')) {
        return "I can help you cancel or reschedule. Which meeting would you like to modify?";
    }

    // Greeting responses
    if (inputLower.includes('hello') || inputLower.includes('hi') || inputLower.includes('hey')) {
        return "Hello! I'm your AI meeting assistant. How can I help you today?";
    }

    // Default response
    return "I understand you're interested in meeting scheduling. Could you please provide more details about what you need help with?";
};

/**
 * Extract key topics from conversation history
 */
const extractKeyTopics = (conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>): string => {
    const topics = new Set<string>();

    conversationHistory.forEach(exchange => {
        const content = exchange.content.toLowerCase();
        if (content.includes('meeting')) topics.add('Meeting Scheduling');
        if (content.includes('calendar')) topics.add('Calendar Management');
        if (content.includes('time') || content.includes('date')) topics.add('Time/Date Coordination');
        if (content.includes('location')) topics.add('Location Planning');
    });

    return Array.from(topics).join(', ') || 'General conversation';
};

/**
 * Initialize a new conversation with an agent prompt
 */
export const startConversation = async (agentPrompt: string): Promise<ConversationContext> => {
    if (!isConfigured) {
        throw new Error('Deepgram service not properly configured');
    }

    return {
        agentPrompt,
        conversationHistory: [],
        isOutOfContext: false
    };
};

/**
 * Process user input and generate AI response
 * For now, we'll use a simple rule-based system, but this can be enhanced
 * with a more sophisticated AI model later
 */
export const processUserInput = async (
    userInput: string,
    context: ConversationContext,
    callSid?: string
): Promise<ConversationResponse> => {
    if (!isConfigured) {
        throw new Error('Deepgram service not properly configured');
    }

    try {
        // Check if the input is out of context
        const outOfContextCheck = checkIfOutOfContext(userInput, context.agentPrompt);
        console.log({ outOfContextCheck });

        if (outOfContextCheck.isOutOfContext) {
            return {
                response: "Sorry , I'm here to help with meeting scheduling and appointments. Would you like to schedule a meeting ?",
                isOutOfContext: true,
                confidence: outOfContextCheck.confidence
            };
        }

        // Generate response based on agent prompt and conversation history
        const response = generateContextualResponse(userInput, context);

        // Check if this is a date input that should end the call
        const shouldEndCall = isSpecificDateTime(userInput);

        // Check if this is a negative response that should end the call
        const isNegativeResponse = /no|not|nope|negative|decline|cancel|don't think|i'll pass|maybe later/i.test(userInput);
        const shouldEndCallDueToNegative = isNegativeResponse;

        // Update conversation history first
        context.conversationHistory.push({
            role: 'user',
            content: userInput,
            timestamp: new Date()
        });

        context.conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date()
        });

        // Return response first, then end call if needed
        // The calling code should handle ending the call after sending the response
        return {
            response,
            isOutOfContext: false,
            confidence: 0.9,
            shouldEndCall: shouldEndCall || shouldEndCallDueToNegative
        };



    } catch (error) {
        console.error('Error processing user input:', error);
        return {
            response: "I apologize, but I'm having trouble processing your request right now. Please try again.",
            isOutOfContext: false,
            confidence: 0.0
        };
    }
};

/**
 * Process audio stream for real-time speech recognition
 * Note: This is a placeholder for future real-time audio processing
 */
export const processAudioStream = async (audioStream: NodeJS.ReadableStream): Promise<SpeechRecognitionResult> => {
    if (!isConfigured || !deepgramClient) {
        throw new Error('Deepgram service not properly configured');
    }

    try {
        // Note: This is a placeholder for real-time audio processing
        // In a real implementation, you would use Deepgram's live transcription
        // For now, we'll return a mock result since we're using Twilio's speech recognition
        console.log('🔊 Deepgram audio processing placeholder - using Twilio speech recognition');

        return {
            transcript: '',
            confidence: 0,
            isFinal: true,
            language: config.deepgram.language
        };
    } catch (error) {
        console.error('Error processing audio stream:', error);
        throw error;
    }
};

/**
 * Check if the service is properly configured
 */
export const isReady = (): boolean => {
    return isConfigured;
};

/**
 * Get conversation summary
 */
export const getConversationSummary = async (context: ConversationContext): Promise<string> => {
    if (!isConfigured) {
        return "Service not configured";
    }

    try {
        const summary = `Conversation Summary:
Agent Purpose: ${context.agentPrompt}
Total Exchanges: ${context.conversationHistory.length}

Key Topics Discussed:
${extractKeyTopics(context.conversationHistory)}`;

        return summary;
    } catch (error) {
        console.error('Error generating summary:', error);
        return "Unable to generate summary";
    }
};

/**
 * Get current configuration status
 */
export const getConfigurationStatus = (): { isConfigured: boolean; hasClient: boolean } => {
    return {
        isConfigured,
        hasClient: deepgramClient !== null
    };
};

/**
 * Reinitialize Deepgram configuration (useful for config updates)
 */
export const reinitializeDeepgram = (): void => {
    initializeDeepgram();
};

/**
 * Get Deepgram client instance (for advanced usage)
 */
export const getDeepgramClient = (): any => {
    return deepgramClient;
};

// For backward compatibility, create an object that mimics the original class structure
export const deepgramService = {
    startConversation,
    processUserInput,
    processAudioStream,
    isReady,
    getConversationSummary,
    getConfigurationStatus,
    reinitializeDeepgram,
    getDeepgramClient
};