# FH20AE — Contrato de respuesta vigente por solicitud

Resultado: implementación local de respuesta HTTP mínima, apagada por defecto y sin registrar una ruta. La protección de entrega estática FH20AD permanece activa. No se habilitó la fuente documental ni se modificó infraestructura.

## Infraestructura y alcance

El proyecto no contiene todavía functions de Pages ni src/pages/api. Existen funciones Supabase para otros procesos, pero su presencia no acredita un entorno conectado ni autoriza otro despliegue. Se implementó un contrato de Web Request/Response independiente del transporte, sin dependencias nuevas y sin elegir una migración de hosting.
`src/lib/blocks/block9/request-delivery.ts` exige habilitación de servidor y `readAuthorizedSnapshot(context, signal)`. Ese callback debe comprobar identidad del aprobador, snapshot y revocación mediante una integración confiable; **este módulo no autentica por sí mismo ni convierte nombres/veredictos en autorización**. Los ensayos inyectan el candidato como fixture del contrato, no lo aprueban.

## Contrato implementado

- GET con slug, superficie y mercado US explícitos; rechaza parámetros adicionales/duplicados y contextos inválidos antes de leer la fuente. Ningún parámetro del navegador habilita o aprueba datos.
- Resolución nueva por solicitud y por ubicación exacta. Respuesta con producto proyectado, condiciones/procedencia pública, sustitutos/complementos y avisos; sin grafo, IDs de revisión, responsables, ASIN ni expiración interna de autorización.
- `serverTime`, `validUntil` y `leaseMs`: techo conservador de 60 segundos, reducido por autorización, evidencia aplicable y transición de confianza. No extiende la captura original.
- Comprueba el reloj después de adquirir datos y antes de responder; rechaza autorización vencida, reloj inválido/regresivo y respuesta cuyo plazo se agotó. Datos vencidos se resuelven como desconocidos, no se recuperan desde una respuesta anterior.
- Fuente limitada a tres segundos y señal de aborto; un proveedor que ignore la señal puede continuar internamente, pero su respuesta tardía no se publica ni se reutiliza. Errores/cancelación sólo devuelven unavailable, sin cuerpo de error privado.
- `Cache-Control: no-store` y `CDN-Cache-Control: no-store` también en errores; no ETag, 304, caché de aplicación ni fallback de una respuesta previa. No se emite CORS abierto por defecto.

La [sección 5.2.2.5 de RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.5) respalda la política de no almacenar/reutilizar. Las cabeceras no prueban obediencia de un CDN desplegado ni borrado universal de copias: falta verificar las capas reales.

## Validación

Diez pruebas dirigidas y 849 completas aprobadas; lint y diff-check aprobados. Tipos: 325 archivos, cero errores/advertencias, 18 hints. Build normal: 88 páginas.
Prueba HTTP con servidor temporal sólo en loopback: respuesta vigente 200; autorización de prueba retirada; siguiente petición, aun con cabeceras condicionales, recibió 503 genérico con no-store. El servidor se cerró al terminar. No es prueba contra Supabase o Cloudflare.
Se probaron contexto exacto en cuatro superficies, disputa independiente, prohibición de aprobación desde query, menor plazo de evidencia/autorización, adquisición lenta, agotamiento antes de responder, fuente colgada, aborto en vuelo, errores privados, producto desconocido y métodos inválidos. [Evidencia resumida](FH20AE_ENTREGA_POR_SOLICITUD_2026-09-06.json).

## Lo pendiente y el siguiente paso

Una respuesta nueva que retira la evidencia no borra lo que un navegador ya mostró. Próxima tarea local: consumidor transitorio que valide versión/contexto y plazo, reste la duración de la petición con reloj monotónico, descarte respuestas fuera de orden y elimine datos al fallar, ocultarse o vencer; sin almacenamiento persistente. Probar antes de conectar UI pública.
La integración debe confirmar origen/transporte y cabeceras finales, autenticación y revocación del snapshot, límites de fuente, clientes abiertos, aprobación y rollback. No se instaló ningún adaptador ni se registró un endpoint; tampoco se otorgó autorización. La presentación restringida por modelo/variante y las imágenes A siguen pendientes.

## Juzgado

Evaluación propia 1–5: producto 4 (condiciones no se pierden), técnica 4 (contrato y HTTP local), datos/editorial 3 (aprobación real/variantes no probadas), operación 2 (sin endpoint/CDN/cliente operativo). Mejora: una solicitud fallida no hereda el último éxito y cada superficie tiene contexto explícito. Verified Task Brief limitó las afirmaciones de éxito a pruebas locales observadas. No son revisores independientes.
FH-20 parcial; ocho tareas hechas/24 restantes. Objetivo activo; heartbeat horario pausado.
