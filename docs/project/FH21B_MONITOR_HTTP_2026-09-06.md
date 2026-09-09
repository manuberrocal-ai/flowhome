# FH21B — comprobación HTTP acotada e incidente local

Fecha: 6 de septiembre de 2026. APROBADO LOCAL con observación pública puntual; FH-21 parcial.

## Resultado

scripts/qa/site-health.mjs verifica portada, ficha Amazon Smart Thermostat y cart con tres GET, sin seguir redirecciones, pulsar enlaces, cargar recursos, iniciar sesión ni llamar a Amazon. Reutiliza inspectPageMetadata y las reglas comerciales existentes. Solo admite https://flowhome.dev o HTTP en loopback numérico explícito, sin credenciales, consultas ni rutas configurables.

Cada solicitud tiene límite de cinco segundos y 512.000 bytes. Devuelve códigos fijos, estado HTTP, recuento de CTA y duración; no guarda cuerpos ni mensajes libres. Las comprobaciones sobre HTML no prueban visibilidad, JavaScript o interacción: la matriz de navegador sigue siendo necesaria.

## Evidencia pública de solo lectura

A las 22:49:49.711 UTC, tres GET al sitio público: portada 200 (449 ms), ficha 200 (284 ms, tres CTA correctos al ASIN B08J4C8871 con flowhome-20), cart 200 (372 ms). Metadatos/política de indexación del alcance pasaron.

FH21B_OBSERVACION_HTTP_2026-09-06.json conserva el resultado. Es una observación puntual, no un SLO, prueba de compras ni equivalencia con los cambios locales. No identifica SHA o deployment ID de producción. Se ejecutó antes de la corrección de clasificación de referencias documentales descrita abajo; no se repitieron peticiones públicas porque esa corrección se validó localmente.

## Incidente controlado y corrección

El primer ensayo del dist local dio un falso positivo: scanSourceCtas detecta ampliamente referencias amazon.com y contó cuatro enlaces a manuales PDF como CTA. Se añadió clasificación por marcador CTA o destino de producto/carrito, sin excluir botones marcados con destinos incorrectos ni admitir productos distintos. Regresión: los manuales no cuentan y un enlace de compra sin marcador falla. No se modificó contenido editorial.

La primera ejecución fallida terminó después de cerrar el servidor; Node imprimió además una aserción interna de libuv al salir. La repetición corregida terminó con código cero y cerró explícitamente las conexiones/servidor. No se atribuye ese diagnóstico de runtime a un fallo de producción.

Ejecutor reproducible: C:/Users/manub/Documents/Codex/2026-09-04/f/work/fh21b-health-incident.mjs.
Usa dist existente y un servidor privado de loopback; quince GET en cinco rondas:
1. sano: passed;
2. ficha 503: needs_attention/http_status_unexpected;
3. restaurado: passed;
4. ficha sin responder: needs_attention/request_timeout, 5.016 ms;
5. restaurado: passed.

FH21B_INCIDENTE_LOCAL_2026-09-06.json conserva la salida. Es restauración del servicio de prueba, NO rollback Pages, incidente público ni prueba de envío de alertas.

## Validación y límites

- Cuatro pruebas dirigidas, incluidos orígenes rechazados antes de red, redirects no seguidos, tamaño excesivo, transporte, CTA ausente/incorrecto, referencias PDF y contenido solo en scripts.
- 762/762 pruebas completas después de la corrección; lint y diff-check aprobados.
- Tipos y build de 88 páginas aprobados antes de la pequeña corrección del filtro; después se repitieron las pruebas completas y lint, no tipos/build ni navegador completo.
- Sin nuevas dependencias, instalaciones, horarios, cuentas, envíos ni despliegues. No se inició Docker.
- Runbook: docs/operations/site-health-runbook.md.
- El monitor es manual y de salida local. No se configuró canal ni receptor de alertas.
- Son reglas para HTML conocido de FlowHome, no un parser DOM general ni prueba de disponibilidad del catálogo completo.

## Juzgado

Valoración propia: producto 3/5 (comprueba páginas centrales); técnica 4/5 local (regresiones e incidente controlado); datos/editorial 3/5 (fuentes distinguidas de CTA, sin captura de respuestas); operación 3/5 del tramo (lectura pública y detección probadas, sin servicio continuo ni restauración remota).

La guía verified-task-brief ayudó a separar lectura pública, fallo simulado y recuperación de producción. FH-21 sigue parcial: faltan responsable y destino autorizados, activación aprobada, SLO calibrado y prueba real de restauración. Ocho tareas hechas y 24 restantes; no se declara terminado el objetivo.
