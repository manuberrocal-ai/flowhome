# FH12J — alineación de la imagen en fichas

La columna de imagen estaba centrada verticalmente contra todo el contenido de la columna textual. Esto producía una separación grande entre categoría e imagen en escritorio. Se alinea el contenido arriba desde 768 px, reservando 64 px para el rótulo. Móvil, contenido, fuentes de imagen, avisos y acciones se conservan.

## Evidencia

- Build: 88 páginas, correcto. Lint de la plantilla sin errores. Detector de layout antes/después: sin hallazgos.
- Navegador: Echo Dot y Philips Hue Starter Kit en 390, 768, 1024 y 1440 px; ocho escenarios sin desbordamiento. Distancia superior del marco: 24 px en móvil, 64 px en los otros tres anchos. Alineación superior comprobada por estilo y geometría.
- Capturas inspeccionadas: [escritorio](FH12J-profile-1440.png), [móvil](FH12J-profile-390.png). Comparación con FH09AJ: imagen desplazada hacia el encabezado, proporciones conservadas. Prueba reproducible: `scripts/qa/product-image-alignment.cjs`.
- No se repitió la suite general: el cambio afecta exclusivamente dos clases de distribución; los 955 resultados anteriores son antecedente, no una nueva ejecución.

## Juzgado propio, no revisión independiente

- Producto 7/10: relación imagen/título mejorada; todavía hay repetición de avisos y una ficha muy extensa.
- Técnica 8/10: ajuste acotado, sin código de interacción nuevo; no equivale a validar todos los navegadores o zoom.
- Datos/editorial 8/10: información y advertencias intactas; continúa la limitación de ilustraciones y datos no verificados.
- Operación 7/10: evidencia local reproducible; no publicado, entrega integral pendiente.

Próximo trabajo: peso de alta densidad/respaldo y revisión de la jerarquía de avisos conservando transparencia. FH-12 continúa parcial.
