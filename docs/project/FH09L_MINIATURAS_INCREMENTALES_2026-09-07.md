# FH09L — generación incremental de miniaturas

El generador deja de recodificar y reescribir todos los activos en cada alta. Caché local reports/product-art/thumbnail-cache.json, comprobada con SHA256 del original, receta (tamaño, ajuste, calidad, esfuerzo y versiones sharp/libvips/codecs) y SHA256 del resultado existente. Una entrada de caché por sí sola no basta. Si falta un archivo, cambia su contenido o la receta, se vuelve a codificar; solo se escribe si los bytes difieren.

La caché es descartable y no se publica: JSON inválido o ausente se reconstruye. Errores de permisos/lectura no se silencian. Solo se aceptan fuentes de la lista del proyecto, no rutas arbitrarias. Los originales no se modifican.

## Evidencia

Primera corrida sobre22fuentes/66variantes: encoded66,written0; reconstruyó caché y comprobó que las variantes eran iguales.
Segunda corrida: encoded0,written0,reused66. Tamaño de variantes intacto732.312bytes. No se afirma una mejora temporal medida ni de rendimiento de la página.
Tres pruebas dirigidas aprobadas: dimensiones/peso/identidad; fixture temporal aislada cubre generación inicial, reutilización sin cambiar mtime, receta obsoleta, archivo corrupto, archivo ausente, original cambiado, caché JSON inválida y rechazo de fuente fuera de lista.
Lint y diff check aprobados. Sin cambios en UI ni activos finales: no se repitió build ni navegador por este cambio exclusivamente de mantenimiento.
Script scripts/maintenance/encode-product-thumbnails.mjs; test test/thumbnail-generator.test.mjs. Directorio temporal propio eliminado tras las pruebas, sin tocar datos del proyecto.

## Juzgado

Producto3/5 indirecto: reduce trabajo repetido, no cambia captación por sí solo. Técnica4/5: caché verificada y autorreparación probada; ejecución concurrente sobre los mismos archivos no se garantiza. Editorial3/5: imágenes y etiquetas intactas,7/28específicas y21pendientes. Operación3/5 local: altas incrementales reproducibles, entrega y producción pendientes.

Siguiente: Roborock Q5+ y eufy C120, manteniendo revisión visual y procedencia. No se creó automatización horaria ni se publicó nada.

