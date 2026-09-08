# FH09AN — mapa completo e índice de reseñas

Se recorrieron las 83 rutas indexables del sitemap en 390/1440 px (166 escenarios), Chromium local, contextos nuevos, DPR1 y movimiento reducido. Se forzó carga de imágenes diferidas con fuente asignada. Todas devolvieron HTTP200, sin imágenes fallidas ni desbordamientos. Único hallazgo de imágenes individuales mayores de 200 KB: `/reviews/`, con 15 originales y 18.024.722 B totales en ambos anchos.

Se corrigió el índice con el selector responsivo existente, sizes80px acorde al cuadro96px menos relleno16px. No cambian ilustraciones, rótulos, enlaces ni contenido.

Después: seis escenarios del índice (390/1440, DPR1/2/3), 15 imágenes distintas y rótulos conservados. Todas seleccionan 240px. Transferencia total de imágenes: 56.108 B en DPR1/2, 88.682 B en DPR3; esta suma incluye logos y otras imágenes, no sólo las tarjetas. Antes/después DPR1: aproximadamente 99,7% menos. Sin comparación previa DPR2/3 ni afirmación de Core Web Vitals.

37 pruebas dirigidas aprobadas. Build88, SEO0/0 y lint afectado correctos. Capturas: [móvil](FH09AN-reviews-390.png), [escritorio](FH09AN-reviews-1440.png). Scripts `sitemap-image-inventory.cjs` y `reviews-image-transfer.cjs` en scripts/qa. El recorrido completo es anterior a la corrección; después se repitió el índice afectado, no las 83 rutas.

## Juzgado propio

- Producto 8/10: reseñas accesibles con transferencia menor, identidad visible conservada.
- Técnica 8/10: familias indexables cubiertas en dos anchos; no cubre todos los estados de herramientas, cuentas, consentimiento o todos los navegadores.
- Datos/editorial 8/10: no altera afirmaciones; ilustraciones, no certificación del paquete real.
- Operación 7/10: todavía no hay candidato publicable actualizado. Inventario anterior a este build: 421 archivos/136.720.173 B, entorno local, autenticación y analítica desactivadas; no usar ese digest como manifiesto actual.

Siguiente prioridad: consolidar candidato editorial y requisitos pendientes de entrega, sin publicar ni activar servicios. El mapa excluye cinco páginas de contenido no indexables y 404; éstos requieren cobertura específica. FH-09 continúa parcial hasta consolidación de evidencia y criterios de entrega.
