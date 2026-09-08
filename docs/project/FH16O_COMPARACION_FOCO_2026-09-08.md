# FH16O — foco y coordinación pendiente en comparaciones

## Resultado local

Corregido el foco del botón Refresh evidence en el montaje explícito de comparaciones. Durante una consulta mantiene el foco y comunica aria-disabled/aria-busy; el guard existente rechaza activaciones repetidas. Al desmontar, el botón queda deshabilitado. No se importa este controlador en la página pública ni se activa un proveedor.

Impeccable/harden orientó la conservación del foco y la prueba de concurrencia. No se rediseñó la identidad visual ni se añadieron afirmaciones comerciales.

## Evidencia

scripts/qa/compatibility-comparison-check.txt amplía el ensayo sobre la página real servida por el harness local. Se retienen deliberadamente las dos respuestas para comprobar el estado pendiente, se pulsa Enter de nuevo y se invoca refresh: sólo se producen dos consultas, una por producto. Tras liberar respuestas, el foco permanece y el botón permite reintentar.

28 comprobaciones correctas en 390 y 1440px: foco durante/después de la carga, duplicados, coherencia tabla/fichas, retirada de fuentes y conclusiones al quedar offline, ausencia de restauración automática y cleanup. Captura móvil revisada: tabla con desplazamiento horizontal contenido, sin desbordar la página. Datos de ensayo, no validación externa de productos.

1015/1015 pruebas generales; lint correcto; tipos 445 archivos, 0 errores, 0 advertencias y 18 hints. Build 88 páginas con selector production, cuentas y analítica desactivadas. No se repitió Lighthouse ni la matriz integral de release. Se cerraron exclusivamente navegador y servidor de ensayo propios; la vista local del usuario permanece fuera de ese cleanup.

## Decisión para la siguiente integración

No montar dos controladores independientes sobre las conclusiones. comparison-presentation.ts regenera tradeoffs, buyerFits y evidenceLimits cuando cambia compatibilidad; buildComparisonInsights consulta getCommerceData y la colección de compatibilidad no lleva precios. Un segundo controlador comercial dejaría límites contradictorios o vería sus textos sobrescritos.

La integración pendiente debe tener un único responsable de render y cumplir:

1. Mapear slug y ASIN sin transportar observaciones comerciales en el HTML estático.
2. Leer ambas colecciones inmediatamente antes de calcular texto; no conservar conclusiones derivadas como fuente de verdad.
3. Expirar precio y compatibilidad independientemente: la retirada de uno no invalida la evidencia vigente del otro.
4. Actualizar todas las copias de precio y sus límites en el mismo render. Los snapshots no justifican ganadores, ahorro ni mejor compra.
5. Probar respuestas parciales, cambios en distinto orden, caducidad y offline con evidencia real de DOM, sin debilitar la barrera estática para pasar la prueba.

Esta coordinación está definida, no implementada. FH-16 continúa parcial; lector confiable, permisos, cuotas globales, HTTP/CDN real y visibilidad/BFCache siguen pendientes. FH16L conserva freeze/resume NO VERIFICADO.

## Correo y juzgado

El correo aportado contiene las mismas 17 anotaciones documentadas en C:/AGENTES/Informes/flowhome/REVISION_CODEQL_PR12.md. No se reclasificaron ni descartaron remotamente; no se modificó la PR o producción. La ausencia de vulnerabilidades confirmadas en esa revisión estática no certifica el proyecto.

APROBADO LOCAL para foco y prevención de duplicados. Valoración integral conservada: producto 2/5 B, técnica 3/5 local, datos/editorial 2/5 y operación 2/5. Evaluación de un único agente, no revisión independiente. La integración comercial de comparaciones no se declara terminada.
