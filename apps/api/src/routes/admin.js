import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { normalizeUrl } from '@savebucks/shared';

const r = Router();
const supa = makeAdminClient();

/** sanity */
r.get('/api/admin/whoami', requireAdmin, async (req, res) => {
  res.json({ isAdmin: true, id: req.admin.id });
});

/** list deals by status (default: pending) */
r.get('/api/admin/deals', requireAdmin, async (req, res) => {
  try {
    const status = (req.query.status || 'pending').toString();
    const { data, error } = await supa
      .from('deals')
      .select('id,title,url,price,merchant,category,submitter_id,status,rejection_reason,created_at')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** approve (optional field edits allowed in payload) */
r.post('/api/admin/deals/:id/approve', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const allowed = ['title','description','price','list_price','currency','merchant','category','image_url','url'];
    const patch = {};
    for (const k of allowed) {
      if (k in (req.body || {})) patch[k] = k === 'url' ? normalizeUrl(req.body[k]) : req.body[k];
    }
    patch.status = 'approved';
    patch.approved_by = req.admin.id;
    patch.approved_at = new Date().toISOString();

    const { data, error } = await supa.from('deals').update(patch).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** reject with reason */
r.post('/api/admin/deals/:id/reject', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const reason = (req.body?.reason || '').toString().slice(0, 500);
    const { data, error } = await supa
      .from('deals')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** expire / mark out-of-stock */
r.post('/api/admin/deals/:id/expire', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data, error } = await supa
      .from('deals')
      .update({ status: 'expired' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

  /** generic edit without changing status */
  r.post('/api/admin/deals/:id/edit', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const allowed = ['title','description','price','list_price','currency','merchant','category','image_url','url'];
      const patch = {};
      for (const k of allowed) {
        if (k in (req.body || {})) patch[k] = k === 'url' ? normalizeUrl(req.body[k]) : req.body[k];
      }
      if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'nothing to edit' });
      const { data, error } = await supa.from('deals').update(patch).eq('id', id).select().single();
      if (error) throw error;
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /** reports queue */
  r.get('/api/admin/reports', requireAdmin, async (_req, res) => {
    try {
      const { data, error } = await supa
        .from('reports')
        .select('id,deal_id,reporter_id,reason,note,created_at, deals!inner(id,title,status)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /** delete report */
  r.delete('/api/admin/reports/:id', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { error } = await supa.from('reports').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  export default r;
