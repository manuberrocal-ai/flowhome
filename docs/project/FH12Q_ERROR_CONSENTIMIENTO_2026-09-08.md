# FH12Q — respuesta visible ante fallo de consentimiento

## Problema y decisión

La revisión de capturas FH13O llevó a examinar el aviso que ocupa espacio en el primer recorrido. No se eliminó: el consentimiento también controla eventos locales, aunque el transporte externo esté desactivado. Impeccable orientó la mejora hacia el estado de error, conservando identidad, contenido y acciones necesarias.

Fallo concreto: las ramas de aceptar, rechazar y revocar retornaban sin explicación si no podían persistir la preferencia. Cambio mínimo: mensaje accesible role=alert, inicialmente oculto, que explica que la elección no se guardó y la anterior permanece; sugiere revisar almacenamiento y reintentar. El aviso queda abierto y no se emite un evento de cambio exitoso. Al reintentar correctamente o reabrir, se limpia el error. No se modificó el significado del consentimiento ni se promete que una revocación fallida detuvo analítica previamente autorizada.

Superficies: ConsentBanner.astro, pruebas de consentimiento y un escenario del runner de navegador. Aceptación: error visible sin falsa confirmación; persistencia fallida conserva estado; recuperación limpia el mensaje; controles accesibles y sin desbordamiento en320px.

## Verificación

- Suite general977/977, lint y tipos correctos; build88 y SEO88 sin errores/advertencias.
- Nueve pruebas dirigidas: incluyen ejecutar el script del componente con almacenamiento fallido para aceptar/rechazar/revocar y reintento. No son sustituto de navegador.
- Navegador real aislado:31/31 escenarios y91/91HTTP;0 errores de preparación/limpieza. El caso nuevo provoca fallo de Storage.setItem, comprueba ausencia de evento exitoso, reintenta rechazo y vuelve a fallar aceptación conservando el rechazo previo. Restaura la implementación original de Storage en finally.
- Captura del error en320px inspeccionada: mensaje completo, botones y foco visibles, sin recorte horizontal. Informe y capturas en `C:/AGENTES/Informes/flowhome/fh12q-consent/`.
- Detector mecánico Impeccable sin hallazgos; diff-check y plan derivado verificados. Lint dirigido del runner repetido tras añadir el escenario. No se repite Lighthouse porque no se afirma cambio de rendimiento.

El build actual de la carpeta original incorpora este cambio; los checkouts históricos FH13M/N no se alteraron y sus inventarios siguen describiendo esos candidatos, no dist actual. No hubo push, actualización de PR, publicación ni activación de servicios. La evidencia973 y134 casos de FH13N/O conserva su alcance anterior.

## Juzgado propio

Producto3/5 local: el botón deja de fallar silenciosamente y explica una recuperación concreta; conversión no medida. Técnica3/5 local: persistencia y evento no se falsean, pruebas y navegador pasan. Datos/editorial3/5 local: conserva consentimiento explícito y mensajes honestos, sin cambiar afirmaciones comerciales. Operación2/5 integral: cambio sólo local pendiente de incorporarse a una fuente revisada; no demuestra revocación ni medición en servicios reales.
