export function setTag({ name, property, content }) {
  if (!content) return;
  let el;
  if (name) el = document.querySelector(`meta[name="${name}"]`);
  if (!el && property) el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    if (name) el.setAttribute('name', name);
    if (property) el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function setCanonical(href) {
  if (!href) return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function setJsonLd(id, json) {
  const scriptId = `ld-${id}`;
  let el = document.getElementById(scriptId);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = scriptId;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(json);
}

export function clearJsonLd(id) {
  const el = document.getElementById(`ld-${id}`);
  if (el) el.remove();
}
