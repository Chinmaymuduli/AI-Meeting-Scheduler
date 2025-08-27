#!/usr/bin/env node

/**
 * Test script for Google Meet integration
 * Run with: node test-google-meet.js
 */

const { scheduleMeeting, getMeetings, getGoogleMeetLink } = require('./dist/Services/MeetingScheduler');

async function testGoogleMeetIntegration() {
    console.log('🧪 Testing Google Meet Integration...\n');

    try {
        // Test 1: Schedule a meeting
        console.log('📅 Test 1: Scheduling a meeting...');
        const meeting = await scheduleMeeting(
            'John Doe',
            123456789,
            '+1234567890',
            'Jane Smith',
            'Project Discussion',
            'tomorrow'
        );

        console.log('✅ Meeting scheduled successfully!');
        console.log(`   Meeting ID: ${meeting.id}`);
        console.log(`   Scheduled for: ${meeting.scheduledDate.toLocaleString()}`);

        if (meeting.googleMeetDetails) {
            console.log(`   Google Meet Link: ${meeting.googleMeetDetails.meetingLink}`);
            console.log(`   Calendar Event ID: ${meeting.googleMeetDetails.eventId}`);
        } else {
            console.log('   ⚠️  No Google Meet link created (check Google API configuration)');
        }

        console.log('');

        // Test 2: Get all meetings
        console.log('📋 Test 2: Retrieving all meetings...');
        const meetings = getMeetings();
        console.log(`✅ Found ${meetings.length} meeting(s)`);

        meetings.forEach((m, index) => {
            console.log(`   ${index + 1}. ${m.requesterName} → ${m.personName} (${m.status})`);
            if (m.googleMeetDetails) {
                console.log(`      🔗 Google Meet: ${m.googleMeetDetails.meetingLink}`);
            }
        });

        console.log('');

        // Test 3: Get Google Meet link
        console.log('🔗 Test 3: Getting Google Meet link...');
        const meetLink = getGoogleMeetLink(meeting.id);
        if (meetLink) {
            console.log(`✅ Google Meet link: ${meetLink}`);
        } else {
            console.log('❌ No Google Meet link found');
        }

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);

        if (error.message.includes('Google Meet')) {
            console.log('\n💡 Tip: Make sure you have configured Google API credentials:');
            console.log('   1. Check GOOGLE_API_SETUP.md for setup instructions');
            console.log('   2. Verify your .env file has the required Google API variables');
            console.log('   3. Ensure Google Calendar API is enabled in your Google Cloud project');
        }
    }
}

// Run the test
if (require.main === module) {
    testGoogleMeetIntegration();
}

module.exports = { testGoogleMeetIntegration };
