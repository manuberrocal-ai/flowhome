# FH16H — cliente comercial transitorio

## Implementación y límites

`delivery-envelope.ts` valida la respuesta mínima de FH16G: identidad exacta US/USD, claves permitidas, números/fechas válidos y plazos exclusivos. Rechaza campos adicionales y disponibilidad desconocida; reutiliza la traducción de disponibilidad y el techo comercial centrales.

`delivery-client.ts` acepta sólo endpoint explícito del mismo origen HTTPS (HTTP sólo loopback de pruebas), sin credenciales, parámetros preconfigurados ni redirecciones. GET usa no-store y omite credenciales. Exige200/JSON/no-store, limita el cuerpo leído a16384 bytes con UTF-8 estricto y cancela a los cinco segundos, incluso si el fetch inyectado no resuelve.

Se reutiliza `block9/transient-lease.ts`, independiente del dominio, para precio y disponibilidad por separado. Ambos plazos descuentan el tiempo desde antes de la petición usando relojes monotónico y de pared; latencia, suspensión detectable y retrocesos no extienden vigencia. Una nueva petición invalida la anterior. El token de generación impide que una respuesta vieja reemplace la nueva. Lectura devuelve copias; no escribe almacenamiento de navegador ni caché de aplicación.

Al vencer, el temporizador limpia el valor y notifica mediante changed. `setPermitted(false)`, invalidate y dispose retiran/cancelan; volver a true no restaura datos. La UI futura debe enlazar estas operaciones con ocultación, offline, navegación y retirada de DOM. **No existe todavía ese enlace de eventos ni integración pública.** Una copia retenida por otro consumidor o una pestaña suspendida no queda controlada universalmente por este cliente.

## Verificación

-Ocho pruebas nuevas: forma/identidad/campos, latencia/plazos independientes, retroceso y permiso suspendido/reanudado, respuesta antigua tardía, transporte/cabeceras/tamaño, contrato de servidor real con lector sintético, retirada activa por temporizador y fetch detenido con timeout real.
-1003/1003 pruebas generales; lint correcto; tipos436 archivos,0 errores/advertencias y18 hints existentes.
-Build88 y SEO88,0 errores/advertencias; diff-check correcto.
-La primera suite general detectó la lista duplicada de estados schema. Se reutilizó getAvailabilitySchemaUrl sin relajar la prueba; la suite posterior pasó completa.
-Los421 archivos de dist coinciden con FH13P, SHA256 `4a3c6561de284075cb8e984747b06c6f3b76aaeaa7af7cfca0a5290a6021b4e7`. No se repitió navegador/Lighthouse: código aún sin consumidor en páginas.

La prueba servidor→cliente usa Request/Response y fetch inyectado, no red HTTP real, Amazon ni CDN. No acredita autenticidad externa, cuotas o derechos. Sin push, endpoint registrado, despliegue, instalación ni activación.

## Juzgado propio y continuación

Producto2/5 integral B: evita mostrar resultados anteriores tras fallo, pero no está conectado al comprador. Técnica3/5 local: contratos servidor/cliente interoperen y retirada temporal probada, reutilizando código existente. Datos/editorial2/5 integral: valores son transitorios y validados; permisos de otros campos y reales siguen pendientes. Operación2/5 integral: lector confiable/cuotas, eventos/DOM reales, HTTP/CDN y autorización de activación no verificados.

Siguiente pendiente local: controlador de ciclo de página y presentación transitoria aislada, sin habilitar datos reales ni alterar la barrera de A. Debe comprobar ocultación, navegación, offline, reanudación y retirada de DOM en navegador; no confundir los setters probados aquí con esos eventos. FH-16 continúa parcial.
