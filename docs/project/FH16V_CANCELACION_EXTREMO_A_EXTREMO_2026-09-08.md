# FH16V — resultados tardíos en el lector comercial completo

## Ficha y resultado dirigido

Pendiente ejecutable: comprobar cancelación y timeout a través de serveCommerceRequest + createGatedCommerceReader, no sólo en cada módulo aislado. Aceptación: respuesta503/no-store mientras una dependencia sigue detenida; después de liberarla, resultado nulo y ninguna etapa posterior. No se requiere proveedor real para refutar ese defecto de coordinación.

Se añadieron dos pruebas, sin modificar código de aplicación. La primera detiene sucesivamente autoridad inicial, reserva, autoridad previa a adquisición, adquisición y autoridad final; la dependencia ignora deliberadamente AbortSignal. Se cancela HTTP, se comprueba la respuesta antes de liberar el trabajo, luego se verifica que la secuencia no continúa y no devuelve snapshot. La segunda espera el timeout real de3 segundos mientras está reservando cuota, libera el resultado tardío y comprueba0 adquisiciones y1 intento consumido.

23/23 pruebas dirigidas de lector/HTTP correctas; el caso de timeout terminó alrededor de3012 ms en esta ejecución. Es observación de laboratorio, no SLO de producción. Suite general1038/1038, lint del archivo modificado y diff-check correctos; plan32/8 coincide. Candidato FH13R limpio confirmado.

## Límites

Una dependencia que ignora cancelación puede seguir trabajando internamente; el contrato no puede detenerla por la fuerza. La evidencia demuestra que su resultado no se entrega y que el orquestador no inicia etapas posteriores. Si la adquisición ya comenzó, no se afirma que se revierte el contacto externo o el uso de cuota. No hay reembolso, reintento ni fallback implícito. No se activó endpoint ni servicio.

No se repiten build/navegador/Lighthouse por un cambio exclusivamente de pruebas; la fuente de aplicación conserva el control general de FH16U. FH13R permanece como candidato editorial inmutable. Faltan integraciones autenticadas reales, políticas del proveedor y pruebas HTTP/CDN en entorno autorizado.

## Juzgado

APROBADO LOCAL para cancelación coordinada en los límites ensayados. Producto2/5 B integral, técnica3/5 local, datos/editorial2/5 y operación2/5. Un único agente, sin revisión independiente. Se amplía evidencia sobre el recorrido real de los módulos con dependencias controladas, sin presentarlas como cuentas reales.
