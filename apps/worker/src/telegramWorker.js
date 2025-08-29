import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import { parseTelegramText } from '@savebucks/shared/src/telegramParser.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED = (process.env.TELEGRAM_ALLOWED_CHANNELS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
const MIN_TITLE_LEN = Number(process.env.TELEGRAM_MIN_TITLE_LEN || 12);

if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN missing');

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
const bot = new Telegraf(BOT_TOKEN);

function allowChat(ctx) {
  const t = ctx.chat?.type;
  if (t !== 'channel') return false;
  const u = (ctx.chat?.username || '').toLowerCase();
  return ALLOWED.length === 0 || ALLOWED.includes(u);
}

async function insertDeal(obj, submitter_note) {
  const row = {
    title: (obj.title && obj.title.length >= MIN_TITLE_LEN) ? obj.title : (obj.merchant || 'Deal'),
    url: obj.url,
    price: obj.price ?? null,
    merchant: obj.merchant ?? null,
    image_url: null,
    status: 'pending',
    description: submitter_note || null
  };

  const { data: near } = await supa.rpc('find_similar_deal', { p_title: row.title, p_days: 7, p_threshold: 0.55 });
  if (near?.length && near[0].sim >= 0.6) {
    console.log(`[tg] skipping near-dup: "${row.title}" (similarity: ${near[0].sim.toFixed(2)})`);
    return null;
  }

  const { data, error } = await supa.from('deals').insert([row]).select().maybeSingle();
  if (error && !/duplicate key|unique/i.test(error.message)) throw error;
  return data;
}

bot.on(['channel_post','edited_channel_post'], async (ctx) => {
  try {
    if (!allowChat(ctx)) return;
    const msg = ctx.update.channel_post || ctx.update.edited_channel_post;
    const text = msg?.text || msg?.caption || '';
    const parsed = parseTelegramText(text);
    if (!parsed?.url) return;

    await insertDeal(parsed, `telegram:${ctx.chat?.username || ctx.chat?.id}`);
  } catch (e) {
    console.error('[tg ingest error]', e.message);
  }
});

(async () => {
  console.log('[tg] starting long polling… allowed channels:', ALLOWED);
  await bot.launch();
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
