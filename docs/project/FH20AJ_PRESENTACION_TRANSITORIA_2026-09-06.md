# FH20AJ — Presentación transitoria reutilizable

Resultado: delivery-presentation.ts conecta elementos de presentación suministrados explícitamente con el cliente vigente. Sin enabled booleano true no modifica DOM ni realiza peticiones. No se importó en páginas públicas ni se configuró un endpoint real.

Cada respuesta gobierna todas las copias suministradas de un campo, sus fuentes y avisos. Retirada, fallo, caducidad y destrucción limpian el contenido anterior; no se restaura el catálogo como si fuera evidencia actual. Usa textContent y nodos DOM, no HTML recibido. Hay mensaje de carga, estado con role=status, reintento y exclusión de peticiones duplicadas mientras se carga. El enlace de ciclo de vida se destruye junto al cliente.

## Validación

27 comprobaciones aprobadas en Edge 152 headless, en 390 y 1440 píxeles: mismos campos repetidos, teclado Enter, estado accesible, ausencia de desbordamiento horizontal, caducidad/revocación/offline, fuentes retiradas, vuelta online sin restauración, limpieza y botón inhabilitado al destruir. Un aviso sintético no vacío con una etiqueta img y onerror se mostró literalmente, sin crear una imagen, y se retiró al quedar offline. Ese aviso se inyecta exclusivamente en la ruta local de prueba notice; no es una afirmación documental.

Se adaptó y volvió a ejecutar el ensayo HTTP anterior: doce comprobaciones aprobadas. Su intento de ocultación mediante otra pestaña sigue NO VERIFICADO porque el navegador mantuvo visible el documento. No sumar ambos ensayos como 39 requisitos independientes: hay cobertura repetida.

Capturas inspeccionadas conjuntamente: [móvil](FH20AJ_MOVIL.png) y [escritorio](FH20AJ_ESCRITORIO.png). La página técnica no reproduce diseño, contenido completo ni disposición de las páginas públicas. No se verificó lectura con lector de pantalla, suspensión de sistema ni bfcache real. Las capturas evidencian la pieza en el ensayo, no una auditoría visual integral del sitio.

871 pruebas completas aprobadas, incluida una prueba nueva de inercia por defecto. Lint/diff-check aprobados; tipos: 334 archivos, cero errores/advertencias, 18 hints; build: 88 páginas. Detector Impeccable sin incidencias mecánicas. Auditor editorial sobre el [inventario exacto de textos de estado](FH20AJ_TEXTOS_UI.txt): un archivo, cero hallazgos; no es auditoría integral de todas las condiciones documentales. Verificado el 7 de septiembre de 2026 a las 02:14 UTC.

## Integración pendiente

El llamador debe enumerar TODOS los indicadores del mismo contexto (incluidas repeticiones en chips y tablas); la pieza no descubre ni borra elementos arbitrarios. Tampoco actualiza sustitutos/complementos o recalcula recomendaciones por sí sola. Falta conectar consumidores reales, retirar cualquier representación derivada antigua y comprobar las superficies completas. Sólo después de aprobación y validación de transporte/autenticación/CDN podría habilitarse una fuente. La barrera estática y el proveedor nulo permanecen.

Reproducción: iniciar scripts/qa/compatibility-browser-harness.mjs, abrir su URL loopback con playwright-cli y ejecutar scripts/qa/compatibility-presentation-check.txt; el ensayo HTTP anterior sigue disponible en compatibility-browser-check.txt. Sesión flowhome-compat-aj cerrada; servidor temporal interrumpido. Sin cambios de cuenta, publicación ni eliminación de sesiones ajenas.

## Juzgado

Evaluación propia 1–5: producto 3 (pieza reutilizable, integración pendiente), técnica 4 (retirada coherente y prueba DOM), datos/editorial 3 (aprobación/variantes pendientes), operación 2 (sin servicio real). Impeccable y Publication Copy Auditor orientaron conservar estructura, estados claros y revisión móvil/escritorio; Playwright permitió comprobar el comportamiento real del ensayo. Sin revisores independientes. FH-20 parcial, ocho hechas/24 restantes.
