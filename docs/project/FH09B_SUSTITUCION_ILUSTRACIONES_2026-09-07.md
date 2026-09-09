# FH09B — sustitución autorizada por ilustraciones propias

Fecha: 7 de septiembre de 2026. Resultado: reemplazo local terminado; publicación NO autorizada. FH-09 sigue parcial por peso y rendimiento, no por falta de decisión sobre fotos.

## Decisión y alcance

El propietario respondió «sí» a sustituir imágenes sin permiso acreditado por ilustraciones propias rotuladas. Se crearon 15 imágenes originales con la herramienta integrada image_gen: 14 categorías y un respaldo genérico. Se conservaron los originales generados, sin descargar ni transformar fotografías de proveedores. Son ilustraciones generadas con IA, no fotografías del modelo, certificados de identidad, representaciones de un paquete comercial ni afirmaciones de exclusividad jurídica.

Las 28 fichas usan ahora la colección local. Se retiraron las 27 URL remotas y se actualizó la antigua ilustración Hue para mantener consistencia. Los dibujos representan categorías: por ejemplo, la ilustración de iluminación no representa la tira Govee ni el contenido de un kit Hue. El rótulo visible en inglés es «Category illustration — not a product photo».

## Conjunto afectado

- Catálogo YAML, fichas principales y laterales, tarjetas, portada/carrusel, reviews, ofertas y buscador.
- Cuestionario: referencias serializadas locales; no se agregó una imagen a sus resultados de texto.
- Listas guardadas: la presentación resuelve por identidad de catálogo y solo admite los archivos locales expresamente enumerados. Las URL históricas almacenadas no se solicitan. No se borraron listas ni se modificaron cuentas remotas.
- Metadatos: ImageObject con URL local y leyenda representativa; Open Graph/Twitter reciben texto alternativo cuando muestran ilustraciones.
- Respaldo: mantiene recuperación y aviso de imagen no disponible; sin reintentos infinitos.

La política cerrada impide que una URL ingresada más adelante vuelva a autorizar por sí sola una foto. Incorporar fotografías requerirá un proceso explícito con procedencia y permiso; no basta cambiar el YAML.

## Archivos y procedencia

Los 15 PNG están en [public/images/product-art/illustrations-v1](../../public/images/product-art/illustrations-v1). [Procedencia y prompts completos](FH09B_ILUSTRACIONES_PROCEDENCIA_2026-09-07.json) identifica cada original generado y su copia utilizada. La herramienta integrada se usó para todas las ilustraciones, sin modo API/CLI.

[Inventario posterior al build](FH09B_INVENTARIO_LOCAL_2026-09-07.json): 176 archivos, 36,773,256 bytes, huella 042b800a1aa6cc88207494a6ab0246a06d0e65d9792373be51cf9c2b72099310. Es inventario local, NO manifiesto de release. Checkout sin confirmar, sourceSha null, entorno local, servicios de cuenta/analítica apagados y publishable false. El inventario FH13B de 160 archivos queda histórico; no representa este build.

## Validación y límites

- 18 pruebas dirigidas de imágenes, recuperación y lista; suite final 898/898, cero omitidas. Una prueba estructural antigua buscaba el mapa en product-art.ts: actualizada a su ubicación real; las nuevas pruebas cotejan las 28 identidades y archivos del catálogo.
- Lint aprobado. Tipos: 345 archivos, cero errores y advertencias, 18 sugerencias existentes. Build: 88 páginas. SEO: 88 páginas de contenido, cero errores y advertencias. Diff-check aprobado.
- Escaneo del resultado: 89 HTML incluyendo 404, más JS/JSON/XML; ninguna de las 27 URL de imágenes anteriores encontrada.
- Navegador Edge local: las 28 fichas decodifican su ilustración y presentan el aviso. Portada, productos, reviews, buscador, ficha Govee y review Echo Dot comprobados a 390 y 1440 píxeles: doce combinaciones sin desbordamiento horizontal y con rótulos visibles.
- Lista de ejemplo con foto remota antigua: usa ilustración del altavoz, conserva el producto y permite quitarlo con teclado. Cero solicitudes a los nueve hosts comerciales de imágenes anteriores durante la comprobación; cero excepciones de página.
- Cuatro capturas inspeccionadas: tarjetas y Govee en móvil/escritorio. La primera captura de tarjetas se tomó antes de la decodificación diferida; la segunda ronda espera la imagen y fuentes. No era una imagen rota.
- [Auditoría de texto](FH09B_AUDITORIA_TEXTO_2026-09-07.json): ocho candidatos en cuatro páginas, todos correspondientes a los dos avatares decorativos hidden y alt vacío por página; comprobados en los elementos reales. Ningún hallazgo nuevo confirmado en los rótulos.
- **Peso pendiente:** los 15 originales PNG suman 20,808,485 bytes. Es peso del conjunto, no transferencia de una página ni una mejora medida. No se ejecutó Lighthouse, no se prepararon derivados optimizados ni se midieron CWV de campo en este incremento. No publicar estos originales como versión optimizada sin resolver ese control.

Comprobación reproducible: scripts/qa/product-illustrations-browser-check.txt contra un preview local en 127.0.0.1:4339. El navegador y el servidor de esta revisión quedaron cerrados. No se hicieron commits, pushes, despliegues, activaciones de cuentas ni llamadas Amazon.

## Juzgado por etapa

| Perspectiva | Valoración | Evidencia y mejora siguiente |
|---|---|---|
| Identidad editorial | 4/5 | Aviso explícito en cada contexto; el nombre identifica el producto, el dibujo solo la categoría. Una foto exacta requeriría procedencia acreditada. |
| Integración técnica local | 4/5 | 28 rutas y listas históricas cubiertas, 898 pruebas. Mantener el cotejo automático al agregar productos. |
| Presentación y accesibilidad | 4/5 | Dos anchos, alt representativo y teclado; no equivale a auditoría completa de todas las tecnologías de asistencia. |
| Rendimiento | 2/5 | Archivos originales grandes. Preparar entrega web optimizada y medir plantillas antes de aprobar publicación. |
| Operación | 2/5 | Sin candidato Git final, destino/rollback ni autorización de publicación. Las pruebas locales no resuelven estos requisitos. |

## Próximo paso

La autorización de sustitución quedó atendida: no volver a pedirla ni seguir buscando permisos para las fotografías retiradas. Continuar con optimización y medición local de estos recursos. Después, seleccionar candidato exacto y obtener autorización separada de destino/rollback/publicación. Los accesos pendientes a Amazon, Supabase y analítica del proyecto completo no se resolvieron con esta decisión. Ocho tareas hechas/24 abiertas; no se declara terminado el objetivo general ni un loop activo en segundo plano.

