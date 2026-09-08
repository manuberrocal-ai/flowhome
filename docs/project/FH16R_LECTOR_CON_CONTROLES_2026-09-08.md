# FH16R — adquisición con controles de autorización y cuota

## Resultado local

Se añade createGatedCommerceReader como composición explícita para readAuthorizedSnapshot de serveCommerceRequest. No instala un lector real, credenciales, almacén, endpoint o servicio. Reutiliza el diseño FH16A: adquisición y revisión en memoria, sin persistir respuestas comerciales.

Orden obligatorio: validar contexto → leer autorización vigente → consumir intento de cuota → comprobar vigencia → adquirir/revisar en la cuenta autorizada → releer autorización → devolver sólo si identidad, cuenta y revisión siguen iguales. La proyección de campos y límite de respuesta permanecen en serveCommerceRequest/projectAuthorizedCommerce.

La expiración entregada es el mínimo entre ambos permisos y la autorización de la observación. Cambiar de cuenta, revocar, cambiar la revisión, vencer o retroceder el reloj descarta el resultado. False/error en cuota impide consultar. Cancelaciones y fallos no reembolsan intentos: una petición puede haber alcanzado ya el proveedor. No hay caché ni respuesta anterior de respaldo.

## Frontera de confianza pendiente

Los tres adaptadores son dependencias de servidor, no JSON del navegador. authorize debe autenticar cuenta/derechos e identidad revisada y emitir revisiones que cambien ante cualquier revocación, incluso revocar/reaprobar. reserveAttempt debe consumir atómicamente un presupuesto global de esa cuenta. acquireReviewedSnapshot recibe accountRef y revisión para seleccionar credenciales y revisión de la cuenta correcta, sin inferirlas desde nombres de usuario o respuestas del proveedor.

Estos backends NO están implementados aquí; un callback que devuelve true no autentica ni impone una cuota global. La prueba concurrente usa un contador sintético exclusivamente para comprobar que cada lector respeta la decisión común. No demuestra atomicidad entre procesos o regiones. Los adaptadores deben respetar AbortSignal; el contrato HTTP ya impone timeout/cancelación, pero no puede detener por sí solo un backend que los ignore. La segunda autorización tampoco garantiza retirada instantánea ante una revocación posterior al chequeo/envío: la lease HTTP limita la vida restante, no implementa notificación remota de revocación.

## Verificación

Nueve pruebas nuevas: desactivación, contexto/cancelación, permisos inválidos, cuota denegada/error, revocación/cambio de cuenta/revisión durante adquisición, integración HTTP con fecha mínima y cuenta, cancelación tras reserva, reloj vencido/atrasado, no reutilización y concurrencia con cuota sintética compartida. El test integrado verifica que mutar la copia entregada a cuota no amplía la autorización usada al adquirir o responder.

No hubo cambio visual: no se repitieron navegador ni Lighthouse. El código sólo se invoca explícitamente; ningún script público lo importa. Build editorial88 con selector production y cuentas/analítica false; SEO88 sin errores/advertencias. Controles finales:1025/1025 pruebas, lint correcto, tipos448 archivos sin errores/advertencias y18 hints. Plan32/8 coincidente y diff-check correcto. No hay cambios en la barrera estática ni instalación de dependencias.

## Juzgado propio

APROBADO LOCAL para la secuencia y rechazo conservador. Producto2/5 B integral, técnica3/5 local, datos/editorial2/5 y operación2/5. Un único agente, sin auditor independiente. No se declara autenticación real, cuota global ni integración Amazon completadas.

FH-16/FH-18 siguen pendientes de los backends autorizados y sus pruebas reales; no repetir búsqueda de credenciales sin nueva ubicación. Revisar presupuesto global sobre infraestructura existente antes de activar adquisición. FH16Q y FH16L conservan pruebas de visibilidad/suspensión no verificadas; A continúa pendiente de revisión/aprobación y publicación de su conjunto exacto. Sin actualización de PR ni despliegue.
