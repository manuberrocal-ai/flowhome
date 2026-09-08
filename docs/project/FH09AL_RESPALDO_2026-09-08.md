# FH09AL — respaldo de imágenes liviano

El selector compartido de respaldo usa la variante autorizada de categoría de 960 px, conservando el original y el mecanismo existente de recuperación. No se cambian imágenes normales ni se permite elegir rutas arbitrarias. La categoría desconocida recurre a smart-home-device.

## Evidencia local

Repetición de `scripts/qa/responsive-image-recovery.cjs`, Chromium local 4339, contextos nuevos a 390 px, DPR1/2/3. Quince escenarios correctos: lista normal y fallo forzado en lista, ficha, reseña y búsqueda. Eliminación por teclado correcta. En ficha/reseña de Echo Dot, el respaldo pasó de 1.083.744 B a 33.006 B en las tres densidades. Rótulo genérico conservado, srcset retirado al fallar, sin desbordamiento. Los placeholders SVG de búsqueda/lista permanecen en 447 B.

16 pruebas dirigidas aprobadas: destinos autorizados por categoría, dimensiones/peso de variantes y recuperación, incluidos fallo del propio respaldo y ausencia de bucles. Build de 88 páginas y lint afectado correctos. La suite general anterior de 955 es antecedente, no nueva ejecución en esta etapa.

## Juzgado propio

- Producto 8/10: recuperación disponible sin descarga excesiva; no representa el modelo exacto y se rotula como genérica.
- Técnica 8/10: reutiliza variantes y mantiene protecciones; falta medir transferencia del conjunto actual.
- Datos/editorial 8/10: no añade afirmaciones ni cambia la procedencia de ilustraciones.
- Operación 7/10: comprobación local reproducible, entrega/publicación pendientes.

FH-09 sigue parcial. Próximo paso: medición de conjunto, detectar consumidores de originales innecesarios y consolidar candidato editorial. Sin publicación ni cierre integral.
