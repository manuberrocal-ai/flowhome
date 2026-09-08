# FH04D — Cobertura por impacto conservadora
Fecha: 2026-09-06. APROBADO LOCAL. FH-04 parcial por verificación de operación y protecciones remotas.

## Implementación
runDaily calcula una verificationKey de la revisión completa, configuración pública y versión de Node. La cobertura completa es obligatoria si esos datos cambiaron o falta evidencia válida. Sólo permite el perfil diario reducido cuando encuentra una ejecución completa de los mismos datos con todos los controles centrales y navegador aprobados, y las huellas de sus informes/capturas intactas.
Busca entre los siete directorios de fecha más recientes, sin fechas futuras ni directorios simbólicos. Evidencia incompleta, corrupta o de otra versión no reduce cobertura. Weekly conserva matriz completa y Lighthouse; el modo diario ampliado NO activa Lighthouse.
La elección y su motivo quedan en manifest.json y visual.json. Todos los controles centrales permanecen obligatorios en una ejecución nueva. El mismo día idéntico reutiliza la ejecución completa; otro día sigue compilando para evaluar contenido dependiente del tiempo.
Alcance intencional: clasificación global conservadora, no grafo fino por archivo. Un cambio desconocido amplía cobertura, no la reduce.

## Evidencia
- 21 pruebas dirigidas aprobadas, incluyendo cambios de fuente, flags, evidencia alterada, baseline incompleto, nuevo día y weekly. Los tests de cambio de fecha usan fixtures, no prueban un día futuro de producción.
- Pasada integrada real local dry-run: ocho controles aprobados; 735/735 pruebas, lint, tipos, calidad editorial, enlaces, build, SEO y navegador.
- Matriz elegida full por changed_or_unverified_source_or_environment: 134/134 casos, cero fallos/errores de preparación/limpieza. SEO: 88 páginas, cero errores/advertencias.
- Primera ejecución complete; segunda reused con huella 1105949224b0ec3c26545ab65d8837281ec8779d29c28d5c3aeb60184921ff51. No segundo build. Bloqueo liberado.
- diff-check aprobado. Sin edición de código durante la pasada, sin Amazon ni Lighthouse, sin despliegue ni activación remota.
- Evidencia: C:/Users/manub/Documents/Codex/2026-09-04/f/work/FH04D_DAILY/2026-09-06/ (manifest.json, tests.json, visual.json, seo-audit/report.json, screenshots/report.json).
- Auxiliar con Node instalado: C:/Users/manub/Documents/Codex/2026-09-04/f/work/fh04d-dry-run.mjs.

## Juzgado del mismo agente
Escala 1–5 sobre el cambio, sin revisores independientes:
- Producto 4/5: cobertura amplia en cambios y menor coste sólo con evidencia vigente.
- Técnica 4/5: invalidación explícita y fallback completo; selección global, no optimización fina por dependencias.
- Datos 4/5: conserva versión, motivo e integridad de evidencia; no afirma rendimiento de campo.
- Operación 3/5: ejecución y reutilización locales probadas; protecciones/ejecución remotas sin verificar por HTTP 401 de la conexión autenticada.

## Siguiente: FH-23
Mientras corría QA se obtuvo un inventario público, sin modificar nada:
- npm audit completo (incluye desarrollo): cero vulnerabilidades reportadas. Lockfile SHA256 A537201C586DAADC198D0989C3C75066E05A7388EFD8ABC9595BA14816FD1BF6.
- fast-uri instalado 3.1.7, bajo ajv de la cadena @astrojs/check.
- [Siete PRs públicas abiertas](https://github.com/manuberrocal-ai/flowhome/pulls), #5–#11. API pública permitió leer sus cambios aunque la sesión autenticada devuelve 401. No se aprobó ni fusionó ninguna.
- Captura del inventario y parches relevantes: C:/Users/manub/Documents/Codex/2026-09-04/f/work/FH23_INVENTARIO_2026-09-06.json. Los grandes parches de lockfile de #8/#9 se omitieron; aún falta revisar compatibilidad y conciliar propuestas con la rama local.
Siguiente acción: completar esa revisión, no repetir npm audit sin cambio relevante. Siete hechas/25 restantes. Objetivo ACTIVO, heartbeat PAUSADO.

