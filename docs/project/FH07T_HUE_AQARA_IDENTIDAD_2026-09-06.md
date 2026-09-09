# FH07T — destinos Hue y Aqara corregidos
Fecha: 2026-09-06. APROBADO LOCAL para identidad y guardados. FH-07 sigue parcial, 2/5 integral.

## Evidencia y decisión
Hue B016H0QZ7I identifica Bridge Only (parte 458471/modelo 453761), no el kit editorial. La propia ficha enlaza B096YFWVVS como kit de dos bombillas y Bridge. La nueva ficha identifica modelo 562918, UPC 046677562915 y contenido 1 Bridge + 2 A19 E26 white-and-color. Ese UPC coincide con Philips US. Se conserva la ruta/nombre editorial genérico y se concreta el modelo del kit.
Aqara B09QXPBRM2 no pudo corroborarse. B09QKVMMTB identifica Motion Sensor P1, MS-S02 y GTIN 6970504215979; el manual oficial confirma MS-S02. No se afirma qué producto era el ASIN anterior.

Fuentes consultadas 2026-09-06:
- https://www.amazon.com/dp/B016H0QZ7I
- https://www.amazon.com/dp/B096YFWVVS
- https://www.philips-hue.com/en-us/p/hue-white-and-color-ambiance-starter-kit-2-e26-smart-bulbs-60-w/046677562915
- https://www.amazon.com/dp/B09QKVMMTB
- https://www.aqara.com/wp-content/uploads/2023/06/Motion-Sensor-P1_User-Manual.pdf

Amazon corresponde a contenido indexado de unas tres semanas, no verificación de oferta vigente. Philips mezcla FAQ genérica Bridge Pro con este kit anterior: no se transfieren esas afirmaciones. Se documenta identidad de catálogo, no inspección de unidad, firmware o vendedor.

## Cambios
- Ambos productos: ASIN/enlace coherentes y notas públicas con fuentes, incertidumbres y datos comerciales históricos no verificados para el nuevo destino.
- Hue: imagen Bridge-only sustituida por arte representativo local; oferta conserva vencimiento 2026-07-15, corregido destino y featured false. No se renovaron precios/ratings/fechas.
- Reseña y guía Hue precisan dos bombillas E26 y Bridge; retirado párrafo de superioridad de largo plazo sin evidencia.
- Normalización de guardados: sólo pareja exacta slug+ASIN anterior cambia. Un Bridge independiente o slug ajeno conserva su ASIN. Deduplicación, bajas y relojes de sincronización conservados. No compra ni transferencia ejecutadas.
- Instalación sigue en 26 documentadas/2 desconocidas: este bloque resuelve identidad, no añade requisitos de montaje.

## Validación
5/5 pruebas nuevas dirigidas; 707/707 generales sin fallos ni saltos. Tipos: 248 archivos, cero errores y warnings, 18 hints existentes. Lint/diff-check aprobados. Build 88 páginas; SEO 88 páginas, cero errores/warnings.
12 escenarios navegador: dos fichas, reseña/guía/comparación Hue y carrito a 1440/390. Carrito con versiones antiguas/nuevas: dos entradas sin duplicación; destino corregido para ambos; no precios históricos; foco; eliminaciones persisten al recargar. No desbordamiento horizontal. Dos capturas de carrito inspeccionadas; botón inferior móvil comprobado en DOM.
89 HTML, incluida 404: cero enlaces href con ASIN anteriores. Esos identificadores permanecen intencionalmente en migración/pruebas y documentación histórica.
Auditor editorial sobre cuatro HTML: ocho candidatos missing-alt de avatares comunes. No constituye auditoría integral de accesibilidad. Red externa bloqueada en QA; cuentas/API y compra no probadas.

## Juzgado del mismo agente
Producto 3/5: destinos acordes al artículo y guardados coherentes; falta instalación.
Técnica 4/5 local: regresión de sincronización y consumidores verificada; no producción.
Datos/editorial 3/5: coincidencia UPC/modelo, no inventa datos comerciales; firmware/paquetes físicos pendientes.
Operación 2/5: cambios locales; sin publicación ni prueba de cuenta real.

## Continuación
Añadir requisitos de Aqara MS-S02 y Hue 562918 utilizando sus modelos delimitados. Revisar separación de radio/Bridge/servicios Hue y demás criterios integrales del catálogo. El hallazgo de destino Hue descrito en FH07S queda corregido por este bloque. Cinco tareas completas y 27 restantes. Objetivo activo; heartbeat pausado.
