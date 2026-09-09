# FH12D — catálogo local con búsqueda

Dos assessments independientes de layout (design_review y technical_review), recibidos en orden A/B antes de editar. Detector previo y posterior: cero hallazgos de layout. Se preservó identidad y rutas.

## Implementado

Cabecera compacta; búsqueda de nombre, marca y modelo combinable con categoría; contador anunciado; estado sin resultados; limpieza con foco de vuelta a búsqueda. Coincidencia normalizada de guiones/acentos y términos sin interpretar HTML. Las tarjetas se ocultan/muestran sin recrear listeners de guardado. Catorce enlaces de categorías en details nativo con blancos de 44 px; cuatro enlaces de robots preservados después del catálogo. Orden alfabético explícito. Sin JavaScript: 28 tarjetas y enlaces disponibles, controles no operativos ocultos.

## Evidencia

- 903 pruebas aprobadas; lint aprobado; tipos 350 archivos, cero errores/advertencias, 18 hints.
- Build 88 páginas; SEO 88 páginas, cero errores/advertencias; diff-check aprobado.
- Navegador 320/390/768/1440: sin overflow horizontal; HS220 produce un resultado; categoría incompatible produce estado vacío; limpiar restaura 28; iluminación produce cinco; 14 enlaces de categoría presentes.
- Inicio de primera tarjeta: 977/893/629/605 px respectivamente, con consentimiento inicial. Antecedente A: 2058/1649/1085/922 px; alturas de viewport anteriores no idénticas en todos los anchos, no inferir métricas de rendimiento.
- Capturas FH12D-directory-320.png, -390.png, -768.png, -1440.png, inspeccionadas 390/1440.
- Prueba sin JavaScript: 28 tarjetas, controles ocultos. Script scripts/qa/catalog-browser.cjs.

## Juzgado del ciclo

Producto 3/5: acceso al inventario y búsqueda más directos; imágenes y comparación resumida pendientes. Técnica 4/5 local: pruebas y fallback sin JS; no certificación integral de accesibilidad. Datos/editorial 3/5: sin ranking opaco ni hechos añadidos. Operación 2/5: no publicado, medición real y paquete exacto pendientes.

Pestañas propias cerradas; preview4339 del usuario conservado. No cambios de cuenta, producción ni programación. FH-09/FH-12 parciales. Próximo: favicon y fidelidad de imágenes; no se declara el proyecto terminado.
