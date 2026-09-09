# FlowHome — línea de base observada en septiembre

Lectura: 2026-09-04, aproximadamente 05:19–05:23 UTC. Fuente autenticada: propiedad **FlowHome**, cuenta Acqua, ID de propiedad 543571866. La página se recargó antes de tomar los números. Los informes de Search Console están vinculados al flujo **FlowHome Web**. Sólo navegación y ordenación de informes: no se editaron etiquetas, filtros de configuración, eventos, propiedades ni permisos.

Los cambios V3 siguen sin publicar. **Ninguna cifra de este documento se atribuye a ellos.** Las observaciones históricas de julio se conservan en el repositorio; no se comparan porcentajes entre ventanas diferentes.

## GA4

Fuente: [inicio de la propiedad](https://analytics.google.com/analytics/web/#/a184097493p543571866/reports/intelligenthome) y [adquisición de tráfico](https://analytics.google.com/analytics/web/#/a184097493p543571866/reports/explorer?r=lifecycle-traffic-acquisition-v2).

| Ventana mostrada | Dato observado | Valor |
|---|---|---:|
| 28 agosto–3 septiembre, 7 días | Usuarios activos / nuevos | 1 / 1 |
| Misma ventana de 7 días | Vistas / eventos | 2 / 8 |
| Misma ventana de 7 días | Sesiones por fuente mostrada | 2 `accounts.google.com / referral`; 1 `(direct) / (none)` |
| 7 agosto–3 septiembre, 28 días | Sesiones / sesiones con interacción | 14 / 7 |
| Misma ventana de 28 días | Interacción | 50 %; media de 7 segundos por sesión |
| Misma ventana de 28 días | Eventos / eventos clave | 56 / 0 |
| Misma ventana de 28 días | Ingresos registrados | 0,00 $ |
| Misma ventana de 28 días | Canales, 2 de 2 filas | Referral: 13 sesiones; Direct: 1 |

El informe detallado usa 28 días por defecto, mientras las tarjetas del inicio usan 7: se conservaron ambas ventanas sin mezclarlas. No se transforma el contador de eventos clave de GA4 en ventas reales de Amazon. La fila `accounts.google.com / referral` merece revisar atribución en una futura prueba autorizada de login; por sí sola no demuestra un fallo ni que esas sesiones sean compradores.

## Search Console mediante su integración en GA4

Ventana seleccionada: **7 agosto–3 septiembre de 2026**, 28 días; flujo FlowHome Web. Fuentes: [consultas](https://analytics.google.com/analytics/web/#/a184097493p543571866/reports/explorer?r=search-query&collectionId=search-console) y [páginas de destino](https://analytics.google.com/analytics/web/#/a184097493p543571866/reports/explorer?r=search-traffic&collectionId=search-console). El informe indicó uso del 100 % de datos disponibles, que no equivale a confirmar que los últimos días ya estén procesados. No se verificó el desfase de actualización ni la zona horaria configurada.

| Desglose | Filas indicadas | Impresiones | Clics | CTR | Posición media |
|---|---:|---:|---:|---:|---:|
| Consultas | 135 | 443 | 0 | 0 % | 40,61 |
| Páginas de destino | 39 | 628 | 0 | 0 % | 41,87 |

Son dos desgloses distintos: **no se suman 443 y 628**, ni se afirma que su diferencia sea un error. No se exportó la base completa ni se auditó cómo la integración trata consultas omitidas. Los números son los totales tal como fueron mostrados.

Principales páginas, ordenadas por impresiones:

| Ruta | Impresiones | Posición media |
|---|---:|---:|
| `/best/best-alexa-smart-home-devices/` | 191 | 29,43 |
| `/review/google-nest-hub-2nd-gen-review/` | 168 | 41,32 |
| `/review/aqara-hub-m2-review/` | 72 | 49,85 |
| `/calculator/` | 28 | 67,57 |
| `/product/tp-link-kasa-smart-plug-mini/` | 19 | 50,00 |
| `/review/eufy-security-indoor-cam-c120-review/` | 13 | 25,46 |
| `/product/tapo-c120-security-camera/` | 12 | 59,00 |
| `/product/arlo-essential-outdoor-camera/` | 11 | 56,73 |
| `/product/google-nest-hub-2nd-gen/` | 11 | 69,64 |
| `/best/best-google-home-starter-devices/` | 9 | 49,67 |

Las diez filas tienen 0 clics. No se extrapolan a demanda global ni a volumen de búsquedas del mercado.

Consultas destacadas del mismo período: `nest hub 2nd gen` (52 impresiones, posición 38,29), `alexa smart home` (42; 22,60), `aqara hub m2` (33; 54,18), `google nest hub 2nd gen` (22; 37,91), `smart thermostat savings calculator` (19; 64,68) y `best amazon alexa smart home devices` (17; 18,00). No se atribuye automáticamente cada consulta a una página: no se aplicó una dimensión cruzada consulta/página.

## Decisión editorial sustentada, no promesa de crecimiento

Priorizar la revisión de las rutas existentes de Alexa, Nest Hub y Aqara: reúnen 431 de las 628 impresiones del desglose por página, aproximadamente 68,6 %. Las dos últimas ya recibieron correcciones documentales locales; la guía Alexa también se revisó en V3. Esta observación apoya dónde verificar primero, no prueba que un título concreto esté causando el CTR ni autoriza publicar más páginas.

El volumen observado es pequeño, con cero clics orgánicos registrados en estos informes. No permite establecer incremento de conversión, ingresos, causalidad SEO o presencia en respuestas de IA. Mantener una ventana comparable después de una publicación autorizada y comprobar atribución/consentimiento antes de experimentar.

## Amazon y pendientes

La observación de Associates de la vuelta anterior está en `credential-location-audit-v3.md`: 17 clics en su ventana de 30 días y 1 clic en el resumen mensual, actualizado el 2 de septiembre. No se mezcla con los 28 días de GA4/GSC. La API sigue sin estar habilitada en la tienda observada.

Pendientes de medición: Bing actual, CWV de campo/INP, detalle de eventos de afiliación, atribución de cuenta y una comparación posterior a publicación. A las 05:30 UTC se intentó acceder a Bing: pidió elegir proveedor e iniciar sesión; se dejó esa pantalla al propietario sin conceder permisos ni modificar sitios. No se obtuvieron métricas de Bing; ver `remote-service-checks-v3.md`. Este registro manual de informes no conecta datos automáticamente al scoring diario ni concede permisos de reutilización comercial.
