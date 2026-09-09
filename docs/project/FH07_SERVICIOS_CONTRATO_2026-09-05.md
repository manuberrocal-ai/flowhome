# FH-07F — no inferir planes de servicio desde un booleano

Fecha: 5 septiembre de 2026. Continúa el lote de confort FH07E aprobado.

- Hallazgo reproducible: `getProductFeatures` convierte `subscriptionRequired: false` en «Subscription required: No» para cámaras/timbres. La ficha lo repite en chips y especificaciones, aunque sus límites dicen que no se infieren requisitos. Un único booleano no distingue uso básico, grabación, almacenamiento o avisos.
- Cambio mínimo: retirar esa fila afirmativa de la matriz compartida y mostrar en cámaras/timbres un aviso explícito de requisitos no verificados por función. Conservar notas documentadas de instalación y sus fuentes; no extrapolarlas a todos los planes vigentes.
- Alcance: helper, ficha y pruebas. No modificar catálogo, schema, identidad, precios, algoritmo del quiz, grafo verificado ni cuentas. Compatibilidad y otros campos requieren su propio bloque posterior.
- Aceptación: valores true/false/ausente/malformado no producen «suscripción sí/no» ni highlight; inventario confirmado de cinco fichas afectadas (cuatro cámaras y un timbre), aviso visible en dos tamaños; no sustituir datos por un precio de plan inventado. Intro de especificaciones diferencia registro de verificación.
- Validación: pruebas nuevas en rojo/verde, consumidores existentes, suite/lint/tipos/build/SEO por cambio compartido; navegador de cámara/timbre en 1440/390, revisión agrupada y texto. Los 28 YAML deben conservar sus hashes FH07E.
- Juzgado: cuatro perspectivas del mismo revisor, lote 3/5 como máximo; FH-07 integral parcial. No publicación.
