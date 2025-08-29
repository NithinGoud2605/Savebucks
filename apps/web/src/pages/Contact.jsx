import React from 'react';
import { setCanonical, setTag } from '../lib/head';
const SITE = import.meta.env.VITE_SITE_URL || window.location.origin;
const NAME = import.meta.env.VITE_SITE_NAME || 'Our Site';
const EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'hello@example.com';

export default function Contact() {
  React.useEffect(()=>{
    document.title = `Contact – ${NAME}`;
    setCanonical(`${SITE}/contact`);
    setTag({ name:'description', content:`Contact ${NAME}` });
  },[]);
  return (
    <div className="max-w-3xl mx-auto p-4 prose prose-zinc">
      <h1>Contact</h1>
      <p>We'd love to hear from you. For support, DMCA, or partnership inquiries, email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>
      <h2>Report an issue</h2>
      <p>If a deal is expired or incorrect, please comment on the deal page or email us with the link.</p>
    </div>
  );
}
