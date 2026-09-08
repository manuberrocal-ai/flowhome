# FH20AQ — Relaciones en la ficha real

Resultado: la ficha contiene una sección separada de relaciones documentadas, oculta por defecto. relations-presentation.ts tiene un montaje explícito y no se importa/activa desde scripts públicos. La sección no convierte las alternativas editoriales existentes en relaciones acreditadas.

El montaje solicita exclusivamente alternatives para la identidad de la ficha y US. No utiliza la respuesta de campos product ni cambia esos campos. Lee una única respuesta v2 vigente para todas las listas y avisos; al caducar, desconectarse o destruirse elimina enlaces, condiciones, fuentes y avisos. Volver a estar conectado no recupera datos ni inicia solicitudes. Construir el montaje tampoco solicita datos.

La lista pública de identidades solo contiene slug/nombre de productos activos, sin precios ni campos de autorización. Se valida antes de usarla. Los productos conocidos obtienen un enlace local construido desde su slug validado. Hardware y productos ausentes se muestran como referencias de texto sin enlaces inventados. Condiciones y procedencia usan textContent; no se ejecuta HTML incluido en una afirmación. Se distinguen sustitución limitada al caso de uso y complemento sin garantía de compatibilidad.

## Evidencia

Se amplió la prueba existente de montaje desactivado; el total permanece 891 pruebas completas, todas aprobadas. Lint completo y dirigido aprobado. Tipos finales: 343 archivos, cero errores/advertencias, 18 hints. El primer control de tipos detectó que la función diferida no conservaba el estrechamiento del slug; se corrigió capturando el contexto ya validado. Build de 88 páginas aprobado antes de esa corrección local de captura; no cambió la plantilla ni la salida visual. Diff-check aprobado.

26 controles de navegador Edge headless en 390 y 1440 píxeles sobre la ficha real Echo Dot: sección inicialmente oculta; montaje sin petición; actualización con teclado en alternatives; solo un producto conocido enlazado; hardware y destino desconocido como texto; condición con etiqueta img literal sin elemento ejecutado; fuentes visibles; campos product intactos; ausencia de desbordamiento global; retirada completa offline; reconexión sin petición/restauración; caducidad real tras 1,5 segundos; destrucción deshabilita botón.

Las tres relaciones visibles en esas pruebas son sondas SINTÉTICAS marcadas TEST ONLY en el arnés, no afirmaciones sobre productos reales. El servidor previo y el parser v2 son reales, pero el arnés sustituye intencionalmente las relaciones del cuerpo solo en rutas de QA. La selección de evidencia real y contradicciones se probaron en FH20AP; esta prueba evalúa DOM, no acredita esas relaciones.

Cuatro capturas inspeccionadas. El detector visual no halló candidatos. El auditor editorial marcó dos imágenes: se verificó que son avatares decorativos ocultos con alt vacío. Consola: imagen remota bloqueada deliberadamente, favicon no servido por arnés y QR diferido fallando offline; sin excepción de la presentación. Se cerró la sesión flowhome-relations-aq y el proceso servidor 55212.

## Juzgado y continuidad

Evaluación propia 1–5, sin revisores independientes: producto 4 (estados y separación editorial visibles); técnica 4 (contextos distintos y caducidad completa); datos/editorial 3 (condiciones visibles, evidencia y autorización simuladas); operación 2 (sin endpoint autorizado ni activación). La guía de interfaz conservó diseño y trató explícitamente destinos desconocidos; la auditoría editorial separó candidatos automáticos de errores confirmados.

Próximo control necesario: comprobar cómo se aplica un vínculo con scope de variante, generación, hardware o firmware a una consulta que solo identifica el producto. isValidCompatibilityScope verifica estructura y tipos de referencias; eso no demuestra por sí solo que el visitante tenga ese contexto. La respuesta pública muestra el texto claim, no los identificadores internos de scope. Evitar promover una afirmación restringida como general y verificar los consumidores reales antes de activar.

Siguen pendientes contexto/variante física, fuentes aprobadas, ocultación real, suspensión/bfcache, derechos, cuentas/CDN y activación. FH-20 parcial; ocho hechas/24 restantes. Objetivo activo, heartbeat pausado. Nada publicado, desplegado ni cambiado en cuentas externas.
