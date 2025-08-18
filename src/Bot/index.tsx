import { Telegraf } from 'telegraf';


const BOT_TOKEN = "8336245975:AAEoM8byQhs2I5xAyKJh_HwnSN3SlI04R9k"

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is not defined");
}
// Initialize the bot
const bot = new Telegraf(BOT_TOKEN);

// start command
bot.start((ctx) => {
    // Reply with a prompt for meeting details that contain userName/contact number and meeting description ( Why you want to schedule meeting?)
    ctx.reply("👋 Hello! I'm your AI Meeting Scheduler.\n\n" +
        "Click here to schedule a meeting: /schedule \n\n"
    );
});

// Schedule command
bot.command('schedule', (ctx) => {
    ctx.reply(`Please provide meeting details including contact number, user name and the reason for scheduling the meeting.\n\n` +
        `Format: [Contact Number] [Name] for [Reason]\n` +
        `Example: 99XXXXXXXX John Doe for project discussion`);
});

// Helper function to validate phone number
function isValidPhoneNumber(phone: string): boolean {
    // Remove any spaces, hyphens, or parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    // Check if it's a valid phone number (8-15 digits, optionally starting with +)
    const phoneRegex = /^(\+?\d{8,15})$/;
    return phoneRegex.test(cleanPhone);
}

//user input
bot.on('message', (ctx) => {
    // Skip if it's a command
    if ('text' in ctx.message && ctx.message.text?.startsWith('/')) {
        return;
    }

    // Safely extract text from message if it exists
    const messageText = 'text' in ctx.message ? ctx.message.text : undefined;
    if (!messageText || messageText.trim().length === 0) {
        ctx.reply("Please provide valid meeting details including contact number, person name and reason for the meeting.");
        return;
    }

  
    const parts = messageText.trim().split(' for ');
    if (parts.length < 2) {
        ctx.reply("Please provide meeting details in the correct format:\n\n" +
            `Format: [Contact Number] [Name] for [Reason]\n` +
            `Example: 99XXXXXXXX John Doe for project discussion`);
        return;
    }

    const contactAndName = parts[0].trim();
    const meetingReason = parts[1].trim();

    // Split contact and name part by spaces
    const contactNameParts = contactAndName.split(' ');
    if (contactNameParts.length < 2) {
        ctx.reply("Please include both contact number and name.\n\n" +
            `Format: [Contact Number] [Name] for [Reason]\n` +
            `Example: 99XXXXXXXX John Doe for project discussion`);
        return;
    }

    const contactNumber = contactNameParts[0];
    const personName = contactNameParts.slice(1).join(' ').trim();

    // Validate if the first part is a valid phone number
    if (!isValidPhoneNumber(contactNumber)) {
        ctx.reply("❌ Invalid contact number!\n\n" +
            `Please provide a valid phone number (8-15 digits).\n` +
            `Format: [Contact Number] [Name] for [Reason]\n` +
            `Example: 99XXXXXXXX John Doe for project discussion`);
        return;
    }

    // Validate person name is not empty
    if (!personName || personName.trim().length === 0) {
        ctx.reply("❌ Please provide a valid person name!\n\n" +
            `Format: [Contact Number] [Name] for [Reason]\n` +
            `Example: 99XXXXXXXX John Doe for project discussion`);
        return;
    }

    // Validate meeting reason is not empty
    if (!meetingReason || meetingReason.trim().length === 0) {
        ctx.reply("❌ Please provide a valid meeting reason!\n\n" +
            `Format: [Contact Number] [Name] for [Reason]\n` +
            `Example: 99XXXXXXXX John Doe for project discussion`);
        return;
    }

    // Get user details from Telegram
    const userName = ctx.message.from.first_name + (ctx.message.from.last_name ? ' ' + ctx.message.from.last_name : '');

    ctx.reply(`✅ Meeting Request Received!\n\n` +
        `👤 Requester: ${userName}\n` +
        `📞 Contact: ${contactNumber}\n` +
        `🤝 Meeting with: ${personName}\n` +
        `📋 Reason: ${meetingReason}\n\n` +
        `🤖 Next step: AI will process this request and handle the scheduling conversation.`
    );
})



export default bot;

// Function to start the bot
export const startBot = () => {
    bot.launch();
    console.log("Bot is running...");

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
};
