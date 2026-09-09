# FH20AK — Presentación transitoria en una ficha real

Resultado: la plantilla de producto conserva el identificador canónico de cada característica y expone espacios de valor/fuente. El enlace product-presentation.ts descubre los nueve campos, incluidas repeticiones en chips, y exige espacios completos antes de montar. Permanece inerte por defecto y no se importa ni ejecuta desde scripts públicos. La prueba lo habilitó explícitamente sólo en el navegador local.

Los controles de estado/reintento están ocultos en el HTML por defecto. No cambia el texto de los valores iniciales ni convierte catálogo en evidencia. Al montar, los nueve campos y sus repeticiones usan una misma respuesta vigente; los avisos estáticos previos se retiran para evitar una copia obsoleta. La fuente de cada campo se muestra en su fila. Alternativas, recomendaciones y comparaciones no se actualizan todavía por este enlace.

## Evidencia

Inspección de los 28 HTML de producto construidos: nueve campos únicos, nueve espacios de fuente y controles ocultos en todos. Una nueva prueba comprueba que cada fila conserva su clave canónica independientemente de la etiqueta visible.

Edge 152 headless abrió el HTML construido de Echo Dot 5th Gen con los estilos y scripts reales del proyecto, servido sólo por loopback. Dieciséis comprobaciones aprobadas a 390 y 1440 píxeles: nueve filas más seis chips, estado inicial no activado, teclado Enter, texto coincidente entre chip y fila, fuente visible, ausencia de desbordamiento horizontal, retirada de todos los valores y fuentes ante offline, sin restauración al volver online. La autorización del servidor sigue siendo un fixture, no aprobación real.

Capturas inspeccionadas: [móvil vigente](FH20AK_MOVIL_VIGENTE.png), [móvil sin evidencia](FH20AK_MOVIL_RETIRADO.png), [escritorio vigente](FH20AK_ESCRITORIO_VIGENTE.png), [escritorio sin evidencia](FH20AK_ESCRITORIO_RETIRADO.png). Se bloquearon solicitudes fuera del loopback: la imagen Amazon falló intencionalmente y aparece la ilustración de categoría existente. La ruta favicon.svg no está servida por el ensayo (404); no es un fallo demostrado del sitio publicado.

872 pruebas completas, lint y diff-check aprobados; tipos: 335 archivos, cero errores/advertencias, 18 hints; build: 88 páginas. Detector de interfaz: cero incidencias mecánicas. Auditor editorial sobre la ficha construida: dos avisos de alt vacío; comprobados como avatares ocultos con alt vacío explícito, no imágenes informativas sin descripción. Verificado el 7 de septiembre de 2026 a las 02:20 UTC.

## Límites y siguiente paso

No se desplegó, registró endpoint ni habilitó una fuente. La prueba cubre la ficha Echo Dot en dos tamaños y la estructura estática de 28 fichas; no prueba todas las interacciones de los 28 modelos ni autenticación/CDN, ocultación real, suspensión del sistema o bfcache. El servidor de ensayo y la sesión flowhome-compat-ak se cerraron.

Siguiente: enlazar comparación y quiz, retirar/recalcular sus decisiones derivadas al perder vigencia y probar los consumidores restantes. La aprobación editorial, variantes, derechos de imágenes e integraciones reales siguen pendientes. NO LISTO PARA PUBLICAR como sistema de evidencia conectado.

## Juzgado

Evaluación propia 1–5: producto 4 (ficha real ensayada), técnica 4 (identificadores completos y retirada conjunta), datos/editorial 3 (fixture de autorización), operación 2 (sin endpoint real). Las guías de interfaz/revisión editorial ayudaron a preservar identidad y condiciones, comprobar móvil/escritorio y contrastar avisos antes de editar texto alternativo. Sin revisores independientes. FH-20 parcial; ocho hechas/24 restantes.
