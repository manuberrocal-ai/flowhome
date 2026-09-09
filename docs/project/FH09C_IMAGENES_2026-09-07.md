# FH09C — transferencia menor, fidelidad todavía pendiente

Las 15 ilustraciones existentes se sirven en WebP sin pérdida: **20.808.485 → 14.541.976 bytes**, ahorro de 6.266.509 bytes (30,12%). No se generó arte nuevo, no hubo retoque, recorte ni cambio de resolución. La igualdad de RGBA decodificado y dimensiones se comprobó para cada archivo. Esto no convierte dibujos genéricos en imágenes fieles del producto.

## Implementación y reproducción

`node scripts/maintenance/encode-product-art.mjs` usa sharp 0.35.3 ya instalado por Astro, sin dependencia añadida. Produce los `.webp` junto a los `.png` bajo `public/images/product-art/illustrations-v1/` y un informe de tamaños, hashes de archivo y RGBA bajo `reports/product-art/lossless-encoding.json`. Rechaza salida no equivalente, sin ahorro o un archivo existente diferente. No sobreescribe originales.

La política compartida devuelve WebP tanto para identidades del catálogo como para rutas PNG antiguas guardadas. Conserva rechazo de URLs externas/rutas no permitidas, pies de imagen y dimensiones. YAML y PNG originales permanecen como fuentes y compatibilidad: el tamaño del artefacto en disco aumenta 14,54 MB; lo que disminuye es la transferencia de imágenes utilizadas. No se presenta esto como reducción del paquete de despliegue. Para revertir la selección de formato, restaurar el resolver anterior y sus expectativas, conservando los archivos originales.

## Evidencia local

- 909 pruebas aprobadas; incluye igualdad de píxeles de 15 imágenes, ahorro superior al 20%, 28 identidades, rutas heredadas, etiquetas y datos estructurados.
- Lint aprobado; tipos: 359 archivos, cero errores/advertencias y 18 hints. Build: 88 páginas. SEO: cero errores/advertencias. Diff check sin errores de whitespace; avisos históricos de LF/CRLF.
- `/products/`, Chromium en contextos nuevos, 390 y 1440 × 900, movimiento reducido, servidor local 4339: carga forzada de las 28 imágenes completas, 14 recursos distintos. `encodedBodySize` **19.555.203 → 13.653.396 bytes**, ahorro 30,18%; todas decodificadas a 1254 × 1254 y sin desbordamiento horizontal.
- Script reproducible: `scripts/qa/catalog-image-transfer.cjs`. No es medida de primera pantalla, red móvil, LCP, INP, CLS de campo ni tasa de conversión. El recurso genérico número 15 no se utiliza en ese catálogo, por eso el total difiere del conjunto completo.
- Portada, ficha Echo Dot, review Echo Dot y búsqueda: ocho escenarios390/1440 con WebP decodificado y sin overflow. Lista antigua con PNG resuelve WebP y permite eliminar con teclado. Script `scripts/qa/optimized-image-surfaces.cjs`; captura `FH09C-catalog-1440.png`. Los scripts CJS también pasaron lint dirigido.
- Una invocación adicional con `core.autocrlf=false` produjo falsos positivos por CRLF en numerosos archivos previos; no se cambió la configuración persistente ni se normalizaron archivos ajenos. El control del proyecto con su configuración normal es el aplicable y pasó.

## Investigación de fidelidad y procedencia

Consulta 2026-09-07; las páginas siguientes son evidencia de identidad o condiciones, no permisos adquiridos por FlowHome.

- **Echo Dot 5:** [Amazon identifica un dispositivo esférico](https://digprjsurvey.amazon.com/csad/help/node/T9vK1qIZkTSG7LX8JT). La ilustración cilíndrica actual no identifica ese modelo. La foto Commons encontrada corresponde a la variante con reloj y se descartó como sustituta del modelo sin reloj. El [centro de prensa Amazon](https://press.aboutamazon.com/images-and-videos) remite a terceros no prensa a sus condiciones de marcas; no se obtuvo autorización específica para esta reutilización.
- **Kasa Plug Mini:** el catálogo identifica EP10 / EP10P2, no HS103. [Ficha oficial EP10](https://static.tp-link.com/upload/product-overview/2021/202111/20211105/EP10%28US%291.0%20%26%201.8_Datasheet.pdf). Los [términos Kasa](https://www.tp-link.com/us/about-us/kasa-terms-of-use/) requieren consentimiento escrito previo para incorporar contenido de sus servicios a otra web. No se copiaron sus fotos.
- **Govee H617C:** la [matriz oficial](https://community.govee.com/support/faqs/specs), ya registrada en el YAML con su evidencia de identidad, describe una tira RGBIC; la ilustración bombilla/interruptor es genérica, no fiel al modelo. No reutilizar H618C ni otra longitud como equivalencia.
- **Aqara M2:** [página oficial](https://www.aqara.com/us/product/hub-m2/) localizada, sin permiso de reutilización demostrado. Existencia pública de una imagen no certifica su licencia ni el paquete ASIN.

No se volvieron a buscar credenciales agotadas, no se descargaron fotos de terceros ni se activó la API. **0/28 imágenes certificadas por modelo** sigue siendo el estado: FH-09 no se cierra.

## Juzgado de esta etapa

Producto **3/5**: menor transferencia, sin resolver repetición visual ni identificación. Técnica **4/5 local**: resolver central y equivalencia comprobados; faltan variantes responsivas de tamaño y medición de red real. Datos/editorial **2/5 para imágenes**: límites honestos y fuentes concretas, pero ninguna foto fiel habilitada. Operación **2/5**: original recuperable y receta reproducible, sin publicación ni entrega exacta aprobada.

Siguiente: sustituir representaciones genéricas mediante activos por modelo verificables, o retirar del contexto de producto las representaciones incorrectas sin fingir fotos. No repetir búsquedas de permisos/credenciales sin una nueva fuente. Continuar los pendientes independientes del catálogo y la entrega local. Preview4339 debe conservarse.
