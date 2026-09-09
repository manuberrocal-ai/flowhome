# FH20AL — Separar catálogo y evidencia temporal

Resultado: delivery-collection.ts permite leer productos base con evidencia exclusivamente vigente, además de avisos y relaciones de cada respuesta. Antes de superponer una respuesta elimina los nueve booleanos y metadatos de compatibilidad heredados: una respuesta ausente no recupera los true del catálogo. Las demás propiedades públicas base se conservan; el módulo exige recibir catálogo base, no recomendaciones derivadas guardadas.

Sin enabled true no solicita datos. La construcción tampoco inicia peticiones: refresh y refreshAll son explícitos. Cada producto tiene su cliente/contexto independiente; no puede heredar la evidencia de otro. El lote activo limita a tres peticiones simultáneas, y suspensión/invalidation detiene las que no empezaron. No hay reintento automático, almacenamiento persistente, sondeo ni servicio nuevo. Se rechazan identidades duplicadas/malformadas y colecciones mayores de cien registros.

read comprueba la vigencia antes de devolver copias; el consumidor debe volver a derivar comparaciones, filtros y texto desde esa lectura. Los avisos de cambio se agrupan en una microtarea y se suprimen después de destruir la colección. Volver a estar permitido no restaura evidencia ni inicia solicitudes. La superficie queda fijada al construir la colección.

## Evidencia y controles

Seis pruebas nuevas aprobadas: inercia y aislamiento; comparación real pierde líderes y razones de evidencia al caducar y al recibir denegación; el motor real del quiz pierde disponibilidad de evidencia de ecosistema tras suspensión y no la restaura al reanudar; máximo tres solicitudes del lote y ninguna de las cinco pendientes comienza después de cancelar; un producto fallido no hereda afirmaciones del compañero; copias, callbacks/destrucción e identidades inválidas. El servidor real del contrato se usa con fuente/autorización simulada, sin red externa.

878 pruebas completas, lint y diff-check aprobados. Tipos: 337 archivos, cero errores/advertencias, 18 hints. Build: 88 páginas. Verificado el 7 de septiembre de 2026 a las 02:25 UTC. No hay nueva prueba visual porque el cambio es de estado/derivación y no modifica las pantallas.

## Límites y juzgado

La colección no vuelve reactivo el DOM por sí sola: los consumidores deben suscribirse, releer y actualizar todas las razones/etiquetas/listas derivadas. El siguiente paso es enlazar las comparaciones y el quiz reales y verificar la retirada en navegador. Los procesos externos que ignoren señales de aborto no quedan garantizados como terminados; el cliente descarta sus respuestas, como en FH20AG. Autorización real, CDN, variantes, derechos y activación siguen pendientes.

Evaluación propia 1–5: producto 3 (motor corregido, pantalla pendiente), técnica 4 (estado separado, concurrencia y derivaciones reales probadas), datos/editorial 3 (autorización simulada), operación 2 (sin servicio público). No hay revisores independientes. FH-20 parcial; ocho hechas/24 restantes.
