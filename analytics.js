(() => {
  if (!/^https?:$/.test(location.protocol) || location.pathname.startsWith('/admin') || location.pathname.startsWith('/checkout')) return;
  const url = new URL(location.href);
  let source = url.searchParams.get('utm_source') || '';
  if (!source && document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      source = referrer.origin === location.origin ? 'Navegación interna' : referrer.hostname;
    } catch {}
  }
  if (!source) source = 'Directo';
  const payload = JSON.stringify({path:location.pathname.slice(0, 180), source:source.slice(0, 60)});
  try {
    fetch('/api/track', {method:'POST', headers:{'content-type':'application/json'}, body:payload, keepalive:true}).catch(()=>{});
  } catch {}
})();
