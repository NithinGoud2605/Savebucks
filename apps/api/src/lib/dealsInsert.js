import { makeAdminClient } from './supa.js';
import { normalizeUrl } from '@savebucks/shared';
const supa = makeAdminClient();

export async function insertPendingDeal({ title, url, price, merchant, image_url = null, submitter_note = null }) {
  const cleanUrl = normalizeUrl(url);
  const row = {
    title: title || merchant || 'Deal',
    url: cleanUrl,
    price: price ?? null,
    merchant: merchant ?? null,
    image_url,
    status: 'pending',
    description: submitter_note || null
  };

  const { data, error } = await supa.from('deals').insert([row]).select().maybeSingle();
  if (error && !/duplicate key|unique/i.test(error.message)) throw error;

  if (!data) {
    const { data: existing } = await supa
      .from('deals')
      .select('id,status,title')
      .eq('url', cleanUrl)
      .limit(1)
      .maybeSingle();
    return existing || null;
  }
  return data;
}
