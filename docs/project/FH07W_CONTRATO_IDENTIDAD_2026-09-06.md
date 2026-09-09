# FH07W — contrato de identidad por afirmación

Estado: base local implementada y validada, 6 septiembre 2026. FH-07 permanece parcial 2/5; no se declara terminado el catálogo ni lista la publicación.

## Cambio

`product-identity.ts` separa ocho dimensiones: modelo, ASIN, generación/revisión, paquete, mercado, firmware, rol y servicios. Cada afirmación requiere valor, condiciones y fuente propia fechada. El registro completo queda ligado al modelo y ASIN exactos; una modificación invalida sus observaciones hasta revisión. Firmware y servicios exigen vencimiento explícito. Fechas inválidas/futuras, enlaces inseguros y fuentes de otro campo no acreditan un hecho. Es validación estructural, no verificación automática de la verdad de una fuente.

El esquema admite el registro y la ficha muestra las ocho dimensiones con fuentes o incertidumbre. No cambia comercio ni señales del selector. El registro no se convierte en grafo de compatibilidad ni certifica ensayos físicos.

Tres afirmaciones migradas: modelo y rol del Aqara P1 desde [manual oficial, inglés páginas 1-2 y 8](https://www.aqara.com/wp-content/uploads/2023/06/Motion-Sensor-P1_User-Manual.pdf); paquete Hue desde [UPC US 046677562915](https://www.philips-hue.com/en-us/p/hue-white-and-color-ambiance-starter-kit-2-e26-smart-bulbs-60-w/046677562915). Consultadas 2026-09-06. La FAQ genérica de Bridge Pro no se aplica al kit. Las fuentes de identidad anteriores en notas no se migran automáticamente.

Cobertura estructurada: 224 campos (28 × 8), tres documentados y 221 sin afirmación estructurada válida. Esto no significa 221 hechos falsos ni 221 investigaciones nuevas: se debe reconciliar primero la evidencia existente. La instalación documental conserva sus 28 perfiles separados. Rutas, ASIN, fechas comerciales y archivos ajenos conservados.

## Verificación

Cuatro pruebas nuevas dirigidas; 713/713 generales, cero fallos/omisiones. Tipos: 250 archivos, cero errores/advertencias y 18 hints previos. Lint/diff aprobados. Build: 88 páginas; SEO: 88, cero errores/advertencias.

Seis escenarios de navegador local: Aqara, Hue y Echo Show a 1440/390 px; ocho campos, fuentes esperadas, estados desconocidos, enfoque de enlaces y ausencia de desbordamiento. Dos capturas FH07W_IDENTIDAD inspeccionadas en la entrega estable. Auditoría textual: tres HTML, seis candidatos alt en los avatares habituales de cabecera; no certificación general de accesibilidad. Recursos externos bloqueados en pruebas, sin cuentas, compras, despliegue o validación física.

## Juzgado del mismo agente y continuación

Producto 3/5: límites visibles, pero lista extensa de desconocidos y migración incompleta. Técnica local 4/5: contrato, esquema y consumidor probados. Datos/editorial 3/5: fuentes por afirmación y rechazo de mezclas; cobertura todavía mínima. Operación 2/5: sólo local.

Siguiente pendiente ejecutable: migrar evidencia de identidad ya revisada (incluidos ASIN Hue/Aqara, Q5+, Kasa y variantes US) con sus condiciones, sin búsquedas repetidas salvo fuente incompleta o cambiante. Completar consumidores y resolver desconocidos críticos antes del cierre editorial A. No cerrar FH-07 por presencia de ocho etiquetas o por sus pruebas. Cinco tareas hechas/27 restantes; objetivo activo, heartbeat pausado.
