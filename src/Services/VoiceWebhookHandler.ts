import { Request, Response } from "express";
import { deepgramService, ConversationContext, checkIfOutOfContext } from "./DeepgramService";
import { config } from "../../config";

export interface CallSession {
    callSid: string;
    context: ConversationContext;
    isActive: boolean;
    startTime: Date;
    lastActivity: Date;
}

// In-memory storage for active call sessions
const activeSessions = new Map<string, CallSession>();
// Store agent prompts for calls initiated via Telegram
const callAgentPrompts = new Map<string, string>();
// Store messages for calls initiated via Twilio
const callMessages = new Map<string, string>();

// Default agent prompt
let defaultAgentPrompt: string =
    "You are a helpful AI assistant for scheduling meetings and managing appointments. Help users with meeting scheduling, calendar management, and appointment coordination.";

/**
 * Generate initial greeting based on agent prompt and optional message
 */
const generateInitialGreeting = async (
    context: ConversationContext,
    message?: string
): Promise<string> => {
    console.log("🤖 Generating initial greeting...", context);
    console.log("🤖 Greeting Message...", message);
    try {
        if (message) {
            return message;
        }
        return `Hello! I'm AI assistant for scheduling meetings. Would you like to schedule a meeting?`;
    } catch (error) {
        console.error("Error generating greeting:", error);
        return "Hello! I'm AI assistant for scheduling meetings. Would you like to schedule a meeting?";
    }
};

/**
 * Create TwiML response for voice interaction
 */
const createVoiceResponse = (message: string, callSid: string): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="${config.call.voice}" language="${config.call.language}">${message}</Say>
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
};

/**
 * Create TwiML response for speech input that redirects back to gather
 */
const createSpeechResponse = (message: string, callSid: string, shouldEndCall: boolean = false): string => {
    if (shouldEndCall) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="${config.call.voice}" language="${config.call.language}">${message}</Say>
    <Hangup/>
</Response>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="${config.call.voice}" language="${config.call.language}">${message}</Say>
    <Redirect method="POST">/ai-voice/placeholder</Redirect>
</Response>`;
};

/**
 * Create error response TwiML
 */
const createErrorResponse = (): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="${config.call.voice}" language="${config.call.language}">I apologize, but I'm experiencing technical difficulties. Please try calling again later.</Say>
    <Hangup/>
</Response>`;
};

/**
 * Clean up session and generate summary
 */
const cleanupSession = async (session: CallSession): Promise<void> => {
    try {
        if (session.context.conversationHistory.length > 0) {
            const summary = await deepgramService.getConversationSummary(
                session.context
            );
            console.log(`📝 Conversation summary for ${session.callSid}:`, summary);
        }
    } catch (error) {
        console.error("Error generating conversation summary:", error);
    }
};

/**
 * Get agent prompt for a specific call
 */
const getCallAgentPrompt = (callSid: string): string => {
    return callAgentPrompts.get(callSid) || defaultAgentPrompt;
};

/**
 * Handle incoming voice call webhook from Twilio
 */
export const handleIncomingCall = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { CallSid, From, To } = req.body;
        const { message: urlMessage, tempSid } = req.query;

        console.log("Req body=======>", req.body)
        console.log(`🔍 CallSid type: ${typeof CallSid}, value: "${CallSid}"`);
        console.log(`🔍 CallSid length: ${CallSid?.length}`);
        console.log(`🔍 URL message: ${urlMessage}`);
        console.log(`🔍 Temp SID: ${tempSid}`);

        console.log("=======================================================")

        console.log(`📞 Incoming call from ${From} to ${To}, SID: ${CallSid}`);

        // Check if we have an existing session for this call
        let session = activeSessions.get(CallSid);

        console.log({ "📌📌📌📌📌📌📌📌📌📌📌": session });

        if (!session) {
            console.log(`🆕 Creating new session for call ${CallSid}`);
            // Check if we have a stored agent prompt for this call
            const agentPrompt = getCallAgentPrompt(CallSid);

            // Initialize conversation with Deepgram AI
            const context = await deepgramService.startConversation(agentPrompt);

            // Store session
            session = {
                callSid: CallSid,
                context,
                isActive: true,
                startTime: new Date(),
                lastActivity: new Date(),
            };

            activeSessions.set(CallSid, session);

            // Get the stored message for this call if available
            console.log(`🔍 About to get stored message for CallSid: ${CallSid}`);
            let storedMessage = getCallMessage(CallSid);

            // If no stored message found, try to get it from URL parameters
            if (!storedMessage && urlMessage) {
                console.log(`🔍 Using message from URL: ${urlMessage}`);
                storedMessage = decodeURIComponent(urlMessage as string);
                // Store it for future use
                setCallMessage(CallSid, storedMessage);
            }

            // If still no message and we have a temp SID, try to get it from there
            if (!storedMessage && tempSid) {
                console.log(`🔍 Trying to get message from temp SID: ${tempSid}`);
                storedMessage = getCallMessage(tempSid as string);
                if (storedMessage) {
                    // Store it with the actual call SID
                    setCallMessage(CallSid, storedMessage);
                    // Remove the temporary entry
                    removeCallMessage(tempSid as string);
                }
            }

            console.log({ storedMessage })

            // Generate initial greeting with optional message
            const greeting = await generateInitialGreeting(context, storedMessage);
            console.log({ greeting });

            // Create TwiML response for new calls
            const twiml = createVoiceResponse(greeting, CallSid);

            res.type("text/xml");
            res.send(twiml);
        } else {
            console.log(`🔄 Continuing existing session for call ${CallSid}`);
            // Continue existing conversation - just gather speech again
            const twiml = createVoiceResponse("", CallSid);

            res.type("text/xml");
            res.send(twiml);
        }
    } catch (error) {
        console.error("Error handling incoming call:", error);
        const errorTwiml = createErrorResponse();
        res.type("text/xml");
        res.send(errorTwiml);
    }
};

