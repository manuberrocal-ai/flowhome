# FlowHome — comprobación de acceso y ubicación de credenciales

Fecha: 2026-09-04, aproximadamente 04:55–05:01 UTC. Lectura autorizada por el usuario al indicar que las claves estaban guardadas en FlowHome u OpenCode. Este documento contiene sólo metadatos y resultados; no secretos ni exportaciones del historial.

## Hallazgo principal

Se encontró una sesión autenticada de Amazon Associates correspondiente a **`flowhome-20`**. Sin embargo, [Creators API](https://affiliate-program.amazon.com/creatorsapi) muestra como requisito incumplido tener una cuenta de afiliado aprobada; no presentó una aplicación ni credenciales disponibles. La [sección anterior de Product Advertising API](https://affiliate-program.amazon.com/assoc_credentials/home) también muestra los requisitos de acceso sin satisfacer y remite a Creators API.

El usuario afirma que tiene acceso a la API. El resultado observado se limita a esta sesión/tienda: puede existir otra cuenta aprobada o un almacén no identificado. No se concluye que nunca haya tenido API. Tampoco se interpreta el indicador general de cumplimiento del programa como prueba de una infracción concreta.

No se solicitó acceso, se aceptaron términos, se crearon aplicaciones, se revelaron claves ni se rotaron credenciales. Se dejó la pantalla de Amazon abierta para el propietario. No se hicieron llamadas autenticadas de catálogo.

## Ubicaciones comprobadas y límites

| Ámbito | Lectura realizada | Resultado |
|---|---|---|
| Proyecto FlowHome | Archivos de configuración pertinentes y nombres de variables, sin mostrar valores | Variables de analítica/Supabase presentes; no configuración Amazon utilizable |
| Entorno de Windows | Nombres pertinentes en proceso/usuario/máquina | Sin configuración Amazon identificada |
| OpenCode: configuración | Configuración activa y copias pertinentes; sólo nombres de proveedores y referencias | Referencias a otros proveedores, ninguna credencial Amazon localizada |
| OpenCode: historial | SQLite en modo sólo lectura, sesiones de FlowHome y búsquedas acotadas por términos de Amazon/Creators/PA API en la base activa y dos respaldos | Referencias a etiquetas, hosts y ejemplos; no valores de credenciales utilizables encontrados |
| n8n accesible | Búsquedas de metadatos Amazon, Creators, FlowHome y tipo AWS; búsqueda de workflows FlowHome | Sin coincidencias; no se ha probado que esta conexión sea la misma instancia que usaba OpenCode |
| Amazon Associates | Navegación de la sesión autenticada, panel y ambas páginas de API | Tienda `flowhome-20`; acceso API no habilitado en la interfaz observada |

Las búsquedas no demuestran ausencia en otros discos, cuentas, instancias, almacenes cifrados o nombres no identificados. No se inspeccionó el almacén de contraseñas del navegador, no se volcaron llaveros y no se desencriptaron credenciales de n8n. No se instalaron conectores ni se ejecutaron workflows.

## Observación comercial, no resultado de V3

Fuente: [panel Amazon Associates](https://affiliate-program.amazon.com/home), sesión `flowhome-20`, leído el 4 de septiembre. El panel indicaba reporte combinado de todas las etiquetas de seguimiento.

| Sección / ventana tal como se mostró | Métrica | Valor |
|---|---|---:|
| Resumen de los últimos 30 días | Clics | 17 |
| Resumen de los últimos 30 días | Comisiones | USD 0,00 |
| Resumen de los últimos 30 días | Bounties | USD 0,00 |
| Resumen de este mes | Clics | 1 |
| Resumen de este mes | Artículos pedidos / enviados | 0 / 0 |
| Resumen de este mes | Ganancias | USD 0,00 |
| Resumen de este mes | Conversión | 0,00 % |

La actualización indicada para el resumen mensual era **Sep 02 2026**. No se infieren fechas exactas adicionales para la ventana móvil ni se equiparan sus 17 clics con el clic mensual. No hubo exportación detallada ni verificación de atribución por etiqueta. Estos datos no prueban el efecto de V3: los cambios continúan sin publicar. Las observaciones de julio del repositorio se preservaron sin sobrescribirlas.

## Acción necesaria del propietario

Confirmar **qué cuenta/tienda tiene el acceso aprobado** o indicar **el almacén y nombre de la entrada existente**. No pegar claves en el chat. Si es otra cuenta, el propietario debe abrir su sesión autenticada. Si Amazon requiere aprobación o nueva configuración, debe resolverla en el panel; no corresponde eludir el requisito ni insistir con llamadas fallidas.

Después se podrá validar el contrato real con una llamada mínima autorizada y valores cargados desde el almacén previsto, sin registrar secretos ni conservar respuestas comerciales completas. La posesión de claves no sustituye los permisos de retención/análisis ni aprueba despliegue, publicación o activación del scheduler.

La skill de credenciales de n8n limitó su revisión a metadatos; la de uso del navegador mantuvo la inspección en la interfaz autenticada y reservó la creación/revelación/rotación de credenciales para el propietario. El bloqueo es el acceso de esta tienda y la falta de una ubicación utilizable, no un fallo de las 593 pruebas locales.
