import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { getConfig } from './lib/config.js';

const config = getConfig();
const bot = new Telegraf(config.botToken);

if (!config.botToken) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

console.log('Bot starting...');
console.log('Allowed channels:', config.allowedChannels);
console.log('Min title length:', config.minTitleLength);

bot.command('start', (ctx) => {
  ctx.reply('Hello! I am the Savebucks bot. I monitor deals channels and help save you money!');
});

bot.command('status', (ctx) => {
  ctx.reply(`Bot Status:
- Allowed channels: ${config.allowedChannels.join(', ') || 'none'}
- Min title length: ${config.minTitleLength}
- Images enabled: ${config.enableImages ? 'yes' : 'no'}`);
});

bot.launch();

console.log('Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
