import { Router } from 'express';
import { hotScore, normalizeUrl } from '@savebucks/shared';
const r = Router();

// in-memory stub (replace with DB soon)
const deals = [];

r.get('/api/deals', (req, res) => {
  const tab = (req.query.tab || 'hot').toString();
  const now = Math.floor(Date.now()/1000);
  const scored = deals.map(d => ({
    ...d,
    hot: hotScore(d.ups, d.downs, d.created, now)
  }));
  if (tab === 'new') return res.json(scored.sort((a,b)=>b.created - a.created));
  if (tab === 'trending') return res.json(scored.sort((a,b)=>b.ups - a.ups));
  return res.json(scored.sort((a,b)=>b.hot - a.hot));
});

r.post('/api/deals', (req, res) => {
  const { title, url, price = null, merchant = null } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: 'title and url required' });
  const item = {
    id: deals.length + 1,
    title,
    url: normalizeUrl(url),
    price,
    merchant,
    ups: 0,
    downs: 0,
    created: Math.floor(Date.now()/1000)
  };
  deals.push(item);
  res.status(201).json(item);
});

r.post('/api/deals/:id/vote', (req, res) => {
  const id = Number(req.params.id);
  const { value } = req.body || {};
  const d = deals.find(x => x.id === id);
  if (!d) return res.status(404).json({ error: 'not found' });
  if (value === 1) d.ups += 1;
  else if (value === -1) d.downs += 1;
  else return res.status(400).json({ error: 'value must be 1 or -1' });
  res.json(d);
});

export default r;
