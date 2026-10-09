const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'}
});
export async function onRequestGet({request, env}) {
  const token = request.headers.get('x-admin-token') || '';
  if (!env.ADMIN_TOKEN || token.length < 24 || token !== env.ADMIN_TOKEN) return json({error:'No autorizado'}, 401);
  if (!env.DB) return json({error:'Base de datos no configurada'}, 503);
  const {results} = await env.DB.prepare(`SELECT id, created_at, status, currency, subtotal_cents, shipping_cents,
    total_cents, items_json, customer_email, customer_name, shipping_json FROM orders ORDER BY created_at DESC LIMIT 200`).all();
  return json({orders: results.map(o => ({...o, items: safeJson(o.items_json), shipping: safeJson(o.shipping_json)}))});
}
function safeJson(v) { try { return v ? JSON.parse(v) : null; } catch { return null; } }
