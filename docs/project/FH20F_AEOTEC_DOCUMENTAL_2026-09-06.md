# FH20F — Aeotec V3 US y pendiente de presentación

Resultado: candidato local de seis modelos, 19 relaciones y 76 registros por superficie. Aeotec GP-AEOHUBV3US añade Wi-Fi, Zigbee, Matter, Thread y rol SmartThings. No se activa el proveedor ni se publica contenido. FH-20 permanece parcial.

## Evidencia consultada

Consulta: 6 de septiembre de 2026, 23:28 UTC. Las fechas de modificación del proveedor no se confunden con la consulta ni con una prueba física.

- [Especificaciones regionales V3](https://aeotec.freshdesk.com/support/solutions/articles/6000240466-smart-home-hub-technical-specifications), modificadas el 8 de enero de 2026: familia y modelo US, banda Wi-Fi de 2,4 GHz/WPA2. La lista de estándares de radio no se interpreta como permiso para afirmar 5 GHz. No se transfieren especificaciones a Smart Home Hub 2.
- [Smart Home Hub](https://aeotec.com/products/aeotec-smartthings-hub/): función de router de borde Thread, no promesa de compatibilidad universal ni de funcionamiento totalmente sin nube.
- [Emparejamiento de dispositivos](https://aeotec.freshdesk.com/support/solutions/articles/6000240427-installing-removing-devices-smart-home-hub): flujos Zigbee y Matter, condicionados al accesorio y sus instrucciones. No se ejecutó emparejamiento real.
- [Configuración del hub](https://aeotec.freshdesk.com/support/solutions/articles/6000240326-how-to-setup-smart-home-hub): registro SmartThings con cuenta Samsung y conexión. No se ejecutaron cambios de cuenta, red, firmware ni migraciones. Las instrucciones históricas de diagnóstico no se convierten en acciones autorizadas.

## Implementación y validación

Módulo de datos Aeotec mediante el constructor compartido. Combinación de lotes simplificada sin duplicar destinos comunes. Identidad del vendedor, firmware instalado y autorización siguen sin atribuirse; plazo editorial de 30 días por lote.

- 20 pruebas documentales dirigidas aprobadas; tres nuevas para Aeotec.
- Suite completa: 786 pruebas aprobadas, salida cero.
- Lint aprobado; tipos: 284 archivos, cero errores/advertencias, 18 hints previos.
- Compilación: 88 páginas; diff-check aprobado.
- Los cinco campos se resuelven por las cuatro ubicaciones exactas; pruebas de región, vencimiento, disputa y modelo diferente. Thread y SmartThings no se heredan por los otros cinco productos. No se rellenan Alexa, Google, Apple ni Bluetooth a partir de nombres o logos.

## Pendiente detectado — siguiente prioridad local

El resolutor admite Thread y SmartThings, pero `FIELD_TO_FLAG` del adaptador público aún cubre siete campos y no transporta estos dos como señales propias. La ficha y el cuestionario tampoco ofrecen ambas filas; el cuestionario sigue declarando que no verifica SmartThings. Las 76 ubicaciones son propuestas de revisión, **no** prueba de que las 19 relaciones se muestren hoy.

Antes de activar este candidato hay que completar el recorrido de presentación, conservar la diferencia entre un hub/controlador y un accesorio y probar estados sin evidencia. Añadir radio o rol de hub no autoriza a recomendar que cualquier otro producto funcione con esa plataforma. Integración servidor y renderizado del candidato completo: NO VERIFICADOS. No se repitió una inspección visual porque no se cambió UI ni proveedor público.

## Juzgado interno

Producto 3/5: seis modelos, 22 pendientes y una brecha de presentación identificada. Técnica 4/5: datos aislados y pruebas de degradación; falta cerrar el consumidor de dos campos. Datos/editorial 3/5: modelo US y condiciones documentados, unidad no inspeccionada. Operación 2/5: revisión pendiente, dueño sin asignar y activación no aprobada. Evaluación de Codex, no revisores independientes.

La guía verified-task-brief orientó la separación entre radio, rol e integración comprobada. Ocho tareas generales hechas, 24 restantes, objetivo activo. Siguiente: cerrar la brecha de Thread/SmartThings en las superficies de revisión antes de seguir ampliando indiscriminadamente el catálogo.
