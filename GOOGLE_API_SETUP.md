# Google API Setup Guide for Google Meet Integration

This guide will help you set up Google API integration to enable automatic Google Meet link creation when scheduling meetings.

## Prerequisites

- Google account with access to Google Calendar
- Node.js project with the required dependencies

## Step 1: Enable Google Calendar API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Set the following:
   - **Name**: Meeting Scheduler AI
   - **Authorized redirect URIs**: `http://localhost:8080/auth/google/callback`
   - **Authorized JavaScript origins**: `http://localhost:8080`
5. Click "Create"
6. Note down your **Client ID** and **Client Secret**

## Step 3: Get Refresh Token

### Option 1: Using Google OAuth Playground (Recommended for development)

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the settings icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. Close settings
6. In the left panel, scroll down and select "Google Calendar API v3"
7. Select the following scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
8. Click "Authorize APIs"
9. Sign in with your Google account
10. Click "Exchange authorization code for tokens"
11. Copy the **Refresh Token**

### Option 2: Using your own OAuth flow

If you want to implement your own OAuth flow, you'll need to:

1. Create an authorization URL
2. Handle the callback
3. Exchange the authorization code for tokens

## Step 4: Configure Environment Variables

Add the following to your `.env` file:

```env
# Google API Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_CALENDAR_ID=primary
```

## Step 5: Calendar ID Configuration

- **Primary calendar**: Use `primary` (default)
- **Custom calendar**: Use the calendar ID from the calendar settings URL
  - Format: `xxxxxxxxx@group.calendar.google.com`

## Step 6: Test the Integration

1. Start your application
2. Schedule a new meeting
3. Check that a Google Meet link is created
4. Verify the link appears in both user and admin emails

## Troubleshooting

### Common Issues

1. **"Invalid Credentials" Error**

   - Verify your Client ID and Client Secret are correct
   - Ensure the OAuth consent screen is configured

2. **"Refresh Token Invalid" Error**

   - Refresh tokens can expire
   - Generate a new refresh token using the OAuth Playground

3. **"Calendar Not Found" Error**

   - Check your `GOOGLE_CALENDAR_ID` setting
   - Ensure you have access to the specified calendar

4. **"Insufficient Permissions" Error**
   - Verify the OAuth scopes include calendar permissions
   - Check that the API is enabled in your Google Cloud project

### Permission Scopes Required

The following OAuth scopes are required:

- `https://www.googleapis.com/auth/calendar` - Full access to calendars
- `https://www.googleapis.com/auth/calendar.events` - Access to calendar events

## Security Considerations

1. **Keep credentials secure**: Never commit `.env` files to version control
2. **Limit scope**: Only request the permissions you need
3. **Regular rotation**: Consider rotating refresh tokens periodically
4. **Production deployment**: Use proper OAuth flow for production applications

## Production Deployment

For production, consider implementing:

1. Proper OAuth flow with refresh token rotation
2. Secure credential storage (e.g., environment variables, secret management)
3. Rate limiting to avoid API quotas
4. Error handling and fallback mechanisms

## API Quotas and Limits

Google Calendar API has the following limits:

- **Queries per day**: 1,000,000,000
- **Queries per 100 seconds per user**: 1,000
- **Queries per 100 seconds**: 10,000

For most applications, these limits are sufficient, but monitor usage in production.

## Support

If you encounter issues:

1. Check the [Google Calendar API documentation](https://developers.google.com/calendar/api)
2. Review the [Google Cloud Console](https://console.cloud.google.com/) for API usage
3. Check the application logs for detailed error messages
