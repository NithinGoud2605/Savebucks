import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';
import {
  hostnameOf, isAmazonHost, addAmazonTag, buildCjDeepLink,
  randomClickId, isAffEnabled
} from '../lib/affiliates.js';
import { makeLimiter, ipKey } from '../lib/limiter.js';

const r = Router();
const supa = makeAdminClient();

let currentReq = null;

const limitGoPerIp = () => makeLimiter({
  key: () => `go:${ipKey(currentReq)}`,
  limit: Number(process.env.RL_GO_PER_IP_PER_MIN || 30),
  windowSec: 60,
  prefix: 'go:ip'
});

const limitGoPerDealIp = (dealId) => makeLimiter({
  key: () => `go:${ipKey(currentReq)}:${dealId}`,
  limit: 5,
  windowSec: 60,
  prefix: 'go:deal'
});

const REQUIRE_APPROVED = (process.env.AFF_REQUIRE_APPROVED ?? 'true').toLowerCase() !== 'false';

async function decorateUrl(deal) {
  if (!isAffEnabled()) return { network: 'none', target: deal.url };

  const host = hostnameOf(deal.url);

  if (isAmazonHost(host)) {
    const tag = process.env.AMZ_ASSOC_TAG;
    if (tag) return { network: 'amazon', target: addAmazonTag(deal.url, tag) };
    return { network: 'amazon', target: deal.url };
  }

  const { data: merch } = await supa
    .from('merchants')
    .select('default_network, program_id')
    .eq('domain', host)
    .single();

  if (merch?.default_network === 'cj' && merch.program_id) {
    const target = buildCjDeepLink(deal.url, merch.program_id, process.env.CJ_WEBSITE_ID);
    return { network: 'cj', target };
  }

  return { network: 'none', target: deal.url };
}

r.get('/go/:id', async (req, res, next) => { currentReq = req; next(); }, async (req, res) => {
  const id = Number(req.params.id);
  const over = await limitGoPerIp()();
  if (!over.success) return res.status(429).send('Too many requests');
  const burst = await limitGoPerDealIp(id)();
  if (!burst.success) return res.status(429).send('Too many for this deal');
  
  try {
    if (!Number.isFinite(id)) return res.status(400).send('Bad id');

    let q = supa.from('deals').select('id,url,status').eq('id', id);
    if (REQUIRE_APPROVED) q = q.eq('status','approved');
    const { data: deal, error } = await q.single();
    if (error || !deal) return res.status(404).send('Not found');

    const { network, target } = await decorateUrl(deal);

    const clickId = randomClickId();
    const source_ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip;
    const ua = req.get('user-agent') || '';
    const referrer = req.get('referer') || req.get('referrer') || '';

    await supa.from('affiliate_clicks').insert([{
      deal_id: deal.id,
      source_ip, ua, referrer,
      network,
      target_url: target,
      click_id: clickId
    }]);

    return res.redirect(302, target);
  } catch (e) {
    try {
      const id = Number(req.params.id);
      const { data: deal } = await supa.from('deals').select('url').eq('id', id).single();
      if (deal?.url) return res.redirect(302, deal.url);
    } catch {}
    res.status(500).send('Resolver error');
  }
});

export default r;
