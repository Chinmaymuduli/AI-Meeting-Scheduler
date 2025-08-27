import { google } from 'googleapis';
import { config } from '../../config';

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

// For backward compatibility, you can also export a default object with all functions
export default {
    createMeetingWithGoogleMeet,
    createGoogleMeetLink,
    updateMeeting,
    deleteMeeting,
    getMeetingDetails,
    isConfigured: isGoogleCalendarConfigured,
};