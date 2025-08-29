import { useEffect, useRef } from 'react';

const ADS_ENABLED = (import.meta.env.VITE_ADS_ENABLED ?? 'false').toString().toLowerCase() === 'true';
const PUB_ID = import.meta.env.VITE_ADS_PUB_ID;

export function useAdsense() {
  const loaded = useRef(false);

  useEffect(() => {
    if (!ADS_ENABLED || loaded.current) return;
    if (!PUB_ID || PUB_ID.includes('XXXXXXXX')) {
      console.warn('[ads] VITE_ADS_PUB_ID missing. Ads not loaded.');
      return;
    }
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}`;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
    loaded.current = true;
  }, []);
}
