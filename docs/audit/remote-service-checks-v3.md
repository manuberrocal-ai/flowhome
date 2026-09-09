# FlowHome — comprobaciones remotas finales

Lectura del 4 de septiembre de 2026, aproximadamente 05:30–05:32 UTC. Son diagnósticos de lectura posteriores al ciclo local de 597 pruebas y 134 casos de navegador. No cambiaron el código, el catálogo, las cuentas, sus permisos ni el despliegue. No se incorporan a las puntuaciones Lighthouse offline como si fueran otra medición de rendimiento.

## Bing: necesita intervención del propietario

Se abrió [Bing Webmaster Tools](https://www.bing.com/webmasters/) y su opción de inicio de sesión. El sitio mostró un selector de Microsoft, Google o Facebook, sin una propiedad autenticada accesible. No se eligió proveedor ni se introdujeron credenciales, se concedieron permisos o se importó/agregó un sitio. Se dejó la pantalla abierta y entregada al propietario para iniciar sesión.

**Resultado:** Bing sigue pendiente; no se obtuvieron métricas ni evidencia de indexación. La lectura actual de GA4/Search Console sí está documentada en `current-measurement-v3.md`.

## Imágenes: disponibilidad de cabeceras, no validación integral

Se leyeron las 28 URL del campo `image` del catálogo. A las **05:31:33.782 UTC**, todas respondieron **HTTP 200** con tipo `image/*` a solicitudes HEAD. Se limitaron las solicitudes a sus nueve hosts HTTPS existentes, sin autenticación, sin seguir redirecciones, con cuatro solicitudes simultáneas y ocho segundos de espera máxima. No se descargaron cuerpos de imágenes.

| Producto, por slug | Host | Tipo declarado | Bytes declarados |
|---|---|---|---:|
| aeotec-smartthings-hub | m.media-amazon.com | image/webp | 4844 |
| amazon-smart-thermostat | m.media-amazon.com | image/jpeg | 6584 |
| aqara-hub-m2 | www.aqara.com | image/jpeg | 34839 |
| aqara-motion-sensor-p1 | us.aqara.com | image/png | 112254 |
| arlo-essential-outdoor-camera | m.media-amazon.com | image/jpeg | 7883 |
| august-wifi-smart-lock | m.media-amazon.com | image/jpeg | 18110 |
| blink-outdoor-4 | m.media-amazon.com | image/jpeg | 10846 |
| echo-dot-5th-gen | m.media-amazon.com | image/jpeg | 13113 |
| echo-show-8-3rd-gen | m.media-amazon.com | image/jpeg | 46212 |
| ecobee-smart-thermostat-premium | images.thdstatic.com | image/jpeg | 10010 |
| eufy-security-indoor-cam-c120 | m.media-amazon.com | image/jpeg | 4133 |
| google-nest-hub-2nd-gen | multimedia.bbycastatic.ca | image/jpeg | 22462 |
| govee-rgbic-led-strip-lights | cdn.shopify.com | image/png | 1615992 |
| irobot-roomba-j7-plus | m.media-amazon.com | image/jpeg | 17565 |
| levoit-core-300s-air-purifier | m.media-amazon.com | image/jpeg | 21599 |
| meross-smart-garage-door-opener | m.media-amazon.com | image/jpeg | 17811 |
| philips-hue-white-color-starter-kit | m.media-amazon.com | image/jpeg | 16916 |
| ring-video-doorbell-wired | m.media-amazon.com | image/jpeg | 3540 |
| roborock-q5-plus | cdn.pji.nu | image/jpeg | 34006 |
| schlage-encode-smart-wifi-deadbolt | m.media-amazon.com | image/jpeg | 12965 |
| switchbot-blind-tilt | www.switch-bot.com | image/jpeg | 28930 |
| switchbot-hub-2 | m.media-amazon.com | image/jpeg | 20905 |
| tapo-c120-security-camera | m.media-amazon.com | image/jpeg | 12692 |
| tp-link-kasa-smart-dimmer-hs220 | m.media-amazon.com | image/jpeg | 17832 |
| tp-link-kasa-smart-light-switch-hs200 | m.media-amazon.com | image/jpeg | 16472 |
| tp-link-kasa-smart-plug-mini | m.media-amazon.com | image/jpeg | 10022 |
| wyze-bulb-color | www.wyze.com | image/png | No informado |
| yale-assure-lock-2-wifi | images.thdstatic.com | image/jpeg | 27993 |

`Content-Length` no equivale a bytes transferidos/renderizados en una sesión real. La imagen Govee declara aproximadamente **1,62 MB** y merece revisión de tamaño una vez confirmadas identidad y condiciones de uso. No se sustituyó ni transformó una imagen cuya correspondencia exacta con la variante del producto aún no está aprobada.

Estos resultados no prueban decodificación, contenido visual correcto, correspondencia ASIN/modelo, licencia, permiso de hotlinking, rendimiento online, funcionamiento futuro ni derechos de almacenamiento. La validación del fallback offline continúa siendo una prueba distinta.

## Auditoría de dependencias: tercer intento sin inventario utilizable

Se repitió una vez la consulta con espera de 15 segundos y sin reintentos automáticos. Terminó con código 1 sin metadatos de inventario utilizables. La lectura acotada del registro de npm `2026-09-04T05_30_41_933Z-debug-0.log` confirmó **FETCH_ERROR** y salida 1, sin código de respuesta HTTP identificado por el filtro. No se copiaron el registro bruto, credenciales ni configuraciones.

El resumen de la consulta produjo una fila vacía al enumerar un valor nulo: **no es una vulnerabilidad hallada ni demuestra ausencia de vulnerabilidades**. No se atribuye a este intento un error específico adicional que no haya quedado comprobado. Dos intentos anteriores sí agotaron su espera. La corrección local de fast-uri y sus tres regresiones aprobadas permanecen válidas; el inventario remoto posterior al parche sigue pendiente.

## Estado de continuidad

La discrepancia de Amazon ya se verificó en el proyecto, las ubicaciones pertinentes de OpenCode y la sesión autenticada disponible. Repetir esas mismas lecturas no proporciona el acceso que falta: `flowhome-20` no muestra habilitación de API, aunque el propietario confirma disponer de acceso. Se necesita identificar la cuenta/tienda aprobada o el almacén y nombre de la entrada existente, sin enviar claves por chat.

Los siguientes pasos de integración real requieren además confirmar permisos de uso/retención, almacenamiento durable y cuenta autorizada para las pruebas de sincronización. La publicación y activación externa siguen sujetas a aprobación explícita. **El objetivo global no está completado**; los cambios y la evidencia local quedan conservados para continuar cuando el propietario resuelva el acceso.
