# GEFRI — Centro de información y análisis

GEFRI es un panel informativo para uso personal y empresarial. La interfaz se publica en `/gefri/` y está separada de la tienda.

## Áreas
- The Kiwi Store: análisis comercial y oportunidades. Los datos reales de ventas requieren integración con la plataforma de la tienda.
- Economía de España e internacional.
- Noticias de IA, e-commerce, tecnología e informática.
- Inteligencia artificial, herramientas, automatización, desarrollo y seguridad.
- Negocios, modelos online y oportunidades.
- Compras y proveedores, priorizando España y la Unión Europea.
- Ayudas, subvenciones y financiación pública, con prioridad España y Andalucía.
- Agenda y eventos de El Puerto de Santa María.
- Meteorología local con previsión de siete días.
- Empleo público de informática en Cádiz y localidades cercanas.

## Privacidad y funcionamiento
- La interfaz no guarda tareas, gastos, notas ni datos personales en localStorage.
- Las consultas escritas en el panel abren ChatGPT con el contexto de GEFRI y la pregunta del usuario. La consulta se procesa en ChatGPT, no en un backend propio de GEFRI.
- El tiempo se consulta desde Open-Meteo en el navegador. Se incluye un enlace a AEMET para avisos oficiales.
- La agenda de Google Calendar no está conectada todavía. Requiere OAuth y autorización del usuario; antes de crear, modificar o borrar citas se deberá pedir confirmación explícita.
- Los avisos por correo requieren configurar un servicio de envío y sus credenciales.
- Las cifras reales de The Kiwi Store requieren conectar la plataforma o facilitar informes.
- La búsqueda diaria de empleo público está configurada mediante una automatización separada en ChatGPT; no depende de almacenamiento en esta web.

## Publicación
El proyecto Cloudflare Pages `thekiwistore` publica la rama `main` del repositorio. Los cambios en esta carpeta se publican mediante el despliegue automático de Pages. No se han modificado archivos de la tienda, DNS ni configuración de Cloudflare.

## Pendiente para completar integraciones
1. Configurar Google OAuth y las operaciones de calendario con confirmación obligatoria.
2. Configurar envío de alertas por correo.
3. Integrar datos de ventas si se desea consultar métricas reales de la tienda.
4. Incorporar un backend seguro para agregación de noticias, eventos oficiales y avisos programados si se desea que el panel los muestre sin abrir ChatGPT.
