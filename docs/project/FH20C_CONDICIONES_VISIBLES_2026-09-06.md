# FH20C — condiciones de compatibilidad conservadas

Estado: aprobado local para este cambio; FH-20 sigue parcial. No publicado ni activado.

## Hallazgo y corrección

El resolutor devolvía el texto condicionado de cada afirmación, pero el adaptador conservaba solamente su fuente y el booleano. Ahora transporta `compatibilityConditions` por campo. Las etiquetas compartidas de ficha, cuestionario y tabla, y las razones de comparación/alternativas conservan ese texto exacto. Una condición por sí sola no acredita compatibilidad; sigue siendo necesaria la evidencia preparada por campo. Los datos ausentes, caducados o fuera de ámbito no heredan condiciones antiguas. El modo desactivado vacía estos metadatos.

No se modificaron las afirmaciones documentales, el catálogo, las fuentes, la identidad visual ni el proveedor público. El candidato sigue limitado a un modelo de 28; el runtime por defecto continúa sin grafo.

## Validación

- 45 pruebas dirigidas aprobadas; suite completa: 774 pruebas aprobadas, salida cero.
- Lint aprobado; tipos: 277 archivos, cero errores y advertencias, 18 hints preexistentes.
- Compilación estática: 88 páginas; diff-check aprobado.
- Detector Impeccable de los archivos afectados: sin hallazgos mecánicos.
- Nueve comprobaciones de navegador: cuestionario, ficha y comparativa a 1440, 390 y 720 px. Texto completo, sin recorte del elemento ni desbordamiento del documento; región de tabla enfocable y operable por teclado.
- Cuestionario: respuesta JSON local de prueba con la condición documental; se ejecutó el renderizador real del cliente. Ficha y tabla: sustitución de texto en el navegador para probar longitud y composición, **no** prueba integral del proveedor en el renderizado servidor. La transmisión real del adaptador y los formateadores se verificó con pruebas automatizadas. 720 px es un ancho adicional, no una prueba de zoom real al 200 %.
- Inspeccionadas capturas de las tres superficies móviles y cuestionario de escritorio. Sin cambios de estilo necesarios. Los errores de red registrados corresponden a imágenes Amazon bloqueadas deliberadamente durante esta prueba local; no se certifica su carga ni sus derechos.
- Auditoría de texto del HTML normal: tres archivos, seis candidatos `missing-alt`, cero bloqueantes. Las imágenes señaladas tienen `alt=""`, sin `src`, en plantillas de la navegación; no son seis ausencias nuevas de texto alternativo. No se declara el conjunto listo para publicar.

## Juzgado del cambio — valoración interna, no revisores independientes

| Dimensión | Valoración | Límite / mejora siguiente |
|---|---|---|
| Producto | 4/5 | Conserva qué función está documentada; comprobar proveedor y todas las superficies antes de activación real. |
| Técnica | 4/5 | Pruebas de transmisión, degradación y serialización; falta integración servidor con proveedor aprobado. |
| Datos/editorial | 3/5 | No amplía el significado de las fuentes; cobertura 1/28 y variante comercial todavía no certificada. |
| Operación | 2/5 | No altera producción; responsable, permisos y activación siguen pendientes. |

Siguiente trabajo ejecutable: ampliar la cobertura documental por modelos y condiciones, manteniendo revisión e inyección explícitas. Antes de cerrar FH-20 se requieren pruebas integrales del proveedor aprobado y de las variantes que efectivamente se publicarán. El objetivo general permanece activo; ocho tareas hechas y 24 restantes.

Las guías de auditoría editorial e Impeccable orientaron la conservación del significado completo y la revisión de longitud sin rediseño. Evidencia visual y auditoría JSON: carpeta de entrega, archivos `FH20C_*`. El navegador y el servidor local propios se cerraron al terminar las comprobaciones.
