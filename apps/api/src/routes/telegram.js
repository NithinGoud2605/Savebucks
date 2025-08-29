import { Router } from 'express';
import { Telegraf } from 'telegraf';
import { makeAdminClient } from '../lib/supa.js';
import { parseTelegramText } from '@savebucks/shared/src/telegramParser.js';

const r = Router();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || 'dev';
const ALLOWED = (process.env.TELEGRAM_ALLOWED_CHANNELS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
const MIN_TITLE_LEN = Number(process.env.TELEGRAM_MIN_TITLE_LEN || 12);
if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN missing');

const bot = new Telegraf(BOT_TOKEN);
const supa = makeAdminClient();

function allowChat(update) {
  const post = update.channel_post || update.edited_channel_post;
  const chat = post?.chat;
  if (!chat || chat.type !== 'channel') return false;
  const u = (chat.username || '').toLowerCase();
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
    console.log(`[tg webhook] skipping near-dup: "${row.title}" (similarity: ${near[0].sim.toFixed(2)})`);
    return;
  }

  const { error } = await supa.from('deals').insert([row]);
  if (error && !/duplicate key|unique/i.test(error.message)) throw error;
}

r.post(`/ingest/telegram/${WEBHOOK_SECRET}`, async (req, res) => {
  try {
    const update = req.body || {};
    const post = update.channel_post || update.edited_channel_post;
    if (!post) return res.json({ ok: true });

    if (!allowChat(update)) return res.json({ ok: true });

    const text = post.text || post.caption || '';
    const parsed = parseTelegramText(text);
    if (parsed?.url) {
      await insertDeal(parsed, `telegram:${post.chat?.username || post.chat?.id}`);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('[tg webhook error]', e.message);
    res.status(200).json({ ok: true });
  }
});

export default r;
