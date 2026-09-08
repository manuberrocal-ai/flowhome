# FH09AK — variante de alta densidad

Se añadió 960 px al generador y a los conjuntos responsivos autorizados. Originales conservados, sin nueva generación de ilustraciones ni cambio de identidad. Generador existente: calidad WebP 84, mismo proceso de reducción; 43 variantes nuevas y 129 reutilizadas. Total 172 variantes, 2.758.980 bytes, frente a 48.502.206 bytes de originales. Este total es inventario, no transferencia de una página.

## Evidencia

Repetición comparable de `scripts/qa/image-surface-transfer.cjs`: Chromium local 4339, contextos nuevos, 390/1440 px, DPR1/2/3, movimiento reducido, sin limitación de red. 18 escenarios correctos, rótulos intactos y sin desbordamiento.

En ficha Echo Dot DPR3, ambos anchos: original 1.255.620 B → variante 960 de 100.350 B (aprox. 92% menos). DPR1 permanece en 31.240 B y DPR2 en 64.826 B. Reseñas y búsqueda conservan las selecciones medidas en FH09AJ. No es una medición de Core Web Vitals ni de la página completa.

Captura de la imagen en móvil DPR3 inspeccionada: [Echo Dot](FH09AK-echo-density3.png); textura, contorno y proporciones legibles. Prueba: `scripts/qa/detail-density-visual.cjs`. No constituye una prueba física del producto ni comparación perceptual exhaustiva de las 43 imágenes.

955 pruebas generales aprobadas; cuatro dirigidas de dimensiones, peso, identidad y caché. Todas las variantes autorizadas son cuadradas, tienen el ancho declarado y pesan menos de un cuarto del original. Build88, SEO0/0, lint afectado y diff correctos.

## Juzgado propio de la etapa

- Producto 8/10: detalle visible preservado en la muestra, descarga mucho menor.
- Técnica 8/10: variante reutiliza el proceso existente y conserva originales; falta optimizar el respaldo genérico pesado.
- Datos/editorial 8/10: no cambia identidad, rótulos ni procedencia; ilustraciones, no fotos certificadas.
- Operación 7/10: pruebas locales e inventario reproducibles; falta consolidación de entrega y comprobación publicada.

FH-09 permanece parcial: siguientes pendientes son respaldo genérico, medición global actual y preparación de entrega. Sin publicación ni cierre del objetivo integral.
