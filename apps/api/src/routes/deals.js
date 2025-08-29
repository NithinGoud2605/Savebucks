import { Router } from 'express';
import { hotScore, normalizeUrl } from '@savebucks/shared';
import { makeAdminClient } from '../lib/supa.js';
import { makeUserClientFromToken } from '../lib/supaUser.js';
import { sanitizeInput } from '../lib/security.js';
import { makeLimiter, userOrIp, ipKey } from '../lib/limiter.js';
import { denyShadowBanned } from '../middleware/denyShadowBanned.js';
import { postDealSchema, voteSchema, commentSchema, cleanText } from '../lib/validate.js';

const r = Router();
const supaAdmin = makeAdminClient();

let currentReq = null;

const limitPosts = () => makeLimiter({
  key: () => `posts:${userOrIp(currentReq)}`,
  limit: Number(process.env.RL_POSTS_PER_DAY || 5),
  windowSec: 24 * 3600,
  prefix: 'posts'
});

const limitVotesHourly = () => makeLimiter({
  key: () => `votes:${userOrIp(currentReq)}`,
  limit: Number(process.env.RL_VOTES_PER_HOUR || 60),
  windowSec: 3600,
  prefix: 'votes:h'
});

const limitPerDealCooldown = (dealId) => makeLimiter({
  key: () => `voteOne:${userOrIp(currentReq)}:${dealId}`,
  limit: 1,
  windowSec: Number(process.env.RL_PER_DEAL_VOTE_COOLDOWN_SEC || 10),
  prefix: 'votes:deal'
});

const limitCommentsCooldown = () => makeLimiter({
  key: () => `comment:${userOrIp(currentReq)}`,
  limit: 1,
  windowSec: Number(process.env.RL_COMMENTS_COOLDOWN_SEC || 10),
  prefix: 'comments'
});

function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

