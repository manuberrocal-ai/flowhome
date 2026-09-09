# FH12B — Teclado y siete tamaños
Fecha: 2026-09-06. APROBADO LOCAL en el alcance probado. FH-12 sigue parcial; no es autorización de publicación ni certificación WCAG completa.

## Hallazgo y corrección
Reproducción en /compare/ a 390 px: con el menú abierto y Products cerrado, Tab desde Products enfocaba “Browse all smart-home gear”, dentro del submenú recortado. Su max-height cero no eliminaba los enlaces del recorrido de teclado.
Se añadió inert inicial a cada submenú y sincronización con su expansión; aria-controls enlaza cada botón con su panel. El botón principal anuncia Open menu/Close menu. Escape desde el panel o su botón lo cierra y devuelve el foco al botón. Sin rediseño, rutas nuevas ni dependencias.
La guía impeccable orientó una corrección acotada de accesibilidad, conservando la interfaz. Su detector señaló la animación de max-height existente y los dos avatares sin src inicial: no son nuevos defectos de este cambio; los avatares están ocultos hasta disponer de imagen. La animación se conserva, sin afirmar una mejora de rendimiento. PRODUCT.md/DESIGN.md faltan, pero no bloquean esta corrección concreta.

## Verificación
- Inicial: 132/134 casos de navegador aprobados. Dos fallos Blind Tilt por etiquetas antiguas (“Matter ready: Yes”, “Apple HomeKit compatible: Yes”). Se sustituyeron las expectativas por las etiquetas actuales explícitamente no verificadas, preservando Bluetooth-only, hub separado y not a native Matter accessory. No se modificó el catálogo.
- Final: 134/134 casos aprobados, cero errores de preparación o limpieza; incluye 16 plantillas por siete tamaños (112 casos), diez casos documentales y doce controles adicionales. No implica 88 páginas por siete tamaños.
- Teclado real en 320, 375, 390, 768, 1024, 1280 y 1440: primer Tab al salto, Enter enfoca main; región de tabla enfocable y ArrowRight desplaza en 320/375/390 donde existe overflow. En cuatro tamaños móviles: Tab evita el submenú cerrado, Enter permite recorrer el abierto, Escape cierra y restaura foco.
- Suite: 726/726, cero omitidas. Tipos cero errores/advertencias, 18 hints; lint y diff-check aprobados. Compilación 18:16:47: 88 páginas.
- SEO: 88 páginas, 83 indexables, cinco noindex; cero errores/advertencias.
- Vista de menú móvil abierto inspeccionada con foco visible. Vista de comparación escritorio de la primera batería inspeccionada, sin cambio visual intencionado en escritorio.
- Recursos externos bloqueados en QA: no mide rendimiento real, autenticación real, analítica real ni imágenes remotas. No hay nueva afirmación de INP/CWV de campo.

## Evidencia reproducible
- C:/Users/manub/Documents/Codex/2026-09-04/f/work/FH12B_BROWSER/report.json (primera ejecución).
- C:/Users/manub/Documents/Codex/2026-09-04/f/work/FH12B_BROWSER_CONFIRM/report.json (confirmación y capturas).
- C:/Users/manub/Documents/Codex/2026-09-04/f/work/fh12b-keyboard.js (prueba de teclado mediante playwright-cli sobre preview local 4328).
- C:/Users/manub/Documents/Codex/2026-09-04/f/work/FH12B_MENU_390.png.
- C:/Users/manub/AppData/Local/Temp/flowhome-seo-audit-GBb8YX/report.json.
- test/header-keyboard.test.mjs: dos regresiones del contrato; no reemplazan la prueba de navegador.

## Juzgado del mismo agente
Valoración 1–5 del cambio, no revisores independientes:
- Producto 4/5: navegación cerrada deja de atrapar foco invisible; conservar pruebas de usuarios.
- Técnica 4/5: estado accesible sincronizado y regresiones; otros navegadores y lector de pantalla no comprobados aquí.
- Datos/editorial 4/5: etiquetas de prueba coinciden con límites reales; no se fabricaron datos.
- Operación 3/5: siete tamaños y teclado registrados, sin despliegue; producción y campo siguen pendientes.

## Próximo trabajo
FH-12 permanece parcial por comprobaciones posteriores a publicación y mediciones de campo separadas; no se altera el criterio original. FH-09 mantiene pendientes de imágenes/permisos/medición. Siguiente trabajo local independiente: FH-04, consolidar controles de calidad. Inspección inicial confirma que quality.yml manual y quality-check.yml de PR mantienen secuencias duplicadas diferentes; aún sin editar esos workflows.
Objetivo ACTIVO, heartbeat horario PAUSADO; siete tareas hechas/25 restantes. Navegadores y previews de esta prueba cerrados; no se hicieron cambios externos.

