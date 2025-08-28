import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api.js';
import DealCard from './components/DealCard.jsx';
import { AdSlot } from './components/AdSlot.jsx';

function List({ tab = 'hot' }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['deals', tab],
    queryFn: () => api(`/api/deals?tab=${tab}`)
  });
  if (isLoading) return <div className="p-6">Loading…</div>;
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-3">
      {data.map((d, i) => (
        <React.Fragment key={d.id}>
          <DealCard deal={d}/>
          {(i > 0 && i % 8 === 0) && (
            <div className="my-4">
              <AdSlot slot="IN-FEED" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <div>
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <nav className="max-w-4xl mx-auto flex gap-4 p-3 text-sm">
          <NavLink to="/" end className={({isActive}) => isActive ? 'font-semibold' : ''}>Hot</NavLink>
          <NavLink to="/new" className={({isActive}) => isActive ? 'font-semibold' : ''}>New</NavLink>
          <NavLink to="/trending" className={({isActive}) => isActive ? 'font-semibold' : ''}>Trending</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<List tab="hot"/>}/>
        <Route path="/new" element={<List tab="new"/>}/>
        <Route path="/trending" element={<List tab="trending"/>}/>
      </Routes>
    </div>
  );
}