async function listDeals(tab) {
  const { data, error } = await supaAdmin
    .from('deals')
    .select('id,title,url,price,merchant,created_at,approved_at,status')
    .eq('status','approved')
    .order('approved_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  const now = Math.floor(Date.now() / 1000);

  let voteMap = new Map();
  try {
    const { data: votesAgg } = await supaAdmin.rpc('get_votes_agg');
    (votesAgg || []).forEach(v => voteMap.set(v.deal_id, v));
  } catch (_) {}

  const enriched = data.map(d => {
    const createdSec = Math.floor(new Date(d.created_at).getTime() / 1000);
    const v = voteMap.get(d.id) || { ups: 0, downs: 0 };
    return {
      id: d.id,
      title: d.title,
      url: d.url,
      price: d.price,
      merchant: d.merchant,
      created: createdSec,
      ups: v.ups || 0,
      downs: v.downs || 0,
      hot: hotScore(v.ups || 0, v.downs || 0, createdSec, now)
    };
  });

  if (tab === 'new') return enriched.sort((a,b)=>b.created - a.created);
  if (tab === 'trending') return enriched.sort((a,b)=>(b.ups - b.downs) - (a.ups - a.downs));
  return enriched.sort((a,b)=>b.hot - a.hot);
}

r.get('/api/deals', async (req, res) => {
  try {
    const tab = (req.query.tab || 'hot').toString();
    const items = await listDeals(tab);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Deal detail (includes comments + vote agg) */
r.get('/api/deals/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: d, error: dErr } = await supaAdmin
      .from('deals')
      .select('id,title,url,price,merchant,description,image_url,created_at,status')
      .eq('id', id)
      .single();
    if (dErr) return res.status(404).json({ error: 'not found' });

    const { data: comments = [] } = await supaAdmin
      .from('comments')
      .select('id,user_id,body,parent_id,created_at')
      .order('created_at', { ascending: true });

    const { data: agg } = await supaAdmin.rpc('get_votes_for_deal', { p_deal_id: id });
    const ups = agg?.ups || 0, downs = agg?.downs || 0;
    const created = Math.floor(new Date(d.created_at).getTime()/1000);
    const now = Math.floor(Date.now()/1000);

    res.json({
      id: d.id, title: d.title, url: d.url, price: d.price, merchant: d.merchant,
      description: d.description, image_url: d.image_url, created,
      ups, downs, hot: hotScore(ups, downs, created, now),
      comments
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Create deal (JWT required; RLS + trigger sets submitter_id) */
r.post('/api/deals', async (req, res, next) => { currentReq = req; next(); }, denyShadowBanned, async (req, res) => {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'auth required' });
    const supaUser = makeUserClientFromToken(token);

    // rate limit
    const take = limitPosts();
    const hit = await take();
    if (!hit.success) return res.status(429).json({ error: 'too many posts today' });

    // validate + sanitize
    const parsed = postDealSchema.safeParse({
      ...req.body,
      title: cleanText(req.body?.title),
      merchant: cleanText(req.body?.merchant),
      description: cleanText(req.body?.description)
    });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid payload' });

    const { title, url, price = null, merchant = null, description = null, image_url = null } = parsed.data;

    const { data, error } = await supaUser
      .from('deals')
      .insert([{ title, url: normalizeUrl(url), price, merchant, description, image_url, status: 'pending' }])
      .select()
      .single();
    if (error) throw error;

    res.status(201).json({
      id: data.id, title: data.title, url: data.url, price: data.price,
      merchant: data.merchant, created: Math.floor(new Date(data.created_at).getTime()/1000),
      ups: 0, downs: 0
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Vote (JWT required; RLS ensures deal is approved) */
r.post('/api/deals/:id/vote', async (req, res, next) => { currentReq = req; next(); }, denyShadowBanned, async (req, res) => {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'auth required' });
    const supaUser = makeUserClientFromToken(token);

    const id = Number(req.params.id);
    const parsed = voteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'value must be 1 or -1' });

    // limits
    const h = await limitVotesHourly()();
    if (!h.success) return res.status(429).json({ error: 'vote limit reached, try later' });
    const c = await limitPerDealCooldown(id)();
    if (!c.success) return res.status(429).json({ error: 'slow down' });

    const { error } = await supaUser.from('votes').insert([{ deal_id: id, value: parsed.data.value }]);
    if (error && !/duplicate key/.test(error.message)) throw error;

    const { data: agg, error: aErr } = await supaAdmin.rpc('get_votes_for_deal', { p_deal_id: id });
    if (aErr) throw aErr;
    const { data: d, error: dErr } = await supaAdmin.from('deals').select('id,title,url,price,merchant,created_at').eq('id', id).single();
    if (dErr) throw dErr;

    const created = Math.floor(new Date(d.created_at).getTime()/1000);
    const now = Math.floor(Date.now()/1000);
    const ups = agg?.ups || 0, downs = agg?.downs || 0;
    res.json({ id: d.id, title: d.title, url: d.url, price: d.price, merchant: d.merchant, created, ups, downs, hot: hotScore(ups, downs, created, now) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Comment (JWT required; RLS enforces deal approved) */
r.post('/api/deals/:id/comment', async (req, res, next) => { currentReq = req; next(); }, denyShadowBanned, async (req, res) => {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'auth required' });
    const supaUser = makeUserClientFromToken(token);

    const id = Number(req.params.id);
    const parsed = commentSchema.safeParse({
      ...req.body,
      body: cleanText(req.body?.body)
    });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid' });

    const cool = await limitCommentsCooldown()();
    if (!cool.success) return res.status(429).json({ error: 'slow down' });

    const { data, error } = await supaUser
      .from('comments')
      .insert([{ deal_id: id, body: parsed.data.body, parent_id: parsed.data.parent_id ?? null }])
      .select('id,deal_id,user_id,body,parent_id,created_at')
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

  /** Report deal (JWT required) */
  r.post('/api/deals/:id/report', async (req, res) => {
    try {
      const token = bearer(req);
      if (!token) return res.status(401).json({ error: 'auth required' });
      const supaUser = makeUserClientFromToken(token);

      const id = Number(req.params.id);
      const { reason, note = null } = req.body || {};
      if (!reason || !reason.trim()) return res.status(400).json({ error: 'reason required' });
      if (reason.length < 3 || reason.length > 500) return res.status(400).json({ error: 'reason must be 3-500 characters' });

      const { data, error } = await supaUser
        .from('reports')
        .insert([{ 
          deal_id: id, 
          reason: reason.trim(), 
          note: note?.trim() || null 
        }])
        .select('id,deal_id,reporter_id,reason,note,created_at')
        .single();
      if (error) throw error;

      res.status(201).json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

export default r;
