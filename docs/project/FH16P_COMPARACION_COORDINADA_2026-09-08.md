# FH16P — comparación comercial y documental coordinada

## Resultado y alcance

Implementado el render único definido en FH16O. mountComparisonCompatibility acepta una opción commerce independiente y explícita; si falta enabled=true a nivel superior no toca DOM ni consulta. Sin commerce.enabled=true conserva el montaje exclusivamente documental. La página pública no importa ni llama a este controlador: sólo el harness local lo activa con datos de ensayo.

El HTML incorpora ASIN en el payload de identidades, ya público en sus enlaces, y atributos en las dos copias de precio y la fuente. No incorpora precios, disponibilidad, ratings ni observaciones en ese payload. La barrera estática getCommerceData sigue intacta.

## Implementación y límites de confianza

Un único propietario por raíz evita montajes que se sobrescriban. Cada render relee las colecciones, actualiza todas las copias y reconstruye conclusiones y límites. Las vigencias comercial y documental son independientes; ocultación/offline y cleanup invalidan ambas. No se restauran datos guardados ni hay polling automático.

buildComparisonInsights conserva su evaluación comercial protegida para los consumidores estáticos. El formateador compartido formatComparisonSignals no autoriza ni verifica datos: el controlador conectado le entrega exclusivamente valores recién leídos de las leases validadas, nunca precios del catálogo ni conclusiones previas. No reutilizar el formateador directamente para contenido estático.

Los clientes mantienen máximo tres solicitudes por colección. Dos colecciones pueden sumar hasta seis solicitudes; no es una cuota global de proveedor/cuenta. El botón común espera ambas y rechaza duplicados. El estado cuenta ASIN únicos con precio, sin prometer disponibilidad. Stock, rating y otros campos comerciales siguen omitidos en la comparación.

## Verificación

84 comprobaciones correctas con scripts/qa/commerce-comparison-check.txt, página real de comparación en 390 y 1440px. Incluye precios diferentes, falta parcial de precio, compatibilidad denegada, expiración de cada fuente manteniendo la otra, offline, correspondencia de ASIN con enlace y ambas copias de precio, cero solicitudes iniciales y rechazo de segundo montaje. Se retuvieron respuestas para probar ambos órdenes de llegada: no se inventa el dato pendiente.

28 comprobaciones previas de compatibilidad repetidas y correctas: foco, duplicados, tabla/fichas, retirada y cleanup. Nueve pruebas unitarias dirigidas correctas, incluyendo nueva desactivación explícita. Suite general final:1016/1016, lint correcto, tipos445 archivos sin errores/advertencias y18 hints. Build88 con selector production y cuenta/analítica false; SEO88 sin errores/advertencias. Diff-check correcto. Sólo se cerraron navegador y servidor de ensayo propios. El HTML cambia respecto a candidatos anteriores: no atribuirle su inventario de bytes.

Capturas .playwright-cli/fh16p-comparison-390.png y fh16p-comparison-1440.png revisadas: foco visible, botón y estado legibles, tabla con scroll contenido. Impeccable/harden orientó estados parciales y consistencia; no es auditoría visual integral ni medición Lighthouse. El ensayo identifica precios sintéticos, no ofertas reales ni validación de autorización Amazon.

## Juzgado propio y siguiente trabajo

APROBADO LOCAL para comparación coordinada bajo harness. Producto 2/5 B integral, técnica 3/5 local, datos/editorial 2/5 y operación 2/5. Un solo agente, sin revisores independientes. La preparación reduce contradicciones, no cumple por sí sola la entrega comercial conectada.

FH-16 sigue parcial: lector confiable, credenciales/permisos y cuotas globales, HTTP/CDN real, otros campos y prueba específica de visibilidad/BFCache pendientes. FH16L conserva freeze/resume NO VERIFICADO: no repetir su comando sin evidencia nueva. Sin actualización de PR, publicación, activación de servicios ni compras. El siguiente trabajo independiente debe abordar evidencia de ciclo real del navegador o preparación del lector autorizado; no rehacer esta integración ya probada.
