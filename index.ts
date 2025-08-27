
import { startBot } from './src/Bot/index';
import './src/server';

console.log('Starting Meeting Schedule AI Bot and Voice Server...');

// Start the Telegram bot
startBot();

console.log('✅ Both services started successfully!');
console.log('🤖 Telegram Bot: Running');
console.log('📞 Voice AI Server: Running on port 8080');