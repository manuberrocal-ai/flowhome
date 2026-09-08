# FH20E — Aqara M2 y P1, funciones y requisitos documentados

Resultado local: candidato de cinco modelos, 14 relaciones y 56 registros por superficie. Se incorporaron M2 y P1 sin activar el proveedor público. FH-20 sigue parcial; no hay certificación de unidades físicas ni publicación.

## Fuentes y alcance

Consultadas el 6 de septiembre de 2026, 23:22 UTC:

- [Aqara Hub M2 US](https://www.aqara.com/us/product/hub-m2/): Wi-Fi, Zigbee para accesorios Aqara y límites de Apple Home. La capacidad anunciada requiere repetidores; el controlador infrarrojo no se expone en Apple Home. No se infiere emparejamiento universal a partir de radios o asistentes enumerados.
- [Anuncio de firmware M2](https://www.aqara.com/en/aqara-hub-m2-matter-update-has-started-to-roll-out/): se conserva explícitamente su alcance histórico 4.0.0 Beta. Describe un puente hacia un controlador Matter externo, no una conversión a Thread ni prueba del firmware instalado hoy.
- [Motion Sensor P1 US](https://us.aqara.com/products/motion-sensor-p1): Zigbee 3.0 con hub Aqara compatible y Matter mediante hub compatible. Las condiciones de red del hub no son Wi-Fi en el sensor. No se certifican todas las funciones expuestas por cada plataforma.

La apertura de la página separada de especificaciones M2 falló; no se trató como evidencia leída. Las fuentes accesibles anteriores sustentan las seis relaciones añadidas. No se usan reseñas de clientes, foros ni contenido de otros productos que aparece en la navegación como especificación del modelo.

## Proceso y verificación

Se extrajo un constructor compartido de candidatos documentales para que Aqara y SwitchBot usen el mismo formato de revisión pendiente, cuatro ubicaciones, copias independientes de metadatos y plazo editorial de 30 días. No decide si una fuente es cierta ni aprueba publicación. Tapo conserva su lote y fecha original. Se mantiene la fecha de revisión más temprana del conjunto y se registra la consulta más reciente.

- 17 pruebas documentales dirigidas aprobadas, cuatro nuevas para Aqara y el constructor compartido.
- Suite completa: 783 pruebas aprobadas, salida cero.
- Lint aprobado; tipos: 282 archivos, cero errores/advertencias, 18 hints previos.
- Build: 88 páginas. Diff-check aprobado.
- Pruebas de ámbito US, caducidad, disputa por ubicación, aislamiento entre modelos, identidad P1/P2, preservación de condiciones y metadatos sin aprobación ni ASIN inventado.
- No se modificó UI ni se activó el candidato; no se repitió inspección visual. Renderizado integral con proveedor aprobado, firmware de unidades y funciones realmente expuestas: NO VERIFICADOS.

## Juzgado interno

Producto 3/5: cinco modelos con funciones acotadas; faltan 23. Técnica 4/5: menos duplicación, pruebas de aislamiento y regresiones aprobadas. Datos/editorial 3/5: condiciones y fuentes primarias, anuncio histórico identificado como tal; variantes sin verificar. Operación 2/5: candidato revisable, sin responsable ni activación aprobada. Valoración de Codex, no revisores independientes.

La guía verified-task-brief exigió separar la evidencia documental de lo instalado o publicado. Ocho tareas generales hechas y 24 restantes; objetivo activo. Siguiente: ampliar cobertura sin inferencias y verificar el recorrido integral de revisión. Los pendientes externos de imágenes, cuentas y entrega A no se consideran resueltos por este avance.
