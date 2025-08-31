import { makeAdminClient } from '../lib/supa.js';
const supa = makeAdminClient();

export async function denyShadowBanned(req, res, next) {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ error: 'auth required' });
    const { data, error } = await supa.from('profiles').select('shadow_banned').eq('id', id).single();
    if (error) throw error;
    if (data?.shadow_banned) return res.status(403).json({ error: 'restricted' });
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
