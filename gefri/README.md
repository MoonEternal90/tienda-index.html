# GEFRI — gestor personal

Primera versión de la interfaz para `https://thekiwistore.com/gefri/`.

## Incluye
- Resumen de tareas y gastos del mes.
- Tareas con fecha, prioridad y categoría.
- Vista mensual de agenda con indicadores de tareas.
- Registro de gastos y notas.
- Diseño adaptable a móvil y escritorio.

## Estado y privacidad
Esta versión guarda los datos únicamente en `localStorage` del navegador. No hay sincronización entre dispositivos, autenticación real ni conexión a Gmail o Google Calendar. No introduzcas datos sensibles hasta configurar Cloudflare Access delante de la ruta `/gefri/*` y decidir un almacenamiento sincronizado y seguro.

## Publicación
El proyecto Cloudflare Pages `thekiwistore` ya publica la raíz de este repositorio desde la rama `main`. Al añadirse esta carpeta, Pages la incluirá en el siguiente despliegue automático. No se han modificado archivos de la tienda ni configuración DNS.
