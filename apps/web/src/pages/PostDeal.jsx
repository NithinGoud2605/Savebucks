import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiAuth } from '../lib/api';

export default function PostDeal() {
  const n = useNavigate();
  const [f, setF] = React.useState({ title:'', url:'', price:'', merchant:'', description:'' });
  const [msg, setMsg] = React.useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    try {
      const payload = { ...f, price: f.price ? Number(f.price) : null };
      await apiAuth('/api/deals', { method:'POST', body: JSON.stringify(payload) });
      setMsg('Submitted! Your deal is pending review.');
      setTimeout(()=> n('/'), 800);
    } catch (err) {
      setMsg(err.message || 'Error');
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">Post a deal</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Title" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="URL" value={f.url} onChange={e=>setF({...f,url:e.target.value})}/>
        <div className="flex gap-2">
          <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Price (optional)" value={f.price} onChange={e=>setF({...f,price:e.target.value})}/>
          <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Merchant (optional)" value={f.merchant} onChange={e=>setF({...f,merchant:e.target.value})}/>
        </div>
        <textarea className="w-full border rounded-lg px-3 py-2" rows="4" placeholder="Description (optional)" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
        <button className="px-4 py-2 rounded-lg bg-zinc-900 text-white">Submit</button>
        {msg && <div className="text-sm text-zinc-600">{msg}</div>}
      </form>
    </div>
  );
}
