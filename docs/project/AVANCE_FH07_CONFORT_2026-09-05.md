# FH-07E — requisitos reales de tres productos de confort

**APROBADO LOCAL para este lote.** Wyze Bulb Color y Levoit Core 300S tienen puesta en marcha documentada sin cableado doméstico; SwitchBot Blind Tilt requiere comprobar la persiana y configuración guiada. El catálogo pasa de 11 a 14 perfiles documentados y de 17 a 14 desconocidos. FH-07 integral sigue parcial, 2/5: cinco tareas hechas y 27 restantes.

## Resultado y alcance

Wyze explica el modelo WLPA19C, casquillo E26, alimentación US, desconexión antes de manipular, restricciones de dimmer/luminaria y app/red. Levoit distingue retirar el envoltorio del filtro, espacio de 15 pulgadas/38 cm, energía US y controles físicos frente a VeSync. Blind Tilt distingue persianas horizontales y diámetros admitidos, incompatibilidad con verticales/roller, batería/USB-C, paquete desconocido y hub adicional para funciones remotas.

La selección de confort ya puede respetar la preferencia sencilla: Levoit y Wyze; con montaje/configuración guiada también Blind Tilt. Entretenimiento añade Wyze a Echo Dot y Nest Hub. No se modificó el algoritmo, las categorías ni las prioridades corregidas en FH07C.

## Evidencia

- [Contrato previo](FH07_CONFORT_CONTRATO_2026-09-05.md), [registro y hashes](FH07E_EVIDENCIA_2026-09-05.json), [navegador](FH07E_NAVEGADOR_2026-09-05.json).
- Dos pruebas nuevas fallaron antes del cambio por perfiles ausentes y filtro ampliado; después pasaron las 28 dirigidas. Suite completa: 663 aprobadas, cero fallos/omitidas.
- Lint, tipos y build aprobados. 88 páginas; auditoría SEO con cero errores/advertencias. Un intento inicial usó por error el nombre inexistente `check`; se corrigió al script real `typecheck` antes de compilar, no fue un fallo del proyecto.
- 72 controles de navegador aprobados en 1440/390 px: requisitos, fuentes, límites, metadatos, desbordamiento, foco y resultados de confort. Se repitió el comando para conservar su JSON completo después de una salida truncada, no por un defecto visual. Ocho capturas inspeccionadas en una ronda agrupada, sin defecto que requiera cambios.
- Analizador de texto: ocho candidatos de alt vacío en cuatro páginas; en el estado anónimo son los dos avatares ocultos por página, con atributo alt presente. No certifica el estado de cuenta real. Diferencias sin errores; persisten avisos LF/CRLF.
- Los demás campos de los 28 productos coinciden semánticamente con la referencia FH07B. Precios, ratings, ASIN, fechas comerciales y compatibilidad raíz no se renovaron por consultar manuales.

## Juzgado del lote

Cuatro perspectivas del mismo revisor, no evaluación independiente. Madurez del lote: 3/5; no elevar FH-07 integral.

| Perspectiva | Dictamen y límite |
|---|---|
| Producto | Aprobado local: confort sencillo tiene candidatos respaldados y límites visibles; no prometer facilidad física universal. |
| Técnica | Aprobado local: sólo datos de instalación y regresiones; reutiliza el contrato existente, preservación 28/28. |
| Datos/editorial | Aprobado local: fuentes oficiales y fecha separada; manual Levoit inspeccionado visualmente. Los vídeos SwitchBot se enlazan como guías, sin atribuirles pasos no observados. |
| Operación | Aprobado local: sin cuenta, llamadas comerciales, publicación ni cambio remoto. El heartbeat horario está pausado por pedido del usuario; trabajo actual continuo. |

## Lo que sigue

Quedan 14 instalaciones sin documentar y la identidad exacta ASIN/bundle/generación, afirmaciones por función, firmware, roles y servicios de los 28 modelos. Las fichas genéricas ambiguas no justifican asignar un modelo por suposición. Siguiente revisión: consumidores de compatibilidad/suscripción sin evidencia y los modelos restantes claramente identificables.

**NO LISTO PARA PUBLICAR el proyecto integral.** No hubo prueba física, verificación autenticada, validación de imágenes online ni despliegue. La habilidad de auditoría editorial exigió restricciones concretas y revisión renderizada; el contrato de evidencia impidió confundir documentación del modelo con certificación del paquete Amazon.
