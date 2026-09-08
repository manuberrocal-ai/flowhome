# FH20AA — Asistentes Aqara/Aeotec y cierre de investigación repetitiva

Fecha local: 6 de septiembre de 2026; UTC: 7 de septiembre.
Resultado: siete relaciones candidatas añadidas. Se mantienen dos afirmaciones Bluetooth sin resolver y dos diferencias de alcance; no se fuerza un contador a cero.

## Evidencia

[Aqara M2](https://www.aqara.com/us/product/hub-m2/) respalda asistentes con límites IR; no prueba control universal. [P1 US](https://us.aqara.com/products/motion-sensor-p1) exige hub: el cuerpo incluye Google, la lista corta lo omite. Se conserva esa salvedad y no se promete exposición de todos los ajustes.
[Aeotec voz](https://aeotec.freshdesk.com/support/solutions/articles/6000240465-voice-control-smart-home-hub) es una guía de 2021, corroborada por [especificaciones GP-AEOHUBV3](https://aeotec.freshdesk.com/support/solutions/articles/6000240466-smart-home-hub-technical-specifications), actualizadas en enero de 2026. [SmartThings](https://support.smartthings.com/hc/en-us/articles/360052409891-Voice-Services-in-SmartThings) advierte alcance sobre todas las ubicaciones. No se vinculó ninguna cuenta.

## Pendientes investigados, no compatibles por inferencia

El [registro de cuatro decisiones](FH20AA_DECISIONES_INVESTIGACION_2026-09-06.json) conserva fuentes y condición concreta de reapertura. No repetir búsquedas en cada pasada sin evidencia nueva; revisar al vencimiento indicado. No lo consume el resolutor ni modifica los indicadores.
M2: radio BLE no demuestra accesorios disponibles. Aeotec: la mención Bluetooth en [ajustes](https://aeotec.freshdesk.com/support/solutions/articles/6000240597-smart-home-hub-settings) corresponde al teléfono; ni eso ni Hub 2 acreditan V3US. Ausencia en especificaciones no demuestra incompatibilidad.
P1/Matter: puente distinto de soporte nativo. [Arlo/Apple](https://kb.arlo.com/000063184): requiere base admitida, no conexión directa al router. No cambiar booleanos ni declarar contradicción sin definir el alcance.

## Validación y juzgado

24 pruebas dirigidas y 832 completas aprobadas; lint aprobado; tipos: 320 archivos, cero errores/advertencias, 18 hints. Build: 88 páginas; diff-check aprobado. Inventario 2026-09-07T01:12:36.184Z: 28 modelos, 115 relaciones, 460 ubicaciones y cero errores. Dos de 108 afirmaciones crudas aún sin señal y dos negaciones a evaluar semánticamente.
Evaluación propia 1–5: producto 4 (dependencias preservadas), técnica 4 (aislamiento y fechas probados), datos/editorial 3 (modelos sin variante/firmware), operación 2 (aprobación real pendiente). Mejora de proceso: registrar por qué una investigación no produce una afirmación, en vez de repetirla o confundirla con una tarea sin empezar. No es revisión independiente ni prueba física.

## Siguiente trabajo

Pasar de ampliar booleans a revisar el contrato de aprobación e integración del proveedor en servidor: mantener proveedor público nulo hasta aprobación específica, identificar gates locales comprobables y evitar activación implícita. No repetir pruebas completas sin cambios de código. FH-20 parcial; ocho tareas hechas/24 restantes. Derechos/variantes de imágenes A, cuentas, publicación y rollback real pendientes. Objetivo activo, sin espera horaria.
