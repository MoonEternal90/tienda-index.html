# Preparación de lanzamiento de TheKiwiStore

Esta rama contiene una base corregida y un catálogo candidato, pero **todavía no está lista para cobrar**. No habilites claves Stripe reales hasta revisar los productos y completar las comprobaciones de lanzamiento.

## Trabajo ya preparado

- Portada reconstruida en `index.html`, con categorías, búsqueda, ordenación, carrito y conexión al endpoint de Stripe Checkout.
- `catalog.js` es la fuente común de precios para la portada y Pages Functions. Contiene 56 productos candidatos del Excel, excluyendo los que tienen avisos de revisión de precio.
- `functions/api/checkout.js` comprueba productos, cantidades, precio y envío en el servidor.
- `functions/webhooks/stripe.js` actualiza el pedido solo después de validar la firma de Stripe.
- `admin/index.html` permite consultar los últimos pedidos con el token de administrador.
- Páginas de retorno de pago, error 404, `robots.txt`, sitemap y cabeceras de seguridad para Cloudflare Pages.

## Datos que faltan antes de vender

1. Revisar y aprobar los 56 productos candidatos, sus PVP, fotos y disponibilidad antes de habilitar pagos reales.
2. El envío está configurado a 8,99 € y gratis desde 50 €. Confirmar si se vende solo en península o en toda España.
3. Confirmar impuestos aplicables, plazos reales, política de devoluciones y quién prepara y entrega los pedidos. El aviso legal ya contiene el titular que indicó la propietaria.
4. Cuenta Stripe verificada y métodos de pago habilitados. El proyecto no tramita los pedidos con el proveedor ni envía emails automáticamente; habrá que gestionar los pedidos desde el panel y preparar el envío manualmente.

## Despliegue previsto

El dominio público todavía está servido por GitHub Pages. GitHub Pages no ejecuta la carpeta `functions/`, así que `/api/checkout` y `/api/admin-orders` solo funcionarán al conectar este repositorio a un proyecto **Cloudflare Pages** o desplegarlo con Wrangler. La carpeta `functions/` debe estar en la raíz que se publica. El flujo de Git de Cloudflare Pages despliega las Pages Functions; una subida estática no las activa.

En Cloudflare Pages, conecta el repositorio `MoonEternal90/tienda-index.html`, usa la raíz del repositorio como directorio de salida y no uses comando de compilación. Antes de vincular `thekiwistore.com`, confirma la cuenta, proyecto y comportamiento DNS con el titular. El archivo `CNAME` contiene `thekiwistore.com`; revísalo al migrar desde GitHub Pages.

### D1

- `schema.sql` crea la tabla de pedidos.
- La configuración `wrangler.toml` incluye una base de datos D1 y una variable de enlace `DB`. Confirma en el panel que ese ID pertenece al proyecto correcto y que la tabla existe.
- Preview y producción deben tener bindings separados si se van a hacer pedidos de prueba.

### Stripe, primero en pruebas

En Cloudflare Pages configura como secretos independientes para Preview y Production:

- `STRIPE_SECRET_KEY`: clave de prueba `sk_test_...`.
- `STRIPE_WEBHOOK_SECRET`: secreto de firma `whsec_...` del endpoint `https://thekiwistore.com/webhooks/stripe`.
- `ADMIN_TOKEN`: valor aleatorio largo. No lo guardes en archivos ni lo envíes por chat.

Suscribe el webhook a `checkout.session.completed`, `checkout.session.async_payment_succeeded` y `checkout.session.expired`. El código rechaza intencionadamente claves que no empiezan por `sk_test_`; no quites esa protección hasta que el catálogo, los importes, los impuestos, los términos de compra y las pruebas estén aprobados.

## Verificación necesaria antes de activar ventas

- Revisar el catálogo importado, fotos, precios, disponibilidad, costes, márgenes e impuestos.
- Confirmar el importe y las zonas de envío y alinear la web, el carrito, Stripe y las condiciones legales.
- Probar un pedido de prueba y comprobar que llega el webhook, el pedido aparece en `/admin/` y el importe guardado coincide.
- Probar pago cancelado, producto inexistente, cantidad inválida y firma de webhook inválida.
- Confirmar HTTPS y redirecciones del dominio después de conectar Cloudflare Pages.
- Revisar aviso legal, privacidad, cookies y condiciones de venta con los datos reales del vendedor.

No se deben publicar claves de Stripe ni tokens de administrador en el repositorio o en la conversación.