/**
 * Handle user speech input from Twilio
 */
export const handleSpeechInput = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { CallSid, SpeechResult, Confidence } = req.body;

        console.log(
            `🗣️ Speech input received: "${SpeechResult}" (confidence: ${Confidence})`
        );

        const outOfContextCheck = checkIfOutOfContext(SpeechResult, getCallAgentPrompt(CallSid));
        console.log(`Out of context check user input: ${JSON.stringify(outOfContextCheck)}`);

        const session = activeSessions.get(CallSid);
        if (!session) {
            console.error(`❌ Session not found for call ${CallSid}`);
            const errorTwiml = createErrorResponse();
            res.type("text/xml");
            res.send(errorTwiml);
            return;
        }

        // Update last activity
        session.lastActivity = new Date();

        console.log(`🤖 Processing speech with Deepgram AI for call ${CallSid}...`);
        // Process speech with Deepgram AI
        const aiResponse = await deepgramService.processUserInput(
            SpeechResult,
            session.context,
            CallSid
        );

        // Update session context
        activeSessions.set(CallSid, session);

        console.log(
            `🤖 AI Response: "${aiResponse.response}" (out of context: ${aiResponse.isOutOfContext})`
        );

        // Create TwiML response with AI reply and redirect for continuous conversation
        const twiml = createSpeechResponse(aiResponse.response, CallSid, aiResponse.shouldEndCall);

        console.log(
            `🔄 Redirecting call ${CallSid} back to main handler for continuous conversation`
        );
        res.type("text/xml");
        res.send(twiml);
    } catch (error) {
        console.error("❌ Error handling speech input:", error);
        const errorTwiml = createErrorResponse();
        res.type("text/xml");
        res.send(errorTwiml);
    }
};

/**
 * Handle call status updates
 */
export const handleCallStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { CallSid, CallStatus } = req.body;

        console.log(`📊 Call status update: ${CallSid} - ${CallStatus}`);

        if (
            CallStatus === "completed" ||
            CallStatus === "failed" ||
            CallStatus === "busy" ||
            CallStatus === "no-answer"
        ) {
            // Clean up session
            const session = activeSessions.get(CallSid);
            if (session) {
                await cleanupSession(session);
                activeSessions.delete(CallSid);
            }
        }

        res.status(200).send("OK");
    } catch (error) {
        console.error("Error handling call status:", error);
        res.status(500).send("Error");
    }
};

/**
 * Get active sessions count
 */
export const getActiveSessionsCount = (): number => {
    return activeSessions.size;
};

/**
 * Get session by call SID
 */
export const getSession = (callSid: string): CallSession | undefined => {
    return activeSessions.get(callSid);
};

/**
 * Update agent prompt for a specific session
 */
export const updateAgentPrompt = async (
    callSid: string,
    newPrompt: string
): Promise<boolean> => {
    const session = activeSessions.get(callSid);
    if (session) {
        session.context.agentPrompt = newPrompt;
        activeSessions.set(callSid, session);
        return true;
    }
    return false;
};

/**
 * Set default agent prompt for new calls
 */
export const setDefaultAgentPrompt = (prompt: string): void => {
    defaultAgentPrompt = prompt;
};

/**
 * Set agent prompt for a specific call (used by Telegram commands)
 */
export const setCallAgentPrompt = (callSid: string, prompt: string): void => {
    callAgentPrompts.set(callSid, prompt);
};

/**
 * Get default agent prompt
 */
export const getDefaultAgentPrompt = (): string => {
    return defaultAgentPrompt;
};



export const setCallMessage = (callSid: string, message: string): void => {
    console.log(`Setting message for call ${callSid}: ${message}`);
    callMessages.set(callSid, message);
    console.log(`📝 Current callMessages Map size: ${callMessages.size}`);
    console.log(`📝 All stored call SIDs:`, Array.from(callMessages.keys()));
};

/**
 * Get message for a specific call
 */
export const getCallMessage = (callSid: string): string | undefined => {
    console.log(`🔍 Looking for message for call SID: ${callSid}`);
    console.log(`🔍 Current callMessages Map size: ${callMessages.size}`);
    console.log(`🔍 All stored call SIDs:`, Array.from(callMessages.keys()));
    const message = callMessages.get(callSid);
    console.log(`🔍 Found message:`, message);
    return message;
};

/**
 * Remove message for a specific call
 */
export const removeCallMessage = (callSid: string): void => {
    console.log(`🗑️ Removing message for call SID: ${callSid}`);
    callMessages.delete(callSid);
};

// For backward compatibility, create an object that mimics the original class structure
export const voiceWebhookHandler = {
    handleIncomingCall,
    handleSpeechInput,
    handleCallStatus,
    getActiveSessionsCount,
    getSession,
    updateAgentPrompt,
    setDefaultAgentPrompt,
    setCallAgentPrompt,
    getCallAgentPrompt,
    getDefaultAgentPrompt,
    setCallMessage,
    getCallMessage,
    removeCallMessage,
};
