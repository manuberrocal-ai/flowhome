---
target: "FlowHome: diseño, animaciones, favicon, catálogo e imágenes fieles"
total_score: 17
max_score: 32
na_heuristics: 7,9
p0_count: 0
p1_count: 3
timestamp: 2026-09-07T04-43-38Z
slug: src-pages-products-index-astro
---
Method: dual-agent (A: /root/design_review · B: /root/technical_review)

# FlowHome: crítica de catálogo y portada
Fecha: 2026-09-07. Target: src/pages/products/index.astro.

## Diagnóstico
La base es aprovechable, pero el catálogo todavía no ayuda suficientemente a elegir ni representa fielmente los modelos. Conservar la marca azul/turquesa y convertir la experiencia en una guía editorial clara, con imágenes verificadas y acciones comprensibles.
Especificidad media-baja: logo y promesa de compatibilidad propios; sombras, gradientes y contenedores anidados intercambiables con otras tiendas tecnológicas.

## Valoración
Evaluación de diseño; no medición de conversión ni certificación de accesibilidad.

| Criterio | Nota /4 | Evidencia |
|---|---:|---|
| 1 Estado | 2 | Carrusel no sincroniza todos los textos. |
| 2 Mundo real | 2 | Carrito significa guardar; imágenes no identifican modelos. |
| 3 Control | 3 | Controles presentes, sin pausa explícita. |
| 4 Consistencia | 2 | Favicon y criterios de orden incoherentes. |
| 5 Prevención | 2 | Avisos honestos, representación visual confusa. |
| 6 Reconocimiento | 2 | Acciones secundarias sin etiquetas visibles. |
| 7 Aceleradores | n/a | No exigibles en superficie editorial. |
| 8 Simplicidad | 2 | Demasiado contenido antes del catálogo. |
| 9 Recuperación | n/a | Estados de error no inspeccionados. |
| 10 Ayuda | 2 | Guías presentes, diferencias poco visibles en tarjetas. |
| Total | 17/32 (53%) | Aceptable; mejoras importantes necesarias. |

## Fortalezas
- Promesa de compatibilidad y cuestionario orientan a principiantes.
- Afiliación e ilustraciones declaradas; precios y valoraciones no verificados no se presentan como actuales.
- Nombres accesibles, acciones principales de 44 px y movimiento reducido; no implican certificación WCAG.

## Prioridades
### P1 Identidad de producto
28 productos únicos, 14 imágenes compartidas; cinco productos de iluminación comparten una ilustración. Ninguna de las 28 imágenes está certificada como representación exacta de su modelo. No hay duplicación de registros.
Echo Dot 5 se ilustra cilíndrico, aunque Amazon lo describe esférico: https://digprjsurvey.amazon.com/csad/help/node/T9vK1qIZkTSG7LX8JT
Govee H617C es una tira LED, no la bombilla e interruptor ilustrados: https://community.govee.com/support/faqs/specs
Causa: src/lib/product-image-policy.js asigna imágenes por categoría; ProductCard y hero las presentan junto al modelo.
Corrección: fotografías autorizadas vinculadas a modelo/ASIN y procedencia. Hasta verificarlas, presentación editorial sin imagen que aparente identificar el modelo; ilustraciones genéricas reservadas a categorías. Generar una imagen no demuestra fidelidad. Comando: impeccable shape.

### P1 Acciones y foco
ProductCard.astro y global.css: Amazon domina; ojo/carrito ocultan la tarea. Teclado colorea ambos controles sin identificar inequívocamente el activo; outline transparente y sombra decorativa reemplazan el anillo. Las clases de expansión existen sin activador localizado; no se afirma expansión funcional.
Corrección: View analysis y Save siempre visibles, marcador en lugar de carrito, dimensiones estables y foco individual contrastado. Transiciones breves sin mover objetivos. Comandos: impeccable clarify, harden, animate.

### P1 Organización del catálogo
products/index.astro: catorce categorías y promoción exclusiva de robots preceden a tarjetas; ningún producto visible en primer viewport 1265x712. Sin búsqueda ni diferencias resumidas. Orden usa ownerRating*log10(ownerRatingCount+1), mientras portada evita ese criterio no verificado.
Corrección: cabecera compacta, búsqueda, agrupación por necesidad, orden editorial explícito, una razón y un requisito comprobado por tarjeta. Promoción de robots contextual. Comando: impeccable layout.

### P2 Portada y movimiento
index.astro/hero-carousel.js: sí hay elevación, brillo, transiciones y rotación cada 4300 ms. Texto destacado lateral fijo mientras cambia tarjeta; anuncio accesible buscado desde contenedor incorrecto.
Corrección: selección editorial explícita, sincronización, CTA visible antes y carrusel manual o pausa visible. Comandos: impeccable distill, animate.

### P2 Marca y retorno
favicon.svg carga pero usa casa blanca, azul y naranja distinta de marca azul/turquesa. flowhome-logo-mark.svg tampoco coincide con PNG real; no reutilizarlo a ciegas. Manifest declara icono no cuadrado. Weekly brief termina en RSS, no correo.
Corrección: iconos coherentes desde marca real y verificados a tamaños pequeños; RSS nombrado desde el inicio; guardado de selección como motivo concreto de retorno. Comandos: impeccable polish, clarify.

## Personas y carga
Jordan: confunde guardar/comprar y no distingue modelos.
Riley: detecta discrepancias imagen/modelo y criterios editoriales.
Casey: desplazamiento excesivo y controles que deben ser independientes de hover; inferencia de código, no nueva prueba móvil.
Carga moderada: 3/8 fallos (agrupación, elecciones, memoria de diferencias). Entrada promete orientación, valle de confianza en tarjetas genéricas, cierre poco concreto. Mejor pico: recomendación con motivo y limitación; mejor cierre: selección guardada útil.

## Observaciones
15 PNG suman 20.8 MB en disco; no equivale a transferencia de página ni CWV medido. Optimizar y medir. Uniformar nombres de categorías y reducir decoración repetitiva. No prometer aumentos de conversión sin medición.
Detector: una advertencia gray-on-color en index.astro:56; falso positivo como defecto de contraste, texto slate-950 sobre blue-50. Revisión manual encontró problemas no detectados automáticamente.
Decisión: fidelidad y claridad antes de movimiento y acabado. Esta crítica no modifica la interfaz. Sustitución anterior por ilustraciones genéricas no satisface identificación exacta solicitada y queda pendiente de corrección.
