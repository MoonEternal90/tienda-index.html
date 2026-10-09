const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}
function constantTimeEqual(a,b) {
  if (a.length !== b.length) return false;
  let out = 0; for (let i=0;i<a.length;i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
export async function onRequestPost({request, env}) {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.DB) return new Response('Not configured', {status:503});
  const raw = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  const parts = Object.fromEntries(signature.split(',').map(x => x.split('=')));
  const timestamp = parts.t;
  const sig = parts.v1;
  if (!timestamp || !sig || Math.abs(Date.now()/1000 - Number(timestamp)) > 300) return new Response('Invalid signature', {status:400});
  const expected = await hmac(env.STRIPE_WEBHOOK_SECRET, `${timestamp}.${raw}`);
  if (!constantTimeEqual(expected, sig)) return new Response('Invalid signature', {status:400});
  let event;
  try { event = JSON.parse(raw); } catch { return new Response('Invalid payload', {status:400}); }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data?.object;
    if (session?.payment_status === 'paid') {
      const orderId = session.metadata?.order_id || session.client_reference_id;
      if (orderId) {
        const details = session.shipping_details || null;
        await env.DB.prepare(`UPDATE orders SET status='paid', customer_email=?, customer_name=?, shipping_json=?
          WHERE id=? AND stripe_session_id=?`)
          .bind(session.customer_details?.email || session.customer_email || null,
            details?.name || session.customer_details?.name || null,
            details ? JSON.stringify(details) : null,
            orderId, session.id).run();
      }
    }
  } else if (event.type === 'checkout.session.expired') {
    const session = event.data?.object;
    const orderId = session?.metadata?.order_id || session?.client_reference_id;
    if (orderId) await env.DB.prepare("UPDATE orders SET status='expired' WHERE id=? AND stripe_session_id=? AND status='pending'").bind(orderId, session.id).run();
  }
  return new Response('ok', {status:200});
}
