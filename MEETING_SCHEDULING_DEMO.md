# Meeting Scheduling Feature Demo

## Overview

The AI Meeting Scheduler now supports automatic meeting scheduling with date parsing and email confirmations!

## New Features

### 1. Date Parsing

The bot can understand various date formats:

- **Relative dates**: "tomorrow", "next week", "next month"
- **Specific dates**: "15th December", "December 15th"
- **Short formats**: "15/12", "15-12"
- **Full dates**: "15/12/2024", "15-12-2024"

### 2. AI-Powered Email Confirmations

- **User confirmation**: Sent to the user's email (if configured)
- **Admin notification**: Sent to your admin email
- **AI-generated personalized content** with dynamic subject lines
- **Beautiful HTML emails** with gradients and modern design
- **Contextual content** based on meeting time and purpose
- **Randomized greetings and signatures** for variety

### 3. Meeting Management

- **View meetings**: `/meetings` command to see all scheduled meetings
- **Meeting status tracking**: pending, confirmed, cancelled
- **Unique meeting IDs** for easy reference

## Usage Examples

### Schedule a Meeting

```
/schedule
```

Then provide details in this format:

```
99XXXXXXXX John Doe for project discussion on tomorrow
```

### Supported Date Formats

#### Relative Dates

```
99XXXXXXXX John Doe for project discussion on tomorrow
99XXXXXXXX John Doe for project discussion on next week
99XXXXXXXX John Doe for project discussion on next month
```

#### Specific Dates

```
99XXXXXXXX John Doe for project discussion on 15th December
99XXXXXXXX John Doe for project discussion on December 15th
99XXXXXXXX John Doe for project discussion on 15/12
99XXXXXXXX John Doe for project discussion on 15-12
99XXXXXXXX John Doe for project discussion on 15/12/2024
99XXXXXXXX John Doe for project discussion on 15-12-2024
```

### View Scheduled Meetings

```
/meetings
```

## Email Configuration

### Option 1: SMTP Configuration

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Option 2: Gmail Configuration

```env
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### Email Addresses

```env
FROM_EMAIL=noreply@meetingscheduler.com
ADMIN_EMAIL=admin@yourcompany.com
USER_EMAIL=user@yourcompany.com
```

## How It Works

1. **User sends meeting request** with date
2. **Bot parses the date** using intelligent date parsing
3. **Meeting is scheduled** and stored in memory
4. **AI generates personalized emails** with dynamic content
5. **Email confirmations** are sent to user and admin
6. **Call is initiated** to the contact person
7. **Meeting details** are displayed with confirmation

## AI Email Features

### 🎯 **Dynamic Subject Lines**

The AI generates contextual subject lines based on meeting details:

- `✅ Meeting Confirmed: John Doe on Dec 15`
- `🌅 Morning meeting confirmed: John Doe`
- `☀️ Afternoon meeting set: John Doe`
- `🌙 Evening meeting scheduled: John Doe`

### 🎨 **Personalized Content**

- **Randomized greetings**: "Hello John! 👋", "Hi there John! ✨", "Greetings John! 🌟"
- **Contextual messaging**: Content adapts based on meeting purpose and time
- **Dynamic signatures**: Various AI assistant personas
- **Professional design**: Beautiful gradients and modern HTML layout

### 📧 **Email Examples**

#### User Email Features:

- Beautiful gradient header with meeting confirmation
- Organized meeting details in attractive cards
- Personalized next steps and context
- Professional footer with meeting ID

#### Admin Email Features:

- Action-oriented notifications
- Complete meeting summary
- Action items and next steps
- Professional admin interface

## Benefits

- ✅ **Automatic date parsing** - No need for specific date formats
- ✅ **AI-powered emails** - Dynamic, personalized content generation
- ✅ **Beautiful design** - Modern HTML emails with gradients and emojis
- ✅ **Smart subject lines** - Contextual based on time and meeting details
- ✅ **Meeting tracking** - View all scheduled meetings
- ✅ **Flexible input** - Multiple date format support
- ✅ **Error handling** - Graceful fallback if scheduling fails
- ✅ **Professional branding** - Consistent AI assistant persona

## Next Steps

To use this feature:

1. **Set up email configuration** in your `.env` file
2. **Restart the bot** to load new configuration
3. **Test with `/schedule`** command
4. **Check `/meetings`** to view scheduled meetings

The bot will now automatically schedule meetings when users provide dates and send email confirmations to both the user and your admin email!
