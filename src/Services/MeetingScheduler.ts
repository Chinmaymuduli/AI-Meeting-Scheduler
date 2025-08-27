import nodemailer from 'nodemailer';
import { config } from '../../config';
import GoogleCalendarService, { GoogleMeetDetails } from './GoogleCalendarService';

export interface MeetingDetails {
    id: string;
    requesterName: string;
    requesterTelegramId: number;
    contactNumber: string;
    personName: string;
    meetingReason: string;
    scheduledDate: Date;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: Date;
    googleMeetDetails?: GoogleMeetDetails;
}

// In-memory storage for meetings
let meetings: MeetingDetails[] = [];

// Initialize Google Calendar service
const googleCalendarService = GoogleCalendarService;

// Generate unique meeting ID
function generateMeetingId(): string {
    return `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get month number from month name
function getMonthNumber(monthName: string): number {
    const months = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3,
        'may': 4, 'june': 5, 'july': 6, 'august': 7,
        'september': 8, 'october': 9, 'november': 10, 'december': 11
    };
    return months[monthName.toLowerCase() as keyof typeof months] || 0;
}

// Parse various date input formats
function parseDateInput(dateInput: string): Date | null {
    const input = dateInput.toLowerCase().trim();

    // Handle relative dates
    if (input.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    }

    if (input.includes('next week')) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek;
    }

    if (input.includes('next month')) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
    }

    // Handle specific date formats
    // Format: "15th December" or "December 15th"
    const dateMatch = input.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = getMonthNumber(dateMatch[2]);
        const year = new Date().getFullYear();

        // If the date has passed this year, schedule for next year
        const date = new Date(year, month, day);
        if (date <= new Date()) {
            date.setFullYear(year + 1);
        }
        return date;
    }

    // Format: "15/12" or "15-12" (day/month)
    const slashMatch = input.match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (slashMatch) {
        const day = parseInt(slashMatch[1]);
        const month = parseInt(slashMatch[2]) - 1; // Month is 0-indexed
        const year = new Date().getFullYear();

        const date = new Date(year, month, day);
        if (date <= new Date()) {
            date.setFullYear(year + 1);
        }
        return date;
    }

    // Format: "15/12/2024" or "15-12-2024" (day/month/year)
    const fullDateMatch = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (fullDateMatch) {
        const day = parseInt(fullDateMatch[1]);
        const month = parseInt(fullDateMatch[2]) - 1;
        const year = parseInt(fullDateMatch[3]);
        return new Date(year, month, day);
    }

    // Try to parse as ISO date string
    const isoDate = new Date(input);
    if (!isNaN(isoDate.getTime())) {
        return isoDate;
    }

    return null;
}

// Create email transporter
function createTransporter(): nodemailer.Transporter {
    // Use Gmail configuration
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.email.gmail.user,
            pass: config.email.gmail.appPassword
        }
    });
    // if (config.email?.smtp) {
    //     // Use SMTP configuration
    //     return nodemailer.createTransport({
    //         host: config.email.smtp.host,
    //         port: config.email.smtp.port,
    //         secure: config.email.smtp.secure,
    //         auth: {
    //             user: config.email.smtp.user,
    //             pass: config.email.smtp.pass
    //         }
    //     });
    // } else if (config.email?.gmail) {
    //     // Use Gmail configuration
    //     return nodemailer.createTransport({
    //         service: 'gmail',
    //         auth: {
    //             user: config.email.gmail.user,
    //             pass: config.email.gmail.appPassword
    //         }
    //     });
    // } else {
    //     throw new Error('No email configuration found');
    // }
}

// Helper methods for generating personalized content
function generatePersonalizedGreeting(name: string): string {
    const greetings = [
        `<p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hello ${name}! 👋</p>`,
        `<p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hi there ${name}! ✨</p>`,
        `<p style="font-size: 18px; color: #333; margin-bottom: 20px;">Greetings ${name}! 🌟</p>`,
        `<p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hey ${name}! 🎉</p>`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
}

function generateMeetingContext(reason: string): string {
    const contexts = [
        `<p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">Great news! Your meeting has been successfully scheduled. This looks like an important discussion about <strong>${reason}</strong>.</p>`,
        `<p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">Perfect! I've scheduled your meeting for <strong>${reason}</strong>. This should be a productive session.</p>`,
        `<p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">Excellent! Your meeting is now on the calendar. The purpose: <strong>${reason}</strong> - sounds important!</p>`
    ];
    return contexts[Math.floor(Math.random() * contexts.length)];
}

