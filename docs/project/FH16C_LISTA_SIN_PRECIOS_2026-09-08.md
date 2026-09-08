# FH16C — lista sin precios heredados

Se elimina price del normalizador de elementos y el subtotal exportado sin consumidores. La lista deja de tratar un importe histórico como dato durable válido. Conserva identidad, nombre, imagen y enlace; no modifica la entrada del llamador. La migración/reparación existente puede reescribir el registro válido sin ese campo al cargarlo. No promete purgar copias externas o backups. Datos corruptos siguen sujetos a recuperación explícita.

Verificación: 23 pruebas dirigidas de lista/sync/proyección aprobadas; 958 generales, 0 fallos; build88 y lint afectado correctos. Navegador aislado a390: lista v1 sintética con price123.45, producto Echo conservado, registro migrado sin price y eliminación por teclado correcta. No se leyó ni modificó la lista real del usuario. Script: `scripts/qa/legacy-list-price.cjs`.

Criterios aplicados con verified-task-brief: no retener precio en salida normalizada/escritura nueva, no perder identidad/enlace, no mutar entrada; pruebas observadas. No prueba eliminación de todas las copias históricas ni operación remota. No se conectó API, desplegó base o activó cuenta.

Juzgado propio: producto8/10 (lista conserva utilidad), técnica8/10 (contrato y regresión probados), datos/editorial8/10 (menos retención comercial heredada), operación7/10 (transporte/permiso real todavía pendientes). FH-16 parcial: endpoint efímero, permisos/cuotas y cliente conectado siguen pendientes; no usar esta corrección como cierre de B.

Dist local reconstruido: FH13D histórico. Candidato FH13E permanece intacto, pero no incorpora esta mejora; reconstruir candidato antes de proponer release. Objetivo integral activo.
