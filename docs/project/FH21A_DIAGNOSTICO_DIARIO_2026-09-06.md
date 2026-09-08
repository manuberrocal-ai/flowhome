# FH21A — diagnóstico de incidentes del diario

Fecha: 6 de septiembre de 2026. APROBADO LOCAL; FH-21 parcial.

## Cambio y evidencia

El diario ya guardaba review-persistence.json, pero summary.md no mostraba sus resultados. Ahora informa estado final del run y cuatro recuentos: insertados, existentes, sin confirmar y no intentados. Las instrucciones distinguen fallo de transporte, trabajo previamente guardado y necesidad de conciliación, sin copiar mensajes libres del proveedor.

Otra carencia: si fallaba la lectura final de evidencia, el manifiesto quedaba needs_attention sin causa explícita en anomalies.json y el resumen podía indicar cero anomalías. Ahora se registra run_evidence_unconfirmed y se actualiza el resumen a needs_attention. Se advierte que un fallo de informe no revierte escrituras confirmadas.

La recuperación no borra ni reinicia estados: se resuelve la causa y se reanuda mediante consulta de identidad. Un trabajo existente/completed no implica aprobación humana. El estado resumido corresponde a ese run, no a una consulta en vivo.

## Validación y alcance

- 22 pruebas dirigidas pasaron. Incluyen desglose parcial, redacción de mensajes, modos desactivado/prueba/calidad fallida, conciliación y evidencia final faltante.
- 758/758 pruebas completas, cero fallos.
- lint, tipos (273 archivos; cero errores/advertencias, 18 hints), compilación de 88 páginas y diff-check aprobados.
- No se repitieron navegador ni PostgreSQL: cambio de informes del diario, sin cambios de UI, SQL ni transporte.
- No se activaron servicios, alertas, horarios, envíos ni despliegues. Sin instalaciones ni eliminación de datos.
- Se recompiló dist para validación; el inventario FH13A conserva la observación histórica de las 22:40:38 UTC, no certifica automáticamente compilaciones posteriores.

## Incidente local y límites

Los ensayos usan directorios temporales y dobles controlados del almacén. Demuestran coherencia entre informe/manifiesto y las instrucciones de conciliación; no son un incidente real de producción ni una restauración remota. La lectura final puede fallar por distintos motivos: el código público es estable y genérico, no pretende diagnosticar una causa concreta sin inspección.

El lector de artefactos sigue siendo un control de integridad/presencia, no una evaluación independiente de contenido. Si el almacenamiento local no permite escribir siquiera el informe de fallo, el proceso puede terminar con error; no se promete evidencia durable bajo pérdida del propio disco.

## Juzgado

Valoración propia del tramo: producto 3/5 (resultado operativo entendible); técnica 4/5 local (estados y regresiones probados); datos/editorial 3/5 (sin mensajes libres ni aprobación inferida); operación 2/5 (diagnóstico local, no monitor activado).

La guía verified-task-brief se utilizó para limitar la afirmación a lo probado. FH-21 pasa de pendiente a parcial: todavía faltan monitor real de disponibilidad/CTA, responsable y destino autorizados, prueba de incidente/restauración y SLO calibrado a capacidad real. No se inventan destinatarios ni tiempos de respuesta.

Siguiente: preparar la comprobación de disponibilidad/CTA sobre el artefacto/entorno autorizado, reutilizando las pruebas existentes, y definir su integración sin envíos automáticos. La decisión de imágenes de A sigue pendiente de respuesta; no se repite la pregunta.
