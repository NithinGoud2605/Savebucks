import React from 'react';
import { setCanonical, setTag } from '../lib/head';
const SITE = import.meta.env.VITE_SITE_URL || window.location.origin;
const NAME = import.meta.env.VITE_SITE_NAME || 'Our Site';
export default function Terms() {
  React.useEffect(()=>{
    document.title = `Terms of Service – ${NAME}`;
    setCanonical(`${SITE}/terms`);
    setTag({ name:'description', content:`Terms of Service for ${NAME}` });
  },[]);
  return (
    <div className="max-w-3xl mx-auto p-4 prose prose-zinc">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>Use of the Service</h2>
      <p>By accessing {NAME}, you agree to these terms and applicable laws.</p>

      <h2>User Content</h2>
      <p>You are responsible for content you post. You grant us a non-exclusive license to host and display it. Do not post unlawful, infringing, or deceptive content.</p>

      <h2>Prohibited Conduct</h2>
      <ul>
        <li>Spam, manipulation of votes, scraping or harvesting data.</li>
        <li>Automated abuse, attempts to bypass rate limits or security.</li>
        <li>Posting others' intellectual property without permission.</li>
      </ul>

      <h2>Links</h2>
      <p>We link to third-party sites. We are not responsible for their content or policies.</p>

      <h2>Disclaimers</h2>
      <p>The service is provided "as is" without warranties. Prices and availability can change and may differ from what is shown.</p>

      <h2>Limitation of Liability</h2>
      <p>To the fullest extent permitted by law, {NAME} and its affiliates are not liable for indirect or consequential damages.</p>

      <h2>Termination</h2>
      <p>We may suspend or terminate accounts that violate these terms or our policies.</p>

      <h2>Changes</h2>
      <p>We may update these terms; continued use constitutes acceptance.</p>
    </div>
  );
}
