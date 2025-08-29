export function getConfig() {
  const allowedChannels = process.env.TELEGRAM_ALLOWED_CHANNELS
    ? process.env.TELEGRAM_ALLOWED_CHANNELS.split(',').map(s => s.trim())
    : [];

  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowedChannels,
    minTitleLength: parseInt(process.env.TELEGRAM_MIN_TITLE_LEN || '12'),
    enableImages: process.env.TELEGRAM_ENABLE_IMAGES === 'true',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE
  };
}

export function isAllowedChannel(username) {
  const config = getConfig();
  return config.allowedChannels.includes(username);
}
