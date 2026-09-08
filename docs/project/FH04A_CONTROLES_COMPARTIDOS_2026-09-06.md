# FH04A — Controles CI compartidos
Fecha: 2026-09-06. APROBADO LOCAL; FH-04 parcial. No se ejecutó un workflow remoto ni se modificaron controles de rama.

## Cambio y alcance
Manual Quality Verification y Quality Check (job quality) consumen .github/actions/quality/action.yml. Se preservan nombre y eventos del control de PR, permisos contents: read, instalación bloqueada con npm ci, configuración local sin autenticación/analítica y fallos que detienen la secuencia.
La acción conserva los nueve pasos del control de PR: auditoría de dependencias de producción, diff-check, pruebas, lint, tipos, calidad editorial estructural, enlaces comerciales, build y SEO inmediatamente después. El manual gana los controles editorial/enlaces que le faltaban. Ambos conservan un solo build. Los informes editorial, enlaces y SEO usan runner.temp; no reescriben data/quality-report.json.
Se mantienen setup/checkout por llamador y no se cambian versiones de Actions en este ciclo. No se toca el despliegue protegido ni el runner diario.
Decisión respaldada por documentación oficial de [acciones compuestas locales de GitHub](https://docs.github.com/en/actions/tutorials/create-actions/create-a-composite-action): permite reutilizar pasos manteniendo el job existente, en lugar de cambiar su identidad por otro workflow.

## Pruebas
- YAML parseado con la dependencia existente; dos pruebas nuevas comprueban nueve pasos exactos y ordenados, ausencia de condicionales/continue-on-error, shell explícito, un único consumo, eventos y nombre del job.
- Contratos anteriores resuelven los pasos reales de la acción antes de comprobar orden. El primer intento detectó un formato de expansión sin sangría en el auxiliar de pruebas; corregido, sin retirar controles.
- Suite final 728/728, cero omitidas; lint y diff-check aprobados.
- Tipos: 259 archivos, cero errores/advertencias, 18 hints existentes.
- Auditoría npm --omit=dev --audit-level=moderate: cero vulnerabilidades reportadas en esta ejecución; no cubre dependencias de desarrollo ni equivale a una auditoría completa de seguridad.
- Calidad estructural de 15 reseñas: todas 7/7. No prueba veracidad editorial, ya revisada separadamente en FH08.
- Enlaces comerciales: control aprobado, cero stale y cinco unknown; unknown no significa oferta verificada.
- Build 18:24:15: 88 páginas. SEO posterior: 88 páginas, cero errores/advertencias; reporte C:/Users/manub/AppData/Local/Temp/flowhome-seo-audit-DBe1t1/report.json.
- Se ejecutaron los comandos locales, no el motor GitHub Actions. No se reinstalaron dependencias ni se repitió QA visual porque no cambió la interfaz.

## Juzgado del mismo agente
Escala 1–5 sobre este cambio, no revisores independientes:
- Producto 4/5: misma exigencia en revisión manual y PR; sin cambio al sitio público.
- Técnica 4/5: duplicación de validaciones eliminada entre dos consumidores, contrato fail-closed; ejecución remota pendiente.
- Datos/editorial 4/5: reportes fuera del código, unknown conservado; auditorías estructurales no certifican hechos.
- Operación 3/5: nombre de control preservado localmente; reglas remotas, pines, reutilización diaria y QA por impacto aún no cerrados.

## Siguiente
FH-04 parcial. Verificar/fijar Actions por SHA, compatibilidad y controles de rama en lectura; después integrar reutilización con runner diario y QA por impacto sin omitir gates necesarios. No activar horarios ni publicación.
FH-12 conserva evidencia de teclado/siete tamaños, pero producción/campo siguen pendientes. FH-09 conserva permisos/imágenes/medición pendientes. Siete hechas/25 restantes. Objetivo ACTIVO, heartbeat PAUSADO.
