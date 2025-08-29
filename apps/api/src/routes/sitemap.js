import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';

const r = Router();
const supa = makeAdminClient();
const SITE = process.env.SITE_URL || 'http://localhost:5173';

function xmlEscape(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

r.get('/sitemap.xml', async (_req, res) => {
  try {
    const urls = [
      { loc: `${SITE}/`, priority: '0.8', changefreq: 'hourly' },
      { loc: `${SITE}/new`, priority: '0.5', changefreq: 'hourly' },
      { loc: `${SITE}/trending`, priority: '0.6', changefreq: 'hourly' },
      { loc: `${SITE}/privacy`, priority: '0.2', changefreq: 'yearly' },
      { loc: `${SITE}/terms`, priority: '0.2', changefreq: 'yearly' },
      { loc: `${SITE}/disclosure`, priority: '0.4', changefreq: 'yearly' },
      { loc: `${SITE}/contact`, priority: '0.3', changefreq: 'yearly' },
    ];

    const { data, error } = await supa
      .from('deals')
      .select('id, approved_at, updated_at')
      .eq('status','approved')
      .order('approved_at', { ascending: false })
      .limit(5000);
    if (error) throw error;

    for (const d of data || []) {
      const lastmod = (d.updated_at || d.approved_at) ? new Date(d.updated_at || d.approved_at).toISOString() : undefined;
      urls.push({ loc: `${SITE}/deal/${d.id}`, priority: '0.7', changefreq: 'daily', lastmod });
    }

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '' }
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type','application/xml; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=600, s-maxage=600');
    res.send(body);
  } catch (e) {
    res.status(500).send('sitemap error');
  }
});

export default r;
