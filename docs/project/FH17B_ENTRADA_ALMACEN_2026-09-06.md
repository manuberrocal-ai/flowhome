# FH17B — entrada SQL y adaptador de cola
Fecha: 2026-09-06. **Preparado localmente; SQL no ejecutado y diario no conectado al almacén. FH-17 parcial.**

## Resultado

La migración 009 añade block10_enqueue_catalog_review al almacén Block10 existente. Revalida seis campos permitidos y sus tipos, genera claves del lado servidor, inserta con ON CONFLICT DO NOTHING y compara identidad/payload del registro existente bajo bloqueo. No actualiza estados, intentos ni leases al repetir. Devuelve sólo estado e identificadores, no la fila completa. No concede escrituras directas; ejecución sólo para service_role, nunca anon/authenticated.

El rollback preparado retira únicamente la función y conserva trabajos. No se ejecutó ni se borró información.

scripts/lib/review-queue-store.mjs recibe un cliente autorizado inyectado; llama únicamente a esa función, verifica que ID/clave/estado coincidan y redacta errores. No descubre cuentas ni credenciales, no abre un cliente automáticamente y no reintenta escrituras inciertas. El llamador debe conciliar antes de decidir reintento. El diario sigue generando preparedJob, no confirma inserción.

## Validación y límites

748/748 pruebas completas, siete dirigidas, lint y diff-check aprobados. Las pruebas del adaptador usan respuestas simuladas y revisan parámetros, confirmaciones incoherentes, rechazo previo a red y redacción de errores. La prueba de migración inspecciona texto/grants y ausencia de UPDATE; **no certifica sintaxis, ejecución SQL ni concurrencia**.

Se preparó supabase/tests/catalog-review-enqueue.sql para base LOCAL desechable, transacción con rollback y rechazo si ya existe la fixture. Comprueba inserción, paridad de claves JavaScript/SQL, estado completed preservado, conflicto, campos comerciales rechazados, NULL y permisos de ejecución. **Todavía no ejecutado.** Sus claves esperadas fueron calculadas con prepareReviewJob real, no copiadas de una ejecución SQL.

Sin cambios de páginas; no se repitieron build/SEO/navegador. Evidencia anterior FH16B sigue diferenciada. No se instalaron paquetes, no se inició motor ni se aplicó migración remota. Docker sin motor disponible y psql ausente en PATH fueron observados en FH17A; no se repitió el diagnóstico sin cambio.

## Trabajo pendiente

1. Ejecutar migraciones y prueba SQL en PostgreSQL local desechable. Verificar funciones de hash y permisos del rol propietario en la versión real.
2. Probar dos conexiones simultáneas, reclaim/lease vencido, reintento y reinicio. No sustituir por mocks.
3. Implementar auditoría durable mínima y revisión humana vinculada al trabajo. Confirmar aislamiento de consumidores: block10_claim_jobs existente no filtra fuente, por lo que no debe compartir inadvertidamente estos trabajos con ejecutores de otra finalidad.
4. Integrar el adaptador al diario sólo con selección explícita del almacén y confirmación inequívoca; conservar modo de informes/dry-run sin escrituras remotas.
5. Caducidad comercial sigue independiente; ningún trabajo pendiente/completado concede permiso de oferta. Activación remota requiere aprobación y FH-03.

## Juzgado

Perspectivas propias: producto 3/5 (continuidad preparada, no operativa); técnica 3/5 (entrada restringida y cliente probado, SQL pendiente); datos/editorial 4/5 (sin contenido comercial ni errores sensibles en confirmaciones); operación 2/5 (auditoría, concurrencia, reinicio y entorno pendientes).

Context7 se usó para el contrato RPC de Supabase. Fuentes primarias: [funciones y cliente Supabase](https://supabase.com/docs/guides/database/functions) y [PostgreSQL INSERT/ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html). El diseño evita actualizar una fila conflictiva para no reiniciar trabajo existente; la revisión documental no reemplaza la prueba del servidor.

Ocho tareas hechas / 24 restantes. Siguiente: validar SQL local y aislar consumidores de cola, no desplegar. Objetivo ACTIVO, heartbeat PAUSADO.
