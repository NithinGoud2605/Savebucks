import { useEffect } from 'react';
import { useAdsEnabled } from '../context/AdsContext.jsx';

const ADS_ENABLED = (import.meta.env.VITE_ADS_ENABLED ?? 'false').toString().toLowerCase() === 'true';
const PLACEHOLDER = (import.meta.env.VITE_ADS_PLACEHOLDER ?? 'false').toString().toLowerCase() === 'true';
const PUB_ID = import.meta.env.VITE_ADS_PUB_ID;

export function AdSlot({ slot = 'DEV', format = 'auto', style, label = 'Sponsored' }) {
  const routeEnabled = useAdsEnabled();
  
  useEffect(() => {
    if (!ADS_ENABLED) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {}
  }, []);

  if (!routeEnabled) return null;
  if (!ADS_ENABLED || !PUB_ID || PUB_ID.includes('XXXXXXXX')) {
    if (!PLACEHOLDER) return null;
    return (
      <div
        className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-4"
        style={style ?? { minHeight: 120 }}
        aria-label="Ad placeholder"
      >
        <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2">{label}</div>
        <div className="h-16 rounded-md bg-zinc-200/60 dark:bg-zinc-700/60" />
      </div>
    );
  }

  return (
    <div className="rounded-xl p-0">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
      <ins
        className="adsbygoogle"
        style={style ?? { display: 'block' }}
        data-ad-client={PUB_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
