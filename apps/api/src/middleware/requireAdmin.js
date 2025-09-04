import { makeAdminClient } from '../lib/supa.js';

const supa = makeAdminClient();

export async function requireAdmin(req, res, next) {
  try {
    console.log('🔧 requireAdmin middleware:', { userId: req.user?.id, userEmail: req.user?.email })
    const authUser = req.user;
    if (!authUser?.id) {
      console.log('❌ No auth user found')
      return res.status(401).json({ error: 'auth required' });
    }

    const { data: prof, error } = await supa
      .from('profiles')
      .select('id, role, shadow_banned')
      .eq('id', authUser.id)
      .single();

    console.log('🔧 Profile lookup result:', { prof, error })

    if (error) throw error;
    if (!prof || prof.shadow_banned || prof.role !== 'admin') {
      console.log('❌ Admin check failed:', { prof, shadow_banned: prof?.shadow_banned, role: prof?.role })
      return res.status(403).json({ error: 'admin only' });
    }
    req.admin = { id: prof.id };
    console.log('✅ Admin access granted')
    next();
  } catch (e) {
    console.log('❌ requireAdmin error:', e.message)
    res.status(500).json({ error: e.message });
  }
}
