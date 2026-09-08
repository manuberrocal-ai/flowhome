# FH07H — contrato de características en fichas

Estado inicial: 5 septiembre 2026; continuación del cierre local FH07G, no una nueva auditoría integral.

## Problema y evidencia

`product/[slug].astro` calcula `getProductFeatures(data)` antes del adaptador de compatibilidad. Los resúmenes de conectividad usan flags crudos cuando no hay grafo; las etiquetas llevan un check de aprobación. `product-specs.ts` transforma booleanos en Yes/No y acepta valores malformados como texto. La etiqueta Matter ready no distingue controller, bridge y dispositivo nativo.

## Cambio autorizado

Compartir el formato de evidencia entre comparaciones y fichas, sin cambiar los 28 YAML ni instalar un proveedor. Alimentar todas las características de compatibilidad con el producto preparado para la superficie exacta. Presentar registros booleanos como `Catalog: Yes/No (unverified)`; ausentes o malformados como `Not verified`. Una señal respaldada exige los metadatos producidos por el adaptador para ese campo; no certifica otras funciones. Conservar notas, fuentes, instalación, límites de servicios y comercio. Usar nombres neutrales y retirar checks afirmativos de las etiquetas.

## Aceptación y validación

- Pruebas de true/false/ausente/malformado, siete campos de compatibilidad y funciones fuera del grafo; paridad de comparaciones.
- Integración con el adaptador real y fixtures aisladas: superficie exacta, procedencia, conflicto/caducidad y ausencia de proveedor. Ninguna fixture se publica.
- Las 28 fichas renderizadas conservan fuentes y condiciones, muestran incertidumbre y no duplican filas de compatibilidad. No convertir falta de datos en incompatibilidad.
- Controles generales del repositorio; revisión de texto y navegador escritorio/móvil, teclado, reflujo y movimiento reducido. Inspección visual acotada a una ronda conjunta y como máximo una confirmación tras correcciones justificadas.
- Verificar los hashes de los 28 YAML contra FH07E y registrar evidencia ligada al código/build.

## Límites y juzgado

Un mismo revisor evaluará producto, técnica, datos/editorial y operación (0–5). Este bloque no verifica físicamente dispositivos, no acredita nuevas características y no cierra FH-07 ni autoriza publicar A. Quiz, claims editoriales, identidad exacta y los 14 perfiles de instalación restantes continúan pendientes.

El objetivo persistente figura activo según la app. El heartbeat horario permanece pausado; no se requiere otra reanudación para este trabajo.
