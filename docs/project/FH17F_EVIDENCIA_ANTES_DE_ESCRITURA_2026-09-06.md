# FH17F — verificar evidencia antes de persistir

Fecha: 6 de septiembre de 2026. APROBADO LOCAL; FH-17 parcial.

## Hallazgo y corrección

Al preparar la frontera de revisión humana se identificó una ventana en el diario: la confirmación de los comandos precedía a la escritura de la cola, pero la lectura de los archivos de evidencia se hacía después. Por tanto, un runner que declarase éxito sin generar sus informes podía insertar trabajos y terminar posteriormente en needs_attention.

Se reutiliza el lector/hash existente en modo qualityOnly antes de consultar el almacén. Se exigen todos los controles centrales, ningún control adicional fallido, ausencia de anomalías y archivos requeridos legibles/JSON parseable. El perfil semanal exige además lighthouse:mobile explícitamente aprobado. No se convierte la existencia del archivo en prueba de veracidad de su contenido: el ejecutor de controles sigue siendo una frontera de confianza.

No cambia el esquema SQL, el contenido público, el navegador ni la política de Amazon. Las instrucciones diarias ahora documentan los estados de persistencia, el alcance del adaptador local y la falta de activación remota.

## Verificación

- 755/755 pruebas completas, cero fallos. Incluye regresión de informe faltante y control semanal fallido u omitido, con cero llamadas al almacén.
- lint aprobado.
- Tipos: 271 archivos, cero errores y cero advertencias; 18 hints existentes.
- Build: 88 páginas.
- diff-check aprobado.
- PostgreSQL y navegador: evidencia anterior FH17E (28 inserciones reales, 134 comprobaciones); NO repetidos tras este cambio sin UI. Los nuevos fallos se prueban con almacén y controles simulados.
- Contenedor local permanece detenido; no cambios externos, nuevas dependencias ni eliminaciones.

## Siguiente contrato: revisión humana

La guía verified-task-brief se utilizó para separar criterios comprobados de autorización no verificada. El encargo continuo no autoriza fingir una decisión humana.

Fuentes locales examinadas: scripts/flowhome-daily.mjs, scripts/lib/review-queue.mjs, scripts/lib/review-queue-store.mjs, src/lib/blocks/block8/admin.ts, src/lib/blocks/block10/admin.ts y migraciones 006, 009–011. Los contratos de admin actuales son funciones puras; actorId y role entran como argumentos, no acreditan una sesión. La RPC de aprobaciones generales pertenece al rol de servicio y no sustituye la autenticación de una persona ni vincula por sí sola una revisión editorial a esta cola.

Criterios de la siguiente implementación local, sin activarla:

1. Separar estado del trabajo (pending/claimed/completed) y decisión editorial. completed nunca implica aprobación ni publicación.
2. Derivar identidad y permiso desde una frontera autenticada del servidor; no desde nombres, correos, actorId, role o metadatos enviados por el navegador. Prueba con cuentas reales: NO VERIFICADO.
3. Vincular decisión a job, revisión exacta y versión de evidencia. Revisión distinta exige nueva evaluación; una aprobación previa no se traslada.
4. Persistir evento mínimo e inmutable con comparación de versión: repetición idéntica no duplica; conflicto concurrente no sobrescribe; corrección es un nuevo evento. Validación SQL local aún pendiente.
5. No almacenar respuestas Amazon, precios, tokens ni notas libres en esta cola. Aprobar una revisión no amplía vigencia, permisos comerciales ni autoriza publicación.
6. Probar rechazo anónimo/sin rol, revisión obsoleta, repetición, concurrencia, pérdida de confirmación y recuperación. Ninguno puede declararse operación remota desde mocks.
7. No crear usuarios/revisores, conceder roles ni publicar migraciones sin aprobación específica.

## Juzgado

Valoración propia: técnica 4/5 local por corregir el orden de la comprobación; operación 2/5 porque transporte y autorización reales siguen sin verificar. Producto y datos/editorial 3/5: se conserva revisión pendiente, sin aprobación automática. Mejora siguiente: implementar el contrato de decisión sin confundir una función que recibe un rol con autenticación.

No se cierra FH-17 ni se recrea un loop horario. Este informe es un punto de continuación, no fin del objetivo.
