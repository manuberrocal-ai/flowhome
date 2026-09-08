# FH12M — franja duplicada en fichas

Se omite la franja global únicamente cuando ProductLayout declara que existe el aviso completo de la página. Su único consumidor actual es la ficha de producto, que conserva AffiliateDisclosure al inicio del artículo. No se cambió su texto ni los avisos de las acciones Amazon. El comportamiento predeterminado del resto del sitio conserva la franja.

Verificación: las 28 fichas construidas contienen el aviso y su limitación de paquete, sin franja global. Navegador a390/1440: ficha Echo y catálogo, cuatro escenarios sin desbordamiento; aviso visible antes del CTA principal en ficha, franja presente en catálogo. [Captura móvil inspeccionada](FH12M-disclosure-390.png), [escritorio](FH12M-disclosure-1440.png). Script: `scripts/qa/disclosure-placement.cjs`. Build88, SEO0/0 y lint afectado correctos. No equivale a dictamen legal ni a una prueba de conversión.

Juzgado propio: producto8/10 (menos repetición antes del contenido), técnica8/10 (alcance explícito y predeterminado conservador), datos/editorial8/10 (texto y relación de afiliación intactos), operación7/10 (evidencia local, entrega pendiente). No se agregaron acciones externas ni publicación. Inventario FH13C sigue histórico; consolidar sólo tras terminar cambios del candidato.
