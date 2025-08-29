import React from 'react';
import { setCanonical, setTag } from '../lib/head';
const SITE = import.meta.env.VITE_SITE_URL || window.location.origin;
const NAME = import.meta.env.VITE_SITE_NAME || 'Our Site';
export default function Disclosure() {
  React.useEffect(()=>{
    document.title = `Affiliate Disclosure – ${NAME}`;
    setCanonical(`${SITE}/disclosure`);
    setTag({ name:'description', content:`Affiliate disclosure for ${NAME}` });
  },[]);
  return (
    <div className="max-w-3xl mx-auto p-4 prose prose-zinc">
      <h1>Affiliate Disclosure</h1>
      <p>Some links on {NAME} are affiliate links. If you click a link and make a purchase, we may earn a commission at no extra cost to you. This helps keep the site running.</p>
      <p>We label sponsored placements and avoid layouts that encourage accidental clicks. Our goal is a clear, useful experience.</p>
      <h2>Amazon Associates</h2>
      <p>When enabled, we will display: <em>"As an Amazon Associate we earn from qualifying purchases."</em></p>
      <h2>Editorial Independence</h2>
      <p>Affiliate relationships do not influence which deals are posted or how they are ranked; community voting and transparent moderation drive visibility.</p>
    </div>
  );
}
