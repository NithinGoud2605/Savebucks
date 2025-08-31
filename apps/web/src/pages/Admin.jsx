import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiAuth } from '../lib/api';
import { useHead } from '../lib/useHead.js';

function useIsAdmin() {
  return useQuery({
    queryKey: ['admin','whoami'],
    queryFn: async () => {
      try {
        const res = await apiAuth('/api/admin/whoami');
        return !!res.isAdmin;
      } catch {
        return false;
      }
    },
    staleTime: 60_000
  });
}

function Row({ d, onApprove, onReject, onEdit }) {
  const [edit, setEdit] = React.useState(false);
  const [patch, setPatch] = React.useState({ title: d.title, price: d.price ?? '', merchant: d.merchant ?? '', url: d.url });

  return (
    <div className="border rounded-lg p-3">
      {!edit ? (
        <>
          <div className="font-medium">{d.title}</div>
          <div className="text-sm text-zinc-500 mt-1">{d.merchant} • {new Date(d.created_at).toLocaleString()}</div>
          <div className="mt-2 flex gap-2">
            <button onClick={()=>onApprove(d.id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">Approve</button>
            <button onClick={()=>onReject(d.id)} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white">Reject</button>
            <button onClick={()=>setEdit(true)} className="px-3 py-1.5 rounded-lg bg-zinc-200">Edit</button>
          </div>
        </>
      ) : (
        <form onSubmit={e=>{e.preventDefault(); onEdit(d.id, patch).then(()=>setEdit(false));}} className="space-y-2">
          <input className="w-full border rounded-lg px-3 py-2" value={patch.title} onChange={e=>setPatch({...patch,title:e.target.value})}/>
          <div className="flex gap-2">
            <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Price" value={patch.price} onChange={e=>setPatch({...patch,price:e.target.value})}/>
            <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Merchant" value={patch.merchant} onChange={e=>setPatch({...patch,merchant:e.target.value})}/>
          </div>
          <input className="w-full border rounded-lg px-3 py-2" placeholder="URL" value={patch.url} onChange={e=>setPatch({...patch,url:e.target.value})}/>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white" type="submit">Save</button>
            <button type="button" onClick={()=>setEdit(false)} className="px-3 py-1.5 rounded-lg bg-zinc-200">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Admin() {
  const qc = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const [tab, setTab] = React.useState('pending');

  const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
  const defaultImage = import.meta.env.VITE_DEFAULT_IMAGE || 'https://dummyimage.com/1200x630/ededed/222.png&text=savebucks';

  useHead({
    title: 'Admin - SaveBucks',
    description: 'Admin panel for managing deals and reports on SaveBucks.',
    image: defaultImage,
    url: `${siteUrl}/admin`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Admin Panel",
      "description": "Administrative interface for SaveBucks",
      "url": `${siteUrl}/admin`
    }
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    enabled: !!isAdmin && tab === 'pending',
    queryKey: ['admin','pending'],
    queryFn: () => apiAuth('/api/admin/deals?status=pending')
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    enabled: !!isAdmin && tab === 'reports',
    queryKey: ['admin','reports'],
    queryFn: () => apiAuth('/api/admin/reports')
  });

  async function onApprove(id) {
    await apiAuth(`/api/admin/deals/${id}/approve`, { method:'POST', body: JSON.stringify({}) });
    qc.invalidateQueries({ queryKey: ['admin','pending'] });
  }
  async function onReject(id) {
    const reason = window.prompt('Reason?') || '';
    await apiAuth(`/api/admin/deals/${id}/reject`, { method:'POST', body: JSON.stringify({ reason }) });
    qc.invalidateQueries({ queryKey: ['admin','pending'] });
  }
  async function onEdit(id, patch) {
    await apiAuth(`/api/admin/deals/${id}/approve`, { method:'POST', body: JSON.stringify(patch) });
    qc.invalidateQueries({ queryKey: ['admin','pending'] });
  }

  async function onDeleteReport(id) {
    if (!confirm('Delete this report?')) return;
    await apiAuth(`/api/admin/reports/${id}`, { method:'DELETE' });
    qc.invalidateQueries({ queryKey: ['admin','reports'] });
  }

  if (!isAdmin) return <div className="max-w-3xl mx-auto p-4">Not an admin.</div>;
  if ((tab === 'pending' && dealsLoading) || (tab === 'reports' && reportsLoading)) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setTab('pending')} 
          className={`px-4 py-2 rounded-lg ${tab === 'pending' ? 'bg-zinc-900 text-white' : 'bg-zinc-100'}`}
        >
          Pending ({deals.length})
        </button>
        <button 
          onClick={() => setTab('reports')} 
          className={`px-4 py-2 rounded-lg ${tab === 'reports' ? 'bg-zinc-900 text-white' : 'bg-zinc-100'}`}
        >
          Reports ({reports.length})
        </button>
      </div>

      {tab === 'pending' && (
        <div className="space-y-3">
          {deals.map(d => (
            <Row key={d.id} d={d} onApprove={onApprove} onReject={onReject} onEdit={onEdit}/>
          ))}
          {deals.length === 0 && <div className="text-zinc-500">No pending deals 🎉</div>}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="border rounded-lg p-3">
              <div className="font-medium">{r.deals.title}</div>
              <div className="text-sm text-zinc-500 mt-1">
                Reported: {new Date(r.created_at).toLocaleString()}
              </div>
              <div className="mt-2 text-sm">
                <strong>Reason:</strong> {r.reason}
              </div>
              {r.note && (
                <div className="mt-1 text-sm text-zinc-600">
                  <strong>Note:</strong> {r.note}
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <button 
                  onClick={() => onDeleteReport(r.id)} 
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white"
                >
                  Dismiss
                </button>
                <a 
                  href={`/deal/${r.deal_id}`} 
                  className="px-3 py-1.5 rounded-lg bg-zinc-200"
                >
                  View Deal
                </a>
              </div>
            </div>
          ))}
          {reports.length === 0 && <div className="text-zinc-500">No reports 🎉</div>}
        </div>
      )}
    </div>
  );
}
