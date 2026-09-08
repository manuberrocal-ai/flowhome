# FH17C — PostgreSQL local, concurrencia y reinicio
Fecha: 2026-09-06. **Verificación SQL real aprobada localmente; FH-17 sigue parcial.**

## Entorno y efectos de la prueba

Se inició Docker Desktop instalado, en ventana oculta. El motor respondió con versión 29.5.3. Existía postgres:16-alpine (imagen local 57c72fd2a128); no se descargó ni instaló nada.

Docker también reanudó automáticamente tres contenedores preexistentes ajenos a FlowHome: n8n-automation, open-notebook-local-open_notebook-1 y open-notebook-local-surrealdb-1. Se detectaron y detuvieron para devolverlos al estado inactivo anterior. No se inspeccionaron ni modificaron sus datos. No se auditó si realizaron actividad durante esos segundos; no se afirma ausencia de efectos de sus propios procesos.

La prueba utilizó exclusivamente flowhome-fh17c-pg-local, PostgreSQL 16.14, base flowhome_test, red none y ningún puerto publicado. Acceso de fixture local sin contraseña sólo dentro del contenedor aislado; no representa configuración admisible para un servicio expuesto. Se dejó el contenedor detenido y conservado con una fila sintética para inspección; no se eliminaron datos ni volúmenes. Docker Desktop queda disponible para las siguientes pruebas locales.

## Evidencia de ejecución

1. Bootstrap mínimo local (roles y objetos auth simulados); nueve migraciones 001–009 ejecutadas con ON_ERROR_STOP. Todo aprobado. auth.uid devuelve NULL en la fixture: **no prueba Auth/RLS de usuarios de Supabase**.
2. catalog-review-enqueue.sql ejecutado: BEGIN, DO, ROLLBACK sin errores. Inserción, claves JS/SQL, duplicado completed, identidad distinta, campo precio, campo ausente, NULL y grants comprobados.
3. scripts/qa/review-queue-postgres.mjs ejecutado en dos procesos psql independientes:
   - dos envíos simultáneos: duplicate e inserted, un mismo ID, una sola fila;
   - dos reclamaciones simultáneas: 0 y 1 filas, un solo ejecutor;
   - propietario incorrecto rechazado; propietario con lease válido completa;
   - reinicio real del contenedor y nueva conexión;
   - estado completed e intento 1 conservados; nuevo envío devuelve duplicate.
4. catalog-review-retry.sql ejecutado: BEGIN, DO, ROLLBACK sin errores. Lease de fixture movido al pasado, finalización vencida rechazada, nueva reclamación cambia token/incrementa intento, retry persiste, no puede reclamarse antes de available_at y luego termina con intento 3. La manipulación temporal está confinada a esa fila sintética; no simula caída del proveedor.
5. Lint y diff-check aprobados. Suite anterior de 748 pruebas sigue como evidencia de FH17B; no se repitió sin cambio de código de producto. Nuevos archivos son harness/fixtures de prueba. Después del ensayo del harness se añadieron límites de 30 s al proceso y 10 s a sentencias; lint los revisó, el ensayo completo no se repitió tras ese ajuste.

## Reproducción y precauciones

Archivos nuevos: supabase/tests/local-bootstrap.sql, supabase/tests/catalog-review-retry.sql y scripts/qa/review-queue-postgres.mjs. Prueba previa: supabase/tests/catalog-review-enqueue.sql.

Usar únicamente base desechable local. Aplicar bootstrap y migraciones en orden con error-stop; después prueba enqueue, harness, prueba retry. El harness exige tabla de trabajos vacía antes de comenzar, verifica contenedor/red/puertos y conserva una fixture completada. Una segunda ejecución sobre esa fila existente se rechaza deliberadamente: preparar una nueva base de prueba, no borrar datos por conveniencia. Los archivos SQL no son migraciones de producción.

El adaptador RPC todavía se prueba con mocks, no con PostgREST real. Las pruebas de PostgreSQL demuestran comportamiento SQL y persistencia del servidor, no el circuito diario→RPC→auditoría completo.

## Pendientes y juzgado

Falta aislar la reclamación por tipo de trabajo: block10_claim_jobs actual comparte toda la cola. Falta auditoría durable de transiciones/revisión e integración explícita al diario, con resultado incierto conciliable. No habilitarlo remotamente hasta completar esos puntos, entorno y aprobación. La expiración comercial no se renueva por un trabajo completado.

Juzgado propio: producto 3/5 (cola aún no activa); técnica 4/5 (SQL, concurrencia y reinicio comprobados); datos/editorial 4/5 (fixtures sin contenido comercial); operación 3/5 (prueba reproducible aislada, limpieza verificada; consumidores/auditoría/end-to-end pendientes). No revisores independientes.

Ocho tareas hechas / 24 restantes. Próximo: aislamiento de consumidores y auditoría. Objetivo ACTIVO; heartbeat PAUSADO. No despliegues ni cambios de cuentas remotas.
