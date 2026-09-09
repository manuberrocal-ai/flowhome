# FH09AO — imágenes de los28 productos en la lista poblada

## Ficha y resultado

FH13R cubría la lista vacía en la matriz general; eso no acredita las imágenes de una lista poblada. Se verificó el candidato ac1ee54cd6930717f5151edebc89f8cc0e8df9d8 en preview aislado4341, sin modificar fuente ni la vista del propietario4339.

Cuatro escenarios:390/1440 px × DPR1/3, contextos nuevos e independientes con movimiento reducido. En cada uno se guardaron los28 productos mediante sus botones reales del catálogo, se comprobó aria-pressed=true y se navegó a la lista. No se sembró la lista personal ni se pulsaron enlaces Amazon.

Los cuatro escenarios terminaron correctamente:28 artículos,28 imágenes seleccionadas distintas, fuente de cada imagen igual a la asociada al ASIN guardado en catálogo, variante responsiva del mismo archivo, alt y aclaración de ilustración presentes, imágenes decodificadas y ancho de cuadro<=100 px, sin desbordamiento horizontal. Son112 asociaciones verificadas en navegador, no112 productos distintos.

Esto prueba consistencia de asociación/render, no fidelidad física de cada ilustración, derechos de fotografía oficial o composición exacta del paquete comercial. Se conservan los límites de identidad/editorial de cada modelo. La cifra encodedBodySize observada fue0 en el resultado inicial por lo que no se usa para afirmar transferencia cero ni mejoras de rendimiento; las imágenes podían provenir de caché tras visitar catálogo.

## Evidencia y límites

Probe reproducible: scripts/qa/populated-list-images.cjs. Verificación de sintaxis correcta. Cuatro capturas fh09ao-list-{390,1440}-{1,3}.png, conservadas en C:/AGENTES/Informes/flowhome/fh09ao-lista-20260908. Se inspeccionó visualmente la captura390/DPR3: encabezado, lista y primeras tarjetas legibles. No se afirma inspección visual exhaustiva de los28 dibujos.

El probe terminó con código0 y completó los cuatro contextos; no fue necesario cambiar aplicación. Navegador y preview propios cerrados; FH13R limpio confirmado. No se repitieron suite general, build o Lighthouse porque no cambió código de aplicación. Esta evidencia añade un estado no indexable a FH09AN, pero no cubre todos los estados de cuenta/búsqueda/errores.

## Juzgado propio

APROBADO LOCAL para imágenes asociadas en lista poblada. Producto3/5 local, técnica3/5 local, datos/editorial3/5 local y operación2/5 integral. Un solo agente. FH-09 permanece parcial por criterios integrales, procedencia y límites de las imágenes; no se convierte una ilustración en foto oficial. La autorización de actualización de PR solicitada para FH13R sigue independiente y no se presume por la continuación automática.
