# FH17I — decisiones probadas en PostgreSQL local

## Resultado y alcance

Se inició Docker Desktop ya instalado, sin instalar paquetes. Antes de iniciar el único contenedor utilizado, `flowhome-fh17c-pg-local`, se comprobaron `NetworkMode:none`, ningún puerto publicado y estado detenido. Se creó una base nueva `flowhome_test_fh17i`, conservando las bases anteriores. Bootstrap local, migraciones001–011 y DDL borrador012 compilaron correctamente en PostgreSQL16.14.

La [fixture de UID](../../supabase/drafts/012_local_auth_fixture.sql) reemplaza la función local nula por lectura de un claim sintético exclusivamente en bases de prueba nominadas. No autentica personas, no usa JWT real, PostgREST ni Supabase remoto. No se modificó el bootstrap común ni ninguna función de producción.

## Pruebas ejecutadas

La [suite SQL](../../supabase/drafts/012_editorial_decisions.test.sql) pasó primero con los casos originales y nuevamente después de ampliarla. Ambas ejecuciones terminaron `BEGIN / DO / ROLLBACK`, con ON_ERROR_STOP. Se comprobaron UID ausente, usuario no autorizado/revocado/expirado, evidencia no registrada/expirada/revocada, identidad inyectada, trece variaciones de tipos/valores/revisión/digest/versión, escritura inicial, duplicado, conflicto, segunda decisión con versión siguiente, actor persistido, denegación real de UPDATE directo, inmutabilidad y grants. Los cambios de esas suites se revirtieron transaccionalmente.

El [harness concurrente](../../scripts/qa/editorial-decisions-postgres.mjs) ejecutó sesiones PostgreSQL separadas:

| Caso | Resultado observado |
|---|---|
| Dos intenciones idénticas | recorded + duplicate, ambas versión1, publicación false |
| Dos decisiones distintas sobre versión0 | recorded + version_conflict |
| Estado durable de los dos trabajos | Dos eventos, suma de versiones2 |
| Reinicio del contenedor y reintento | duplicate versión1; siguen dos eventos |

El harness verifica contenedor/red/puertos/base nominada y estado inicialmente vacío. Conserva las fixtures; no debe repetirse sobre esa base poblada. Sus dos llamadas simultáneas usan transacciones con retención breve de lock, pero no miden ni certifican todas las intercalaciones posibles.

Lint del harness y diff-check correctos. No se repitieron las970 pruebas JavaScript, build, navegador ni Lighthouse: no ejecutan SQL ni verifican autenticación. No se cambió código del sitio ni se publicó.

Al terminar se detuvo sólo el contenedor utilizado: `exited none {}` comprobado. La nueva base y sus dos eventos se conservaron; no se borraron datos ni volúmenes. Docker Desktop queda iniciado, sin este contenedor en ejecución.

## Límites y siguiente paso

012 sigue en drafts, no en migrations. Falta probar explícitamente vencimiento esperando lock, revocación concurrente, recuperación que conserve auditoría, aprovisionamiento confiable de evidencia/membresías y un recorrido real autenticado. El propietario de tablas aprovisionó sólo fixtures sintéticas en esta base local. No se concedió autoridad real ni se conectó un endpoint.

## Juzgado propio

Producto2/5 para decisiones: todavía sin interfaz de revisión. Técnica3/5 local: SQL, conflictos y persistencia tras reinicio comprobados. Datos/editorial3/5 local: actor/digest/versionado probados con fixtures, no evidencia comercial real. Operación2/5 para esta pieza: ensayo aislado reproducible, sin despliegue ni identidad real. FH-17 permanece parcial; el objetivo integral no está completado.