function generateNextSteps(personName: string): string {
    const steps = [
        `<p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">I'll now reach out to <strong>${personName}</strong> to confirm their availability and finalize the details.</p>`,
        `<p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">Next, I'll contact <strong>${personName}</strong> to ensure they're available and lock in the meeting time.</p>`,
        `<p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">I'm now reaching out to <strong>${personName}</strong> to confirm everything and get this meeting locked in.</p>`
    ];
    return steps[Math.floor(Math.random() * steps.length)];
}

function generatePersonalizedSignature(): string {
    const signatures = [
        `<p style="font-size: 16px; color: #333; margin-top: 30px;">Best regards,<br><strong>Your AI Meeting Assistant</strong> 🤖✨</p>`,
        `<p style="font-size: 16px; color: #333; margin-top: 30px;">Cheers,<br><strong>Your Smart Scheduler</strong> 🎯🚀</p>`,
        `<p style="font-size: 16px; color: #333; margin-top: 30px;">Warm regards,<br><strong>Your AI Meeting Partner</strong> 💫🤝</p>`
    ];
    return signatures[Math.floor(Math.random() * signatures.length)];
}

function generateAdminGreeting(): string {
    const greetings = [
        `<p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hello Admin! 👨‍💼</p>`,
        `<p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hi there! 📊</p>`,
        `<p style="font-size: 18px; color: #333; margin-bottom: 20px;">Greetings! 🔔</p>`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
}

function generateMeetingSummary(meeting: MeetingDetails): string {
    const summaries = [
        `<p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">A new meeting request has been processed through the AI Meeting Scheduler. The requester, <strong>${meeting.requesterName}</strong>, has scheduled a meeting with <strong>${meeting.personName}</strong>.</p>`,
        `<p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">The AI system has successfully scheduled a meeting between <strong>${meeting.requesterName}</strong> and <strong>${meeting.personName}</strong>. This meeting is now in the system.</p>`,
        `<p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">Meeting request processed: <strong>${meeting.requesterName}</strong> → <strong>${meeting.personName}</strong>. The AI scheduler has confirmed the appointment.</p>`
    ];
    return summaries[Math.floor(Math.random() * summaries.length)];
}

function generateActionItems(meeting: MeetingDetails): string {
    const actions = [
        `<div style="background-color: #fff3cd; padding: 20px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">⚡ Action Required</h3>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
                <li>Review meeting details and confirm</li>
                <li>Check availability of ${meeting.personName}</li>
                <li>Update meeting status if needed</li>
                <li>Prepare any necessary materials</li>
            </ul>
        </div>`,
        `<div style="background-color: #d1ecf1; padding: 20px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #17a2b8;">
            <h3 style="margin: 0 0 15px 0; color: #0c5460;">📋 Next Steps</h3>
            <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
                <li>Verify meeting details are correct</li>
                <li>Contact ${meeting.personName} to confirm</li>
                <li>Update calendar and systems</li>
                <li>Monitor meeting status</li>
            </ul>
        </div>`
    ];
    return actions[Math.floor(Math.random() * actions.length)];
}

function generateAdminSignature(): string {
    const signatures = [
        `<p style="font-size: 16px; color: #333; margin-top: 30px;">Best regards,<br><strong>AI Meeting Scheduler</strong> 🤖📅</p>`,
        `<p style="margin-top: 30px;"><strong>AI Meeting Scheduler</strong><br>Automated notification system</p>`
    ];
    return signatures[Math.floor(Math.random() * signatures.length)];
}

// Generate personalized subject line for user
function generateUserSubject(meeting: MeetingDetails): string {
    const formattedDate = meeting.scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const subjects = [
        `✅ Meeting Confirmed: ${meeting.personName} on ${meeting.scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        `📅 Your meeting with ${meeting.personName} is scheduled!`,
        `🤝 Meeting scheduled: ${meeting.meetingReason} on ${formattedDate}`,
        `📋 Confirmation: ${meeting.personName} meeting on ${formattedDate}`,
        `🎯 Meeting booked: ${meeting.meetingReason} - ${formattedDate}`
    ];

    // Use meeting details to create contextual subject
    const timeOfDay = meeting.scheduledDate.getHours();
    if (timeOfDay < 12) {
        subjects.push(`🌅 Morning meeting confirmed: ${meeting.personName}`);
    } else if (timeOfDay < 17) {
        subjects.push(`☀️ Afternoon meeting set: ${meeting.personName}`);
    } else {
        subjects.push(`🌙 Evening meeting scheduled: ${meeting.personName}`);
    }

    return subjects[Math.floor(Math.random() * subjects.length)];
}

// Generate personalized subject line for admin
function generateAdminSubject(meeting: MeetingDetails): string {
    const formattedDate = meeting.scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const subjects = [
        `📅 New Meeting: ${meeting.requesterName} → ${meeting.personName}`,
        `🆕 Meeting Request: ${meeting.meetingReason}`,
        `📋 New Schedule: ${meeting.personName} on ${formattedDate}`,
        `🤝 Meeting Added: ${meeting.requesterName} for ${meeting.meetingReason}`,
        `📞 New Call: ${meeting.personName} - ${meeting.meetingReason}`
    ];

    return subjects[Math.floor(Math.random() * subjects.length)];
}

// Generate personalized HTML email for user
function generateUserEmailHTML(meeting: MeetingDetails, formattedDate: string, formattedTime: string): string {
    const greeting = generatePersonalizedGreeting(meeting.requesterName);
    const meetingContext = generateMeetingContext(meeting.meetingReason);
    const nextSteps = generateNextSteps(meeting.personName);
    const signature = generatePersonalizedSignature();

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 300;">🎯 Meeting Confirmed!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your AI-powered meeting scheduler</p>
            </div>
            
            <div style="padding: 40px 30px;">
                ${greeting}
                
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 15px; margin: 30px 0; color: white; text-align: center;">
                    <h2 style="margin: 0 0 15px 0; font-size: 24px;">📅 Meeting Details</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left;">
                        <div>
                            <p style="margin: 5px 0;"><strong>👤 Meeting with:</strong> ${meeting.personName}</p>
                            <p style="margin: 5px 0;"><strong>📞 Contact:</strong> ${meeting.contactNumber}</p>
                            <p style="margin: 5px 0;"><strong>📋 Purpose:</strong> ${meeting.meetingReason}</p>
                        </div>
                        <div>
                            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${formattedTime}</p>
                            <p style="margin: 5px 0;"><strong>🆔 ID:</strong> ${meeting.id}</p>
                        </div>
                    </div>
                    ${meeting.googleMeetDetails ? `
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
                        <p style="margin: 10px 0; font-size: 18px;"><strong>🔗 Google Meet Link:</strong></p>
                        <a href="${meeting.googleMeetDetails.meetingLink}" 
                           style="display: inline-block; background-color: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0;">
                            🎥 Join Google Meet
                        </a>
                        <p style="margin: 5px 0; font-size: 14px; opacity: 0.9;">Click the button above to join your meeting</p>
                    </div>
                    ` : ''}
                </div>
                
                ${meetingContext}
                ${nextSteps}
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #667eea;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">💡 What happens next?</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #555;">
                        <li>We'll contact ${meeting.personName} to confirm availability</li>
                        <li>You'll receive updates on the meeting status</li>
                        <li>Any changes will be communicated promptly</li>
                    </ul>
                </div>
                
                ${signature}
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
                <p style="margin: 0;">This email was generated by your AI Meeting Scheduler</p>
                <p style="margin: 5px 0;">Meeting ID: ${meeting.id}</p>
            </div>
        </div>
    `;
}

// Generate personalized HTML email for admin
function generateAdminEmailHTML(meeting: MeetingDetails, formattedDate: string, formattedTime: string): string {
    const greeting = generateAdminGreeting();
    const meetingSummary = generateMeetingSummary(meeting);
    const actionItems = generateActionItems(meeting);
    const signature = generateAdminSignature();

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📅 New Meeting Scheduled</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">AI Meeting Scheduler Notification</p>
            </div>
            
            <div style="padding: 40px 30px;">
                ${greeting}
                
                <div style="background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%); padding: 25px; border-radius: 15px; margin: 30px 0; color: white;">
                    <h2 style="margin: 0 0 15px 0; font-size: 24px;">📋 Meeting Summary</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <p style="margin: 5px 0;"><strong>👤 Requester:</strong> ${meeting.requesterName}</p>
                            <p style="margin: 5px 0;"><strong>🆔 Telegram ID:</strong> ${meeting.requesterTelegramId}</p>
                            <p style="margin: 5px 0;"><strong>📞 Contact:</strong> ${meeting.contactNumber}</p>
                        </div>
                        <div>
                            <p style="margin: 5px 0;"><strong>🤝 Meeting with:</strong> ${meeting.personName}</p>
                            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${formattedTime}</p>
                        </div>
                    </div>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
                        <p style="margin: 5px 0;"><strong>📋 Purpose:</strong> ${meeting.meetingReason}</p>
                        <p style="margin: 5px 0;"><strong>🆔 Meeting ID:</strong> ${meeting.id}</p>
                        <p style="margin: 5px 0;"><strong>⏱️ Scheduled at:</strong> ${meeting.createdAt.toLocaleString()}</p>
                        ${meeting.googleMeetDetails ? `
                        <p style="margin: 5px 0;"><strong>🔗 Google Meet:</strong> <a href="${meeting.googleMeetDetails.meetingLink}" style="color: white; text-decoration: underline;">Join Meeting</a></p>
                        ` : ''}
                    </div>
                </div>
                
                ${meetingSummary}
                ${actionItems}
                
                ${signature}
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
                <p style="margin: 0;">AI Meeting Scheduler - Admin Notification</p>
                <p style="margin: 5px 0;">Meeting ID: ${meeting.id}</p>
            </div>
        </div>
    `;
}

// Generate AI-powered personalized email content
function generateAIEmailContent(meeting: MeetingDetails, recipientType: 'user' | 'admin'): { subject: string; html: string } {
    const formattedDate = meeting.scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const formattedTime = meeting.scheduledDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (recipientType === 'user') {
        // AI-generated personalized email for the user
        const subject = generateUserSubject(meeting);
        const html = generateUserEmailHTML(meeting, formattedDate, formattedTime);
        return { subject, html };
    } else {
        // AI-generated personalized email for the admin
        const subject = generateAdminSubject(meeting);
        const html = generateAdminEmailHTML(meeting, formattedDate, formattedTime);
        return { subject, html };
    }
}

// Send confirmation email to user
async function sendUserConfirmation(meeting: MeetingDetails): Promise<void> {
    const transporter = createTransporter();

    // Generate AI-powered personalized email content
    const emailContent = generateAIEmailContent(meeting, 'user');

    const mailOptions = {
        from: config.email?.fromEmail || 'noreply@meetingscheduler.com',
        to: config.email?.userEmail,
        subject: emailContent.subject,
        html: emailContent.html
    };

    await transporter.sendMail(mailOptions);
}

// Send notification email to admin
async function sendAdminNotification(meeting: MeetingDetails): Promise<void> {
    const transporter = createTransporter();

    // Generate AI-powered personalized email content
    const emailContent = generateAIEmailContent(meeting, 'admin');

    const mailOptions = {
        from: config.email?.fromEmail || 'noreply@meetingscheduler.com',
        to: config.email?.adminEmail,
        subject: emailContent.subject,
        html: emailContent.html
    };

    await transporter.sendMail(mailOptions);
}

// Send email confirmations to both user and admin
async function sendEmailConfirmations(meeting: MeetingDetails): Promise<void> {
    try {
        // Send confirmation to user's email (if available)
        if (config.email?.userEmail) {
            await sendUserConfirmation(meeting);
        }

        // Send notification to admin email
        if (config.email?.adminEmail) {
            await sendAdminNotification(meeting);
        }
    } catch (error) {
        console.error('Error sending email confirmations:', error);
    }
}

// Schedule a new meeting
export async function scheduleMeeting(
    requesterName: string,
    requesterTelegramId: number,
    contactNumber: string,
    personName: string,
    meetingReason: string,
    dateInput: string
): Promise<MeetingDetails> {
    // Parse the date input
    const scheduledDate = parseDateInput(dateInput);

    if (!scheduledDate) {
        throw new Error('Invalid date format. Please provide a valid date.');
    }

    // Check if date is in the future
    if (scheduledDate <= new Date()) {
        throw new Error('Meeting date must be in the future.');
    }

    const meeting: MeetingDetails = {
        id: generateMeetingId(),
        requesterName,
        requesterTelegramId,
        contactNumber,
        personName,
        meetingReason,
        scheduledDate,
        status: 'pending',
        createdAt: new Date()
    };

    // Create Google Meet link if service is configured
    if (googleCalendarService.isConfigured()) {
        try {
            // Set meeting duration to 1 hour by default
            const endTime = new Date(scheduledDate.getTime() + 60 * 60 * 1000);

            // Create attendees list (you might want to extract emails from config or user input)
            const attendees: string[] = [];
            if (config.email?.adminEmail) attendees.push(config.email.adminEmail);
            if (config.email?.userEmail) attendees.push(config.email.userEmail);

            const googleMeetDetails = await googleCalendarService.createMeetingWithGoogleMeet(
                `Meeting: ${meetingReason}`,
                `Meeting between ${requesterName} and ${personName}. Reason: ${meetingReason}`,
                scheduledDate,
                endTime,
                attendees,
                'Google Meet'
            );

            meeting.googleMeetDetails = googleMeetDetails;
        } catch (error) {
            console.error('Failed to create Google Meet link:', error);
            // Continue without Google Meet if it fails
        }
    }

    meetings.push(meeting);

    // Send email confirmations
    await sendEmailConfirmations(meeting);

    return meeting;
}

// Get all meetings
export function getMeetings(): MeetingDetails[] {
    return [...meetings];
}

// Get meeting by ID
export function getMeetingById(id: string): MeetingDetails | undefined {
    return meetings.find(meeting => meeting.id === id);
}

// Update meeting status
export function updateMeetingStatus(id: string, status: MeetingDetails['status']): boolean {
    const meeting = meetings.find(m => m.id === id);
    if (meeting) {
        meeting.status = status;
        return true;
    }
    return false;
}

// Delete meeting
export function deleteMeeting(id: string): boolean {
    const index = meetings.findIndex(m => m.id === id);
    if (index !== -1) {
        const meeting = meetings[index];

        // Delete from Google Calendar if exists
        if (meeting.googleMeetDetails?.eventId && googleCalendarService.isConfigured()) {
            googleCalendarService.deleteMeeting(meeting.googleMeetDetails.eventId)
                .catch((error: any) => console.error('Failed to delete Google Meet:', error));
        }

        meetings.splice(index, 1);
        return true;
    }
    return false;
}

// Update meeting with Google Meet integration
async function updateMeetingWithGoogleMeet(
    id: string,
    updates: Partial<MeetingDetails>
): Promise<boolean> {
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return false;

    // Update local meeting data
    Object.assign(meeting, updates);

    // Update Google Calendar if exists and service is configured
    if (meeting.googleMeetDetails?.eventId && googleCalendarService.isConfigured()) {
        try {
            const calendarUpdates: any = {};

            if (updates.meetingReason) {
                calendarUpdates.summary = `Meeting: ${updates.meetingReason}`;
                calendarUpdates.description = `Meeting between ${meeting.requesterName} and ${meeting.personName}. Reason: ${updates.meetingReason}`;
            }

            if (updates.scheduledDate) {
                calendarUpdates.startTime = updates.scheduledDate;
                calendarUpdates.endTime = new Date(updates.scheduledDate.getTime() + 60 * 60 * 1000);
            }

            await googleCalendarService.updateMeeting(meeting.googleMeetDetails.eventId, calendarUpdates);
        } catch (error) {
            console.error('Failed to update Google Meet:', error);
        }
    }

    return true;
}

// Get Google Meet link for a meeting
function getGoogleMeetLink(meetingId: string): string | null {
    const meeting = meetings.find(m => m.id === meetingId);
    return meeting?.googleMeetDetails?.meetingLink || null;
}

// Export the MeetingDetails interface and all functions
export {
    generateMeetingId,
    getMonthNumber,
    parseDateInput,
    createTransporter,
    generatePersonalizedGreeting,
    generateMeetingContext,
    generateNextSteps,
    generatePersonalizedSignature,
    generateAdminGreeting,
    generateMeetingSummary,
    generateActionItems,
    generateAdminSignature,
    generateUserSubject,
    generateAdminSubject,
    generateUserEmailHTML,
    generateAdminEmailHTML,
    generateAIEmailContent,
    sendUserConfirmation,
    sendAdminNotification,
    sendEmailConfirmations,
    updateMeetingWithGoogleMeet,
    getGoogleMeetLink
};
