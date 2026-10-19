import { PRODUCTS, SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from '../../catalog.js';

const PRODUCT_BY_ID = new Map(PRODUCTS.map(product => [String(product.id), product]));

const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

export async function onRequestPost({ request, env }) {
  try {
    if (!env.STRIPE_SECRET_KEY || !env.DB) return json({error:'El pago todavía no está configurado. Contacta con la tienda.'}, 503);
    // Default to test mode. Live charges require both an explicit mode setting and a live key.
    const stripeMode = env.STRIPE_MODE || 'test';
    const expectedKeyPrefix = stripeMode === 'live' ? 'sk_live_' : 'sk_test_';
    if (!['test', 'live'].includes(stripeMode) || !env.STRIPE_SECRET_KEY.startsWith(expectedKeyPrefix)) {
      return json({error:'La configuración de pagos no es válida.'}, 503);
    }
    const body = await request.json();
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 40) return json({error:'Carrito no válido.'}, 400);
    const quantities = new Map();
    for (const item of body.items) {
      const id = String(item?.id ?? '');
      const quantity = Number(item?.quantity);
      if (!PRODUCT_BY_ID.get(id)?.active || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return json({error:'Producto o cantidad no válida.'}, 400);
      quantities.set(id, (quantities.get(id) || 0) + quantity);
    }
    if ([...quantities.values()].some(q => q > 20)) return json({error:'Cantidad máxima por producto: 20.'}, 400);

    const items = [...quantities.entries()].map(([id, quantity]) => ({
      id: Number(id), title: PRODUCT_BY_ID.get(id).title, unitPrice: PRODUCT_BY_ID.get(id).price, quantity,
      lineTotal: PRODUCT_BY_ID.get(id).price * quantity
    }));
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;
    const total = subtotal + shipping;
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`INSERT INTO orders
      (id, created_at, status, currency, subtotal_cents, shipping_cents, total_cents, items_json)
      VALUES (?, ?, 'pending', 'eur', ?, ?, ?, ?)`)
      .bind(orderId, now, subtotal, shipping, total, JSON.stringify(items)).run();

    const form = new URLSearchParams();
    form.set('mode', 'payment');
    form.set('success_url', new URL('/checkout/success.html?session_id={CHECKOUT_SESSION_ID}', request.url).toString());
    form.set('cancel_url', new URL('/checkout/cancel.html', request.url).toString());
    form.set('client_reference_id', orderId);
    form.set('metadata[order_id]', orderId);
    form.set('billing_address_collection', 'required');
    form.set('shipping_address_collection[allowed_countries][0]', 'ES');
    form.set('phone_number_collection[enabled]', 'true');
    items.forEach((item, index) => {
      form.set(`line_items[${index}][price_data][currency]`, 'eur');
      form.set(`line_items[${index}][price_data][product_data][name]`, item.title);
      form.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitPrice));
      form.set(`line_items[${index}][quantity]`, String(item.quantity));
    });
    form.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
    form.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(shipping));
    form.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
    form.set('shipping_options[0][shipping_rate_data][display_name]', shipping ? 'Envío península' : 'Envío gratis');
    form.set('metadata[shipping_cents]', String(shipping));
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok || !session.url) {
      await env.DB.prepare("UPDATE orders SET status='checkout_error' WHERE id=?").bind(orderId).run();
      return json({error:'Stripe no pudo preparar el pago. Inténtalo de nuevo.'}, 502);
    }
    await env.DB.prepare('UPDATE orders SET stripe_session_id=? WHERE id=?').bind(session.id, orderId).run();
    return json({url: session.url});
  } catch (e) {
    return json({error:'No se pudo iniciar el pago. Inténtalo de nuevo.'}, 500);
  }
}
