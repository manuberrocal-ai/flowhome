# FH13F — navegador sobre candidato editorial

Se sirvió el artefacto FH13E por loopback4340, sin reemplazar dist ni el preview4339. Configuración de preview separada en `scripts/qa/editorial-preview.config.mjs`; la primera validación rechazó outDir URL, corregido a ruta string antes de arrancar. No hubo rebuild del candidato.

`scripts/qa/editorial-candidate-smoke.cjs`: contextos aislados a390/1440, movimiento reducido. Registro servido confirma configuración production y auth/analytics apagadas. Aceptación de consentimiento sólo en contexto de prueba; guardado de un producto, navegación a lista, persistencia tras recarga y eliminación por teclado correctos. Cuenta y preferencias muestran indisponibilidad real. Cero solicitudes observadas a Supabase, GTM o Clarity; cero errores JavaScript en esos flujos. No prueba ausencia universal de solicitudes ni todos los estados.

Inventario FH13E cotejado de nuevo tras pruebas, sin cambios: 421 archivos, publishable:false. Lint de configuración correcto. Sesión de navegador y servidor4340 de prueba cerrados; preview del usuario no alterado.

Juzgado propio: producto8/10 (recorrido principal probado), técnica8/10 (prueba del artefacto correcto, no sólo de la fuente), datos/editorial8/10 (servicios inactivos no fingidos), operación7/10 (candidato probado localmente, sin release autorizado).

Se completa el smoke local pendiente de FH13E, no toda la entrega. Restan revisión/versionado de fuente, manifiesto protegido, destino y rollback concretos, aprobación de publicación y comprobación online. El objetivo integral conserva trabajos independientes locales; no se solicita ni presume permiso amplio para desplegar.
