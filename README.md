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

# Email Configuration (Choose either SMTP or Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Or use Gmail directly
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Email addresses
ADMIN_EMAIL=admin@yourcompany.com
USER_EMAIL=user@yourcompany.com

# Google API Configuration (for Google Meet integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_CALENDAR_ID=primary

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
- ✅ **NEW: Intelligent meeting scheduling with date parsing**
- ✅ **NEW: Automatic email confirmations to users and admins**
- ✅ **NEW: Meeting management and tracking system**
- ✅ **NEW: Automatic Google Meet link creation and integration**

## Architecture

The system consists of several key components:

1. **VoiceWebhookHandler**: Manages call sessions and conversation flow
2. **DeepgramService**: Handles AI conversation processing and speech recognition
3. **TwilioService**: Manages Twilio API interactions
4. **Express Server**: Provides webhook endpoints and API
5. **Telegram Bot**: Allows users to initiate calls via chat

## Meeting Scheduling Features

The system now includes an intelligent meeting scheduler that can:

- **Automatic Date Parsing**: Understands various date formats including relative dates (tomorrow, next week), specific dates (15th December), and short formats (15/12)
- **Email Confirmations**: Sends professional HTML emails to both users and administrators
- **Meeting Management**: Track all scheduled meetings with unique IDs and status updates
- **Flexible Input**: Accepts natural language date inputs from users
- **Google Meet Integration**: Automatically creates Google Meet links for all scheduled meetings
- **Calendar Sync**: Integrates with Google Calendar for seamless meeting management

### Telegram Bot Commands

- `/schedule` - Schedule a new meeting with date and details
- `/meetings` - View all scheduled meetings

## Google Meet Integration

The system automatically creates Google Meet links for all scheduled meetings:

- **Automatic Link Generation**: Creates Google Meet links when meetings are scheduled
- **Calendar Integration**: Syncs with Google Calendar for seamless management
- **Email Notifications**: Includes Google Meet links in confirmation emails
- **Meeting Updates**: Automatically updates Google Calendar when meeting details change
- **Meeting Deletion**: Removes meetings from Google Calendar when cancelled

### Setup Requirements

To enable Google Meet functionality, you need to:

1. **Enable Google Calendar API** in Google Cloud Console
2. **Create OAuth 2.0 credentials** with calendar permissions
3. **Generate a refresh token** for API access
4. **Configure environment variables** with your Google API credentials

See [GOOGLE_API_SETUP.md](./GOOGLE_API_SETUP.md) for detailed setup instructions.

### Meeting Format

```
[Contact Number] [Name] for [Reason] on [Date]
```

**Examples:**

- `99XXXXXXXX John Doe for project discussion on tomorrow`
- `99XXXXXXXX John Doe for project discussion on 15th December`
- `99XXXXXXXX John Doe for project discussion on 15/12/2024`

### Email Configuration

Configure email settings in your `.env` file:

```bash
# Choose either SMTP or Gmail configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Or use Gmail directly
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Email addresses
ADMIN_EMAIL=admin@yourcompany.com
USER_EMAIL=user@yourcompany.com
```

## Google Meet Integration

The system automatically creates Google Meet links for all scheduled meetings:

- **Automatic Link Generation**: Creates Google Meet links when meetings are scheduled
- **Calendar Integration**: Syncs with Google Calendar for seamless management
- **Email Notifications**: Includes Google Meet links in confirmation emails
- **Meeting Updates**: Automatically updates Google Calendar when meeting details change
- **Meeting Deletion**: Removes meetings from Google Calendar when cancelled

### Setup Requirements

To enable Google Meet functionality, you need to:

1. **Enable Google Calendar API** in Google Cloud Console
2. **Create OAuth 2.0 credentials** with calendar permissions
3. **Generate a refresh token** for API access
4. **Configure environment variables** with your Google API credentials

See [GOOGLE_API_SETUP.md](./GOOGLE_API_SETUP.md) for detailed setup instructions.

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
