import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiAuth } from '../lib/api';
import AffiliateButton from './AffiliateButton.jsx';
import InlineDisclosure from './InlineDisclosure.jsx';

export default function DealCard({ deal }) {
  const qc = useQueryClient();
  
  async function upvote() {
    await apiAuth(`/api/deals/${deal.id}/vote`, {
      method:'POST',
      body: JSON.stringify({ value: 1 })
    });
    qc.invalidateQueries({ queryKey: ['deals', 'hot'] });
    qc.invalidateQueries({ queryKey: ['deals', 'new'] });
    qc.invalidateQueries({ queryKey: ['deals', 'trending'] });
    qc.invalidateQueries({ queryKey: ['deal', deal.id] });
  }

  async function report() {
    const reason = window.prompt('Why are you reporting this deal? (3-500 characters)');
    if (!reason || reason.length < 3) return;
    
    try {
      await apiAuth(`/api/deals/${deal.id}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      alert('Report submitted. Thank you!');
    } catch (error) {
      alert('Error submitting report: ' + error.message);
    }
  }

  return (
    <article className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
        <Link to={`/deal/${deal.id}`} className="hover:underline">{deal.title}</Link>
      </h3>
      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{deal.merchant ?? 'Merchant'}</div>
      <div className="mt-2 flex items-center gap-3 text-sm">
        {deal.price ? <span className="font-medium">${deal.price}</span> : null}
        <span className="text-zinc-500">•</span>
        <span>{new Date(deal.created * 1000).toLocaleString()}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={upvote} className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white">Upvote</button>
        <AffiliateButton dealId={deal.id}/>
        <button onClick={report} className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200">Report</button>
      </div>
      <InlineDisclosure />
    </article>
  );
}
