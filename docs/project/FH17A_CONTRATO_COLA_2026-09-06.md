# FH17A — contrato de entrada para revisión durable
Fecha: 2026-09-06. Estado **parcial: preparación local implementada, persistencia no conectada**.

## Hallazgo y decisión

El proceso diario construía una cola de informe en memoria. La migración SQL 006 contiene tabla de trabajos, reclamación con exclusión, lease y reintento, pero su existencia no demuestra aplicación ni funcionamiento remoto. Se conserva esa infraestructura como destino preferido, sin introducir otra base de datos.

Comprobación local: docker.exe existe, pero docker info no pudo conectar con el motor Linux; psql no fue localizado en PATH. No se inició Docker, descargaron imágenes ni instaló un servidor. Las pruebas SQL reales de concurrencia/reinicio siguen NO VERIFICADAS. Esta limitación no bloquea contratos locales ni todo el proyecto.

## Implementación

scripts/lib/review-queue.mjs valida un payload exacto:
schemaVersion, intent=catalog-review, asin, market=US, productSlug nullable y revision SHA-256.

Rechaza campos adicionales, respuestas anidadas en los campos definidos, identidad inválida y mercados no soportados con errores codificados que no repiten valores. No acepta precio, título API, imagen, rating, disponibilidad ni secretos en el payload. El contrato no sustituye autenticación del futuro endpoint ni pretende detectar un secreto deliberadamente disfrazado de identificador permitido.

prepareReviewJob reutiliza enqueueJob de Block10: idempotencia por ASIN y revisión, separación US, conflicto ante payload diferente con la misma clave. Una repetición con el trabajo existente devuelve ese mismo objeto y conserva estado/intentos; otra revisión crea trabajo separado. La revisión es la huella del proyecto, no una fecha de captura comercial ni permiso para exhibir datos.

El diario adjunta preparedJob a cada entrada del informe review-queue.json. Es una preparación declarativa, no inserción remota ni confirmación de trabajo procesado. No existe adaptador durable en este cambio. El próximo adaptador debe leer el estado existente y persistir transaccionalmente; no reemplazar filas por el estado pending del informe nuevo.

## Validación

- Tres pruebas nuevas: lista de campos; rechazo de datos prohibidos; repetición y conflictos de identidad.
- 744/744 pruebas completas aprobadas, lint y diff-check aprobados.
- Después se reforzó la prueba de integración del diario: verifica payload real serializado, revisión, estado preparado y ausencia del precio manual de fixture. Las 19 pruebas dirigidas volvieron a pasar. No se repitió suite completa después de esas aserciones adicionales.
- No cambios de UI ni compilación de páginas; última evidencia aplicable FH16B: 741 pruebas de aquella revisión, tipos/build/SEO y 134 casos navegador. No se afirma que se hayan repetido ahora.
- Pruebas actuales usan archivos temporales de informe y objetos en memoria; **no prueban persistencia en PostgreSQL, dos procesos ni reinicio de base**.

## Siguiente implementación requerida

Añadir entrada transaccional al almacén existente con lista permitida, conflicto de idempotencia y auditoría redactada; preservar revisión y estado, separar aprobación editorial de caducidad. Adaptador de lectura/escritura por funciones autorizadas, sin abrir grants directos. Probar dos ejecutores, pérdida de lease, reintento, reinicio y recuperación; sólo después conectar al diario. Confirmar entorno y permisos antes de cualquier migración remota. No usar una prueba de memoria como sustituto de ese cierre.

## Juzgado

Perspectivas propias: producto 3/5 (revisión preparada, aún no operativa); técnica 3/5 (contrato y consumidor probado, transacción pendiente); datos/editorial 4/5 (mínimos datos y errores redactados, no adquisición nueva); operación 2/5 (motor/entorno, dos ejecutores y recuperación pendientes).

La skill verified-task-brief exigió separar el contrato validado del resultado durable no probado. FH-17 pasa de pendiente a parcial, no a hecho. Ocho tareas hechas / 24 restantes. Objetivo ACTIVO, heartbeat horario PAUSADO.
