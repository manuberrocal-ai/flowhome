# FH16B — protección de entrega estática
Fecha: 2026-09-06. **Implementado y verificado localmente. FH-16 sigue parcial.**

## Cambio y alcance

El plugin existente de entorno fija __FLOWHOME_STATIC_COMMERCE__ a true en la compilación Astro, tanto servidor como cliente. No lee un permiso comercial de .env ni ofrece un interruptor de activación. getCommerceData descarta la observación comercial antes de calcular la proyección cuando opera en ese contexto. Conserva CTA y ausencia explícita de precio/stock/rating, sin modificar el catálogo.

Se evita que las superficies que ya usan la proyección común —producto, review, comparativas, home, búsqueda, quiz y schema— materialicen ofertas frescas en un artefacto de vida indefinida. La política sin bundling conserva su evaluación temporal para pruebas y futuros consumidores de servidor; **no autoriza servir datos**, necesita el contrato de permisos y transporte de FH16A.

Archivos: scripts/config/astro-environment.mjs, src/lib/commerce-data.ts, test/static-commerce-delivery.test.mjs. Sin nuevos paquetes, migraciones, llamadas Amazon ni cambios de producción.

## Evidencia

- Cuatro pruebas nuevas: proyección estática con fixture API fresca y sin mutación; política aislada conserva su comportamiento; constante de compilación incondicional; compilación real Vite en memoria que produce payload y Product schema sin cifras ni Offer.
- La fixture no se escribió en catálogo ni se publicó. La prueba compilada cubre proyección/schema; no se presenta como un build Astro completo con catálogo artificial.
- 741/741 pruebas completas; lint aprobado.
- Tipos: 264 archivos, cero errores/advertencias y 18 hints.
- Build Astro real: 88 páginas. SEO: 88 páginas de contenido, cero errores/advertencias.
- Auditoría del artefacto: 89 HTML = 88 contenido + 1 verificación Google; 322 bloques JSON-LD y tres catálogos serializados (home, search, quiz), sin Offer/AggregateOffer/AggregateRating ni cifras comerciales positivas en esos payloads.
- La primera aserción de inventario del helper esperaba 88 HTML y falló. Se investigó: el auditor SEO excluye el archivo de verificación Google, no la página 404. Se corrigió el contador para distinguir ambos ámbitos; nueva ejecución aprobada. No se descartó un archivo de contenido.
- Navegador completo: 134/134, cero fallos, errores de preparación y errores de limpieza.
- diff-check aprobado.

Evidencia local: C:/Users/manub/Documents/Codex/2026-09-04/f/work/FH16B_BROWSER/report.json y screenshots; helper de lectura fh16b-artifact-audit.mjs en la misma carpeta work. El análisis de payloads no es un escáner universal de toda cifra posible ni demuestra permisos de imágenes. No se midieron métricas de campo ni cuentas reales.

## Juzgado y continuación

Perspectivas propias, no revisores independientes: producto 4/5 (CTA y catálogo útil conservados); técnica 4/5 (barrera compilada, fixture positiva y regresión completa); datos/editorial 4/5 (sin comercial fresco materializado por la proyección, derechos de imágenes siguen FH-09); operación 3/5 (local verificado, transporte y entorno remoto no verificados).

Context7 confirmó la sustitución de constantes globales en dev/build; fuente primaria: [Vite define](https://github.com/vitejs/vite/blob/main/docs/config/shared-options.md). Se reutilizó la comprobación de navegador del proyecto, siguiendo la guía de ejecución de pruebas sin instalar herramientas nuevas.

FH-16 parcial: falta política/endpoint de transporte efímero, control de cuotas/permisos y cliente conectado; no cerrar por haber protegido A. Siguiente trabajo local: contrato durable de cola FH-17, limitado a metadatos propios, con pruebas de dos ejecutores y reinicio. La oferta real y activación B conservan gates FH-15/FH-18/FH-31. Ocho tareas hechas / 24 restantes. Objetivo ACTIVO, heartbeat horario PAUSADO.
