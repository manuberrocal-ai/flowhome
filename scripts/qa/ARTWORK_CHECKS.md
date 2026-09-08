# Verificación de imágenes del catálogo

Prueba conjunta: `catalog-artwork-regression.cjs`. Ejecutar con el Playwright CLI ya instalado, sobre una sesión propia con densidad de píxel 1 y la vista local construida en http://127.0.0.1:4339. No instalar dependencias ni adjuntar un perfil del usuario.

```powershell
playwright-cli -s=fh-artwork open http://127.0.0.1:4339/products/
playwright-cli -s=fh-artwork run-code --filename=scripts/qa/catalog-artwork-regression.cjs
playwright-cli -s=fh-artwork close
```

Cerrar únicamente la sesión creada para esta verificación. Revisar el bloque Result/Error y la salida del proceso; una invocación no es evidencia de éxito.

## Cobertura

- Inventario completo esperado de 28 productos, slugs y ASIN distintos.
- Ninguna ilustración específica compartida por dos productos; genéricas pendientes contabilizadas por separado, no ocultadas.
- Coherencia entre título, imagen, enlaces internos, destino Amazon y datos del botón de lista guardada. No hace compras ni pulsa enlaces externos.
- Miniatura de 240 px seleccionada en catálogo a DPR1, imagen decodificada y advertencia de ilustración presente.
- Ficha de cada producto en 390/1440: respuesta HTTP, nombre, imagen, texto alternativo, leyenda, destino Amazon y ausencia de desbordamiento.
- Pruebas unitarias del propio verificador en `test/catalog-artwork-regression.test.mjs` incluyen casos negativos. Simulan la interfaz del navegador; no reemplazan su ejecución real.

## Qué NO demuestra

La coherencia entre páginas no demuestra fidelidad al fabricante: todas podrían repetir el mismo error. Una imagen nueva requiere referencia primaria, inspección visual del archivo y de su tarjeta renderizada, límites editoriales y prompt/procedencia conservados. Esta prueba tampoco certifica fotos oficiales, permisos de imagen, precios, paquetes, accesibilidad completa, fidelidad por ASIN, conversión ni rendimiento en dispositivos físicos.

No sustituye pruebas específicas de búsqueda/categoría, recuperación ante errores, densidad alta o carrusel cuando esas superficies cambian. Los scripts anteriores por modelo quedan como evidencia histórica; no hace falta ejecutarlos todos en cada alta.

## Secuencia para un modelo nuevo

1. Confirmar identidad y referencia visual; generar y revisar la ilustración sin afirmar que es fotografía.
2. Integrar el modelo y generar miniaturas con el codificador incremental existente.
3. Ejecutar pruebas de `product-image-labels`, `product-art-encoding` y `product-thumbnails`.
4. Reconstruir y ejecutar la prueba conjunta; revisar visualmente el modelo nuevo y las superficies específicas afectadas.
5. Guardar reporte de evidencia y actualizar los documentos operativos. Si cambia un componente compartido, ampliar la regresión proporcionalmente.
