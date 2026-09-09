# FH20S — Arlo HD segunda generación implementado

Fecha local: 6 de septiembre de 2026; revisión UTC: 7 de septiembre.
Resultado: cinco relaciones candidatas para Essential Outdoor HD VMC2050, con requisitos explícitos. Sin activación pública.

Se aplicó la evidencia de [FH20R](FH20R_CAMARAS_EVIDENCIA_2026-09-06.md): [ficha de generación](https://kb.arlo.com/000063761/Arlo-Essential-Outdoor-2nd-Generation-Spec-Sheet), [matriz de asistentes](https://kb.arlo.com/000062278/What-smart-home-and-voice-assistant-systems-can-I-use-with-my-Arlo-devices) y [requisitos Apple Home](https://kb.arlo.com/000063184).
Wi-Fi no implica Apple Home directo; la relación Apple conserva la base requerida y el hub Apple adicional para acceso remoto. SmartThings no convierte la cámara en un hub. No se resuelve cantidad del paquete, revisión de hardware ni prestaciones comerciales.

## Verificación

22 pruebas dirigidas y 815 pruebas completas aprobadas.
Lint aprobado; tipos: 306 archivos, cero errores/advertencias, 18 hints existentes.
Build: 88 páginas; diff-check aprobado.
Inventario a 2026-09-07T00:35:19.994Z: 22/28 candidatos, seis pendientes, 73 relaciones y 292 ubicaciones resueltas; cero errores contables.
Dos pruebas nuevas comprueban condiciones en cuatro superficies, adaptación Apple Home, fechas, mercado, ubicación, generación y disputa aislada. La prueba Aeotec conserva las integraciones independientes de Arlo, ecobee y Hue al retirar sus propias relaciones.
No hubo nuevo render visual del sitio: el proveedor público sigue nulo. No se probaron cámara física, base, firmware, cuentas o paquete. Catálogo YAML sin cambios en este incremento.

## Juzgado

Evaluación propia 1–5 del incremento: producto 4 (roles y requisitos claros); técnica 4 (pruebas e aislamiento); datos/editorial 3 (variante y paquete pendientes); operación 2 (sin aprobación pública ni cuentas reales). Mejoras: validar configuración real y revisar la integración antes de activarla.

## Continuidad

FH-20 parcial; ocho tareas hechas y 24 restantes. eufy C120 sigue pendiente: revisar el emparejamiento T8400 antes de implementar las cuatro relaciones propuestas en FH20R.
Imágenes/derechos A y accesos/aprobaciones externas siguen pendientes. Objetivo activo; heartbeat horario pausado. No listo para publicar.
