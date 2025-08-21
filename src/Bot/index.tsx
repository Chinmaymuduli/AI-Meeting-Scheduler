import { Telegraf } from "telegraf";
import { makeCall, getCallStatus, isReady } from "../Services/TwilioService";
import { config } from "../../config";


const BOT_TOKEN = config.bot.token;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined");
}
// Initialize the bot
const bot = new Telegraf(BOT_TOKEN);



// start command
bot.start((ctx) => {
  // Reply with a prompt for meeting details that contain userName/contact number and meeting description ( Why you want to schedule meeting?)
  ctx.reply(
    "👋 Hello! I'm your AI Meeting Scheduler.\n\n" +
      "Click here to schedule a meeting: /schedule \n\n"
  );
});

// Schedule command
bot.command("schedule", (ctx) => {
  ctx.reply(
    `Please provide meeting details including contact number, user name and the reason for scheduling the meeting.\n\n` +
      `Format: [Contact Number] [Name] for [Reason]\n` +
      `Example: 99XXXXXXXX John Doe for project discussion`
  );
});

// Helper function to validate phone number
function isValidPhoneNumber(phone: string): boolean {
  // Remove any spaces, hyphens, or parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, "");
  // Check if it's a valid phone number (8-15 digits, optionally starting with +)
  const phoneRegex = /^(\+?\d{8,15})$/;
  return phoneRegex.test(cleanPhone);
}

//user input
bot.on("message", (ctx) => {
  // Skip if it's a command
  if ("text" in ctx.message && ctx.message.text?.startsWith("/")) {
    return;
  }

  // Safely extract text from message if it exists
  const messageText = "text" in ctx.message ? ctx.message.text : undefined;
  if (!messageText || messageText.trim().length === 0) {
    ctx.reply(
      "Please provide valid meeting details including contact number, person name and reason for the meeting."
    );
    return;
  }

  const parts = messageText.trim().split(" for ");
  if (parts.length < 2) {
    ctx.reply(
      "Please provide meeting details in the correct format:\n\n" +
        `Format: [Contact Number] [Name] for [Reason]\n` +
        `Example: 99XXXXXXXX John Doe for project discussion`
    );
    return;
  }

  const contactAndName = parts[0].trim();
  const meetingReason = parts[1].trim();

  // Split contact and name part by spaces
  const contactNameParts = contactAndName.split(" ");
  if (contactNameParts.length < 2) {
    ctx.reply(
      "Please include both contact number and name.\n\n" +
        `Format: [Contact Number] [Name] for [Reason]\n` +
        `Example: 99XXXXXXXX John Doe for project discussion`
    );
    return;
  }

  const contactNumber = contactNameParts[0];
  const personName = contactNameParts.slice(1).join(" ").trim();

  // Validate if the first part is a valid phone number
  if (!isValidPhoneNumber(contactNumber)) {
    ctx.reply(
      "❌ Invalid contact number!\n\n" +
        `Please provide a valid phone number (8-15 digits).\n` +
        `Format: [Contact Number] [Name] for [Reason]\n` +
        `Example: 99XXXXXXXX John Doe for project discussion`
    );
    return;
  }

  // Validate person name is not empty
  if (!personName || personName.trim().length === 0) {
    ctx.reply(
      "❌ Please provide a valid person name!\n\n" +
        `Format: [Contact Number] [Name] for [Reason]\n` +
        `Example: 99XXXXXXXX John Doe for project discussion`
    );
    return;
  }

  // Validate meeting reason is not empty
  if (!meetingReason || meetingReason.trim().length === 0) {
    ctx.reply(
      "❌ Please provide a valid meeting reason!\n\n" +
        `Format: [Contact Number] [Name] for [Reason]\n` +
        `Example: 99XXXXXXXX John Doe for project discussion`
    );
    return;
  }

  // Get user details from Telegram
  const userName =
    ctx.message.from.first_name +
    (ctx.message.from.last_name ? " " + ctx.message.from.last_name : "");

  // Send initial confirmation
  ctx.reply(
    `✅ Meeting Request Received!\n\n` +
      `👤 Requester: ${userName}\n` +
      `📞 Contact: ${contactNumber}\n` +
      `🤝 Meeting with: ${personName}\n` +
      `📋 Reason: ${meetingReason}\n\n` +
      `📞 Initiating call to ${contactNumber}...`
  );

  // Automatically call the provided number
  initiateCall(ctx, contactNumber, personName, meetingReason, userName);
});

// Function to initiate call using Twilio
async function initiateCall(
  ctx: any,
  contactNumber: string,
  personName: string,
  meetingReason: string,
  requesterName: string
) {
  try {
    // Check if Twilio service is configured
    if (!isReady()) {
      ctx.reply(
        `⚠️ Twilio service not configured. Please set up your Twilio credentials.\n\n` +
          `📋 Meeting details saved:\n` +
          `📞 Contact: ${contactNumber}\n` +
          `🤝 Meeting with: ${personName}\n` +
          `📋 Reason: ${meetingReason}`
      );
      return;
    }

      const callMessage = `Hello ${personName}! I’m calling on behalf of ${requesterName}.The context is ${meetingReason}.Would you like to schedule a meeting?`;

    // Make the call
    const callResult = await makeCall({
      to: contactNumber,
      message: callMessage,
      timeout: 30,
      record: false,
    });

    if (callResult.success) {
      console.log(
        `🎉 Call initiated successfully!\n\n` +
          `📞 Calling ${personName} at ${contactNumber}\n` +
          `🆔 Call ID: ${callResult.callSid}\n` +
          `📊 Status: ${callResult.status}\n\n` +
          `The recipient will receive an automated call with meeting details.`
      );

      // You can add call status tracking here
      trackCallStatus(ctx, callResult.callSid!, contactNumber, personName);
    } else {
      ctx.reply(
        `❌ Failed to initiate call to ${contactNumber}\n\n` +
          `Error: ${callResult.error}\n\n` +
          `📋 Meeting details saved for manual follow-up:\n` +
          `📞 Contact: ${contactNumber}\n` +
          `🤝 Meeting with: ${personName}\n` +
          `📋 Reason: ${meetingReason}`
      );
    }
  } catch (error) {
    console.error("Error in initiateCall:", error);
  }
}

// Function to track call status (optional enhancement)
async function trackCallStatus(
  ctx: any,
  callSid: string,
  contactNumber: string,
  personName: string
) {
  try {
    // Wait a few seconds before checking status
    setTimeout(async () => {
      const status = await getCallStatus(callSid);

      let statusMessage = "";
      switch (status.status) {
        case "completed":
          statusMessage = `✅ Call to ${personName} (${contactNumber}) completed successfully!`;
          if (status.duration) {
            statusMessage += `\n⏱️ Duration: ${status.duration} seconds`;
          }
          break;
        case "busy":
          statusMessage = `📞 ${personName}'s phone was busy. You may want to try again later.`;
          break;
        case "no-answer":
          statusMessage = `📞 No answer from ${personName}. The call will be retried automatically.`;
          break;
        case "failed":
          statusMessage = `❌ Call to ${personName} failed. Please check the phone number and try again.`;
          break;
        case "canceled":
          statusMessage = `🚫 Call to ${personName} was canceled.`;
          break;
        default:
          statusMessage = `📞 Call status update: ${status.status}`;
      }
      console.log(`📊 Call Status Update\n\n${statusMessage}`);
    }, 10000); // Check status after 10 seconds
  } catch (error) {
    console.error("Error tracking call status:", error);
  }
}

export default bot;

// Function to start the bot
export const startBot = () => {
  bot.launch();
  console.log("Bot is running...");

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};
