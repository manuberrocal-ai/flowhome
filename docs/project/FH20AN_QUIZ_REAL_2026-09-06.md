# FH20AN — Quiz real con evidencia temporal

Resultado: el cuestionario usa una colección vigente al calcular resultados y al guardar productos. Las preferencias permanecen separadas de la evidencia. El cambio de evidencia recalcula tarjetas, filtros, avisos y razones sin ejecutar queueQuizCompletion, enfocar resultados ni desplazar la página. Los avisos de relaciones de cada producto se transmiten al renderizado y se escapan como texto.

El montaje sin opciones está desactivado: conserva una copia del catálogo y no pide datos. No existe un parámetro URL, almacenamiento o configuración pública para activarlo. La integración activa exige opciones explícitas y un servicio autorizado. El control de actualización usa el lote de hasta tres peticiones, sin sondeo ni reintentos automáticos. La suspensión retira evidencia; reanudar permite una actualización nueva, no restaura la anterior.

## Pruebas y artefactos

Tres pruebas nuevas: montaje desactivado/aislamiento; motor real conectado a los avisos de cambio ante actualización, caducidad, offline y destrucción, con respuestas congeladas; contrato del consumidor real para lecturas vigentes, foco y analítica. Suite completa: 881 aprobadas. Lint completo aprobado y lint dirigido adicional a los dos archivos de QA modificados después. Tipos finales: 341 archivos, cero errores/advertencias, 18 hints. Build normal: 88 páginas; diff-check aprobado.

quiz-live-review.mjs genera una copia temporal con entorno saneado, configuración de cuentas ausente y una transformación de revisión que habilita únicamente el montaje del quiz. Verifica que el archivo público permanece intacto. No instala el proveedor ni modifica dist; no es artefacto publicable. Salida utilizada: C:/Users/manub/AppData/Local/Temp/flowhome-quiz-live-review-1hA6Jj/output.

compatibility-browser-harness.mjs puede servir esa carpeta explícita en loopback; compatibility-quiz-check.txt verifica la página real con autorización simulada. Se aprobaron 26 controles a 390 y 1440 píxeles: ninguna solicitud automática, 28 identidades tras acción de teclado, condiciones visibles en tarjetas, respuestas URL intactas, retirada de campos y razones offline, foco conservado en Edit answers, sin desbordamiento global, reconexión sin restauración ni nuevas solicitudes, caducidad real de respuesta de 1,5 segundos y máximo cuatro tarjetas. Sin probar todas las combinaciones posibles del cuestionario.

Se inspeccionaron las cuatro capturas live/withdrawn. El detector visual señaló tres combinaciones de colores en líneas anteriores al cambio: una incluye text-blue-950 en hover y las otras mezclan clases de botones diferentes en una misma plantilla. No justifican cambiar la identidad del sitio. El auditor editorial del HTML señaló dos avatares decorativos ocultos con alt vacío; se verificaron las etiquetas. La consola registró favicon.svg no servido por el arnés y un QR diferido que falló durante offline; no se observaron excepciones del cuestionario. Se cerraron la sesión aislada flowhome-quiz-an y el proceso servidor 23880.

Verificación final de tipos: 7 septiembre 2026, 02:44 UTC. No se midió entrega real de analítica ni se afirmó autorización por pruebas verdes.

## Juzgado y siguientes pendientes

Evaluación propia 1–5, sin revisores independientes: producto 4 (respuestas y foco conservados, estados reales comprobados); técnica 4 (lecturas vigentes y consumidores coherentes); datos/editorial 3 (condiciones visibles, fuente/autorización simulada); operación 2 (sin endpoint autorizado ni activación pública).

La guía de interfaz priorizó conservar entradas y foco ante errores; la guía de verificación exigió comprobar la pantalla real además del motor; la auditoría editorial evitó convertir candidatos del detector en errores confirmados. La revisión visual fue acotada, sin rediseño.

Siguiente: integrar y retirar relaciones derivadas en perfiles de productos, sin confundir alternativas editoriales con sustitutos/complementos acreditados ni heredar permisos de la superficie product a alternatives. La ficha usa ambas superficies por separado; el endpoint debe conservar esa separación. Permanecen pendientes ocultación real, suspensión/bfcache, aprobación de fuentes, variantes, derechos, cuentas/CDN y activación. FH-20 parcial; ocho hechas/24 restantes. Objetivo activo, heartbeat pausado.
