# FH12C — acciones de producto

Implementación local, sin publicación. Deriva de la crítica independiente archivada en .impeccable/critique/2026-09-07T04-43-38Z__src-pages-products-index-astro.md.

## Cambios

- Detalles y guardado con etiquetas visibles sin hover; dos columnas estables bajo Amazon.
- Marcador en lugar de carrito; estado guardado conserva texto y ancho.
- Foco individual con contorno navy de 3 px, independiente de sombras decorativas.
- Eliminadas reglas de expansión sin activador y elemento compacto invisible de Amazon.
- Ampliación de imagen sin modificar altura ni padding; margen de desplazamiento para acciones.
- No se cambiaron ASIN, destinos afiliados, almacenamiento ni datos comerciales.

## Evidencia

15 pruebas dirigidas aprobadas; suite completa intermedia 900/900. Tipos: 347 archivos, cero errores/advertencias y 18 hints existentes. Lint aprobado. Build final 88 páginas. SEO previo al último ajuste CSS: 88 páginas, cero errores/advertencias. Diff-check aprobado antes del último ajuste CSS.

El ensayo de navegador inicial detectó intercepción de clic por elemento invisible y un problema de alineación observado en captura; corregidos antes de entregar. No se usó force-click para ocultarlos. Script reproducible: scripts/qa/product-actions-browser.cjs, usando playwright-cli run-code y preview 4339.

Escenarios: 390 y 1440 px, etiquetas visibles, foco por Tab/Shift+Tab, guardado y eliminación por clic, ancho estable y ausencia de overflow horizontal. Movimiento reducido comprobado por duración calculada. Capturas: FH12C-actions-390.png y FH12C-actions-1440.png. No sustituye siete tamaños, lector de pantalla ni ensayo integral de compactas y ofertas.

## Juzgado del ciclo (evaluación del agente, no nuevos revisores independientes)

- Producto 3/5: tareas más claras; catálogo e imágenes aún limitan la decisión.
- Técnica 3/5: foco y geometría reparados; ampliar cobertura de variantes.
- Datos/editorial 2/5: sin nuevas afirmaciones; las imágenes genéricas no identifican modelos.
- Operación 2/5: solo local; artefacto previo queda histórico. No publicado ni listo para publicar.

Continuar con catálogo, favicon e imágenes verificadas. FH-09 y FH-12 siguen parciales; el proyecto no está terminado. No repetir búsquedas de credenciales agotadas ni crear automatización horaria.

## Segundo ciclo: orden editorial

El directorio deja de ordenar por ownerRating y volumen histórico. Orden alfabético por nombre con desempate por ID, declarado en pantalla; descripción SEO sin promesa de ratings. No modifica contenido ni destinos. Prueba catalog-order añadida; 16 pruebas dirigidas aprobadas y build 88 páginas. Esta corrección no reemplaza la futura selección editorial razonada ni resuelve búsqueda/estructura.

Confirmación final del segundo ciclo: lint aprobado; tipos 348 archivos, cero errores/advertencias, 18 hints; navegador devuelve los 28 nombres en orden alfabético. Filtro de búsqueda puro preparado y dos pruebas aprobadas, aún sin conectar en este punto documental.

Juzgado: producto 3/5 (orden predecible), técnica 3/5 (determinista), datos/editorial 3/5 en este criterio (sin ranking no verificado), operación 2/5 (local). La puntuación no afirma cierre integral de la entrega.
