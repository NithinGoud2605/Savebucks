import { useEffect } from 'react';

export function AdSlot({ slot, style }) {
  useEffect(() => {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {}
  }, []);
  return (
    <ins className="adsbygoogle"
      style={style ?? { display: 'block' }}
      data-ad-client="ca-pub-XXXXXXX"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true" />
  );
}
