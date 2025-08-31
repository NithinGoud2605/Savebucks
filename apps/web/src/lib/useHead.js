import { useEffect } from 'react';
import { setTag, setCanonical, setJsonLd, clearJsonLd } from './head.js';

export function useHead({ title, description, image, url, jsonLd }) {
  useEffect(() => {
    // Set title
    if (title) {
      document.title = title;
    }

    // Set meta tags
    setTag({ name: 'description', content: description });
    setTag({ property: 'og:title', content: title });
    setTag({ property: 'og:description', content: description });
    setTag({ property: 'og:image', content: image });
    setTag({ property: 'og:url', content: url });
    setTag({ name: 'twitter:card', content: 'summary_large_image' });
    setTag({ name: 'twitter:title', content: title });
    setTag({ name: 'twitter:description', content: description });
    setTag({ name: 'twitter:image', content: image });

    // Set canonical URL
    setCanonical(url);

    // Set JSON-LD structured data
    if (jsonLd) {
      setJsonLd('page', jsonLd);
    }

    // Cleanup function
    return () => {
      if (jsonLd) {
        clearJsonLd('page');
      }
    };
  }, [title, description, image, url, jsonLd]);
}
