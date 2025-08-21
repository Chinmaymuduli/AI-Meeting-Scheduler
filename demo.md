# Meeting Schedule AI - Demo Script

This demo shows how to test the complete voice call flow system using Deepgram for AI processing.

## Prerequisites

1. Ensure the server is running: `npm start`
2. Have your environment variables configured (especially `DEEPGRAM_API_KEY`)
3. Have a Twilio account with a phone number
4. Have a Deepgram account with API access

## Demo Steps

### 1. Health Check

First, verify all services are running:

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{
  "status": "healthy",
  "services": {
    "twilio": true,
    "deepgram": true,
    "webhook": true
  },
  "activeSessions": 0
}
```

### 2. Test TwiML Generation

Verify the TwiML is generated correctly:

```bash
curl http://localhost:8080/test/twiml
```

Expected response: XML with `<Response>`, `<Say>`, and `<Gather>` elements.

### 3. Simulate Incoming Call

Test the voice webhook endpoint:

```bash
curl -X POST http://localhost:8080/ai-voice/placeholder \
  -H "Content-Type: application/json" \
  -d '{
    "CallSid": "demo_call_001",
    "From": "+1234567890",
    "To": "+0987654321"
  }'
```

Expected response: XML with AI greeting and speech gathering.

### 4. Simulate Speech Input

Test the speech processing with Deepgram:

```bash
curl -X POST http://localhost:8080/webhook/speech \
  -H "Content-Type: application/json" \
  -d '{
    "CallSid": "demo_call_001",
    "SpeechResult": "I need to schedule a meeting with John tomorrow at 2 PM",
    "Confidence": 0.95
  }'
```

Expected response: XML with Deepgram AI response and redirect.

### 5. Continue Conversation

Simulate the redirect loop:

```bash
curl -X POST http://localhost:8080/ai-voice/placeholder \
  -H "Content-Type: application/json" \
  -d '{
    "CallSid": "demo_call_001",
    "From": "+1234567890",
    "To": "+0987654321"
  }'
```

Expected response: XML with continuation prompt and speech gathering.

### 6. Check Session Status

Verify the session is maintained:

```bash
curl http://localhost:8080/health
```

Expected response: `"activeSessions": 1`

## Real Call Flow

In a real call, the flow would be:

1. **User calls Twilio number**
2. **Twilio sends webhook** to `/ai-voice/placeholder`
3. **Deepgram AI generates greeting** and plays it
4. **Twilio gathers speech** using `<Gather>`
5. **User speaks** → Twilio transcribes
6. **Transcript sent** to `/webhook/speech`
7. **Deepgram AI processes** and generates response
8. **Response played** to user
9. **Redirect** back to main handler
10. **Loop continues** until user hangs up

## Deepgram AI Responses

The Deepgram AI will provide contextual responses for:

- **Meeting Scheduling**: "I can help you schedule that meeting. What day and time would work best for you?"
- **Calendar Management**: "Let me check your calendar availability. What date are you looking for?"
- **Time Coordination**: "I'd be happy to help you schedule a meeting. What time would work best for you?"
- **Location Planning**: "Great! Where would you like to have the meeting?"
- **Confirmation**: "Perfect! I've confirmed that for you. Is there anything else you'd like me to help with?"

## Expected Behavior

- ✅ Deepgram AI generates contextual responses
- ✅ Conversation history is maintained
- ✅ Speech recognition works properly
- ✅ TwiML is correctly formatted
- ✅ Sessions are properly managed
- ✅ Error handling works gracefully
- ✅ Real-time AI processing capabilities

## Troubleshooting

If any step fails:

1. Check server logs for errors
2. Verify environment variables (especially `DEEPGRAM_API_KEY`)
3. Test individual endpoints
4. Check Twilio configuration
5. Verify Deepgram API key is valid and has sufficient credits
6. Check Deepgram service status at https://status.deepgram.com

## Deepgram Configuration

The system uses these Deepgram settings:

- **Model**: `nova-2` (latest and most accurate)
- **Language**: `en-US` (configurable)
- **Smart Formatting**: Enabled for better readability
- **Punctuation**: Automatic punctuation
- **Speaker Diarization**: Identify different speakers
- **Utterance Detection**: Better sentence boundaries
