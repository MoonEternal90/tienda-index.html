# TheKiwiStore

Tienda estática con carrito y Pages Functions para Stripe Checkout.

## Estado

- La página principal se ha reconstruido para quitar el HTML y JavaScript duplicados que impedían cargar el catálogo.
- `catalog.js` es la única fuente de productos y precios para la tienda y el endpoint de compra. Contiene 56 productos candidatos sin aviso de revisión de precio; comprueba el catálogo antes de activar el checkout real.
- Stripe permanece limitado a claves de prueba (`sk_test_`). El checkout no está listo para cobrar pagos reales.
- El sitio público todavía responde desde GitHub Pages. Allí no se ejecutan `functions/`; el dominio debe conectarse a Cloudflare Pages para que el checkout y el panel de pedidos funcionen.
- El envío está configurado a 8,99 €, gratis desde 50 €.

Consulta [LEEME-DEPLOY-CLOUDFLARE.md](LEEME-DEPLOY-CLOUDFLARE.md) antes de conectar cuentas o desplegar.
