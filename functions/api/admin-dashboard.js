import { PRODUCTS } from '../../catalog.js';

const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'}
});

function authorized(request, env) {
  const token = request.headers.get('x-admin-token') || '';
  return Boolean(env.ADMIN_TOKEN && token.length >= 24 && token === env.ADMIN_TOKEN);
}

export async function onRequestGet({request, env}) {
  if (!authorized(request, env)) return json({error:'No autorizado'}, 401);
  if (!env.DB) return json({error:'Base de datos no configurada'}, 503);
  const days = Math.max(7, Math.min(90, Number(new URL(request.url).searchParams.get('days')) || 30));
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const [visits, sources, orders, costs] = await Promise.all([
    env.DB.prepare(`SELECT day, SUM(views) AS views FROM visit_stats WHERE day >= ? GROUP BY day ORDER BY day`).bind(since).all(),
    env.DB.prepare(`SELECT source, SUM(views) AS views FROM visit_stats WHERE day >= ? GROUP BY source ORDER BY views DESC LIMIT 12`).bind(since).all(),
    env.DB.prepare(`SELECT id, created_at, subtotal_cents, shipping_cents, total_cents, items_json FROM orders WHERE status='paid' AND stripe_livemode=1 AND created_at >= ? ORDER BY created_at DESC LIMIT 5000`).bind(`${since}T00:00:00.000Z`).all(),
    env.DB.prepare(`SELECT product_id, cost_cents FROM product_costs`).all()
  ]);
  const pageRows = await env.DB.prepare(`SELECT page_path, SUM(views) AS views FROM visit_stats WHERE day >= ? GROUP BY page_path ORDER BY views DESC LIMIT 12`).bind(since).all();
  const allViewsPeriod = await env.DB.prepare(`SELECT COALESCE(SUM(views),0) AS total FROM visit_stats WHERE day >= ?`).bind(since).first();
  const viewsTotal = await env.DB.prepare('SELECT COALESCE(SUM(views),0) AS total FROM visit_stats').first();
  const costMap = new Map((costs.results || []).map(row => [Number(row.product_id), Number(row.cost_cents)]));
  const productMap = new Map();
  const salesByDay = new Map();
  let paidProductSales = 0, shippingSales = 0, totalSales = 0;
  for (const order of orders.results || []) {
    paidProductSales += Number(order.subtotal_cents || 0);
    shippingSales += Number(order.shipping_cents || 0);
    totalSales += Number(order.total_cents || 0);
    const saleDay = String(order.created_at || '').slice(0, 10);
    salesByDay.set(saleDay, (salesByDay.get(saleDay) || 0) + Number(order.total_cents || 0));
    let items = [];
    try { items = JSON.parse(order.items_json || '[]'); } catch {}
    for (const item of items) {
      const id = Number(item.id);
      const row = productMap.get(id) || {id, title:item.title || `Producto ${id}`, quantity:0, sales:0};
      row.quantity += Number(item.quantity || 0);
      row.sales += Number(item.lineTotal || 0);
      productMap.set(id, row);
    }
  }
  const products = PRODUCTS.filter(p => p.active).map(p => {
    const sold = productMap.get(Number(p.id)) || {id:Number(p.id),title:p.title,quantity:0,sales:0};
    const cost = costMap.has(Number(p.id)) ? costMap.get(Number(p.id)) : null;
    return {...sold, cost, costTotal:cost === null ? null : cost * sold.quantity,
      margin:cost === null ? null : sold.sales - cost * sold.quantity};
  }).sort((a,b) => b.sales-a.sales || a.title.localeCompare(b.title, 'es'));
  const knownCostProducts = products.filter(p => p.quantity > 0 && p.cost !== null);
  const salesDaily = [...salesByDay.entries()].map(([day, total]) => ({day, total})).sort((a,b)=>a.day.localeCompare(b.day));
  return json({days, viewsTotal:Number(viewsTotal?.total || 0), viewsPeriod:Number(allViewsPeriod?.total || 0), visits:visits.results || [], sources:sources.results || [], pages:pageRows.results || [],
    sales:{orders:(orders.results || []).length, productSales:paidProductSales, shipping:shippingSales, total:totalSales, daily:salesDaily,
      estimatedMargin:knownCostProducts.reduce((sum,p)=>sum+p.margin,0), productsWithCost:knownCostProducts.length,
      productsSold:products.filter(p=>p.quantity>0).length, orderLimitReached:(orders.results || []).length===5000}, products});
}

export async function onRequestPost({request, env}) {
  if (!authorized(request, env)) return json({error:'No autorizado'}, 401);
  if (!env.DB) return json({error:'Base de datos no configurada'}, 503);
  let body;
  try { body = await request.json(); } catch { return json({error:'Solicitud no válida'}, 400); }
  const productId = Number(body.productId), cost = Number(body.costCents);
  if (!PRODUCTS.some(p => p.active && Number(p.id) === productId) || !Number.isSafeInteger(cost) || cost < 0 || cost > 100000000) return json({error:'Producto o coste no válido'}, 400);
  await env.DB.prepare(`INSERT INTO product_costs (product_id, cost_cents, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(product_id) DO UPDATE SET cost_cents=excluded.cost_cents, updated_at=excluded.updated_at`)
    .bind(productId, cost, new Date().toISOString()).run();
  return json({ok:true});
}
