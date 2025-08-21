# Meeting Schedule AI - Voice Call System

This system provides an AI-powered voice call service that can handle meeting scheduling and appointment management through natural conversation using Deepgram for speech recognition and AI processing.

## Call Flow Implementation

The system implements a continuous conversation loop using Twilio's voice services and Deepgram's AI capabilities:

### 1. Call Initiation

- User calls the Twilio phone number
- Twilio sends webhook to `/ai-voice/placeholder`
- System creates new conversation session with Deepgram AI
- AI generates initial greeting and plays it to user

### 2. Speech Recognition Loop

- Twilio uses `<Gather>` verb to capture user speech
- Audio is streamed and transcribed by Twilio's speech recognition
- Transcript is sent to `/webhook/speech` endpoint
- Node.js server processes transcript with Deepgram AI
- AI generates response and plays it to user

### 3. Continuous Conversation

- After AI response, system uses `<Redirect>` to loop back
- User can continue speaking without interruption
- Conversation context is maintained throughout the call
- Loop continues until user hangs up or timeout occurs

## API Endpoints

- `POST /ai-voice/placeholder` - Handles incoming calls and conversation flow
- `POST /webhook/speech` - Processes speech input and AI responses
- `POST /webhook/status` - Handles call status updates
- `GET /health` - Health check for all services
- `GET /test/twiml` - Test endpoint to verify TwiML generation

## Configuration

Set these environment variables:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Deepgram Configuration
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US

# Server Configuration
PORT=8080
BASE_URL=http://localhost:8080
```

## Running the System

1. Install dependencies: `npm install`
2. Set environment variables
3. Build the project: `npm run build`
4. Start server: `npm start`
5. Configure Twilio webhook URLs to point to your server endpoints

## Testing the System

### Health Check

```bash
curl http://localhost:8080/health
```

### Test TwiML Generation

```bash
curl http://localhost:8080/test/twiml
```

### Test Voice Webhook

```bash
curl -X POST http://localhost:8080/ai-voice/placeholder \
  -H "Content-Type: application/json" \
  -d '{"CallSid":"test123","From":"+1234567890","To":"+0987654321"}'
```

### Test Speech Webhook

```bash
curl -X POST http://localhost:8080/webhook/speech \
  -H "Content-Type: application/json" \
  -d '{"CallSid":"test123","SpeechResult":"Hello","Confidence":0.9}'
```

## Twilio Webhook Configuration

Configure these webhook URLs in your Twilio console:

- **Voice Webhook**: `{BASE_URL}/ai-voice/placeholder`
- **Status Callback**: `{BASE_URL}/call-status/placeholder`

## Features

- ✅ Continuous conversation flow
- ✅ Advanced speech recognition with Deepgram
- ✅ AI-powered conversation processing
- ✅ Conversation context maintenance
- ✅ Configurable voice and language settings
- ✅ Health monitoring and logging
- ✅ Error handling and fallbacks
- ✅ Telegram bot integration for call initiation
- ✅ Session management and cleanup
- ✅ Real-time audio processing capabilities

## Architecture

The system consists of several key components:

1. **VoiceWebhookHandler**: Manages call sessions and conversation flow
2. **DeepgramService**: Handles AI conversation processing and speech recognition
3. **TwilioService**: Manages Twilio API interactions
4. **Express Server**: Provides webhook endpoints and API
5. **Telegram Bot**: Allows users to initiate calls via chat

## Deepgram Integration Benefits

- **Real-time Speech Recognition**: Advanced AI models for accurate transcription
- **Multi-language Support**: Support for multiple languages and accents
- **Smart Formatting**: Automatic punctuation and formatting
- **Speaker Diarization**: Identify different speakers in conversations
- **Utterance Detection**: Better sentence boundary detection
- **High Accuracy**: State-of-the-art speech recognition models

## Call Flow Diagram

```
User Call → Twilio → /ai-voice/placeholder → AI Greeting → <Gather>
                                                              ↓
User Speech → Twilio Speech Recognition → /webhook/speech → Deepgram AI Response
                                                              ↓
<Redirect> → /ai-voice/placeholder → <Gather> → (Loop Continues)
```

## Troubleshooting

- Check the `/health` endpoint to verify all services are running
- Review server logs for detailed error information
- Ensure all environment variables are properly set
- Verify Twilio webhook URLs are correctly configured
- Test individual endpoints using the test commands above
- Verify Deepgram API key is valid and has sufficient credits
