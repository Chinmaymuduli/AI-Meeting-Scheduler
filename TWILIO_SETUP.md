# Twilio Setup Guide for Meeting Schedule AI Bot

This guide will help you configure Twilio to enable automatic calling functionality in your Meeting Schedule AI bot.

## Prerequisites

1. A Twilio account (sign up at [twilio.com](https://www.twilio.com))
2. A purchased Twilio phone number with voice capabilities
3. Node.js and npm installed

## Setup Steps

### 1. Get Your Twilio Credentials

1. Log in to your [Twilio Console](https://console.twilio.com)
2. Find your **Account SID** and **Auth Token** on the Console Dashboard
3. Purchase a phone number with voice capabilities from the Phone Numbers section

### 2. Environment Configuration

Create a `.env` file in your project root with the following variables:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Telegram Bot Configuration (already configured)
BOT_TOKEN=8336245975:AAEoM8byQhs2I5xAyKJh_HwnSN3SlI04R9k

# Optional: TwiML Application SID for advanced call features
TWILIO_TWIML_APP_SID=your_twiml_app_sid_here
```

### 3. Replace Placeholder Values

Replace the placeholder values with your actual Twilio credentials:

- `your_twilio_account_sid_here` → Your Account SID from Twilio Console
- `your_twilio_auth_token_here` → Your Auth Token from Twilio Console
- `your_twilio_phone_number_here` → Your purchased Twilio phone number (in E.164 format, e.g., +1234567890)

### 4. Test the Configuration

Run your bot and test with a meeting request:

```bash
npm run dev
```

Send a message to your Telegram bot in the format:

```
+1234567890 John Doe for project discussion
```

The bot will automatically call the provided number with a personalized message.

## Features

### ✅ Implemented Features

- **Automatic Calling**: Instantly calls the provided phone number when a meeting request is received
- **Personalized Messages**: Creates custom call messages with requester name, meeting reason, and recipient name
- **Call Status Tracking**: Monitors call progress and provides status updates
- **Error Handling**: Graceful fallback when Twilio is not configured or calls fail
- **Phone Number Formatting**: Automatically formats phone numbers to E.164 format
- **Call Configuration**: Configurable timeout, recording, and voice settings

### 📞 How It Works

1. User sends meeting request: `+1234567890 John Doe for project discussion`
2. Bot validates the phone number and extracts meeting details
3. Bot immediately initiates a Twilio call to the provided number
4. Recipient receives an automated call with meeting details
5. Bot provides real-time status updates on the call progress

### 🎯 Call Message Format

When someone receives a call, they'll hear:

> "Hello [Recipient Name]! This is an automated call from Meeting Schedule AI. [Requester Name] has requested to schedule a meeting with you for [Meeting Reason]. Please confirm your availability. Thank you!"

## Advanced Configuration

### Custom TwiML

You can customize the call flow by modifying the `TwilioService.ts` file. The current implementation uses Twilio's hosted TwiML for simplicity, but you can create your own TwiML endpoints for more advanced features like:

- Interactive voice response (IVR)
- Call recording
- Call forwarding
- Conference calls

### Call Settings

Modify `config.ts` to adjust default call settings:

```typescript
call: {
  timeout: 30,        // Call timeout in seconds
  record: false,      // Whether to record calls
  voice: 'alice',     // Voice for text-to-speech
  language: 'en-US'   // Language for text-to-speech
}
```

## Troubleshooting

### Common Issues

1. **"Twilio service not configured" message**

   - Check that all environment variables are set correctly
   - Ensure `.env` file is in the project root
   - Verify Account SID and Auth Token are correct

2. **Call fails immediately**

   - Verify the phone number format (should include country code)
   - Check that your Twilio account has sufficient balance
   - Ensure your Twilio phone number has voice capabilities

3. **No call status updates**
   - This is normal for the first few seconds
   - Status updates appear after ~10 seconds
   - Check console logs for any errors

### Phone Number Format

The bot automatically formats phone numbers, but for best results, use:

- **US numbers**: `+1234567890` or `1234567890`
- **International**: `+[country code][number]`

### Webhook Configuration (Optional)

For production deployments, consider setting up webhook endpoints to receive real-time call status updates instead of polling.

## Cost Considerations

- **Outbound calls**: Typically $0.013 - $0.02 per minute depending on destination
- **Phone number rental**: ~$1/month for US numbers
- **TwiML usage**: Free for basic text-to-speech

Check [Twilio Pricing](https://www.twilio.com/pricing) for current rates.

## Security Notes

- Never commit your `.env` file to version control
- Rotate your Auth Token regularly
- Consider using Twilio's API Keys for production
- Implement rate limiting to prevent abuse

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify your Twilio account status and balance
3. Test with a known working phone number
4. Consult [Twilio's documentation](https://www.twilio.com/docs/voice)

Your Meeting Schedule AI bot is now ready to automatically call users when receiving phone numbers! 🎉
