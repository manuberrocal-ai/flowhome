# FH20W — cola de investigación por campo

Fecha local: 6 de septiembre de 2026; UTC: 7 de septiembre.
Resultado: el inventario ya separa presencia por modelo de afirmaciones pendientes por campo.

## Hallazgo y cambio

El catálogo contiene 108 valores booleanos positivos en los nueve campos examinados. A 2026-09-07T00:53:21.940Z, 23 carecen de señal candidata vigente en alguna superficie. Dos valores negativos tienen señales candidatas que requieren comparar alcance: Matter de Aqara P1 y Apple de Arlo. No se declaran automáticamente contradicciones: puente, hub, generación y condiciones pueden explicar diferencias.

Se amplió el inventario de lectura, sin alterar YAML, grafo ni runtime público. Cada pendiente identifica campo del catálogo y superficies sin evidencia. Solo los booleanos estrictos cuentan; valores omitidos o negativos no se convierten en incompatibilidad. No se examinan todas las afirmaciones en prosa ni se certifica publicación. La cola ordenada por slug es reproducible, no una valoración comercial.

## Validación

Siete pruebas dirigidas y 824 pruebas completas aprobadas. Lint aprobado; tipos: 312 archivos, cero errores/advertencias y 18 hints existentes. Build de 88 páginas y diff-check aprobados.
Tres pruebas nuevas comprueban valores no booleanos, ausencia de mutación, resolución independiente de flags crudos, disputas por superficie, caducidad y conciliación de recuentos. La evidencia sigue en 94 relaciones/376 ubicaciones, 28 modelos con alguna señal; cero errores contables. No hubo nueva revisión visual ni cambio de producción.

## Juzgado

Evaluación propia 1–5: producto 4 (pendientes relevantes identificados); técnica 4 (inventario reproducible y probado); datos/editorial 3 (no reemplaza revisión de fuentes, variantes o prosa); operación 3 (cola utilizable, sin activación). Mejora: resolver o retirar afirmaciones con evidencia de alcance preciso; no intentar completar todos los protocolos en cada dispositivo.

## Próximo trabajo

Comenzar por Wi-Fi de Echo Dot, Echo Show y Amazon Thermostat y Bluetooth de Dot. Después: asistentes y Bluetooth de hubs, persianas y cerraduras; contrastar las dos negaciones detectadas.
Se localizó y abrió [la ayuda oficial del termostato](https://digprjsurvey.amazon.com/csad/help/node/GLJEMJYYPUGXV2A4), con banda 2,4 GHz y limitación WPA3 para revisar en el candidato. También se abrió [setup de Dot 5](https://digprjsurvey.amazon.com/csad/help/node/TdLI5SX5VhnxC6x6Ct), que enlaza seguridad y emparejamiento Bluetooth; abrir esas referencias antes de atribuir perfiles o bandas. [Seguridad de Show 8 gen. 3](https://digprjsurvey.amazon.com/csad/help/node/TqPCgJORlaxedTdjIv) necesita leer el tramo final de especificaciones. Una búsqueda sobre Dot Kids se descartó como prueba directa del Dot estándar. Estas fuentes aún no modificaron candidatos.

FH-20 parcial; ocho tareas hechas/24 restantes. Derechos de imágenes, variantes, cuentas e integración pública aprobada siguen pendientes. Objetivo activo; sin loop horario. No listo para publicar.
