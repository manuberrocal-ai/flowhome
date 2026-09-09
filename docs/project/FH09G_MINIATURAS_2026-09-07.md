# FH09G — miniaturas responsivas del catálogo

ProductCard incorpora srcset240/480/720 y sizes200px: la imagen cuadrada visible está limitada por su contenedor h44, con margen para hover. Se conservan src original, dimensiones, carga diferida, alt/pie y fallback. Fichas, carrusel y otras plantillas no cambian su fuente grande en esta etapa.

54 variantes WebP quality84, effort6, de18 ilustraciones autorizadas; 636.580 bytes adicionales en disco. No son lossless: hay reducción de resolución y compresión con pérdida. Los originales PNG y WebP lossless permanecen intactos. No se generó arte nuevo. Identidad específica permanece3/28;25pendientes.

## Medición reproducible

Catálogo completo,28imágenes forzadas a cargar,15recursos únicos, contextos nuevos sin caché; no primer viewport ni Core Web Vitals.
Antes:14.968.040 bytes en390 y1440, DPR1.
Después:59.274 bytes en ambos anchos, DPR1 (99,60% menos).
DPR2:169.240 bytes; DPR3:315.620 bytes. Estas densidades se comprobaron después; no se midió baseline separado DPR2/3.
Ninguna imagen rota ni overflow. No se afirma reducción equivalente del paquete dist: se añadieron variantes y conservaron originales.

Scripts scripts/qa/catalog-image-transfer.cjs y scripts/qa/thumbnail-density.cjs. Se actualizó el contador histórico de14recursos: ahora el catálogo usa15, porque Govee dejó de compartir la bombilla. La prueba de densidad exige el tamaño correspondiente de cada recurso y28tarjetas.
Capturas FH09G-thumbnails-dpr1.png a dpr3.png. DPR1 inspeccionada visualmente: silueta, textura y aro reconocibles, etiqueta legible. No es certificación de todas las pantallas ni comparación perceptual exhaustiva.

## Verificación y operación

917 pruebas completas aprobadas. 13 dirigidas de variantes/fallback aprobadas. Lint del cambio, tipos366archivos sin errores/advertencias (18hints), build88 y SEO0errores/advertencias.
Fallo de miniatura Echo forzado en contexto aislado: srcset eliminado, fallback decodificado y etiqueta genérica, sin falsa identidad específica.
Generador reproducible: node scripts/maintenance/encode-product-thumbnails.mjs. Ejecutarlo al añadir un modelo; la prueba falla si faltan variantes. No nuevas dependencias ni publicación.

## Juzgado

Producto4/5 en carga del catálogo: reducción material, diseño conservado. Técnica4/5 local: densidades/fallback/regresión probados, falta medición real de velocidad y otras plantillas. Datos/editorial3/5: identidad/etiquetas intactas;25modelos aún genéricos. Operación2/5: pruebas locales, entrega exacta/producción pendientes.
Impeccable optimize orientó medir antes y después, dimensionar por superficie y conservar accesibilidad. Siguiente: imágenes específicas pendientes y extender optimización a consumidores grandes con medición propia, sin atribuir a toda la web este resultado del catálogo.

