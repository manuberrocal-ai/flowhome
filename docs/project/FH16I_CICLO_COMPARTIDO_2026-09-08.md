# FH16I — ciclo de página compartido para datos transitorios

> Corrección comprobada en FH16J: la afirmación de identidad de421 archivos de este informe no es válida para una reconstrucción posterior a FH16I. El quiz importa indirectamente el binding aunque su integración esté desactivada: cambian su bundle y la referencia HTML frente a FH13P. FH16J verifica esa diferencia y el quiz normal; no se modificó el candidato histórico.

## Cambio y aceptación

Se extrae el binding existente de compatibilidad a `src/lib/transient-lifecycle.ts` y se conserva su nombre público mediante reexportación. Comercio reexporta el mismo controlador como `bindCommerceLifecycle`; no hay dos implementaciones que mantener.

Se corrige además una ambigüedad observada en el código anterior: freeze y pagehide compartían una marca suspended, y cualquiera de resume/pageshow podía cancelarla. Ahora hay marcas independientes: resume sólo levanta freeze y pageshow sólo levanta pagehide. Visibilidad y conexión deben permitir la actividad simultáneamente. Cleanup elimina listeners y dispone el cliente una sola vez; eventos posteriores no actúan.

El controlador no consulta al proveedor, no restaura valores anteriores y no interpreta volver online como autorización comercial. `setPermitted(false)` usa la retirada/cancelación de cada cliente. Volver a estar permitido exige refresh explícito para obtener nuevos datos.

Aceptación: causas independientes en ambos órdenes de reanudación; visibilidad/online no anulan suspensión; datos retirados al navegar y ausencia de consulta/restauración automática; mismos consumidores compatibles; limpieza idempotente.

## Evidencia

-11 pruebas dirigidas iniciales correctas, incluyendo las siete de compatibilidad existentes.
-1007/1007 pruebas generales; lint correcto; tipos438 archivos,0 errores/advertencias y18 hints existentes.
-Build88 y SEO88 sin errores/advertencias; diff-check y plan derivado correctos.
-421 archivos estáticos idénticos al inventarioFH13P. No se repitió navegador/Lighthouse por identidad de artefactos y ausencia de montaje público nuevo.

Las pruebas nuevas despachan eventos sobre EventTarget con estados controlados y ejercitan el cliente comercial real con respuesta sintética. **No son una prueba de freeze/BFCache/visibilidad nativos en navegador ni de retirada de DOM.** El controlador existe, pero aún no está montado en la interfaz comercial. Esa integración y su prueba de navegador siguen pendientes.

Sin datos, permisos o cuentas reales modificados. Sin push, registro de endpoint ni despliegue. La API anterior de compatibilidad conserva su firma de uso; la suspensión es más restrictiva cuando coexisten causas.

## Juzgado propio

Producto2/5 integral B: no recupera una oferta anterior al volver a la página, todavía sin recorrido comercial público. Técnica3/5 local: controlador compartido, interacción de estados y cancelación probadas. Datos/editorial2/5 integral: reanudación no renueva captura ni permiso. Operación2/5 integral: falta presentación/DOM aislada probada en navegador, lector confiable/cuotas y HTTP/CDN reales.

Siguiente paso local: montaje explícito de slots transitorios con este binding y verificación de retirada visual, sin inferir endpoint ni activar B. FH-16 sigue parcial; no sustituir ese paso por repetir las mismas pruebas EventTarget.
