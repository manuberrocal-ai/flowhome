# FH08A — recomendaciones, destinos y fechas editoriales

## Resultado y alcance

Corrección local verificada el 6 de septiembre de 2026. FH-08 sigue PARCIAL: este bloque no acredita la revisión semántica completa de las 15 reseñas y ocho guías. FH-07 conserva su cierre documental (28 fichas; 74 afirmaciones y 150 desconocidos), sin certificación física ni autorización de publicación. Seis tareas hechas y 26 restantes.

## Hallazgos y cambios

- Q5+, consejo de compra: “broad smart-home compatibility” y la insinuación de mejor ajuste del j7+ a obstáculos excedían la evidencia comparativa. Sustituidos por comandos concretos a verificar, distinción Siri Shortcuts/HomeKit y ausencia de prueba de rendimiento.
- Q5+, primera utilización: “supervise the routine enough” diluía el requisito del manual. Se conserva la instrucción de supervisar toda la primera ruta, enlazando el manual ya consultado el 5 de septiembre en FH07M; no se fabrica una nueva fecha de consulta.
- Q5+, necesidad editorial: sustituidos párrafos genéricos por límites de resultados no ensayados y enlaces a identidad e instalación. Actualización real del contenido: 2026-09-06; publicación original conservada. No se atribuye revisión humana.
- Plantilla común de las 15 reseñas: aviso junto al enlace comercial exige modelo, paquete, precio y disponibilidad; distingue la oferta actual no verificada de la documentación. Añade acceso a evidencia y desconocidos. La metodología remite compatibilidad e instalación al fabricante, no únicamente a Amazon.
- Hallazgo nuevo al inspeccionar la captura: el 6 de septiembre se mostraba como 5, y el 28 de junio como 27. Las cuatro etiquetas de fecha de la plantilla ahora usan UTC, preservando el día de calendario como ya hacía la guía.

## Verificación

- 716/716 pruebas aprobadas, cero omitidas. Dos pruebas nuevas de límites editoriales/destino, guardia de cuatro fechas UTC. Un test histórico fijaba la fecha anterior del Q5+; actualizado tras confirmar el fallo en esa aserción.
- Tipos: 252 archivos, cero errores/advertencias, 18 sugerencias existentes. Lint y diff-check aprobados.
- Compilación final: 88 páginas, 17:24:20 hora local. SEO: 88 páginas, cero errores/advertencias.
- Seis escenarios reales de navegador: Q5+, j7+ y M2 a 1440/390 px; aviso, enlace exacto a identidad, foco, navegación al destino, afiliación y ausencia de desbordamiento. Q5+ comprueba además fechas y texto corregido. Dos capturas finales inspeccionadas.
- Dos errores iniciales del verificador por selectores ambiguos (aside/article) corregidos acotando al contenido de reseña; no eran fallos de la aplicación.
- Solicitudes externas bloqueadas deliberadamente. La consola registra la imagen remota de Aqara bloqueada; no implica disponibilidad remota verificada.
- Auditor de texto: 15 HTML, 30 candidatos por alt vacío (dos avatares del encabezado por página, patrón preexistente documentado); no se consideran automáticamente 30 defectos nuevos ni una aprobación integral de accesibilidad. No hubo otros candidatos deterministas.
- Capturas y JSON: entrega estable, prefijo FH08A_. Ayudante reproducible en la carpeta work, fh08a-browser-check.js.

## Juzgado del bloque

Cuatro perspectivas de una sola revisión, no revisores independientes. Producto 3/5: decisión de compra mejor delimitada, faltan las demás piezas. Técnica 4/5 local: regresiones, render y navegación aprobados. Datos/editorial 3/5: fuente manual existente y límites explícitos, sin prueba física ni oferta actual acreditada. Operación 2/5: cambios locales; falta aprobación y comprobación remota para publicar.

**NO LISTO PARA PUBLICAR como conjunto.** Próximo trabajo ejecutable: reseñas y guía de hubs, reconciliando requisitos de instalación/identidad acreditados en FH-07 con las recomendaciones. Objetivo ACTIVO; heartbeat PAUSADO, sin esperas horarias.
