import React from 'react';
import { setCanonical, setTag } from '../lib/head';
const SITE = import.meta.env.VITE_SITE_URL || window.location.origin;
const NAME = import.meta.env.VITE_SITE_NAME || 'Our Site';
const EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'hello@example.com';
const COMPANY = import.meta.env.VITE_COMPANY_NAME || NAME;
const ADDRESS = import.meta.env.VITE_COMPANY_ADDRESS || '';

export default function Privacy() {
  React.useEffect(()=>{
    document.title = `Privacy Policy – ${NAME}`;
    setCanonical(`${SITE}/privacy`);
    setTag({ name:'description', content:`Privacy Policy for ${NAME}` });
  },[]);
  return (
    <div className="max-w-3xl mx-auto p-4 prose prose-zinc">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p>{NAME} ("we", "us") operates this website. This policy explains what we collect and how we use it.</p>

      <h2>Information We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> email and profile information you provide.</li>
        <li><strong>Usage data:</strong> page views, clicks, votes, and device info (IP, user agent) for security and analytics.</li>
        <li><strong>Cookies:</strong> used for sign-in, preferences, and (if enabled later) advertising/attribution.</li>
      </ul>

      <h2>How We Use Information</h2>
      <ul>
        <li>Provide core features (accounts, posting, voting, comments).</li>
        <li>Moderation and fraud prevention.</li>
        <li>Optional email updates you opt into (you can unsubscribe anytime).</li>
        <li>Advertising and affiliate attribution (if enabled later).</li>
      </ul>

      <h2>Sharing</h2>
      <p>We do not sell personal data. We may share limited data with service providers (hosting, analytics, email) under contract; and as required by law.</p>

      <h2>Ads & Affiliates</h2>
      <p>We may show ads (e.g., Google AdSense) and use affiliate links (e.g., Amazon Associates, CJ). These partners may set cookies to measure performance. See <a href="/disclosure">Affiliate Disclosure</a> for details.</p>

      <h2>Data Retention</h2>
      <p>We retain account and content data while your account remains active or as needed for our legitimate interests and legal obligations.</p>

      <h2>Your Choices</h2>
      <ul>
        <li>Update or delete your account by contacting us.</li>
        <li>Control cookies via your browser settings.</li>
      </ul>

      <h2>Children's Privacy</h2>
      <p>Our service is not directed to children under 13. We do not knowingly collect data from children under 13.</p>

      <h2>Contact</h2>
      <p>{COMPANY}{ADDRESS ? ` • ${ADDRESS}` : ''} • <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>

      <h2>Changes</h2>
      <p>We may update this policy; we'll post the new date above.</p>
    </div>
  );
}
