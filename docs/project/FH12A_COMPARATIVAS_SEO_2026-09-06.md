# FH12A — Comparativas coherentes y SEO local
Fecha: 2026-09-06. Estado: APROBADO LOCAL para este cambio; FH-12 sigue parcial y NO LISTO PARA PUBLICAR como entrega integral.

## Hallazgo y cambio
El índice y las ocho rutas mantenían definiciones duplicadas; podían divergir en orientación y metadatos. La orientación anterior usaba comparaciones de precio, comodidad o compatibilidad que no se sostienen con el estado de evidencia actual.
Se centralizaron las ocho definiciones en src/lib/comparison-content.ts y se actualizaron ambos consumidores. Cada comparativa explicita necesidades, documentación y límites específicos. No se añadieron precios, valoraciones, fuentes nuevas ni certificaciones; se conservaron las ocho rutas y el catálogo. La lista de decisión ya no presenta flags sin verificar como filtros que certifican compatibilidad.
La guía publication-copy-auditor exigió comprobar contenido visible y metadatos además de corregir el texto fuente.

## Evidencia
- 33 pruebas dirigidas iniciales aprobadas; después se añadieron dos regresiones y se adaptó el contrato SEO para leer la definición compartida.
- Suite final: 724 pruebas, 724 aprobadas, cero fallos y cero omitidas.
- Tipos: cero errores, cero advertencias y 18 hints existentes. El primer intento tuvo seis errores por la expresión regular mal escrita de una prueba nueva; corregida antes de repetir. No se suprimieron controles.
- Lint y diff-check aprobados. Compilación 18:08:35 local: 88 páginas.
- SEO local: 88 páginas, cero errores y cero advertencias. Reporte: C:/Users/manub/AppData/Local/Temp/flowhome-seo-audit-PPfS0X/report.json.
- Navegador: índice más ocho comparativas a 390 y 1440 px, 18 casos. Todos HTTP 200, un H1, canonical exacto, JSON-LD parseable, sin overflow horizontal; textos visibles, ángulos y descripciones coinciden con la fuente compartida. Recursos externos bloqueados: esta prueba NO mide imágenes reales ni rendimiento.
- Cuatro vistas inspeccionadas: índice y guía de decisión de termostatos en escritorio/móvil. Las primeras dos capturas móviles no correspondían al destino esperado; se descartaron como evidencia y se repitieron en pasos separados (_checked).
- Revisor determinista: nueve HTML, 18 candidatos missing-alt, todos dos avatares decorativos por página (alt vacío intencional, ocultos; acceso con nombre Open account/Profile). No se añadió texto redundante.
- Auxiliares y capturas: C:/Users/manub/Documents/Codex/2026-09-04/f/work/fh12a-browser.js y FH12A_*.png; FH12A_TEXTO.json.

## Juzgado del mismo agente, no revisores independientes
Escala 1–5, valoración circunscrita al cambio, no certificación integral:
- Producto 4/5: orientaciones concretas por necesidad; faltan pruebas de uso y oferta actual.
- Técnica 4/5: una fuente y regresiones; validación local completa del cambio, no producción.
- Datos/editorial 4/5: no extrapola ventajas ni compatibilidad; no se verificaron nuevos hechos externos.
- Operación 3/5: reproducible y sin publicación; teclado/siete tamaños, integración real y aprobación de entrega siguen pendientes.

## Continuidad
FH-12 parcial: seguir con teclado y siete tamaños según criterios originales, después cerrar las comprobaciones locales restantes. No confundir comprobación local con producción ni métricas de campo.
FH-09 permanece parcial: la guía web-perf requiere Chrome DevTools MCP, no disponible tras buscar herramientas; la medición se pausó por esa dependencia, sin instalar ni sustituirla por un supuesto dato equivalente. Permisos de imágenes y variantes siguen pendientes; consulta enviada al propietario en el ciclo FH09A.
Siete tareas hechas y 25 restantes. Objetivo ACTIVO, heartbeat horario PAUSADO. No hubo deploy, push ni cambios externos.

