const { sendDummyEmail } = require('./dist/src/Services/GoogleCalendarService');

async function testGmail() {
    try {
        console.log('🚀 Testing Gmail functionality...');
        console.log('📧 Sending test email to: chinmaymuduli0@gmail.com');

        await sendDummyEmail('chinmaymuduli0@gmail.com');

        console.log('✅ Test email sent successfully!');
        console.log('📬 Check your inbox at chinmaymuduli0@gmail.com');

    } catch (error) {
        console.error('❌ Error sending test email:', error.message);
        console.log('\n🔧 Make sure you have configured the following environment variables:');
        console.log('   - GMAIL_USER: Your Gmail address');
        console.log('   - GMAIL_APP_PASSWORD: Your Gmail app password');
        console.log('   - FROM_EMAIL: The email address to send from');
    }
}

// Run the test
testGmail();
