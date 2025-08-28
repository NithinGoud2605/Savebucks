import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, apiAuth } from './lib/api.js';
import DealCard from './components/DealCard.jsx';
import { AdSlot } from './components/AdSlot.jsx';
import { supa } from './lib/supa';
import AuthBox from './components/AuthBox.jsx';
import DealPage from './pages/DealPage.jsx';
import PostDeal from './pages/PostDeal.jsx';
import Admin from './pages/Admin.jsx';

function useSessionUser() {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    supa.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    const { data: sub } = supa.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return user;
}

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
  const user = useSessionUser();
  const { data: isAdmin } = useIsAdmin();
  return (
    <div>
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <nav className="max-w-4xl mx-auto flex items-center justify-between p-3 text-sm">
          <div className="flex gap-4">
            <NavLink to="/" end className={({isActive}) => isActive ? 'font-semibold' : ''}>Hot</NavLink>
            <NavLink to="/new" className={({isActive}) => isActive ? 'font-semibold' : ''}>New</NavLink>
            <NavLink to="/trending" className={({isActive}) => isActive ? 'font-semibold' : ''}>Trending</NavLink>
            {user && <NavLink to="/post" className={({isActive}) => isActive ? 'font-semibold' : ''}>Post</NavLink>}
            {isAdmin && <NavLink to="/admin" className={({isActive}) => isActive ? 'font-semibold' : ''}>Admin</NavLink>}
          </div>
          <div className="flex items-center gap-3">
            {user ? <span className="text-zinc-600 hidden md:inline">Signed in: {user.email}</span> : null}
            <AuthBox />
          </div>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<List tab="hot"/>}/>
        <Route path="/new" element={<List tab="new"/>}/>
        <Route path="/trending" element={<List tab="trending"/>}/>
        <Route path="/deal/:id" element={<DealPage/>}/>
        <Route path="/post" element={<PostDeal/>}/>
        <Route path="/admin" element={<Admin/>}/>
      </Routes>
    </div>
  );
}
