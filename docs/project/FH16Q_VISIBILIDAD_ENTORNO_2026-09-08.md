# FH16Q — diagnóstico de visibilidad del entorno de ensayo

## Resultado: NO VERIFICADO

Se preparó scripts/qa/commerce-visibility-check.txt para comprobar la ficha real con dos paneles comerciales: carga explícita, ocultación nativa, retorno visible sin restauración ni peticiones automáticas y recuperación explícita. No usa dispatchEvent ni modifica visibilityState. Exige eventos isTrusted y retirada efectiva del texto.

El cambio de pestaña en la sesión aislada fh16q no produjo hidden en cinco segundos. Desactivar la emulación de foco de ese target tampoco lo produjo. Lectura posterior: Chrome152.0.7977.76, visibilityState=visible, visibilityEvidence=[]. El cleanup vació los paneles: ese vacío posterior NO prueba retirada por visibilidad.

Se comprobó una segunda precondición distinta mediante la ventana virtual del propio target: Browser.getWindowBounds confirmó windowState=minimized después de minimizarla, pero el documento seguía visible y sin eventos. Se restauró a normal. No se manipuló ninguna ventana o sesión del usuario, ni se repitió freeze/resume.

La evidencia demuestra que estos mecanismos no inducen la transición requerida en el entorno observado; no demuestra un defecto del controlador ni permite aprobar el recorrido. No repetir las mismas órdenes ni rebajar el requisito de evento real. Requiere un entorno que efectivamente emita hidden/visible, por ejemplo una sesión interactiva apropiada de ensayo. BFCache y freeze/resume siguen separados y pendientes.

## Referencias y alcance

La documentación oficial consultada distingue [simulación de foco/actividad](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setFocusEmulationEnabled) de [estado de ventana](https://chromedevtools.github.io/devtools-protocol/tot/Browser/#method-setWindowBounds). Ninguno de esos contratos permite inferir por sí solo un evento visibilitychange; por eso se comprobó el estado del documento y no sólo la aceptación del comando.

Sólo se añadió el probe y este registro; no cambió aplicación, build, datos ni configuración de servicios. No se repitieron las1016 pruebas o el build sin cambios que lo justificaran. FH16P conserva su evidencia de comparación coordinada y las limitaciones de su propio entorno. El probe es diagnóstico, no gate aprobado de npm test.

## Juzgado y continuación

REQUIERE ENTORNO DE PRUEBA ADECUADO para visibilidad nativa. Producto2/5 B integral, técnica3/5 local por los cambios previamente probados, datos/editorial2/5 y operación2/5. Un único agente. No sube la madurez por añadir un ensayo inconcluso ni bloquea todo el proyecto.

Siguiente pendiente independiente: preparar el lector autorizado y su frontera de confianza/cuotas, sin nuevas búsquedas de credenciales agotadas ni activar endpoints públicos. A sigue pendiente de revisión/autorización de su conjunto exacto y publicación. No se actualizó la PR ni se desplegó.
