const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'}
});
export async function onRequestGet({request, env}) {
  const token = request.headers.get('x-admin-token') || '';
  if (!env.ADMIN_TOKEN || token.length < 24 || token !== env.ADMIN_TOKEN) return json({error:'No autorizado'}, 401);
  if (!env.DB) return json({error:'Base de datos no configurada'}, 503);
  const includeArchived = new URL(request.url).searchParams.get('archived') === '1';
  const query = `SELECT id, created_at, status, currency, subtotal_cents, shipping_cents,
    total_cents, items_json, customer_email, customer_name, customer_phone, shipping_json, archived_at, stripe_livemode
    FROM orders ${includeArchived ? '' : 'WHERE archived_at IS NULL'} ORDER BY created_at DESC LIMIT 200`;
  const {results} = await env.DB.prepare(query).all();
  return json({orders: results.map(o => ({...o, items: safeJson(o.items_json), shipping: safeJson(o.shipping_json)}))});
}

export async function onRequestPost({request, env}) {
  const token = request.headers.get('x-admin-token') || '';
  if (!env.ADMIN_TOKEN || token.length < 24 || token !== env.ADMIN_TOKEN) return json({error:'No autorizado'}, 401);
  if (!env.DB) return json({error:'Base de datos no configurada'}, 503);
  let body;
  try { body = await request.json(); } catch { return json({error:'Solicitud no válida'}, 400); }
  const {id, action} = body || {};
  if (typeof id !== 'string' || id.length < 8 || id.length > 100 || !['archive','restore','delete'].includes(action)) {
    return json({error:'Acción o pedido no válido'}, 400);
  }
  if (action === 'archive') {
    await env.DB.prepare("UPDATE orders SET archived_at=? WHERE id=?").bind(new Date().toISOString(), id).run();
  } else if (action === 'restore') {
    await env.DB.prepare("UPDATE orders SET archived_at=NULL WHERE id=?").bind(id).run();
  } else {
    await env.DB.prepare("DELETE FROM orders WHERE id=?").bind(id).run();
  }
  return json({ok:true});
}
function safeJson(v) { try { return v ? JSON.parse(v) : null; } catch { return null; } }
