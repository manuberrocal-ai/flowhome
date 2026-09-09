# FH16N — catálogo con observaciones transitorias

## Ficha y alcance

Problema: FH16M limitaba solicitudes sin presentar resultados en las tarjetas reales. Se conecta esa colección mediante mountCatalogCommerce, exclusivamente por invocación explícita del harness. ProductCard acepta commerceSlots=false por defecto; sólo /products/ agrega los espacios vacíos/ocultos. Las alternativas de la ficha no reciben paneles nuevos, evitando mezclar sus identidades con las del producto principal.

Aceptación:28 tarjetas enlazadas con su ASIN, ninguna petición inicial, estados parciales por identidad, búsqueda intacta, retirada por caducidad/offline y cleanup, foco conservado y enlaces de compra sin cambios. No se publica ni se consulta al proveedor real.

## Implementación

-src/lib/blocks/block8/catalog-presentation.ts: verifica controles y campos, crea una sola colección, comparte el binding de ciclo y presenta resultados según ASIN. Los paneles sin observación se vacían y ocultan; el enlace de compra sigue presente. El estado cuenta productos únicos, no tarjetas visibles ni promesas de disponibilidad.
-delivery-presentation.ts exporta renderCommerceObservation para usar el mismo formato y retirada en ficha y catálogo; no duplica reglas de vigencia o interpretación de stock.
-/products/ contiene controles ocultos y tarjetas con espacios vacíos. No importa el montaje ni configura endpoint. Buscar/filtrar no consulta precios; el botón de ensayo se llama Refresh catalog prices porque refresca el catálogo completo, no sólo el filtro visible.
-harness loopback agrega la ruta /real-catalog/ y una respuesta parcial sintética que deniega el ASIN Echo Dot. La fixture no autentica identidad ni permisos y no es un endpoint de producción.

## Evidencia

Ocho pruebas dirigidas correctas;1015/1015 pruebas generales después del cambio. La prueba de desactivación incluye el montaje de catálogo. El número total no aumenta: se amplió una prueba existente y se añadieron probes de navegador independientes.

Lint correcto; tipos445 archivos,0 errores/advertencias y18 hints. Build editorial88 con cuenta/analítica false; SEO88 sin errores/advertencias. Plan32 tareas/8 hechas coincidente y diff-check correcto. Se cerraron sólo la sesión de navegador y el servidor de ensayo propios. No se repitió Lighthouse; los espacios normales siguen ocultos, pero no se atribuyen métricas históricas a este artefacto nuevo.

18 comprobaciones de navegador en320/1440px:28 paneles ocultos con identidad igual a su CTA y cero peticiones iniciales;27 observaciones conservadas cuando una se deniega; estado27/28; búsqueda Echo Dot y reset; retirada total offline; caducidad con foco preservado; cleanup y href de Amazon intactos.16 comprobaciones de ficha real repetidas por el formateador compartido, todas correctas. No se realizaron compras ni se abrió Amazon.

Capturas revisadas de catálogo320/1440: marca conservada y estado parcial legible, con rótulo explícito de ensayo sintético. Archivos .playwright-cli/fh16n-catalog-320.png y fh16n-catalog-1440.png. No equivale a auditoría visual exhaustiva de todas las tarjetas y estados. Impeccable sin hallazgos mecánicos en los archivos afectados; orientó foco, copy de recuperación y separación de compra/datos.

Reproducible con scripts/qa/commerce-catalog-check.txt y el harness existente. La respuesta503 intencional no es un fallo de carga inesperado. El HTML de catálogo cambia: conservar el inventario de candidatos previos para sus propias versiones; no atribuir FH13P a estos bytes.

## Juzgado propio

**APROBADO LOCAL**, producto2/5 integral B, técnica3/5 local, datos/editorial2/5 y operación2/5. Un mismo agente, sin revisores independientes inventados. El comprador no pierde la consulta a Amazon cuando una observación falla. La prueba con datos sintéticos no valida permisos, cotizaciones reales ni correspondencia externa del ASIN.

FH-16 sigue parcial: comparación, cuotas de cuenta/servidor, lector confiable, HTTP/CDN real y visibilidad/BFCache específicos pendientes. FH16L conserva el probe freeze/resume no aprobado; no se repitió sin evidencia nueva. Siguiente trabajo local: comparación con vigencias independientes sin derivar ahorro o ganadores de precios ausentes. Sin actualización de PR ni despliegue.
