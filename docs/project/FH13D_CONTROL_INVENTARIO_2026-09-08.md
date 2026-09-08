# FH13D — control reproducible del inventario local

Nuevo verificador de sólo lectura: `node scripts/qa/verify-local-inventory.mjs docs/project/FH13D_INVENTARIO_LOCAL_2026-09-08.json`.

Compara lista exacta de archivos, contenido por SHA256, conteos, bytes y registro de entorno con dist. Reutiliza el inventario seguro existente. Rechaza registros que pretendan autorizar publicación; no escribe, reconstruye, despliega ni modifica controles del flujo de release. No imprime diffs de archivos ni contenido de entradas rechazadas.

[Inventario actual](FH13D_INVENTARIO_LOCAL_2026-09-08.json): 421 archivos, 136.717.793 B, árbol `4afffb683a5107a1e8e51347ce5bc8e0269539a98d148228f32ce520cc3c4725`. Verificación real correcta con publishable:false. FH13C rechazado con código1 como se esperaba tras cambios posteriores. Un test con casos de modificación, añadido, ausencia, identidad, conteo, huella y entorno pasa; lint afectado y diff correctos. No hubo nuevo build ni repetición de la suite general: cambia el control de inventario, no el sitio.

Límites: igualdad no acredita procedencia reproducible del código ni aprobación, destino o rollback. El inventario registra entorno local sin autenticación/analítica y sourceSha:null. Un build posterior exige verificar de nuevo; no se actualiza silenciosamente el registro para hacer pasar el control.

Juzgado propio: producto7/10 (sin cambio visual), técnica8/10 (rechazo de drift probado), datos/editorial8/10 (no falsa atribución de release), operación8/10 (control ejecutable, aún sin candidato de producción). Mantener FH-13 pendiente de aprobación y el objetivo activo; próximos pasos son revisión final de pendientes locales y preparación deliberada del candidato, no publicación automática.
