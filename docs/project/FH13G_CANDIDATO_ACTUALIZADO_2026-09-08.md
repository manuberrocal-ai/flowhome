# FH13G — candidato editorial actualizado y comprobado

El candidato local vigente es `artifacts/editorial-review-20260908-fh13g`. Incluye FH16C: la lista conserva la identidad de los productos y deja de almacenar precios heredados. FH13E permanece intacto como antecedente; no representa este cambio. No se reemplazó `dist` ni se publicó el sitio.

[Inventario verificable](FH13G_CANDIDATO_EDITORIAL_2026-09-08.json): 421 archivos, 136.717.720 B, huella `b49cea4e68d173fe0782ed2a8f1c47b4621b4f18a8fa31f83ec176170e08e21e`. Configuración production, cuentas/analítica desactivadas, Supabase null. `publishable:false`, `sourceSha:null`: es evidencia local, no manifiesto de publicación ni prueba de reproducibilidad desde un commit limpio.

## Verificación de este ciclo

- Build aislado de 88 páginas y SEO sobre esa carpeta: 0 errores/0 advertencias.
- Navegador en contextos nuevos de 390 y 1440 px: guardar, recargar, quitar con teclado; migrar una lista ficticia con precio 123.45 conservando ASIN y sin retener precio; cuenta/preferencias desactivadas. Cero errores JS y solicitudes a Supabase/GTM/Clarity en esos flujos. No se tocó el almacenamiento del usuario.
- 960 pruebas generales correctas antes del ajuste de alcance de tipos. Después, tres pruebas dirigidas de herramientas correctas. La prueba nueva inicialmente falló por el BOM del archivo JSON; su lector ahora lo tolera. No se afirma una segunda ejecución completa posterior.
- Diff-check y lint general correctos; después del ajuste, lint afectado correcto. Tipos: 417 archivos, 0 errores/0 advertencias, 18 hints.
- Inventario cotejado después del navegador. Se cerraron sólo la sesión de prueba y el servidor temporal de puerto 4340; no la vista del usuario en 4339.

## Mejora del proceso

`tsconfig.json` excluye dependencias y salidas `dist`/`artifacts`, manteniendo el modo estricto, JavaScript y la inclusión heredada del código fuente. La comprobación anterior incluía los paquetes compilados históricos: 477 archivos y 80 hints. Esta corrección evita revisar copias minificadas como si fueran fuente; no elimina esos paquetes ni oculta errores del código fuente. Configuración de preview y smoke apuntan al candidato actualizado; la prueba del precio heredado queda incorporada al smoke para futuros candidatos.

## Pendientes y juzgado propio

Producto 7/10: candidato coherente, sin evidencia nueva de captación real. Técnica 8/10: pruebas locales y paquete cotejado; no validación de producción. Datos/editorial 8/10: precios antiguos retirados y servicios inactivos; ilustraciones específicas siguen rotuladas, no son fotos oficiales. Operación 7/10: candidato actualizado; falta fuente final revisada, manifiesto protegido, destino, rollback y aprobación concreta de publicación. FH-13 continúa pendiente de aprobación, no cerrado.

FH-17 sigue parcial: intención editorial no equivale a una decisión autenticada y persistida. En este ciclo Docker no pudo conectarse a su motor local; no se ejecutó SQL ni se inventó una prueba de concurrencia. Esta dependencia no bloquea el desarrollo editorial independiente.
