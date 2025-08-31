import 'dotenv/config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || 'dev';
const API_BASE = process.env.API_BASE || 'http://localhost:4000';

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const webhookUrl = `${API_BASE}/ingest/telegram/${WEBHOOK_SECRET}`;

console.log('Setting up Telegram webhook...');
console.log('Bot Token:', BOT_TOKEN.substring(0, 10) + '...');
console.log('Webhook URL:', webhookUrl);
console.log('Webhook Secret:', WEBHOOK_SECRET);
console.log('');

// Set webhook
const setWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

try {
  const response = await fetch(setWebhookUrl);
  const result = await response.json();
  
  if (result.ok) {
    console.log('✅ Webhook set successfully!');
    console.log('Result:', result);
  } else {
    console.error('❌ Failed to set webhook:', result);
  }
} catch (error) {
  console.error('❌ Error setting webhook:', error.message);
}

console.log('');
console.log('To check webhook status, run:');
console.log(`curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq .`);
