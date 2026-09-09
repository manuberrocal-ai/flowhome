# FH24A — gobierno remoto comprobado por lectura

## Ficha y alcance

Problema: FH-24 conservaba reglas remotas sin comprobar y la revisión de PR12 podía confundir fallo de CodeQL con una condición obligatoria de fusión. Cambio mínimo: contrastar reglas activas, protección clásica y entorno production; corregir la dirección operativa. Superficies: documentación de entrega y gobierno. Aceptación: distinguir controles reales, recomendaciones y decisiones del propietario. Validador: respuestas autenticadas GET de GitHub, sin mutaciones.

Fecha de lectura: 2026-09-08. Repositorio público `manuberrocal-ai/flowhome`, rama predeterminada `main`. No se consultaron valores de secretos. La sesión existente tiene permisos administrativos, pero no se utilizaron para escribir.

## Controles observados

| Superficie | Evidencia actual | Límite |
|---|---|---|
| Protección clásica de main | Exige PR, conversaciones resueltas, historial lineal, rama actualizada y `quality` de la aplicación15368; aplica a administradores; prohíbe borrado y force-push | Aprobaciones requeridas0; revisión CODEOWNERS y aprobación del último push desactivadas |
| Ruleset22062817, Protect main | Activo sobre rama predeterminada, sin actores de bypass; prohíbe borrado/force-push; exige PR, conversaciones y checks `quality` y `Analyze (javascript-typescript)` de aplicación15368 | Aprobaciones0; no incluye regla code_scanning ni contexto `CodeQL`; `do_not_enforce_on_create:true` |
| Revisiones obsoletas | Protección clásica `dismiss_stale_reviews:true`; ruleset equivalentefalse | Registrar ambos, no inferir que uno elimina al otro |
| Entorno production | Revisor requerido `manuberrocal-ai`; política personalizada permite únicamente rama `main` | `prevent_self_review:false` y `can_admins_bypass:true`: no constituye revisión independiente ni aprobación imposible de omitir |
| PR12 | OPEN, borrador, head `5cc6c95cafb78993b3f04cd4a074139e680ef21c`, mergeStateStatusBLOCKED | quality y Analyze completadosSUCCESS, CodeQL completadoFAILURE. BLOCKED no identifica por sí solo la causa; el borrador ya impide tratarla como lista para fusionar |
| Licencia | API devuelve license:null; raíz remota no contiene LICENSE/COPYING | No equivale a una determinación jurídica sobre derechos; falta decisión explícita del titular. No se añade licencia por inferencia |

Fuentes directas: [protección clásica](https://api.github.com/repos/manuberrocal-ai/flowhome/branches/main/protection), [reglas aplicables](https://api.github.com/repos/manuberrocal-ai/flowhome/rules/branches/main), [ruleset](https://github.com/manuberrocal-ai/flowhome/rules/22062817), [entorno production](https://api.github.com/repos/manuberrocal-ai/flowhome/environments/production), [restricciones de ramas del entorno](https://api.github.com/repos/manuberrocal-ai/flowhome/environments/production/deployment-branch-policies), [PR12](https://github.com/manuberrocal-ai/flowhome/pull/12). Los endpoints privados de administración pueden requerir sesión autorizada.

## Decisiones pendientes, no ejecutadas

1. Confirmar cómo se revisará y actualizará PR12: el commit corregido `b12a60e` sigue sólo local y fuera de la autorización específica de envío de `5cc6c95`.
2. Revisar las17 anotaciones de CodeQL y decidir el control requerido de resultados. No dar por protegido el resultado de seguridad porque el trabajo Analyze termine correctamente; tampoco silenciar reglas para obtener verde. Clasificación estática local preservada en `C:/AGENTES/Informes/flowhome/REVISION_CODEQL_PR12.md`; no es una aprobación remota ni una auditoría completa.
3. Acordar política de aprobación con la capacidad real de mantenimiento: RULESET.md recomienda al menos una aprobación, pero la configuración requiere cero. No inventar segundo mantenedor ni imponer una política que luego no pueda cumplirse.
4. Decidir explícitamente autoaprobación y excepción administrativa de production, conservando un procedimiento de incidente. La autorización de desarrollo local no permite cambiar estos controles.
5. Obtener decisión de licencia del titular. FH-24 sigue parcial; su lectura remota ya no está pendiente, su resolución sí.

## Juzgado de un único agente

- Producto3/5 local: conserva la entrega editorial preparada; todavía no llega al público como versión aprobada.
- Técnica3/5 local: controles e identidades contrastados; la configuración remota no garantiza el resultado de seguridad ni revisión humana de cada PR.
- Datos/editorial3/5 documental: ninguna afirmación de producto modificada; clasificación estática no equivale a certificación de seguridad.
- Operación2/5 integral: controles remotos existen y sus excepciones están identificadas; cambios de política, actualización de PR, release y recuperación siguen sujetos a aprobación/evidencia propia.

Validación proporcional: lecturas remotas y verificación documental local; no se repiten suite completa, build, navegador ni Lighthouse porque no cambia código, configuración ejecutable ni contenido publicado. Sin push, fusión, descarte de alertas, cambio de reglas, ejecución remota ni despliegue.
