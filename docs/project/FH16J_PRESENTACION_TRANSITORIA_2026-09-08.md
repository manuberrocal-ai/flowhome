# FH16J — presentación comercial transitoria

## Ficha y alcance

Problema: el cliente retiraba su memoria, pero aún faltaba un consumidor DOM que retirara todas las copias visibles del dato. Cambio mínimo: montaje explícito de espacios de precio, fuente y disponibilidad con el controlador compartido; permanece inerte sin enabled:true. No se registra endpoint ni se monta en páginas públicas. El enlace de compra y la explicación editorial quedan fuera de los espacios transitorios.

Aceptación: formato USD, copias coherentes, carga/reintento accesibles, retirada independiente de disponibilidad, caducidad del precio, offline, navegación de ida/vuelta y limpieza. El texto se asigna con textContent; no se generan precios históricos, descuentos ni ratings. La fecha de captura no se renueva al consultar.

## Implementación y evidencia

- `src/lib/blocks/block8/delivery-presentation.ts`: montaje con copia de referencias, sin consulta automática, bloqueo de acciones simultáneas y limpieza idempotente.
- `test/block8-delivery-presentation.test.mjs`: dos pruebas de desactivación predeterminada, repetición, retirada y limpieza. Son elementos/EventTarget controlados, no navegador.
- `scripts/qa/compatibility-browser-harness.mjs`: servidor exclusivamente loopback con respuesta comercial sintética señalizada. Se repone además el módulo transient-lifecycle requerido tras FH16I; faltaba en el servidor de pruebas. No modifica el proveedor público.
- `scripts/qa/commerce-presentation-check.txt`:14 comprobaciones correctas en navegador aislado,320/1440px, teclado, expiración automática de disponibilidad/precio, offline/online, navegación real y vuelta, denegación y cleanup.27 comprobaciones existentes de compatibilidad pasan sobre el harness corregido.
-1009/1009 pruebas generales; lint correcto; tipos440 archivos,0 errores/advertencias y18 hints. Build88 y SEO88 sin errores/advertencias. Impeccable no detectó hallazgos mecánicos en el nuevo módulo.

Se inspeccionó visualmente la captura320: texto íntegro y sin desbordamiento. Es una página de prueba sin la marca ni estilos de producción, no una aprobación visual del producto final. Capturas locales en `.playwright-cli/fh16j-commerce-320.png` y `fh16j-commerce-1440.png`. Los503 de consola corresponden a la denegación y revocación deliberadas, no a fallos inesperados de carga en la corrida final.

Dos intentos iniciales terminaron con cierre de la sesión CLI al ejecutar el probe con un listener de peticiones. Tras retirar ese observador, la ejecución terminó correctamente. No se atribuye una causa interna del CLI sin diagnóstico. El probe final verifica retirada visual; no acredita por conteo la ausencia de solicitudes. Esa ausencia tiene cobertura dirigida de cliente/montaje, no una medición de red de este probe.

Se cerraron exclusivamente la sesión de navegador y el servidor creados para este ensayo. No se tocaron la vista4339, cuentas, PR ni producción.

### Corrección del inventario anterior

El primer build utilizó el perfil local predeterminado, distinto al candidato. Repetido con PUBLIC_APP_ENV=production y cuenta/analítica false, quedan421 archivos pero no identidad total con FH13P: cambia el bundle del quiz y su referencia en quiz/index.html;419 entradas permanecen idénticas. El diff del bundle muestra el binding compartido introducido por FH16I. El quiz lo importa indirectamente aun con integración desactivada. Se corrige expresamente el informeFH16I: ausencia de activación no implica ausencia de bytes nuevos. El candidato histórico se conserva intacto y no se le asignan las pruebas actuales.

Smoke del quiz normal en4339,320/1440px: cuatro resultados, controles conectados ocultos, cero solicitudes a /compatibility/ observadas en Resource Timing y ningún desbordamiento. Sin errores de consola observados. No equivale a prueba del grafo activado. Build editorial88/SEO88 correctos; plan32 tareas/8 hechas coincidente y diff-check correcto con avisos preexistentes de conversión CRLF/LF.

## Juzgado propio y continuación

**APROBADO LOCAL**, valoración del mismo agente: producto2/5 integral B, técnica3/5 local, datos/editorial2/5 integral y operación2/5 integral. Impeccable orientó los estados de carga, indisponibilidad y recuperación, manteniendo el flujo de compra independiente. No hay revisores externos ni datos Amazon reales en esta evidencia.

FH-16 sigue parcial: falta conectar todos los espacios de las plantillas reales en un ensayo aislado, verificar visibilidad/freeze y restauración BFCache específica (la vuelta observada no demuestra uso de BFCache), lector confiable/cuotas, HTTP/CDN desplegado y permisos reales. No se promete retirada de copias externas o de memoria de cualquier navegador suspendido. Próximo paso: consumidor en plantilla real bajo harness, conservando la barrera estática y sin activación pública.
