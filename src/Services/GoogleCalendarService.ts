import { google } from 'googleapis';
import { config } from '../../config';
import * as nodemailer from 'nodemailer';

export interface GoogleMeetDetails {
    meetingLink: string;
    eventId: string;
    calendarEvent: any;
}

interface UpdateMeetingParams {
    summary?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    attendees?: string[];
    location?: string;
}

// Initialize Google Calendar client
const initializeGoogleCalendar = () => {
    try {
        // Create OAuth2 client
        const auth = new google.auth.OAuth2(
            config.google.clientId,
            config.google.clientSecret,
            config.google.redirectUri
        );

        // Set refresh token
        if (config.google.refreshToken) {
            auth.setCredentials({
                refresh_token: config.google.refreshToken
            });
        }

        // Create calendar instance
        const calendar = google.calendar({ version: 'v3', auth });

        return { calendar, auth };
    } catch (error) {
        console.error('Error initializing Google Calendar service:', error);
        return null;
    }
};

/**
 * Create a Google Calendar event with Google Meet link
 */
export const createMeetingWithGoogleMeet = async (
    summary: string,
    description: string,
    startTime: Date,
    endTime: Date,
    attendees: string[],
    location?: string
): Promise<GoogleMeetDetails> => {
    const calendarClient = initializeGoogleCalendar();

    if (!calendarClient?.calendar) {
        throw new Error('Google Calendar service not initialized');
    }


    const { calendar } = calendarClient;

    try {
        // Create event with Google Meet
        const event: any = {
            summary,
            description,
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'UTC',
            },
            attendees: attendees.map(email => ({ email })),
            conferenceData: {
                createRequest: {
                    requestId: `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 15 }, // 15 minutes before
                ],
            },
        };

        if (location) {
            event.location = location;
        }

        const response: any = await calendar.events.insert({
            calendarId: config.google.calendarId || 'primary',
            requestBody: event || {},
            conferenceDataVersion: 1,
            sendUpdates: 'all',
        });

        const createdEvent = response.data;
        const meetingLink = createdEvent.conferenceData?.entryPoints?.[0]?.uri;

        if (!meetingLink) {
            throw new Error('Failed to create Google Meet link');
        }

        return {
            meetingLink,
            eventId: createdEvent.id,
            calendarEvent: createdEvent
        };

    } catch (error: any) {
        console.error('Error creating Google Meet:', error);
        throw new Error(`Failed to create Google Meet: ${error.message}`);
    }
};

/**
 * Update an existing calendar event
 */
export const updateMeeting = async (
    eventId: string,
    updates: UpdateMeetingParams
): Promise<void> => {
    const calendarClient = initializeGoogleCalendar();

    if (!calendarClient?.calendar) {
        throw new Error('Google Calendar service not initialized');
    }

    const { calendar } = calendarClient;

    try {
        const event: any = {};

        if (updates.summary) event.summary = updates.summary;
        if (updates.description) event.description = updates.description;
        if (updates.startTime) {
            event.start = { dateTime: updates.startTime.toISOString(), timeZone: 'UTC' };
        }
        if (updates.endTime) {
            event.end = { dateTime: updates.endTime.toISOString(), timeZone: 'UTC' };
        }
        if (updates.attendees) {
            event.attendees = updates.attendees.map(email => ({ email }));
        }
        if (updates.location) event.location = updates.location;

        await calendar.events.update({
            calendarId: config.google.calendarId,
            eventId,
            requestBody: event,
            sendUpdates: 'all',
        });

    } catch (error: any) {
        console.error('Error updating Google Meet:', error);
        throw new Error(`Failed to update Google Meet: ${error.message}`);
    }
};

/**
 * Delete a calendar event
 */
export const deleteMeeting = async (eventId: string): Promise<void> => {
    const calendarClient = initializeGoogleCalendar();

    if (!calendarClient?.calendar) {
        throw new Error('Google Calendar service not initialized');
    }

    const { calendar } = calendarClient;

    try {
        await calendar.events.delete({
            calendarId: config.google.calendarId,
            eventId,
            sendUpdates: 'all',
        });

    } catch (error: any) {
        console.error('Error deleting Google Meet:', error);
        throw new Error(`Failed to delete Google Meet: ${error.message}`);
    }
};

/**
 * Get meeting details by event ID
 */
export const getMeetingDetails = async (eventId: string): Promise<any> => {
    const calendarClient = initializeGoogleCalendar();

    if (!calendarClient?.calendar) {
        throw new Error('Google Calendar service not initialized');
    }

    const { calendar } = calendarClient;

    try {
        const response = await calendar.events.get({
            calendarId: config.google.calendarId,
            eventId,
        });

        return response.data;

    } catch (error: any) {
        console.error('Error getting meeting details:', error);
        throw new Error(`Failed to get meeting details: ${error.message}`);
    }
};

/**
 * Create only a Google Meet link without creating a calendar event
 */
export const createGoogleMeetLink = async (): Promise<string> => {
    const calendarClient = initializeGoogleCalendar();

    if (!calendarClient?.calendar) {
        throw new Error('Google Calendar service not initialized');
    }

    const { calendar } = calendarClient;

    try {
        // Create a temporary event just to get the Meet link
        const tempEvent: any = {
            summary: 'Temporary Meeting',
            start: {
                dateTime: new Date().toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
                timeZone: 'UTC',
            },
            conferenceData: {
                createRequest: {
                    requestId: `temp_meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
        };

        const response: any = await calendar.events.insert({
            calendarId: config.google.calendarId || 'primary',
            requestBody: tempEvent,
            conferenceDataVersion: 1,
            sendUpdates: 'none', // Don't send notifications
        });

        const createdEvent = response.data;
        const meetingLink = createdEvent.conferenceData?.entryPoints?.[0]?.uri;

        if (!meetingLink) {
            throw new Error('Failed to create Google Meet link');
        }

        // Delete the temporary event immediately
        await calendar.events.delete({
            calendarId: config.google.calendarId || 'primary',
            eventId: createdEvent.id,
            sendUpdates: 'none',
        });

        return meetingLink;

    } catch (error: any) {
        console.error('Error creating Google Meet link:', error);
        throw new Error(`Failed to create Google Meet link: ${error.message}`);
    }
};

/**
 * Check if the service is properly configured
 */
export const isGoogleCalendarConfigured = (): boolean => {
    return !!(
        config.google.clientId &&
        config.google.clientSecret &&
        config.google.refreshToken
    );
};

/**
 * Send email using Gmail SMTP
 */
export const sendGmail = async (
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string
): Promise<void> => {
    try {
        // Create Gmail transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.email.gmail.user,
                pass: config.email.gmail.appPassword,
            },
        });

        // Email options
        const mailOptions = {
            from: config.email.fromEmail,
            to: to,
            subject: subject,
            html: htmlContent,
            text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);

    } catch (error: any) {
        console.error('Error sending Gmail:', error);
        throw new Error(`Failed to send Gmail: ${error.message}`);
    }
};

