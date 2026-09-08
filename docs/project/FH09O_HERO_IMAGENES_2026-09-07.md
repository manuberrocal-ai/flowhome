# FH09O — Imágenes responsivas del carrusel

Corrección posterior FH09P: el original mide 1254 px; el descriptor 1024w utilizado en esta etapa fue corregido a 1254w. Se verificaron nuevamente densidades y fallback. Las medidas de bytes de esta etapa siguen siendo las observadas.

Estado: implementado y verificado localmente. No publicado. Cobertura sin cambio: 9/28 modelos específicos, 19 pendientes; ilustraciones, no fotografías oficiales.

## Resultado medido

Carrusel completo de seis productos, navegador Chromium local, caché desactivada mediante interceptación, pantallas de 390 y 1440 px, densidad 1:

| Medida | Antes | Después |
| --- | ---: | ---: |
| Suma de cuerpos de las seis imágenes seleccionadas | 6.098.636 bytes | 66.158 bytes |
| Echo inicial | 1.255.620 bytes | 31.240 bytes |

Reducción del conjunto: 98,9 %. No es el peso total de la página ni una medición de Core Web Vitals, velocidad real móvil o conversión comercial. Las seis imágenes se cargan al recorrer el carrusel, no necesariamente en la primera pantalla.

## Implementación

- Reutiliza variantes existentes de 240/480/720 px y conserva el original de 1024 px como candidato para densidad alta.
- El tamaño declarado representa el cuadrado visible limitado por la altura, no el ancho de la caja con object-contain.
- Precarga y elemento de imagen comparten candidatos y tamaños; la rotación actualiza ambos sin modificar URL canónica, etiqueta, destino o metadatos editoriales.
- El mecanismo existente elimina candidatos cuando falla una imagen, muestra la ilustración genérica debidamente identificada y recupera la etiqueta específica al seleccionar otro producto.
- Sin dependencias, nuevos archivos gráficos ni cambios de diseño. Impeccable orientó medición previa/posterior y conservación de nitidez, accesibilidad y comportamiento.

## Evidencia

- `scripts/qa/hero-image-transfer.cjs`: seis imágenes distintas, decodificadas, con etiquetas y destinos en 390/1440; sin desbordamiento horizontal.
- `scripts/qa/hero-image-density.cjs`: Echo selecciona 480/720/1024 px para densidades 1/2/3; precarga alineada; cero solicitudes del original en densidades 1/2. Fallo simulado de Echo y recuperación en Kasa aprobados.
- Capturas inspeccionadas: `reports/FH09O-hero-1440.png` y `reports/FH09O-hero-390.png`. La segunda captura de elemento incluye parte del encabezado fijo por la posición de desplazamiento, no implica duplicación del componente.
- 17 pruebas dirigidas; suite completa final: 925 aprobadas, 0 fallos. Se actualizó C14 para verificar explícitamente el nuevo contrato de precarga responsiva en lugar de su cadena anterior.
- Tipos: 375 archivos, 0 errores, 0 avisos, 18 sugerencias existentes. Build: 88 páginas. SEO: 0 errores/avisos. Lint y diff sin errores.

## Juzgado de esta etapa (autoevaluación, no revisores independientes)

| Eje | Valoración | Límite / siguiente mejora |
| --- | --- | --- |
| Producto | 8/10 | Primera imagen mucho más liviana; no prueba aumento de captación. |
| Técnica | 9/10 | Densidades, precarga y fallback verificados; falta medición en teléfono físico/red móvil. |
| Datos/editorial | 8/10 | Identidades y advertencias preservadas; 19 productos siguen con ilustración genérica. |
| Operación | 8/10 | Pruebas reproducibles y cambios locales reversibles; entrega/publicación siguen pendientes. |

Siguiente prioridad: completar imágenes específicas del catálogo verificando referencias de fabricante, sin presentar dibujos generados como fotos de producto.
