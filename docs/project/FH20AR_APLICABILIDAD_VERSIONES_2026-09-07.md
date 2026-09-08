# FH20AR — Aplicabilidad de versiones corregida

Hallazgo reproducido antes de corregir: una relación de producto con scope restringido a variante podía generar alexaCompatible true en una consulta sin variante. Las relaciones substitutes/complements conservaban también esa afirmación restringida. Un conflicto de firmware se mostraba como conflicto general. La validez estructural de scope no bastaba para establecer aplicabilidad.

Corrección central en surfaceableResultsFrom: cuando la consulta identifica un producto, las restricciones no nulas variantId, generationId, hardwareId o firmwareId no se proyectan como aplicables. Se mantienen los registros originales; no se inventan identificadores seleccionados ni se reescribe su fuente. La respuesta es no verificado, no incompatibilidad.

El conjunto previo a este filtro sigue participando en el análisis de contradicciones: un conflicto vigente de versión potencialmente aplicable impide emitir una afirmación positiva general, pero no se muestra como incompatibilidad universal. Cuando ese conflicto caduca deja de bloquear. Los requisitos generales de instalación se conservan; los limitados además a firmware desconocido no se presentan como universales.

## Pruebas

Cuatro pruebas nuevas aprobadas:
- Cuatro clases de restricción por cuatro superficies: 16 respuestas HTTP de producto/quiz/comparison/alternatives sin afirmación ni condición heredada, aceptadas por el parser v2.
- Ocho combinaciones de clase y substitutes/complements sin promoción ni explicación fuera de contexto.
- Conflicto de firmware bloquea la afirmación general sin convertirse en aviso universal; al caducar deja de bloquear.
- Requisito de instalación general permanece; restringirlo a firmware no seleccionado lo retira.

La primera ejecución reprodujo los tres fallos principales. La cuarta prueba necesitó incorporar una fila de evidencia para su ubicación exacta, ausente en el fixture inicial; esa corrección de fixture no debilitó la validación. Después, 20 pruebas dirigidas y 895 completas aprobadas. Lint, tipos (344 archivos, cero errores/advertencias, 18 hints), build 88 páginas y diff-check aprobados. Sin cambios visuales ni nueva prueba de navegador en este incremento.

## Límites y juzgado

El endpoint sigue identificando solo producto, superficie y US. No se implementó un selector de variante/firmware ni se verificó una unidad física. El cambio evita el caso inseguro mientras falta ese contexto; no resuelve por sí solo la parte del objetivo que requiere datos reales por versión. El estado de un registro de auditoría puede seguir siendo activo aunque no sea aplicable a una consulta genérica; actividad y aplicabilidad son conceptos distintos.

Evaluación propia 1–5, sin revisores independientes: producto 4 (deja de generalizar); técnica 4 (causa reproducida y regla central probada); datos/editorial 3 (contexto físico y fuentes aprobadas pendientes); operación 2 (sin activación autorizada).

## Próximo trabajo dentro del conjunto

Se revisaron los 24 pendientes del backlog: la mayoría requieren cuenta, derechos, publicación aprobada o medición posterior. No repetir búsquedas de credenciales ni inventar aprobaciones. La ficha FH13A de entrega editorial conserva un inventario histórico y validaciones anteriores a estos cambios: corresponde consolidar el paquete local A con el estado exacto actual, sus pruebas y decisiones pendientes. Es un inventario de revisión, no un manifiesto publicable ni un permiso para commit/push/despliegue. Priorizar esa entrega general antes de añadir integraciones comerciales sin acceso.

FH-20 sigue parcial; ocho hechas/24 restantes. Objetivo activo y heartbeat pausado. Sin cambios de cuentas, publicación ni envío de código.