/**
 * Send a test/dummy email to the specified address with Google Meet link
 */
export const sendDummyEmail = async (toEmail: string = 'chinmaymuduli0@gmail.com'): Promise<void> => {
    try {
        // Create a Google Meet link first
        console.log('🔗 Creating Google Meet link...');
        const meetLink = await createGoogleMeetLink();
        console.log('✅ Google Meet link created:', meetLink);

        const subject = 'Test Email with Google Meet Link from Meeting Scheduler AI';
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Hello from Meeting Scheduler AI! 🚀</h2>
                <p>This is a test email sent from your Meeting Scheduler AI application.</p>
                
                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                    <h3 style="color: #2e7d32; margin-top: 0;">🎯 Google Meet Link Created!</h3>
                    <p><strong>Meeting Link:</strong> <a href="${meetLink}" style="color: #1976d2; text-decoration: none; font-weight: bold;">${meetLink}</a></p>
                    <p style="margin-top: 15px;">
                        <a href="${meetLink}" style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                            🚀 Join Meeting
                        </a>
                    </p>
                </div>

                <p><strong>Features:</strong></p>
                <ul>
                    <li>✅ Google Calendar integration</li>
                    <li>✅ Google Meet creation</li>
                    <li>✅ Gmail sending capability</li>
                    <li>✅ Voice call handling</li>
                    <li>✅ AI-powered scheduling</li>
                </ul>
                <p>If you're receiving this email, it means the Gmail integration is working perfectly!</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                    Sent on: ${new Date().toLocaleString()}<br>
                    From: Meeting Scheduler AI System
                </p>
            </div>
        `;

        await sendGmail(toEmail, subject, htmlContent);
        console.log('📧 Email sent successfully with Google Meet link!');

    } catch (error) {
        console.error('❌ Error in sendDummyEmail:', error);
        // Fallback: send email without meet link
        const subject = 'Test Email from Meeting Scheduler AI (Meet Link Creation Failed)';
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Hello from Meeting Scheduler AI! 🚀</h2>
                <p>This is a test email sent from your Meeting Scheduler AI application.</p>
                <p style="color: #e74c3c;"><strong>Note:</strong> Google Meet link creation failed, but email sending is working.</p>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>✅ Google Calendar integration</li>
                    <li>✅ Google Meet creation</li>
                    <li>✅ Gmail sending capability</li>
                    <li>✅ Voice call handling</li>
                    <li>✅ AI-powered scheduling</li>
                </ul>
                <p>If you're receiving this email, it means the Gmail integration is working perfectly!</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                    Sent on: ${new Date().toLocaleString()}<br>
                    From: Meeting Scheduler AI System
                </p>
            </div>
        `;

        await sendGmail(toEmail, subject, htmlContent);
    }
};

