# FH23E — alerta adicional de CodeQL

## Resultado

[Alerta43](https://github.com/manuberrocal-ai/flowhome/security/code-scanning/43), regla js/bad-tag-filter: **not_actionable** como vulnerabilidad de sanitización en el uso inspeccionado; confianza estática alta. No se descartó remotamente, no se silenciaron reglas ni se modificó la prueba para obtener verde. Esta clasificación sigue requiriendo revisión antes de una decisión remota.

CodeQL señala que la expresión de `test/consent-banner-errors.test.mjs:8` no reconoce etiquetas SCRIPT en mayúsculas. Eso es cierto como limitación del extractor. El código lee una ruta fija del repositorio, conserva el contenido del script, quita un import y lo transpila para ejecutar la prueba con un DOM simulado. No está eliminando scripts de HTML externo ni produciendo HTML seguro para visitantes. Si no coincide la etiqueta, el acceso al resultado nulo falla antes de ejecutar. Cambiar el componente requiere el mismo control del código que ya permite cambiar la propia prueba.

## Evidencia y alcance

- Fuente remota: merge de PR12 `4b92a8c07f6f5ee91387db013d425025b92451f6`; instancia refs/pull/12/merge, línea8, columnas30–58. El SHA del blob remoto y local coincide: `299a909e651f755155f14b7658ede506a7fe6046`.
- Revisión local base: d86d95b; los cambios de portada en curso no modifican este archivo.
- Ruta inspeccionada: package.json npm test → archivo de prueba → lectura fija ConsentBanner.astro → captura/transpilación → runInNewContext con fixtures y aserciones. No se ofrece esa VM como sandbox para datos externos.
- SECURITY.md resuelto desde la raíz canónica: prioriza inyección de contenido externo y CI. La configuración de Astro/Pages sirve dist y no registra la prueba como ruta pública. Los consumidores inspeccionados no introducen un actor de menor confianza en ese extractor.
- La anotación no especifica actor ni un sumidero explotable. No se ejecutó un exploit ni una validación dinámica para esta clasificación. Las pruebas de rendimiento paralelas pertenecen a FH23D, no demuestran este dictamen.
- Resultado estructurado: `C:/AGENTES/Informes/flowhome/FH23E_CODEQL_43.json`.

El control102354081549 mantiene18 anotaciones. Los ocho archivos afectados por las17 anteriores no tienen diferencias de fuente entre5cc6c95 y d86d95b; su informe histórico `C:/AGENTES/Informes/flowhome/REVISION_CODEQL_PR12.md` se conserva. Esa comparación no se presenta como una nueva auditoría completa ni como prueba de todos los consumidores posibles. No se deduplicaron ni eliminaron anotaciones.

## Juzgado y siguiente paso

Producto3/5 y datos/editorial3/5 sin cambios; técnica3/5 para esta clasificación estática acotada; operación2/5 porque el control remoto continúa fallido. Revisar las clasificaciones con el responsable de la PR antes de decidir el tratamiento remoto. No añadir una biblioteca, cambiar un extractor de pruebas ni omitir CodeQL únicamente para borrar una advertencia.
