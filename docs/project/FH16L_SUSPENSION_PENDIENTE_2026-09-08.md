# FH16L — prueba nativa de suspensión no concluyente

## Ficha

Pendiente seleccionado: demostrar retirada del DOM de la ficha ante freeze/resume originados por el navegador, no mediante dispatchEvent. Se preparó scripts/qa/commerce-freeze-check.txt contra el harness loopback existente. No se modificó código de aplicación, build, datos ni configuración pública.

El probe monta el consumidor real con respuesta sintética, observa event.isTrusted y el texto de ambos paneles, intenta congelar mediante Page.setWebLifecycleState y sólo admite recuperación tras consulta explícita. El método experimental permite estados frozen/active según la [documentación oficial del protocolo](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-setWebLifecycleState), consultada2026-09-08; aceptar la orden no demuestra haber alcanzado la transición.

## Resultado: NO VERIFICADO

Primer intento: las órdenes consecutivas devolvieron sin eventos; el DOM seguía con precio y una petición registrada. Segundo intento: se esperó una señal de consola emitida exclusivamente por el listener freeze, con límite5 segundos; no llegó. El probe falló, no se relajaron sus aserciones. No hay evidencia suficiente para atribuirlo a un defecto de retirada del cliente: el evento requerido no fue observado.

El probe queda como diagnóstico pendiente y no está incorporado a npm test ni marcado como gate aprobado. Lectura final: Chrome152.0.7977.76, visibilityState visible, eventos vacíos. Antes de repetir, establecer un entorno que realmente transicione a suspensión y confirmar sus precondiciones; no repetir las mismas órdenes sin evidencia nueva. Visibilidad y BFCache específico tampoco quedan acreditados. La suite y navegador de FH16K mantienen su alcance anterior, no se reejecutaron sin cambios de aplicación. Se cerraron la sesión propia y el servidor de ensayo. Plan32/8 y diff-check correctos.

## Correo recibido durante el ciclo

El propietario aportó un correo con17 anotaciones CodeQL de PR12. Se contrastaron con la revisión individual previa en C:/AGENTES/Informes/flowhome/REVISION_CODEQL_PR12.md. Los ocho archivos afectados coinciden con5cc6c95 ignorando CRLF; PR12 permanece abierta/en borrador con ese SHA. Se resolvió SECURITY.md para cada archivo y se revisaron consumidores estáticos: se conserva el dictamen previo de no accionables como las vulnerabilidades alegadas en esos usos, no certificación general de seguridad. No se descartó ninguna alerta remota ni se modificó código durante el triaje. El correo carece de cabeceras autenticadas y IDs completos; su nombre de remitente no se usó como prueba de identidad. No es una aprobación de actualizar o fusionar la PR.

## Juzgado propio

**REQUIERE CORRECCIÓN** del entorno/probe de suspensión nativa antes de usarlo como evidencia. Producto2/5 integral, técnica3/5 local por la evidencia FH16K (no por este probe fallido), datos/editorial2/5, operación2/5. Valoración del mismo agente. No cambia el estado parcial de FH-16 ni bloquea todo el proyecto. Siguiente trabajo independiente: catálogos/comparación con identidad y retirada coherentes; dejar suspensión específica pendiente de un entorno que emita los eventos reales.
