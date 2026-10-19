const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'}
});

export async function onRequestPost({request, env}) {
  if (!env.DB) return json({error:'Analytics no configurada'}, 503);
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).origin !== new URL(request.url).origin) return json({error:'Origen no válido'}, 403);
  let body;
  try { body = await request.json(); } catch { return json({error:'Solicitud no válida'}, 400); }
  const path = typeof body.path === 'string' && /^\/(?!\/)[a-zA-Z0-9/_-]{0,180}$/.test(body.path) ? body.path : null;
  if (!path || path.startsWith('/admin') || path.startsWith('/checkout') || path.startsWith('/api')) return json({error:'Página no válida'}, 400);
  const rawSource = typeof body.source === 'string' ? body.source.trim().slice(0, 60) : '';
  const source = rawSource.replace(/[^\p{L}\p{N} .:_-]/gu, '') || 'Directo';
  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(`INSERT INTO visit_stats (day, page_path, source, views) VALUES (?, ?, ?, 1)
    ON CONFLICT(day, page_path, source) DO UPDATE SET views=views+1`).bind(day, path, source).run();
  return json({ok:true});
}
