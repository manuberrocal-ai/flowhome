# FH12R — rendimiento medido de FH13Q

## Resultado

Candidato inmutable 2ec3e0adae418dcf448152f5611eaee370f529e6, checkout flowhome-review-fh13q. Runner lighthouse:mobile completado con salida 0: cuatro rutas, tres muestras por ruta, cero incumplimientos de presupuestos. Checkout limpio después de medir; preview propio 4321 cerrado. No se modificó la vista del propietario en 4339.

| Ruta | Rendimiento | Accesibilidad | Buenas prácticas / SEO | LCP mediana | CLS | TBT mediana |
| --- | --- | --- | --- | --- | --- | --- |
| Inicio | 97 | 100 | 100 / 100 | 2416 ms | 0 | 0 ms |
| Amazon Smart Thermostat | 98 | 97 | 100 / 100 | 2264 ms | 0 | 0,92 ms |
| Reseña Roborock Q5 Plus | 98 | 100 | 100 / 100 | 2265 ms | 0 | 0 ms |
| Comparativa Amazon / ecobee | 99 | 100 | 100 / 100 | 2114 ms | 0 | 0 ms |

Evidencia completa: C:/AGENTES/Informes/flowhome/fh13q-lighthouse-20260908/summary.json y sus doce informes de muestras. Tres procesos Lighthouse terminaron con advertencias EPERM al limpiar perfiles temporales, después de producir informes completos. El runner los conservó y registró explícitamente; no se descartaron muestras ni se repitió la matriz.

Prueba sintética local móvil, recursos externos bloqueados. No acredita métricas de usuarios reales, INP, condiciones de producción o funcionamiento con servicios conectados. La home conserva sólo unos 84 ms de margen de LCP frente al umbral local de 2500 ms.

## Hallazgos que no deben ocultarse tras las puntuaciones

El informe de producto identifica contraste insuficiente de AMAZON LISTING LINK: naranja #f54900 sobre blanco, 3,59:1 frente a 4,5:1 requerido por el auditor. También detecta discrepancias entre texto visible y nombre accesible en llamadas a Amazon y acciones de tarjetas. La segunda comprobación figura como experimental en Lighthouse; requiere inspección y corrección semántica, no ignorarla por no reducir el resultado global.

Pendiente: corregir en el árbol de trabajo original, comprobar consumidores y acciones dinámicas, validar los elementos afectados y preparar un candidato nuevo si cambia código. Este informe no acredita esas correcciones. FH13Q debe permanecer inmutable y sus cifras no se atribuirán a otro candidato.

## Juzgado

Presupuesto local aprobado; perfeccionamiento de accesibilidad pendiente. Revisión externa, decisión sobre CodeQL, autorización del nuevo commit y cadena de publicación siguen independientes. No hubo push, merge, despliegue ni activación de servicios.
