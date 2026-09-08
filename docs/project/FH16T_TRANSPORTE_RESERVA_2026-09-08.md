# FH16T — transporte de reserva Supabase con política de commit explícita

## Implementación

createSupabaseAttemptReserver conecta el contrato reserveAttempt de FH16R con la RPC del borrador014 mediante POST a una ruta fija. Sin enabled=true permanece inerte. No tiene proyecto, credenciales ni política transaccional por defecto. No se monta en un endpoint ni se conecta con una cuenta real.

Se usa fetch existente porque se necesita inspeccionar Preference-Applied, no sólo el cuerpo data/error del cliente de aplicación. No se instala otra dependencia. El cuerpo lleva únicamente account_ref/revision; no datos de producto ni permisos aportados por navegador. El origen se configura en servidor, exige HTTPS salvo loopback y rechaza credenciales en URL, query, fragmento y rutas arbitrarias. Redirects se rechazan; claves/tokens se leen en servidor y no se registran.

Timeout2s incluye lectura de credenciales, transporte y cuerpo. El lector HTTP exterior conserva su límite3s. No hay reintentos. Cancelación, error, cuerpo mayor128bytes, MIME/status inesperado o cualquier resultado distinto del booleano JSON true deniegan adquisición. Una reserva puede quedar consumida si se pierde la respuesta; se acepta esa pérdida conservadora y no se consulta al proveedor.

## Contrato transaccional y fuente

Context7 se usó para revisar la documentación oficial PostgREST14 sobre [db-tx-end](https://docs.postgrest.org/en/v14/references/configuration.html#db-tx-end) y [preferencia de fin de transacción](https://docs.postgrest.org/en/v14/references/api/preferences.html#transaction-end-preference). Esa consulta cambió el diseño: true no basta si la transacción puede revertirse.

En configuración verificada commit, el servidor siempre confirma transacciones y no necesariamente aplica/eco la preferencia tx. En modos que permiten override, el adaptador exige Preference-Applied: tx=commit. Rollback, preferencias contradictorias/duplicadas o desconocidas se rechazan incluso si el cuerpo dice true. Se envía Prefer: tx=commit, handling=strict.

transactionPolicy es configuración confiable que un operador debe verificar contra la instancia real antes de habilitarla. No se deduce de la respuesta ni de un flag del navegador. La cabecera no es un recibo criptográfico; una instancia mal configurada o un servidor que mienta queda fuera de esta garantía. No se confirmó versión/configuración de Supabase real ni JWT/PostgREST remoto.

## Pruebas y límites

Se añadieron seis pruebas del transporte y una integración con el lector: configuración/desactivación, petición exacta, matriz de políticas/preferencias, cuerpos y errores, credenciales/cancelación y timeout. El lector no adquiere cuando recibe rollback o commit ambiguo. Pruebas de HTTP simulado, no de commit en PostgREST real. FH16S conserva la evidencia PostgreSQL de serialización/commit/autocommit en sus conexiones locales, no se atribuye al transporte simulado.

Controles finales:1032/1032 pruebas; lint correcto; tipos451 archivos sin errores/advertencias y18 hints. Build88 con selector production, cuenta/analítica false; SEO88 sin errores/advertencias. Plan32/8 coincidente y diff-check correcto.

El borrador014 continúa sin grants. Faltan identidad y permisos autenticados, configuración transaccional comprobada, presupuesto aprobado y adaptador de adquisición real. No se repitieron navegador/Lighthouse por este cambio exclusivamente de servidor. No se actualizó PR ni producción.

## Juzgado propio

APROBADO LOCAL para transporte conservador e integración con lector. Producto2/5 B integral, técnica3/5 local, datos/editorial2/5 y operación2/5. Un solo agente, sin revisión independiente. No equivale a conexión autorizada con Amazon ni a habilitación de Supabase. Próximo trabajo: control de autorización por cuenta y referencia revisada, sin inventar permisos desde metadata o estado de una respuesta.
