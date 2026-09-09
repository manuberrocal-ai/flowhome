# FH-01 — base reconciliada y verificada

Fecha: 5 de septiembre de 2026. **APROBADO LOCAL — madurez 3/5.** Un único revisor desde cuatro perspectivas; no es una aprobación de publicación.

## Resultado

Se integró el `main` remoto en la rama local `improve/flowhome-v3-2026-09-04`, sin conflictos, mediante el commit de merge `116e04df648d97cae9d4aae03f190e81109937ab`. Sus padres son `17a4ec14dcfcbb537df452273335a44c8881da59` y `d038534f3341cc4546e2fc8b66eb19cafdbac771`.

El merge contiene exclusivamente los ocho archivos de gobierno que faltaban. Las correcciones V3 permanecen en el árbol de trabajo, sin incorporarlas subrepticiamente al commit: **451/451 archivos preexistentes conservaron SHA-256 y las 150 entradas del estado Git quedaron idénticas** antes de actualizar estos documentos. El índice quedó limpio. El SHA del merge no representa por sí solo todo el trabajo V3 no confirmado.

No hubo push, PR, activación de workflows, modificación de reglas remotas ni despliegue. Producción no se cambió ni se volvió a auditar en esta etapa.

## Contrato y comparación

Problema: historia divergente y kit remoto ausente localmente. Cambio mínimo: recuperación verificable, comparación directa de árboles y merge local conservando ambos lados. Aceptación: conservar archivos, incorporar main como antecesor, revisar exactamente los ocho archivos nuevos y validar la base integrada.

| Comparación | Evidencia y conclusión |
|---|---|
| `17a4ec1` frente a `50bad4d` | Ambos tienen árbol `2e7230cafea6e095823eecfe3965cafa72511bcc`. Son historias distintas con contenido idéntico, no dos implementaciones visuales que deban combinarse manualmente |
| `17a4ec1` frente a `d038534` | Ocho archivos añadidos, 192 líneas; sin diferencias de código/editorial |
| Merge frente a `d038534` | Árbol confirmado idéntico; `main` es antecesor del merge. La capa V3 no confirmada sigue conservada por separado |
| Producción declarada `50bad4d` | Sólo se compara el árbol Git; el despliegue histórico declara `commit_dirty=true`, por lo que no se infiere equivalencia de bytes servidos |

Archivos incorporados sin editar su contenido: `AGENTS.md`, `SECURITY.md`, `CONTRIBUTING.md`, `RULESET.md`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/pull_request_template.md`, `.github/workflows/codeql.yml`.

## Recuperación

Respaldo local privado: `C:\Users\manub\Documents\Codex\2026-09-04\f\work\flowhome-recovery-2026-09-05`.

- `working-tree.zip`: 451 archivos versionados o no ignorados, comprobados entrada por entrada contra SHA-256; hash del ZIP `7da3a3e7cfdfc45d0edf939a3c86c3238c2ecfef04921c8cf389d241f85c504d`.
- `repository.bundle`: historia Git completa y referencias anteriores al merge, validado con `git bundle verify`; hash `ea87f6bdd892133a0d5d3b9adb685ed62e9d78e25e536727fcd00dddd770eeff`.
- `manifest.json`: rutas, hashes y estado previo; no contiene valores de `.env`.

Se excluyeron los archivos ignorados, entre ellos `.env`, dependencias, builds y evidencia generada; no se borraron sus originales. Para recuperar, clonar el bundle en una carpeta nueva, seleccionar el commit previo `17a4ec1` y extraer allí el ZIP. Validar los 451 hashes antes de utilizar esa copia. No aplicar una restauración destructiva sobre la carpeta activa. El bundle y el ZIP son respaldo privado de código/historia, no material para publicación pública.

## Validación ejecutada

| Control | Resultado |
|---|---|
| Igualdad visual de las dos bases | Árbol Git idéntico |
| Merge | Sin conflictos; ocho archivos revisados; antecesor remoto comprobado |
| Conservación | 451 hashes y 150 entradas Git idénticos antes/después del merge |
| `git diff --check` y control del índice | Pasaron; índice sin cambios tras el commit |
| `npm test` | 597/597; cero fallos y cero omitidas |
| `npm run lint` | Pasó |
| `npm run typecheck` | Cero errores, cero warnings finales y 18 hints informativos |
| `npm run build` | Pasó; 88 páginas |
| `npm run seo:audit` | Pasó sobre el build actual; 88 páginas, cero errores y cero advertencias |

Los hints provienen de APIs de validación deprecadas y scripts de datos que Astro trata como inline; no se corrigieron dentro de una integración de gobierno. No se repitió navegador/Lighthouse porque el código y contenido conservaron sus bytes. No se verificó ejecución real de CodeQL/Dependabot ni reglas remotas en esta etapa.

## Juzgado

| Perspectiva | Dictamen | Evidencia y límite |
|---|---|---|
| Producto | APROBADO LOCAL | Desbloquea la preparación de A sin cambiar rutas, marca ni decisiones del comprador |
| Técnica | APROBADO LOCAL | Merge trazable, original preservado y controles generales verdes; V3 aún no constituye un artefacto publicado |
| Datos/editorial | APROBADO LOCAL | No se modificaron datos comerciales ni afirmaciones; su revisión pendiente sigue intacta |
| Operación | APROBADO LOCAL | Respaldo validado y gobierno incorporado; falta unir artefacto/despliegue y comprobar operación real |

**FH-01 queda hecha. FH-24 queda parcial:** el kit ya está integrado; continúan pendientes la comprobación de protecciones remotas y la decisión explícita de licencia del titular. No se inventa una licencia abierta.

Siguiente trabajo ejecutable: **FH-02**, fijar el mismo SHA y artefacto durante verificación, aprobación y despliegue, con integridad y recuperación comprobables. La entrega A y el objetivo general siguen pendientes.
