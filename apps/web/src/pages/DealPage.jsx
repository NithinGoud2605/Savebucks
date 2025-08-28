import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiAuth } from '../lib/api';

function CommentForm({ dealId }) {
  const qc = useQueryClient();
  const [body, setBody] = React.useState('');
  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    await apiAuth(`/api/deals/${dealId}/comment`, { method:'POST', body: JSON.stringify({ body }) });
    setBody('');
    qc.invalidateQueries({ queryKey: ['deal', dealId] });
  }
  return (
    <form onSubmit={submit} className="mt-4 flex gap-2">
      <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Add a comment…" value={body} onChange={e=>setBody(e.target.value)} />
      <button className="px-3 py-2 rounded-lg bg-zinc-900 text-white">Post</button>
    </form>
  );
}

export default function DealPage() {
  const { id } = useParams();
  const dealId = Number(id);
  const { data, isLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => api(`/api/deals/${dealId}`)
  });

  async function report() {
    const reason = window.prompt('Why are you reporting this deal? (3-500 characters)');
    if (!reason || reason.length < 3) return;
    
    try {
      await apiAuth(`/api/deals/${dealId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      alert('Report submitted. Thank you!');
    } catch (error) {
      alert('Error submitting report: ' + error.message);
    }
  }

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (!data) return <div className="p-6">Not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold">{data.title}</h1>
      <div className="text-sm text-zinc-600 mt-1">{data.merchant}</div>
      <div className="mt-2 flex items-center gap-3 text-sm">
        {data.price ? <span className="font-medium">${data.price}</span> : null}
        <span className="text-zinc-500">•</span>
        <span>{new Date(data.created * 1000).toLocaleString()}</span>
        <span className="text-zinc-500">•</span>
        <span>{data.ups - data.downs} points</span>
      </div>
      {data.description && <p className="mt-3 text-zinc-800">{data.description}</p>}

      <div className="mt-4 flex gap-2">
        <a className="px-3 py-2 rounded-lg bg-zinc-100" href={data.url} target="_blank" rel="noreferrer">Go to deal</a>
        <button onClick={report} className="px-3 py-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200">Report</button>
      </div>

      <h2 className="mt-8 mb-2 font-semibold">Comments</h2>
      <div className="space-y-3">
        {data.comments.map(c => (
          <div key={c.id} className="border rounded-lg p-3">
            <div className="text-sm text-zinc-500">{new Date(c.created_at).toLocaleString()}</div>
            <div className="mt-1">{c.body}</div>
          </div>
        ))}
      </div>
      <CommentForm dealId={dealId} />
    </div>
  );
}
