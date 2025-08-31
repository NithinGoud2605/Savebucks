import { Link } from 'react-router-dom';

const SITE = import.meta.env.VITE_SITE_NAME || 'Our Site';
const EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'hello@example.com';

export default function Footer() {
  return (
    <footer className="mt-10 border-t">
      <div className="max-w-4xl mx-auto p-4 text-sm text-zinc-600">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-x-4">
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/disclosure" className="hover:underline">Affiliate Disclosure</Link>
            <Link to="/contact" className="hover:underline">Contact</Link>
          </div>
          <div className="text-xs">
            © {new Date().getFullYear()} {SITE}. Some outbound links may be affiliate links.
          </div>
        </div>
        <div className="mt-2 text-xs">
          Questions? <a className="underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </div>
      </div>
    </footer>
  );
}
