# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication and obtain a refresh token for your Meeting Schedule AI application.

## Prerequisites

1. Google Cloud Console project with Google Calendar API enabled
2. OAuth 2.0 credentials configured
3. Your application running locally on port 8080

## Step 1: Verify Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project "AI Meeting Scheduler"
3. Navigate to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID and verify these settings:

### ✅ Required Configuration:

- **Authorized JavaScript origins**: `http://localhost:8080`
- **Authorized redirect URIs**: `http://localhost:8080/google/auth/callback`

## Step 2: Set Up Environment Variables

Create a `.env` file in your project root with these variables:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8080/google/auth/callback
```

## Step 3: Start Your Application

```bash
npm run dev
```

Your server should start on `http://localhost:8080`

## Step 4: Generate Authorization URL

Visit this URL in your browser:

```
http://localhost:8080/google/auth
```

This will return a JSON response with an authorization URL.

## Step 5: Complete OAuth Flow

1. **Click the authorization URL** from the previous step
2. **Sign in** with your Google account
3. **Grant permissions** for Google Calendar access
4. **You'll be redirected** to `http://localhost:8080/google/auth/callback`
5. **Copy the refresh token** displayed on the success page

## Step 6: Add Refresh Token to Environment

Add the refresh token to your `.env` file:

```env
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

## Step 7: Test the Setup

Restart your application and test calendar functionality.

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"

**Cause**: Redirect URI mismatch between Google Cloud Console and your application.

**Solution**:

1. Verify the redirect URI in Google Cloud Console matches exactly: `http://localhost:8080/google/auth/callback`
2. Check your `.env` file has the correct `GOOGLE_REDIRECT_URI`
3. Ensure your server is running on port 8080

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in your OAuth request doesn't match what's configured in Google Cloud Console.

**Solution**:

1. Double-check the authorized redirect URIs in Google Cloud Console
2. Make sure there are no extra spaces or typos
3. The URI must be exactly: `http://localhost:8080/google/auth/callback`

### No Refresh Token Generated

**Cause**: Google only provides refresh tokens on first authorization or when `prompt=consent` is used.

**Solution**:

1. Revoke access to your application in Google Account settings
2. Re-authorize with the `prompt=consent` parameter (already configured in our code)
3. Or use the OAuth Playground method below

## Alternative Method: Using Google OAuth Playground

If you prefer using Google's OAuth Playground:

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the settings icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. Add `https://developers.google.com/oauthplayground` to your authorized redirect URIs in Google Cloud Console
6. Select "Google Calendar API v3" and choose the scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
7. Click "Authorize APIs"
8. Click "Exchange authorization code for tokens"
9. Copy the refresh token from the response

## Security Notes

⚠️ **Important Security Reminders**:

- Never commit your `.env` file to version control
- Keep your refresh token secure
- Rotate refresh tokens periodically
- Use environment variables for all sensitive data

## API Scopes Used

The application requires these Google Calendar scopes:

- `https://www.googleapis.com/auth/calendar` - Full access to calendars
- `https://www.googleapis.com/auth/calendar.events` - Full access to calendar events

These scopes allow the application to:

- Create calendar events
- Add Google Meet links
- Send email invitations
- Manage calendar settings
