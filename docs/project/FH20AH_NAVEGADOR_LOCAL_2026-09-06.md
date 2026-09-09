# FH20AH — Navegador real con HTTP local

Resultado: doce comprobaciones aprobadas en Edge 152 headless sobre Windows. El navegador ejecutó los tres módulos cliente reales, servidos por una página aislada en loopback. El servidor utilizó el contrato real con autorización documental simulada. No hubo mocks de fetch en esta prueba, cuentas conectadas ni activación pública.

## Evidencia y límites

Se observaron: condición cualificada y procedencia visibles; retirada de ambas al vencer el plazo de 1,5 segundos; evento offline del navegador y ausencia de restauración al volver online; respuesta 200 seguida de 503 al mismo cliente y retirada de su afirmación anterior; denegación inicial; localStorage, sessionStorage, IndexedDB, Cache Storage y registros de service worker vacíos; recarga en Unknown y cliente destruido que no vuelve a mostrar evidencia.

La prueba inspeccionó texto del DOM y produjo capturas revisadas visualmente: [vigente](FH20AH_VIGENTE.png) y [vencido](FH20AH_VENCIDO.png). Es una página técnica sin diseño de producción, marcada explícitamente como no aprobada para publicación.

**NO VERIFICADO:** ocultación real mediante cambio de pestaña. El navegador headless mantuvo visibilityState=visible al abrir otra pestaña, por lo que el ensayo no lo contó como éxito. Freeze, suspensión del sistema y restauración desde bfcache reales siguen pendientes; las simulaciones unitarias previas no los sustituyen. Tampoco prueba CDN, autorización real, derechos de imágenes, variante física ni las páginas públicas actuales.

## Reproducción y limpieza

Iniciar `node scripts/qa/compatibility-browser-harness.mjs`: muestra una URL de 127.0.0.1 con puerto libre. Abrir esa URL con una sesión nombrada de playwright-cli y ejecutar `run-code --filename=scripts/qa/compatibility-browser-check.txt`. El fichero es una expresión de función para la CLI, no un módulo de producción. Recarga la página al comenzar para reiniciar el ensayo de revocación. Cerrar únicamente esa sesión y terminar el servidor al acabar.

Sesión usada: flowhome-compat-ah. Puerto final: 65188. Se confirmó cierre de navegador y ausencia de escucha del puerto después de terminar el servidor. El cierre por interrupción devuelve código 1 en este entorno; no es un fallo del ensayo. No se borraron perfiles ni sesiones ajenas. Un primer intento encontró que URL no existe en el entorno run-code; se corrigió el predicado de espera, luego se repitió con éxito. Las respuestas 503 esperadas aparecen como errores de recurso de consola, no como excepciones de aplicación.

## Controles y juzgado

Suite completa, lint y diff-check aprobados; tipos: 332 archivos, cero errores/advertencias, 18 hints; build: 88 páginas. Verificado el 7 de septiembre de 2026 a las 02:02 UTC. La guía Playwright orientó sesión aislada, verificaciones de DOM/capturas y cierre explícito.

Evaluación propia 1–5: producto 3 (presentación de ensayo, no producción), técnica 4 (HTTP y navegador comprobados), datos/editorial 3 (autorización simulada), operación 2 (sin despliegue ni CDN). Siguiente: integrar presentación reutilizable sin habilitar datos no aprobados y cerrar cobertura de ocultación/suspensión en entorno apropiado. FH-20 parcial; ocho hechas/24 restantes.
