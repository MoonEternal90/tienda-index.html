# TheKiwiStore — carrito + Stripe Checkout (modo de pruebas)

## Estado de esta entrega
Es una base de integración, NO una tienda lista para cobrar dinero real. Los 8 productos y precios que aparecen en `prueba1.html` y `functions/catalog.js` son datos DEMO de la plantilla, no el catálogo vigente de OCIOSTOCK. No habilites pagos reales hasta reemplazarlos y probar todo.

## Incluye
- `prueba1.html`: carrito persistente en el navegador, total con envío de 8,99 € y envío gratis desde 50 €.
- `functions/api/checkout.js`: valida IDs y cantidades en servidor, recalcula precios y crea Stripe Checkout.
- `functions/webhooks/stripe.js`: verifica la firma del webhook y marca el pedido como pagado al recibir confirmación de Stripe.
- `functions/api/admin-orders.js` + `admin/index.html`: panel de consulta de pedidos con token.
- `schema.sql`: tabla D1 para guardar pedidos.
- `checkout/success.html` y `checkout/cancel.html`: páginas de retorno.

## 1. Importante antes de publicar
1. Mantén una copia de seguridad del ZIP original.
2. Los precios, títulos y disponibilidad de `functions/catalog.js` son demo. Reemplaza con el catálogo nuevo y precios de venta revisados.
3. Esta entrega bloquea intencionadamente cualquier clave que no empiece por `sk_test_`. No acepta cobros reales.
4. El sistema actual solo guarda pedidos y los muestra en el panel; no envía correos ni compra automáticamente al proveedor.
5. Configura las condiciones legales, política de privacidad, devoluciones, impuestos y contacto antes de vender.

## 2. Crear proyecto Cloudflare Pages
1. Sube el contenido de esta carpeta a un repositorio Git nuevo/privado.
2. En Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git, selecciona el repositorio.
3. No configures un build command; como output directory usa `.`. Pages Functions requiere que `functions/` esté en la raíz del directorio desplegado.
4. El archivo `CNAME` del repositorio original es específico del dominio anterior. Revisa si quieres mantenerlo antes de asociar `thekiwistore.com`.

Documentación: https://developers.cloudflare.com/pages/functions/get-started/

## 3. Crear la base de datos D1
1. Cloudflare Dashboard → Storage & databases → D1 SQL database → Create database.
2. Nombre sugerido: `thekiwistore-orders`.
3. En la consola SQL de D1, ejecuta el contenido de `schema.sql`.
4. En el proyecto Pages → Settings → Bindings, añade D1 con variable `DB` y selecciona esa base de datos.
5. Redeploy el proyecto para que la binding esté disponible.
6. Actualiza `database_id` en `wrangler.toml` si vas a usar Wrangler; también puedes gestionar la binding desde el panel de Cloudflare.

## 4. Secretos — nunca dentro del HTML ni del repositorio
En Pages → Settings → Variables and Secrets, crea secretos cifrados:
- `STRIPE_SECRET_KEY`: clave secreta de prueba de Stripe, empieza por `sk_test_`.
- `STRIPE_WEBHOOK_SECRET`: secreto del endpoint webhook de prueba, empieza por `whsec_`.
- `ADMIN_TOKEN`: crea una cadena aleatoria larga de al menos 32 caracteres, por ejemplo con un gestor de contraseñas. No uses la frase de ejemplo ni la compartas.

No pongas estos valores en archivos públicos ni en `wrangler.toml`. No los envíes por chat. Configura secretos separados para Preview y Production según corresponda.

## 5. Configurar Stripe en modo de pruebas
1. Crea/verifica tu cuenta en https://stripe.com/es.
2. Activa modo de prueba y copia la clave secreta de prueba desde el panel de desarrolladores.
3. En Stripe → Developers → Webhooks, añade endpoint `https://TU-DOMINIO/webhooks/stripe`.
4. Suscríbete al evento `checkout.session.completed` y también `checkout.session.async_payment_succeeded` y `checkout.session.expired`.
5. Copia el secreto de firma del endpoint (`whsec_...`) al secreto `STRIPE_WEBHOOK_SECRET` de Cloudflare.
6. Configura `STRIPE_SECRET_KEY` como secreto de prueba y `ADMIN_TOKEN`.
7. Redeploy tras añadir los secretos.

## 6. Pruebas obligatorias antes de cualquier venta
- Añadir dos o más productos, cambiar cantidades, recargar la página y comprobar el carrito.
- Pedido de menos de 50 €: debe añadir 8,99 € de envío.
- Pedido de 50 € o más: debe mostrar envío gratis.
- Completar un pago de prueba con una tarjeta de prueba indicada por la documentación de Stripe: https://docs.stripe.com/testing
- Comprobar que el webhook marca el pedido como `paid`.
- Abrir `/admin/`, introducir el `ADMIN_TOKEN` y comprobar que el pedido aparece.
- Probar pago cancelado, firma webhook inválida, producto inexistente y cantidad no válida.
- Verificar que los precios nunca se aceptan del navegador: el servidor usa `functions/catalog.js`.

## 7. Límites conocidos / próximos pasos
- El panel de administración utiliza un token compartido en cabecera; protege el acceso a la cuenta Cloudflare y rota el token si se expone. Para uso real de mayor escala, sustituir por autenticación individual y roles.
- El endpoint muestra hasta 200 pedidos.
- La dirección se recopila mediante Stripe Checkout; revisa qué campos de dirección son necesarios para tus envíos.
- Aún no se envían emails ni se tramitan pedidos al proveedor automáticamente.
- El frontend actual puede seguir mostrando datos de ejemplo; actualiza también el array `products` en `prueba1.html` para que coincida con `functions/catalog.js`.
- La política de envío gratis desde 50 € se calcula sobre subtotal de productos, antes del envío.
- No habilites claves `sk_live_` ni retires el bloqueo de modo prueba hasta revisar impuestos, márgenes, disponibilidad y seguridad.

## Nota de despliegue
Cloudflare Pages no admite añadir Functions mediante una subida manual directa desde el dashboard; conecta un repositorio Git o despliega mediante Wrangler. Consulta la documentación oficial.
