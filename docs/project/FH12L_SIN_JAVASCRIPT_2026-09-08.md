# FH12L — estados sin JavaScript

Corregidos tres estados: preferencias deja de mostrar una comprobación interminable; búsqueda explica su dependencia de JavaScript y enlaza catálogo; lista no afirma estar vacía sin leer el almacenamiento. Los estilos de noscript son inline para que Astro no los aplique a la experiencia con JavaScript.

Verificación: cuatro páginas auxiliares a 390 px con JavaScript desactivado, texto observado; doce escenarios con JavaScript a 390/1440, incluida preservación y reset explícito de lista dañada. Tres pruebas dirigidas de lifecycle/cart aprobadas; build88, SEO0/0, lint afectado y diff correctos. El script `scripts/qa/no-script-utilities.cjs` conserva comprobaciones para el mensaje y el falso vacío. No se afirma que las funciones interactivas operen sin JavaScript ni que una carga de script fallida con JavaScript habilitado esté cubierta.

Juzgado propio: producto8/10 (recuperación comprensible), técnica8/10 (ambos modos probados), datos/editorial8/10 (no inventa estado de almacenamiento), operación7/10 (local, sin publicación). No es una auditoría total de accesibilidad.

El build posterior cambia los archivos: inventario FH13C conserva su valor histórico, pero no representa este dist. Recalcular antes de preparar candidato. Siguen pendientes simplificación de avisos, revisión final del conjunto y pasos de producción autorizados.
