# FH16S — presupuesto compartido de intentos en PostgreSQL local

## Decisión e implementación

La tabla006 block10_rate_limit_observations registra observaciones, pero no impone reservas atómicas. Se prepara el borrador014 fuera de migrations, reutilizando PostgreSQL/Supabase y sin añadir infraestructura. Una fila por cuenta conserva un presupuesto absoluto, revisión, referencia de aprobación, inicio, fin, consumo y última reserva. No almacena respuestas, precios, ASINs ni credenciales.

La función bloquea esa fila, vuelve a leer clock_timestamp después de esperar y consume un intento sólo si revisión, estado, tiempo y saldo permiten hacerlo. No hay reposición automática, reinicio al cambiar revisión, devolución por error ni presupuesto independiente por ASIN. Una cuenta agotada no recibe una nueva cuota al reiniciar el proceso.

RLS habilitado; grants de tabla y función revocados para public/anon/authenticated/service_role. No se añade RPC de provisión ni permiso de ejecución. Un operador confiable deberá justificar cualquier presupuesto real y su revisión. La referencia de aprobación es un identificador, no prueba de identidad humana ni autenticación por sí sola.

El adaptador de FH16R deberá realizar la reserva en una transacción separada, confirmar su commit y sólo después adquirir contenido. Un resultado incierto debe impedir la consulta; hacer rollback después de llamar al proveedor permitiría devolver indebidamente el intento. Esa integración de transporte todavía está pendiente.

## Pruebas reales locales

Se verificó el contenedor existente flowhome-fh17c-pg-local detenido, network=none y sin puertos publicados; se inició sólo para este ensayo. Se crearon bases nuevas flowhome_test_fh16s y flowhome_test_fh16s2, sin modificar la base editorial anterior. La primera cubrió concurrencia y la segunda añadió caducidad mientras espera un bloqueo. Ambas se conservan.

La suite SQL se ejecutó con ON_ERROR_STOP y rollback: inexistente, revisión incorrecta, límite exacto, cambio de revisión sin reset, desactivación, caducidad, reloj anterior a última reserva, RPC no autorizada y reset por service_role rechazados. Los datos de la suite no persisten.

scripts/qa/commerce-budget-postgres.mjs abrió12 solicitudes independientes sobre presupuesto3:3 admitidas,9 denegadas y consumo3. En la segunda base, se observó wait_event_type=Lock en pg_stat_activity; la solicitud bloqueada recibió false al obtener la fila ya vencida, sin consumir. El runner exige base de prueba vacía y contenedor aislado, no crea servicios ni aplica el borrador. Las fixtures de concurrencia permanecen para inspección.

Antes de reiniciar se comprobó ausencia de otras conexiones cliente. Después del reinicio, test:parallel conservó consumo3 y denegó un nuevo intento; test:lock conservó consumo0. Se verificó ejecución denegada para anon/authenticated/service_role. Estado final del contenedor: exited, network none, sin puertos. Lint correcto, plan32/8 coincidente y diff-check correcto.

## Límites y juzgado

APROBADO LOCAL para presupuesto absoluto y serialización entre conexiones. Producto2/5 B integral, técnica3/5 local, datos/editorial2/5 y operación2/5. Un solo agente, sin certificación independiente.

No demuestra cuotas reales Amazon ni límites por segundo, ventanas deslizantes, múltiples regiones o integridad del aprovisionamiento. Este tope absoluto es conservador y puede negar consultas; no sustituye límites adicionales del proveedor. No hay autorización para configurar cantidades reales ni activar la función. Falta conectar el adaptador con autenticación y confirmación de transacción y comprobar la configuración de cuenta aprobada.

No se repiten navegador/Lighthouse/build editorial por SQL fuera de migrations y un runner local sin consumidores públicos. FH16R conserva sus1025 pruebas y controles para esa versión. No se despliega, publica ni modifica la PR.
