# FH12S — contraste y nombres accesibles de acciones de producto

## Ficha y cambio

Evidencia inicial: FH12R detectó contraste 3,59:1 en AMAZON LISTING LINK y discordancia entre texto visible/nombre accesible. Aceptación: contraste >=4,5:1, nombres que incluyan las etiquetas visibles, guardar/quitar con teclado, sin pérdida de rutas, marca ni información editorial.

Se reutiliza el token existente accent-dark (#9a2e00), sin rediseño. ProductCard y la ficha/sidebar nombran las llamadas como Check on Amazon; detalles como View details; la lista mantiene Add to list/Saved al sincronizar y explicita Remove cuando está guardado. El enlace de imagen conserva su nombre por contenido (imagen, categoría y aclaración), sin sustituirlo con aria-label. No se alteraron URLs, datos comerciales ni ilustraciones.

Impeccable orientó la corrección al componente compartido y al token existente. El detector mecánico devolvió cero hallazgos en la primera corrección; no equivale a accesibilidad certificada. El primer pase de Lighthouse posterior aprobó contraste y acciones, pero señaló adicionalmente el enlace de imagen; se conservó el informe y se corrigió ese consumidor, sin silenciar la regla.

## Evidencia y límites

Prueba de navegador scripts/qa/action-accessible-names.cjs: 390/768/1440, tres enlaces Amazon por tamaño, nombres de detalles, estados de lista, foco por Tab, contraste calculado 7,595:1 sobre fondo blanco, sin desbordamiento ni errores de página. Movimiento reducido 0,00001 s. Capturas .playwright-cli/fh12s-product-{390,768,1440}.png; inspeccionadas móvil y escritorio. El primer intento del probe usó aside ambiguo y se corrigió a complementary: era un selector de prueba, no un fallo del sitio.

Primera suite: una aserción exigía las frases antiguas; actualizada para la semántica corregida. Se agregó regresión de ambos estados de lista y de la ausencia de sustitución del nombre del enlace de imagen. Validación final:1033/1033 pruebas, lint y diff-check correctos (advertencias de normalización CRLF existentes), tipos452 archivos/0 errores/0 advertencias/18 hints; build88 y SEO88/0 errores/0 advertencias. Probe de navegador repetido después del último cambio: mismos resultados correctos en los tres tamaños. No atribuir a este árbol los números de FH13Q.

Medición inicial posterior: C:/AGENTES/Informes/flowhome/fh12s-lighthouse-20260908. La medición final de producto se conserva separada en C:/AGENTES/Informes/flowhome/fh12s-lighthouse-final-20260908: tres muestras, contraste y label-content-name-mismatch aprobados en las tres; medianas98/100/100/100, LCP2259,875 ms, CLS0 y TBT6,5 ms; INP no disponible. Cero incumplimientos de presupuestos; dos advertencias EPERM de limpieza posteriores a informes completos, conservados. Son ensayos locales con recursos externos bloqueados, no datos de campo ni una matriz completa de release. Las tres capturas finales se conservan también en esa carpeta estable.

## Juzgado

APROBADO LOCAL para este defecto. Producto 3/5 local, técnica 3/5 local, datos/editorial 3/5 local, operación 2/5 integral. Valoración de un único agente, no revisión independiente. Mejora verificable de acceso a acciones; FH-12 permanece parcial por sus criterios integrales de release/producción/campo. FH13Q permanece inmutable y limpio, pero ya no representa los bytes actuales del árbol de trabajo. No hubo push, merge, publicación ni activación.
