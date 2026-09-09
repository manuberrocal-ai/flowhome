# FH04C — Validación diaria coherente y reutilización comprobada
Fecha: 2026-09-06. APROBADO LOCAL en modo dry-run; FH-04 permanece parcial.

## Cambios
El runner diario ahora incluye los mismos controles centrales que CI: pruebas, lint, tipos, calidad estructural editorial, enlaces comerciales, build y SEO; añade QA de navegador. scripts/qa/quality-plan.mjs centraliza el plan diario y una regresión verifica su igualdad con la acción CI. El audit de dependencias y diff-check específicos de CI permanecen separados.
Si falla o falta un requisito previo, no se compila: build queda not_run/prerequisite_failed y sus auditorías dependientes not_run/build_failed. Los controles diagnósticos independientes siguen ejecutándose; el resultado permanece needs_attention. No se simula una aprobación.
La configuración env entregada a runDaily pasa a checkRunner y a los procesos; antes el runner usaba process.env aunque la huella se calculaba con otro env.
Los informes editorial-quality.json y commercial-links.json se guardan en el directorio de ejecución y se incluyen en las huellas de evidencia; su modificación o ausencia invalida la reutilización. No se escribe data/quality-report.json.
Se conserva el cache existente de ejecución completa idéntica dentro del mismo día. No se implementó cache entre días ni se omiten comprobaciones según supuestos de impacto.

## Pruebas
18 pruebas dirigidas aprobadas; cubren fallo/ausencia de requisitos, configuración, paridad CI, fuente cambiada, evidencia corrupta y ausencia de llamadas al proveedor en dry-run.
Pasada integrada real con el Node instalado y npm-cli existente:
- test: 733/733, cero fallos.
- lint, typecheck, quality:check, links:check, build y seo:audit: exit 0, sin timeout.
- QA navegador diario: 30/30, cero fallos, cero errores de preparación/limpieza. No es la matriz semanal completa.
- SEO: 88 páginas, cero errores y cero advertencias.
- Primera ejecución complete, providerStatus dry_run. Segunda reused con la misma huella 4e23e4ebd1df43946c1ce113c45bbac073c3704fe32bda0aa1d5425d289bbe87. La segunda retorna antes de invocar las validaciones, por lo que no repite el build.
- El bloqueo de la pasada verificada fue liberado. No se ejecutó Lighthouse ni Amazon ni se activó el horario remoto.
- diff-check aprobado durante el ciclo; control final al guardar documentos.

Evidencia: C:/Users/manub/Documents/Codex/2026-09-04/f/work/FH04C_DAILY/2026-09-06/{manifest.json,tests.json,summary.md,editorial-quality.json,commercial-links.json,seo-audit/report.json,screenshots/report.json}.
Auxiliar: C:/Users/manub/Documents/Codex/2026-09-04/f/work/fh04c-dry-run.mjs. Ejecutar con node instalado y npm_execpath apuntando al npm-cli instalado; no usar npm exec para seleccionar Node.

## Incidencia del lanzador
El primer intento con npm exec --offline intentó resolver node@26.7.0 y llegó a iniciar un proceso que fue interrumpido. Esa pasada no cuenta como evidencia. Se verificó que el PID 23188 y sus hijos directos ya no existían; su bloqueo exacto se movió de forma recuperable a FH04C_DAILY/.interrupted-lock-23188.json. No se borraron carpetas ni caches. La repetición correcta usó C:/Program Files/nodejs/node.exe y su npm-cli. No se afirma que el primer intento no haya poblado el cache de npm.

## Juzgado del mismo agente
Valoraciones 1–5 del cambio, no revisión independiente:
- Producto 4/5: evita gasto de compilación tras fallos y mantiene diagnóstico.
- Técnica 4/5: configuración y evidencia consistentes, requisito previo explícito, pruebas e integración; selección por impacto aún pendiente.
- Datos/editorial 4/5: reportes propios protegidos por huella y fuera del contenido; resultados estructurales no prueban veracidad ni ofertas.
- Operación 3/5: pasada local completa y reutilizada; runner remoto/protecciones requieren acceso válido. Incidencia del lanzador documentada.

## Continuidad
Siguiente FH-04: QA por impacto con cobertura explícita de superficies afectadas y fallback completo para cambios desconocidos, sin relajar controles centrales. Acceso GitHub devuelve 401 en FH04B; no repetir búsquedas de credenciales ni consultas idénticas sin cambio de acceso.
FH-09 mantiene permisos/imágenes/medición pendientes; FH-12 conserva pruebas locales y pendientes de producción/campo. Siete tareas hechas/25 restantes. Objetivo ACTIVO, heartbeat PAUSADO. Ningún push, deploy ni cambio remoto.

