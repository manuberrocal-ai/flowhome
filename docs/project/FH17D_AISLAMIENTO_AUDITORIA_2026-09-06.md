# FH17D — consumidores aislados y auditoría durable
Fecha: 2026-09-06. **Implementado y probado en PostgreSQL local. FH-17 parcial.**

## Cambio

Migración 010: el consumidor genérico block10_claim_jobs excluye catalog-review. El nuevo block10_claim_catalog_reviews sólo toma revisiones. Ambos reutilizan una función interna sin permiso de ejecución directo para service_role; mantienen límite de intentos, leases y exclusión de filas ocupadas. El cierre de un lease conserva la función previa y exige propietario/token vigentes.

Auditoría privada block10_review_job_audit registra inserción y actualizaciones con estados, intentos, revisión y fecha. No copia el payload ni guarda respuestas comerciales. Un trigger impide cambiar la identidad/payload de una revisión existente; otro impide modificar/borrar auditoría. Registros previos reciben baseline con el estado observado, no un historial inventado. Esto es auditoría operacional, no aprobación humana editorial.

Rollback de capacidad: revoca nuevas reclamaciones de revisión, conserva aislamiento genérico, trabajos y auditoría. No elimina tablas ni contenido. Habilitar de nuevo requiere una acción revisada.

## Pruebas reales y correcciones

- La primera ejecución de 010 detectó una comilla faltante en la selección de baseline. Se verificó que la transacción había revertido; se corrigió y ejecutó de nuevo satisfactoriamente.
- Una segunda base local inicialmente encontró roles ya existentes en el clúster. El bootstrap de pruebas ahora reutiliza únicamente roles sin login/superusuario; no modifica cuentas existentes. El bootstrap simula auth.uid=NULL, por tanto no certifica Supabase Auth.
- Se creó flowhome_test_fh17d dentro del contenedor aislado existente. Las diez migraciones 001–010 pasaron desde cero.
- En la base nueva: enqueue, aislamiento y retry SQL: tres secuencias BEGIN/DO/ROLLBACK aprobadas.
- Aislamiento probado con una revisión y un trabajo de otra fuente; cada consumidor toma el suyo. La auditoría registra tres eventos de revisión y ninguno del trabajo ajeno; edición del historial y mutación del payload rechazadas; permisos directos comprobados.
- Harness actualizado ejecutado: dos conexiones simultáneas produjeron inserted/duplicate, reclamaciones 0/1, propietario incorrecto rechazado. Reinicio real conservó completed, intento 1 y tres eventos de auditoría. La repetición no generó auditoría ficticia.
- Rollback 010 ejecutado en la base anterior flowhome_test: permiso de claim de revisión false, una fila de trabajo y un baseline conservados. La base nueva conserva el comportamiento 010 completo para pruebas posteriores.
- 748/748 pruebas JavaScript completas, lint y diff-check aprobados. No cambios de frontend; no se repitió build/SEO/navegador.

Contenedor flowhome-fh17c-pg-local: PostgreSQL 16.14, network none, sin puertos, detenido al terminar y conservado. No se borraron fixtures/volúmenes. No conexión o migración remota, instalación ni nuevas descargas.

## Archivos

supabase/migrations/010_review_queue_isolation_audit.sql; rollback homónimo; supabase/tests/catalog-review-isolation.sql; ajustes a local-bootstrap.sql, catalog-review-retry.sql y scripts/qa/review-queue-postgres.mjs. El harness acepta una base explícita con prefijo flowhome_test, conserva restricción de contenedor/red/puertos y exige cola vacía al empezar.

## Pendientes y juzgado

Pendiente: conectar diario→adaptador de forma explícita, probar el transporte real o una adaptación local equivalente identificada como tal, conciliar respuestas inciertas y conservar una revisión humana independiente del estado técnico del trabajo. completed no equivale a aprobado/publicado. No incorporar precios ni reiniciar la edad de observaciones.

Juzgado propio: producto 3/5 (preparación, sin operación activada); técnica 4/5 (aislamiento, restricciones y concurrencia probados); datos/editorial 4/5 (auditoría mínima sin contenido comercial; aprobación humana pendiente); operación 4/5 local (reinicio y desactivación preservan historial), no validación productiva.

Ocho tareas hechas / 24 restantes. Siguiente: integración explícita del diario y conciliación. Objetivo ACTIVO, heartbeat PAUSADO.
