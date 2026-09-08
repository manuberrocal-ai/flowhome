# FH17J — vencimiento, revocación y suspensión conservando auditoría

## Resultado local

En la base nominada `flowhome_test_fh17i`, PostgreSQL16.14, contenedor `flowhome-fh17c-pg-local`, se probaron dos carreras adicionales mediante [sesiones separadas](../../scripts/qa/editorial-decision-races.mjs). Antes de iniciarlo se revalidaron estado detenido, red none y puertos vacíos. Se conservaron las fixtures anteriores y se agregaron dos trabajos y un actor sintético nuevo; no se reutilizó una identidad real.

El harness observa `pg_stat_activity` en la base exacta: primero la sesión que retiene el bloqueo en PgSleep y luego la decisión con `wait_event_type=Lock`. No da por probado un bloqueo sólo por lanzar dos promesas o esperar una duración.

| Intercalación observada | Respuesta | Eventos del trabajo | Versión |
|---|---|---:|---:|
| Evidencia vence antes de liberar la cabeza bloqueada | stale_evidence | 0 | 0 |
| Revisor revocado por una transacción que bloquea su membresía | unauthorized | 0 | 0 |

Ambos casos pasaron. No fue necesario alterar la función de decisión: las comprobaciones posteriores a adquirir los locks ya cubrían estas intercalaciones. No se afirma cobertura de todas las carreras, aislamiento serializable ni autenticación JWT real. El harness usa el UID de fixture de FH17I y falla si ya existe su actor de prueba.

## Suspensión ensayada

Se añadió y aplicó sólo a esta base el [borrador de suspensión](../../supabase/drafts/012_editorial_decisions_suspend.sql): revoca ejecución de la función a public/anon/authenticated/service_role, sin eliminar tablas, decisiones, versiones, evidencia ni membresías. Es retirada operativa, no rollback destructivo ni restauración automática.

Antes y después se observaron dos eventos conservados y el mismo SHA-256 de su representación JSONB ordenada por trabajo/versión: `5a47868c944bda9d0fbd3a6f53c0cb50e7b415eba732103ce26704801e8b86b2`. La consulta de privilegios devolvió false para authenticated; una invocación efectiva bajo ese rol devolvió permission denied. El exit1 de esa invocación es el rechazo esperado, no una publicación fallida. No se volvió a conceder ejecución: la fixture queda suspendida para revisión.

Rehabilitar exige un grant revisado por separado y mantener los demás controles. Esta prueba conserva auditoría, pero no demuestra recuperación completa de servicio ni backup externo.

Al terminar se detuvo únicamente el contenedor utilizado y se verificó `exited none {}`. Bases, fixtures e historial permanecen disponibles; no se borraron datos ni volúmenes.

## Verificación y continuidad

Harness ejecutado y lint correcto; diff-check y plan operativo comprobados. No se repitieron suite JavaScript, build, navegador ni medición de rendimiento: no cambió el sitio ni la función SQL ya probada. Los970 PASS históricos no se atribuyen a esta prueba.

012 sigue fuera de migrations. Próximo pendiente sustantivo: aprovisionamiento confiable y auditable de evidencia/membresías, sin otorgar a automatismos autoridad de revisión; después integración y sesión real en el entorno autorizado. La entrega A conserva por separado los requisitos de fuente/release/aprobación.

## Juzgado propio

Producto2/5 para la revisión: sin interfaz conectada. Técnica3/5 local: dos intercalaciones adicionales verificadas. Datos/editorial3/5 local: cero decisiones con evidencia/revisor invalidados, auditoría conservada. Operación2/5: retirada local probada, reactivación y entorno real no probados. FH-17 parcial; sin publicación, cuentas reales ni cambios remotos.
