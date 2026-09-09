# FH09AJ — imágenes responsivas en plantillas

## Resultado local

Fichas, reseñas, búsqueda y lista guardada usan variantes según el tamaño visible. La ficha conserva el original verificado de 1254 px para densidades altas. Identidad, textos alternativos, rótulos y destinos no se alteran. No son fotos oficiales ni certificación del paquete comercial.

## Medición comparable

Chromium local, vista previa 4339, contextos nuevos, movimiento reducido, anchos 390/1440, DPR 1/2/3, sin limitación de red. Recurso seleccionado de Echo Dot; no peso total de página ni Core Web Vitals. Antes: 1.255.620 bytes en cada una de las 18 combinaciones de ficha/reseña/búsqueda.

| Superficie | Después DPR 1 | DPR 2 | DPR 3 |
|---|---:|---:|---:|
| Ficha | 31.240 B | 64.826 B | 1.255.620 B |
| Reseña | 7.410 B | 31.240 B | 64.826 B |
| Búsqueda | 7.410 B | 7.410 B | 31.240 B |

Mismos resultados de transferencia en ambos anchos. Lista guardada a 390: 7.410 / 7.410 / 31.240 B; no se midió su línea base antes del cambio. Sin desbordamiento horizontal en los escenarios observados.

## Verificación

- 955 pruebas generales, 0 fallos; 19 dirigidas de miniaturas, codificación, recuperación y lista.
- Build de 88 páginas; SEO 0 errores/0 advertencias; tipos 0 errores/0 advertencias, 18 sugerencias; lint afectado correcto.
- 18 escenarios de transferencia; 15 adicionales: tres densidades de lista y recuperación forzada en cuatro superficies. Eliminación con teclado correcta en seis escenarios de lista.
- Catálogo y las 28 fichas comprobados a 390/1440: 28 imágenes específicas distintas, 0 genéricas en estado normal; nombres, rótulos y destinos coherentes.
- Capturas inspeccionadas: [móvil](FH09AJ-profile-390.png), [escritorio](FH09AJ-profile-1440.png). La ilustración mantiene detalle y proporción; persiste exceso de espacio vertical y avisos repetidos, fuera de esta optimización.
- Pruebas reproducibles: `scripts/qa/image-surface-transfer.cjs`, `responsive-image-recovery.cjs`, `responsive-image-visual.cjs`.

## Juzgado propio de esta etapa

- Producto 7/10: imágenes legibles; jerarquía de la ficha y avisos aún mejorables.
- Técnica 8/10: transferencia muy reducida en superficies pequeñas; original pesado en ficha DPR3 y respaldo genérico aún de 1.083.744 B.
- Datos/editorial 8/10: identidad y rótulos conservados; ilustraciones, no fotografías ni paquetes certificados.
- Operación 7/10: pruebas locales reproducibles; faltan medición de conjunto actual y candidato de entrega actualizado. Sin publicación.

Siguiente: reducir peso de alta densidad/respaldo sin perder fidelidad y revisar jerarquía de ficha. Mantener FH-09 parcial y el objetivo integral activo.
