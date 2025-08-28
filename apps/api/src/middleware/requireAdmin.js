import { makeAdminClient } from '../lib/supa.js';

const supa = makeAdminClient();

export async function requireAdmin(req, res, next) {
  try {
    const authUser = req.user;
    if (!authUser?.id) return res.status(401).json({ error: 'auth required' });

    const { data: prof, error } = await supa
      .from('profiles')
      .select('id, role, shadow_banned')
      .eq('id', authUser.id)
      .single();

    if (error) throw error;
    if (!prof || prof.shadow_banned || prof.role !== 'admin') {
      return res.status(403).json({ error: 'admin only' });
    }
    req.admin = { id: prof.id };
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