/**
 * Send a meeting email with Google Meet link
 */
export const sendMeetingEmailWithMeetLink = async (
    toEmail: string,
    meetingDetails: {
        title: string;
        date: string;
        time: string;
        duration: string;
        description?: string;
        attendees?: string[];
    }
): Promise<void> => {
    try {
        // Create a Google Meet link
        console.log('🔗 Creating Google Meet link for meeting...');
        const meetLink = await createGoogleMeetLink();
        console.log('✅ Google Meet link created:', meetLink);

        const subject = `Meeting Scheduled: ${meetingDetails.title}`;
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">📅 Meeting Scheduled Successfully!</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #34495e; margin-top: 0;">${meetingDetails.title}</h3>
                    <p><strong>📅 Date:</strong> ${meetingDetails.date}</p>
                    <p><strong>⏰ Time:</strong> ${meetingDetails.time}</p>
                    <p><strong>⏱️ Duration:</strong> ${meetingDetails.duration}</p>
                    ${meetingDetails.description ? `<p><strong>📝 Description:</strong> ${meetingDetails.description}</p>` : ''}
                    ${meetingDetails.attendees && meetingDetails.attendees.length > 0 ? `<p><strong>👥 Attendees:</strong> ${meetingDetails.attendees.join(', ')}</p>` : ''}
                </div>

                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                    <h3 style="color: #2e7d32; margin-top: 0;">🎯 Google Meet Link</h3>
                    <p><strong>Meeting Link:</strong> <a href="${meetLink}" style="color: #1976d2; text-decoration: none; font-weight: bold;">${meetLink}</a></p>
                    <p style="margin-top: 15px;">
                        <a href="${meetLink}" style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                            🚀 Join Meeting
                        </a>
                    </p>
                </div>

                <p>We look forward to seeing you at the meeting!</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #7f8c8d; font-size: 12px;">
                    Sent on: ${new Date().toLocaleString()}<br>
                    From: Meeting Scheduler AI System
                </p>
            </div>
        `;

        await sendGmail(toEmail, subject, htmlContent);
        console.log('📧 Meeting email sent successfully with Google Meet link!');

    } catch (error: any) {
        console.error('❌ Error sending meeting email:', error);
        throw new Error(`Failed to send meeting email: ${error.message}`);
    }
};

// For backward compatibility, you can also export a default object with all functions
export default {
    createMeetingWithGoogleMeet,
    createGoogleMeetLink,
    updateMeeting,
    deleteMeeting,
    getMeetingDetails,
    isConfigured: isGoogleCalendarConfigured,
    sendGmail,
    sendDummyEmail,
    sendMeetingEmailWithMeetLink,
};