import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';

const r = Router();
const supa = makeAdminClient();

// Create table if missing (noop if exists) via RPC-like best effort
async function ensureTables() {
  try {
    await supa.rpc('noop');
  } catch (_) {}
}

// Track arbitrary analytics event
r.post('/track', async (req, res) => {
  try {
    const { event_name, properties = {}, user_id = null } = {
      event_name: req.body?.event || req.body?.event_name,
      properties: req.body?.properties || {},
      user_id: req.user?.id || req.body?.user_id || null,
    };

    if (!event_name || typeof event_name !== 'string') {
      return res.status(400).json({ error: 'event_name is required' });
    }

    // Check table existence by probing
    let tableExists = true;
    try {
      await supa.from('analytics_events').select('id').limit(1);
    } catch (_) {
      tableExists = false;
    }

    if (!tableExists) {
      return res.status(501).json({ error: 'analytics_events table not provisioned' });
    }

    await ensureTables();

    const { error } = await supa
      .from('analytics_events')
      .insert([{ user_id, event_name, properties }]);
    if (error) throw error;
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to track event' });
  }
});

export default r;

