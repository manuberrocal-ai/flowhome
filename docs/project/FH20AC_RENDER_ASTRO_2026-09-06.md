# FH20AC — Condiciones documentales en páginas Astro reales

Resultado: tres builds aislados aprobados (vigente, vencido y disputa de una afirmación en una sola ficha). Ninguna instalación del proveedor público, publicación o cambio de cuenta.

## Implementación y prueba

`scripts/qa/compatibility-render-review.mjs` ejecuta un hijo con variables de sistema mínimas y sin configuración de cuentas heredada. Usa la configuración del proyecto, un directorio de entorno nuevo y salida/caché temporales. Un plugin modifica únicamente el módulo de servidor en memoria para inyectar el candidato y la fecha de prueba; comprueba que el archivo runtime original queda idéntico. No escribe en el destino dist normal. Astro puede actualizar sus metadatos generados locales.
Context7 verificó la [API programática de Astro](https://github.com/withastro/docs/blob/main/src/content/docs/en/reference/programmatic-reference.mdx) y los [plugins de integración](https://github.com/withastro/docs/blob/main/src/content/docs/en/reference/integrations-reference.mdx); la versión instalada es 7.1.6. Verified Task Brief separó el render real del resultado de funciones y de una prueba en navegador.

Cada escenario compiló 88 páginas y comprobó 115 condiciones de fichas, 52 condiciones de comparativas, 28 entradas del quiz, enlaces de 21 secciones de alternativas y 27 bundles de cliente. La disputa de Alexa en la ficha Tapo no afecta al quiz ni a su comparativa. El escenario vencido elimina las condiciones del HTML recién generado y las devuelve como null en el quiz.
Los bundles no contienen los marcadores internos del grafo revisado comprobados por el script. El JSON del quiz sí incluye señales y condiciones necesarias para la interfaz; no se afirma que ningún dato documental llegue al navegador.

## Hallazgos, corrección de la prueba y límites

La primera ejecución exigió Wi-Fi de ecobee en la comparativa, pero la tabla no tiene fila Wi-Fi: renderiza Matter, Alexa, Google, Apple, Thread y SmartThings. Se corrigió esa expectativa con evidencia del componente, sin modificar la página ni ocultar una afirmación que sí existiera. Wi-Fi/BLE/Zigbee se verifican en fichas y quiz. El aviso de envFile deprecado se eliminó conservando envDir temporal vacío y entorno hijo restringido.
Las tarjetas de alternativas publican enlaces a perfiles, no afirmaciones de compatibilidad. Se comprueban destinos existentes, no autoenlaces y ausencia de etiquetas de evidencia; no se cuentan como 115 condiciones visibles.
**Pendiente crítico de activación:** el escenario vencido vuelve a construir HTML con una fecha futura. No demuestra que el HTML publicado antes de vencer deje de mostrar una afirmación. El resolutor se ejecuta al generar una página estática; su reloj no modifica después los bytes entregados. Mantener la fuente pública nula y cerrar el contrato de entrega/vigencia antes de activarla. No se detectó una exposición actual del candidato en producción.
No hubo prueba visual, teclado nuevo, interacción del quiz ni CWV de campo. Los artefactos temporales identificados en el JSON son de revisión y no están aprobados para desplegar.

## Validación y juzgado

Los tres procesos finalizaron con código 0. Lint y diff-check aprobados; tipos: 323 archivos, cero errores/advertencias y 18 hints. No se repitió la suite completa: 837 pruebas aprobadas en FH20AB son la base previa, no una nueva ejecución de este incremento. No cambió código de producto.
Evaluación propia 1–5: producto 4 (condiciones comprobadas en su superficie real); técnica 4 (aislamiento y render, sin navegador); datos/editorial 3 (variantes/firmware pendientes); operación 2 (caducidad de entrega y aprobación pendientes). No son revisores independientes.
Siguiente: proteger la entrega estática ante activación accidental de un grafo y precisar la vía de servidor que conserve vigencia, sin desplegar ni aprobar fuentes. Después, revisión visual acotada del candidato. FH-20 parcial; ocho tareas hechas/24 restantes. Objetivo activo, heartbeat horario pausado.
