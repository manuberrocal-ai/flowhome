# FH09AP — búsqueda completa y estados comprensibles

## Cambio local

La búsqueda omitía silenciosamente cuatro de los 28 productos por un límite de 24 y no explicaba la ausencia de coincidencias. Se eliminó ese límite, se reutilizó el filtro del catálogo (términos, espacios, guiones y acentos) y se añadió un recuento accesible separado de la cuadrícula. Una única etiqueta visible reemplaza las dos etiquetas ocultas, una de las cuales prometía buscar guías que no están en este conjunto.

El estado sin resultados explica cómo recuperarse, ofrece limpiar la consulta por teclado y vuelve a enfocar el campo; conserva un enlace al catálogo. La tarjeta sin precio ahora dice «View product details» porque abre una ficha interna, no Amazon. El ejemplo del campo usa el color de texto secundario existente para mejorar contraste. Impeccable orientó estas correcciones de claridad y recuperación sin cambiar la identidad visual ni añadir afirmaciones comerciales.

## Verificación

Probe reproducible: `scripts/qa/search-states.cjs`. Preview local aislado 4341; no modifica la vista del propietario 4339. Tres anchos: 390, 768 y 1440 px, DPR2 y movimiento reducido. Comprueba todos los 28 artículos, 28 archivos distintos por escenario, correspondencia con el registro del producto, selección de miniatura del mismo modelo, decodificación, texto alternativo y rótulo de ilustración. También prueba cuatro consultas, entrada con caracteres HTML sin coincidencias, mensaje y recuento vacíos, recuperación con Enter y foco, consulta inicial por URL y ausencia de desbordamiento horizontal.

Evidencia y capturas: `C:/AGENTES/Informes/flowhome/fh09ap-search-20260908`. Inspección visual del estado vacío móvil y de resultados de escritorio. Las comprobaciones de asociación no certifican fidelidad física ni derechos de fotografía: siguen siendo ilustraciones rotuladas, no fotos oficiales. No se ha medido mejora de conversión ni Core Web Vitals con este cambio.

## Alcance y revisión

Controles generales: 1.043/1.043 pruebas, lint y diff-check correctos; tipos en 456 archivos con 0 errores, 0 warnings y 20 hints; compilación correcta. No se repitió la matriz completa de Lighthouse por este cambio acotado de búsqueda no indexable.

Este cambio está en el árbol local original, **no en el candidato inmutable FH13R ni en la PR12**. La autorización pendiente para subir FH13R no abarca este cambio posterior. No se publica, fusiona ni activa ningún servicio.

Juzgado propio: aprobado local para el comportamiento probado de búsqueda; FH-09 continúa parcial por procedencia y alcance integral. Una sola revisión de agente, no certificación independiente. La entrega externa y la validación conectada siguen pendientes por separado.
