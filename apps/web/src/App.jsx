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
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import Disclosure from './pages/Disclosure.jsx';
import Contact from './pages/Contact.jsx';
import { useAdsense } from './lib/useAdsense';
import { AdsProvider } from './context/AdsContext.jsx';
import { useHead } from './lib/useHead.js';
import { setTag, setCanonical } from './lib/head';
import Footer from './components/Footer.jsx';

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

  React.useEffect(() => {
    const SITE = import.meta.env.VITE_SITE_URL || window.location.origin;
    const titleMap = { hot: 'Hot', new: 'New', trending: 'Trending' };
    const title = `${titleMap[tab]} deals – savebucks`;
    document.title = title;
    setCanonical(`${SITE}/${tab === 'hot' ? '' : tab}`.replace(/\/$/, ''));
    setTag({ name: 'description', content: 'Community-driven US deals: post, vote, save.' });
    setTag({ property: 'og:title', content: title });
    setTag({ property: 'og:type', content: 'website' });
  }, [tab]);

  if (isLoading) return <div className="p-6">Loading…</div>;
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-3">
      {data.map((d, i) => (
        <React.Fragment key={d.id}>
          <DealCard deal={d}/>
          {(i > 0 && i % 9 === 0) && (
            <div className="my-4">
              <AdSlot slot="INFEED_1" format="auto" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function App() {
  useAdsense();
  const user = useSessionUser();
  const { data: isAdmin } = useIsAdmin();

  // Default SEO for the app
  const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
  const defaultImage = import.meta.env.VITE_DEFAULT_IMAGE || 'https://dummyimage.com/1200x630/ededed/222.png&text=savebucks';

  useHead({
    title: 'SaveBucks - Best Deals & Discounts',
    description: 'Find the best deals, discounts, and sales on electronics, home goods, fashion, and more. Join the SaveBucks community to discover amazing bargains.',
    image: defaultImage,
    url: siteUrl,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "SaveBucks",
      "description": "Community-driven deals and discounts platform",
      "url": siteUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  });
  return (
    <div className="min-h-screen flex flex-col">
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
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<List tab="hot"/>}/>
          <Route path="/new" element={<List tab="new"/>}/>
          <Route path="/trending" element={<List tab="trending"/>}/>
          <Route path="/deal/:id" element={<DealPage/>}/>
          <Route path="/post" element={<AdsProvider enabled={false}><PostDeal/></AdsProvider>}/>
          <Route path="/admin" element={<AdsProvider enabled={false}><Admin/></AdsProvider>}/>
          <Route path="/privacy" element={<AdsProvider enabled={false}><Privacy/></AdsProvider>}/>
          <Route path="/terms" element={<AdsProvider enabled={false}><Terms/></AdsProvider>}/>
          <Route path="/disclosure" element={<AdsProvider enabled={false}><Disclosure/></AdsProvider>}/>
          <Route path="/contact" element={<AdsProvider enabled={false}><Contact/></AdsProvider>}/>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
