# FH17E — diario conectado a la cola durable local

Fecha: 6 de septiembre de 2026. Estado: APROBADO LOCAL; FH-17 continúa parcial.

## Resultado y alcance

El diario admite un almacén explícitamente inyectado. Consulta cada identidad antes de intentar una escritura idempotente y confirma identidad, clave y estado. No activa conexiones por variables de entorno ni desde la CLI. Sin almacén sigue desactivado; dry-run no consulta ni escribe. Calidad incompleta impide la persistencia. Una confirmación incierta o un conflicto detiene el resto del lote y exige atención.

La migración 011 agrega una consulta de conciliación de solo lectura, disponible exclusivamente al rol de servicio. El informe review-persistence.json forma parte de los hashes de evidencia. El destino declarado se incorpora a la huella para impedir reutilizar evidencia de otro almacén; quien inyecta el cliente debe asignar un destino estable y verdadero.

## Evidencia observada

- Ejecución real entre 22:28:03 y 22:30:47 UTC, con Amazon deshabilitado y publicación desactivada.
- 751/751 pruebas; lint, tipos, calidad editorial, enlaces, compilación, SEO y navegador aprobados.
- Navegador completo: 134/134, cero errores de preparación o limpieza.
- PostgreSQL local real, base flowhome_test_fh17d, migraciones 001–011. El adaptador de prueba ejecuta las RPC mediante psql bajo service_role; NO constituye una prueba de PostgREST, JWT, Supabase remoto ni RLS de usuarios autenticados.
- Primera ejecución complete: 28 confirmaciones inserted. Segunda ejecución reused: no nuevo procesamiento. Consulta posterior: 28 pendientes, un completado previo, 31 eventos de auditoría.
- Consulta SQL de conciliación probada: coincidencia devuelve duplicate/completed; payload diferente conflict; clave inexistente missing; auditoría sin cambios.
- Después de la ejecución completa se añadieron tres regresiones: confirmación perdida tras escritura, cambio de destino/calidad incompleta, y consulta sin escritura implícita. 26/26 pruebas dirigidas y lint pasaron. La suite completa de 751 corresponde al código funcional previo a estas tres pruebas; no se afirma una ejecución completa de 754.
- Las dos nuevas pruebas del diario fallaron inicialmente porque su simulación no generaba los archivos de evidencia exigidos. Se completó la simulación, sin relajar el control del diario; después pasaron.
- diff-check aprobado; avisos existentes de normalización LF/CRLF, sin errores.
- Contenedor exclusivo flowhome-fh17c-pg-local detenido tras las verificaciones, conservando datos. Sin eliminación, despliegue, publicación, instalación ni cambios de cuentas en este tramo.

Evidencia completa: C:/Users/manub/Documents/Codex/2026-09-04/f/work/FH17E_DAILY/2026-09-06/.
Ejecutor local: C:/Users/manub/Documents/Codex/2026-09-04/f/work/fh17e-daily-postgres.mjs.

## Límites y recuperación

reused significa evidencia histórica intacta de la ejecución, no consulta del estado vivo de la cola. Un trabajo completado en la cola significa procesamiento técnico, no aprobación editorial ni derecho a publicar. La consulta missing tampoco prueba que una escritura remota pendiente no vaya a confirmarse después; la restricción única y la RPC de inserción siguen siendo la protección de concurrencia.

El ensayo de confirmación perdida usa transporte simulado; la inserción real y los controles del diario sí se ejecutaron contra PostgreSQL. Persistir decisiones humanas autenticadas y verificar el transporte real son trabajos distintos aún pendientes.

Para desactivar esta integración local se omite reviewStore. El rollback 011 retira solo la función de consulta; conserva tablas, trabajos y auditoría. No se aplicó el rollback 011 en este tramo. No ejecutar el banco de concurrencia que exige tabla vacía sobre esta base conservada.

## Juzgado del tramo

Valoración propia, no revisores independientes; escala 1–5 y evidencia limitada al alcance local.

| Etapa | Valoración | Mejora pendiente |
|---|---|---|
| Producto | 3/5 | Convertir pendientes en decisiones humanas revisables, sin aprobar automáticamente |
| Técnica | 4/5 local | Probar cliente y transporte reales, identidad del destino y timeouts |
| Datos/editorial | 3/5 | Mantener payload mínimo; añadir decisión humana autenticada sin contenido comercial persistido |
| Operación | 2/5 | Cuenta autorizada, despliegue de migraciones aprobado, monitorización y recuperación remota |

Siguiente: contrato y pruebas locales para decisiones de revisión, manteniendo separados completar un trabajo, aprobar contenido y publicar. FH-17 no se cierra; se mantienen ocho tareas hechas y 24 restantes.
