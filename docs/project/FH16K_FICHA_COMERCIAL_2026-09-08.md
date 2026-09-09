# FH16K — observaciones transitorias en la ficha real

## Ficha y aceptación

Problema: FH16J verificaba DOM de ensayo, no los paneles de la ficha editorial. Se añaden dos espacios vacíos y ocultos mediante CommerceObservation: panel principal PriceHistory y panel lateral ProductLayout. No se importa ni invoca el cliente comercial desde las páginas públicas. StickyCTA conserva su enlace y texto de consulta, sin copiar un precio.

El montaje explícito mountProductCommerce exige ASIN válido y coincidente en todos los paneles, un único grupo de controles y campos completos antes de mutar. Activa el presentador existente; al desmontar retira datos, oculta paneles y restaura las notas estáticas de indisponibilidad. Durante el montaje, el estado transitorio sustituye esas notas para no contradecir la observación cargada. Esto no autentica una fuente: el servidor y los permisos conservan sus requisitos.

Aceptación: dos paneles coherentes, carga y error recuperables, caducidad/offline sin precio residual, foco conservado, enlaces de compra intactos y HTML normal sin datos comerciales nuevos.

## Verificaciones

-1010/1010 pruebas generales tras la corrección de foco; lint y tipos442 archivos correctos,0 errores/advertencias y18 hints. Tres pruebas dirigidas incluyen desactivación predeterminada, ASIN inválido/ausente/mezclado y rechazo de consulta simultánea.
-16 comprobaciones de navegador sobre la ficha real Echo Dot en harness loopback,320/1440px: dos paneles inicialmente ocultos sin peticiones comerciales, carga, offline/reconexión, expiración, denegación, cleanup, foco y href de todos los CTA preservados. Datos sintéticos señalizados, no ofertas reales. No se abrió Amazon ni se realizó una compra.
-Se detectó pérdida de foco al desactivar físicamente el botón durante la carga. Corregido con aria-disabled/aria-busy y guardia de concurrencia, manteniendo disabled al desmontar. La repetición de navegador pasó.
-Inspección visual de la captura320: panel de precio, fuente legible, estado de recuperación y foco visibles; botón Amazon separado. Prueba de desbordamiento también en1440. No hay nueva animación. Impeccable sin hallazgos mecánicos en los componentes y montaje afectados.
-Inventario de28 fichas construidas:56 paneles ocultos, campos precio/fuente/disponibilidad vacíos y pares de ASIN coincidentes. Este control no certifica identidad comercial externa ni todos los estados visuales de los28 productos.
-Build final editorial88 con cuenta/analítica false; SEO88 sin errores/advertencias. Plan derivado coincide con32 tareas/8 hechas; diff-check correcto. No se repitió Lighthouse ni se atribuyen sus métricas históricas a estos bytes nuevos.

Evidencia reproducible: scripts/qa/commerce-product-check.txt contra scripts/qa/compatibility-browser-harness.mjs. Capturas locales .playwright-cli/fh16k-product-320.png y fh16k-product-1440.png. El harness permite asin solicitado sólo como eco de fixture de ensayo; no es un servidor comercial autorizado.

Una apertura inicial coincidió con la reconstrucción de dist y registró recursos500; no se usó como evidencia final. Se añadió la ruta favicon.svg faltante en el harness. La corrida final sólo registró los503 de denegación provocados. Se cerraron el servidor y la sesión de navegador propios, sin cerrar la vista4339 del usuario.

La salida estática cambia por los paneles vacíos y atributos; FH13P no representa estos bytes. No se actualizó la PR, no se publicó ni se activó Amazon. Los candidatos previos se conservan.

## Juzgado propio

**APROBADO LOCAL**. Producto2/5 integral B: la compra queda independiente y los paneles reales retiran datos. Técnica3/5 local: montaje, identidades y concurrencia probados. Datos/editorial2/5 integral: observaciones sintéticas no prueban permisos ni correspondencia con una respuesta Amazon real. Operación2/5 integral: sigue faltando integración autorizada completa. Impeccable influyó en el foco, la separación del CTA y los estados recuperables. Valoración del mismo agente, no revisión independiente.

FH-16 continúa parcial. Siguientes pendientes ejecutables: integración coherente de catálogos/comparaciones y validación de visibilidad/freeze/BFCache específico; mantener lectores confiables, cuotas, entrega HTTP/CDN real y fuente Amazon como dependencias separadas. Antes de publicar A hay que revisar su fuente/artefacto exactos: los paneles ocultos no constituyen aprobación de B.
