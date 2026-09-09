# FH09R — Verificación conjunta y textos alternativos coherentes

Estado: implementado y verificado localmente. 11/28 ilustraciones específicas, 17 pendientes. No se generaron imágenes ni se publicó el sitio.

## Mejora del proceso

Se añadió `scripts/qa/catalog-artwork-regression.cjs`, reutilizable para el catálogo completo. Descubre los productos desde la página real y contrasta sus fichas en 390 y 1440 px. Revisa nombre, imagen, texto alternativo, leyenda, ASIN, destinos internos/Amazon, datos para la lista guardada, miniaturas y desbordamiento. Requiere 28 identidades únicas; cuenta por separado las ilustraciones genéricas pendientes. No confunde consistencia técnica con fidelidad al fabricante.

La nueva [guía de verificación](../../scripts/qa/ARTWORK_CHECKS.md) define cómo combinar esta prueba con inspección visual y pruebas específicas de las superficies afectadas. Conserva los scripts históricos; evita exigir su ejecución repetitiva cuando una verificación conjunta cubre la misma invariancia.

## Hallazgo y corrección

La primera ejecución real detectó diferencias de texto alternativo en las 17 fichas con ilustración genérica, en ambos tamaños. El mecanismo compartido de recuperación veía que la imagen ya era la de respaldo y sustituía el texto descriptivo con nombre/categoría por uno genérico, incluso tras una carga correcta. Las tarjetas responsivas no sufrían esa sustitución, produciendo la inconsistencia.

Se preserva ahora el texto que explícitamente declara «category illustration; not a photo of …» cuando la fuente ya es el respaldo y no está indisponible. Los errores reales siguen mostrando indisponibilidad; textos que pretenden describir una fotografía siguen siendo reemplazados por la advertencia representativa. No se modifica el comportamiento decorativo de alt vacío ni la recuperación de srcset.

Impeccable orientó esta corrección hacia la descripción accesible y la honestidad editorial, sin cambios de estilo o diseño.

## Evidencia

- Navegador real: 28 tarjetas y 28 fichas aprobadas en 390 px, y las mismas 28/28 en 1440 px. 56 comprobaciones de ficha completas. 11 ilustraciones específicas y 17 genéricas contabilizadas en ambos tamaños.
- Nueve pruebas del verificador: caso correcto y ocho negativos (catálogo incompleto, slug duplicado, arte específico repetido, enlace interno cruzado, imagen incorrecta en lista, miniatura ausente, advertencia ausente y leyenda divergente en ficha).
- Nueva prueba de recuperación: el texto alternativo descriptivo persiste al cargar correctamente; un fallo posterior sigue anunciando imagen no disponible.
- 21 pruebas dirigidas del verificador y recuperación aprobadas. Suite general final: 937 pruebas, 937 aprobadas, 0 fallos.
- Tipos: 380 archivos, 0 errores, 0 avisos, 18 sugerencias existentes. Build88. SEO sin errores/avisos. Lint de los archivos afectados y diff aprobados.
- La primera ejecución del nuevo script falló por usar URL fuera del contexto de página del CLI; se corrigió antes de obtener los resultados de navegador. No se contabilizó esa ejecución como fichas aprobadas.

## Juzgado (autoevaluación, no revisores independientes)

| Eje | Nota | Límite / mejora siguiente |
| --- | --- | --- |
| Producto | 8/10 | Descripción accesible coherente en todo el catálogo; 17 ilustraciones pendientes. |
| Técnica | 9/10 | Regresión compartida y casos negativos verifican los controles; no equivale a auditoría completa de accesibilidad. |
| Datos/editorial | 8/10 | Advertencias preservadas; la coincidencia entre páginas no certifica fidelidad ni ASIN. |
| Operación | 9/10 | Proceso reproducible para próximas altas; todavía requiere inspección visual y fuentes por modelo. |

Siguiente prioridad: continuar las ilustraciones específicas pendientes empleando el control conjunto. La entrega editorial A sigue incompleta; no declarar concluido el proyecto ni usar paquetes de publicación anteriores como actuales.
