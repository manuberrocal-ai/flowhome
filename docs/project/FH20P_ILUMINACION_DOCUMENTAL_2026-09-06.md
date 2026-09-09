# FH20P — iluminación documental

Fecha local: 6 de septiembre de 2026; revisión de fuentes el 7 de septiembre UTC.
Resultado: tres modelos añadidos al candidato documental, sin activación pública.

## Fuentes y decisión editorial

[Wyze Bulb Color](https://www.wyze.com/products/wyze-bulb-color) aporta Wi-Fi y asistentes; la [guía de configuración](https://support.wyze.com/hc/en-us/articles/360056417672-Wyze-Bulb-Color-Setup-Guide) limita la relación Bluetooth al emparejamiento. No se convierte esa señal en control Bluetooth autónomo ni aprobación de un regulador externo.

La [matriz oficial Govee](https://community.govee.com/support/faqs/specs), fila H617C y encabezados RGBIC, respalda una relación Bluetooth. No se trasladan Wi-Fi ni asistentes de H618C; la ausencia de señal genérica del resolutor no sustituye las notas negativas específicas del catálogo.

El [kit Hue UPC 046677562915](https://www.philips-hue.com/en-us/p/hue-white-and-color-ambiance-starter-kit-2-e26-smart-bulbs-60-w/046677562915) aporta seis relaciones; la [documentación Matter](https://www.philips-hue.com/en-us/explore-hue/works-with/matter) aporta la séptima, condicionada al Bridge actualizado. Se excluyen Bluetooth-only y prestaciones de Bridge Pro. La [página SmartThings](https://www.philips-hue.com/en-us/explore-hue/works-with/samsung-smartthings) se consultó como contexto, no como certificación universal.

La ficha Hue tiene recomendaciones comerciales y FAQ genéricas de Bridge Pro: no se usaron como especificaciones del kit. Las relaciones conservan sus condiciones por componente. No se verificaron físicamente variante, unidad, firmware, instalación, vendedor ni cuenta.

## Verificación

- 22 pruebas dirigidas aprobadas; dos pruebas nuevas de iluminación.
- Suite completa: 811 pruebas aprobadas.
- Tipos: 302 archivos, cero errores/advertencias y 18 hints existentes; lint aprobado.
- Build: 88 páginas; diff-check aprobado.
- Inventario a 2026-09-07T00:26:14.314Z: 20/28 modelos candidatos, ocho sin candidato, 66 relaciones, 264 ubicaciones resueltas y cero errores contables.
- Cuatro superficies verificadas por resolutor y adaptación: ficha, quiz, comparación y alternativas.
- Se prueba caducidad, fecha futura, ubicación, región, identidad y revisión en disputa; ecobee y Hue conservan sus integraciones al retirar las relaciones de Aeotec.
- Proveedor público nulo; no hubo nuevo render visual del sitio ni activación de filtro SmartThings. Los 28 YAML no se modificaron en este incremento.

## Juzgado

Evaluación propia del incremento, escala 1–5; no revisores independientes.

| Dimensión | Valoración | Mejora pendiente |
|---|---|---|
| Producto | 4/5 | Roles visibles en condiciones; comprobar funciones según configuración real. |
| Técnica | 4/5 | Aislamiento probado; integración pública aprobada y verificación visual pendientes. |
| Datos/editorial | 3/5 | Modelos y fuentes separados; campos y variantes sin evidencia siguen pendientes. |
| Operación | 2/5 | Registro reproducible; falta responsable de revisión y aprobación pública. |

## Continuidad

FH-20 parcial; ocho tareas hechas y 24 restantes en el conjunto.
Próximo trabajo independiente: cámaras restantes (Arlo, Blink y eufy), con identidad y funciones por asistente.
Imágenes/derechos A y accesos/aprobaciones externas pendientes. Objetivo activo; heartbeat horario pausado.
Estado de publicación: no listo para publicar.
