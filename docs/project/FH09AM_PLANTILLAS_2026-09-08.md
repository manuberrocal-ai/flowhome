# FH09AM — transferencia de imágenes entre plantillas

El inventario encontró un consumidor pendiente: la tarjeta lateral de ficha usaba el original. Ahora usa el selector responsivo compartido con tamaño de referencia 240 px. Identidad, geometría, rótulos y enlaces conservados.

## Condiciones y resultados

Chromium local 4339, contextos nuevos, DPR1, 390/1440 px, movimiento reducido. Carga forzada de todas las imágenes con fuente asignada, incluyendo las diferidas. Se suman encodedBodySize de recursos de imagen; no HTML, CSS, JS ni Core Web Vitals. Los dos elementos ocultos de avatar sin fuente se excluyen: no son fallos de descarga.

| Ruta | Después 390 | Después 1440 |
|---|---:|---:|
| Portada | 60.068 B | 67.478 B |
| Catálogo | 92.072 B | 92.072 B |
| Ficha Echo Dot | 49.754 B | 49.754 B |
| Reseña Echo Dot | 18.514 B | 18.514 B |
| Búsqueda Echo Dot | 18.514 B | 18.514 B |

Antes del cambio, ficha Echo: 1.297.964 B en ambos anchos, incluido original lateral de 1.255.620 B. Después, sin imágenes mayores de 200 KB en las diez combinaciones; cero imágenes con fuente fallidas y cero desbordamientos. Portada antes: 60.068 B en ambos anchos; la variación posterior de una petición de 7.410 B se registra, no se atribuye al cambio lateral. Una pasada no prueba estabilidad del contenido dinámico.

Tarjeta lateral: DPR1/2/3 selecciona 240/480/720 px correctamente, conservando rótulo Echo. [Captura inspeccionada](FH09AM-sidebar-1440.png): imagen legible y proporciones conservadas.

Scripts: `scripts/qa/template-image-inventory.cjs`, `sidebar-image-density.cjs`. 16 pruebas dirigidas aprobadas; build88, SEO0/0 y lint afectado correctos. No se repitió la suite general. Esta muestra no cubre las 88 rutas ni todos sus estados.

## Juzgado propio

- Producto 8/10: ficha más liviana con imagen lateral reconocible; avisos repetidos aún pendientes.
- Técnica 8/10: corrige consumidor omitido; faltan otras plantillas y estabilidad dinámica para cerrar el alcance global.
- Datos/editorial 8/10: sin cambios de afirmaciones o imágenes; no certifica fotografía ni paquete.
- Operación 7/10: medición reproducible y límites explícitos; candidato editorial/publicación pendientes.

Siguiente: ampliar inventario a las restantes familias de páginas y consolidar los requisitos de la entrega A. FH-09 parcial; sin publicación ni cierre integral.
