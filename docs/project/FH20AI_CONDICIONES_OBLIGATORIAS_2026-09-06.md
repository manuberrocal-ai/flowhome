# FH20AI — Condiciones obligatorias antes de presentar evidencia

Hallazgo: el sobre HTTP nuevo exigía condición y procedencia, pero hasFeatureEvidence admitía siete campos con fuente sola. Además, comparison-insights tenía una segunda comprobación de evidencia sin condición. Eso permitía etiquetas o prioridades de recomendación que omitían el alcance de la función. Se corrigió antes de construir la presentación transitoria; no se afirma que esa presentación esté integrada.

## Cambio y cobertura

Los nueve campos de compatibilidad requieren señal true, verificación habilitada, fuente no vacía y condición propia no vacía. El formateador devuelve Not verified si falta cualquiera de ellas; se eliminó el fallback Evidence-backed signal; check conditions. La comparación reutiliza el mismo criterio, sin una segunda regla más débil. El cuestionario ya consumía ese criterio y ahora tampoco mejora el orden ni filtra por ecosistema basándose en fuente sola.

La matriz dirigida cubre nueve campos, cinco valores, cinco variantes de fuente y seis condiciones: 1.350 combinaciones, con comprobación de booleano, etiqueta y consistencia de comparación. Se añadieron pruebas negativas de liderazgo/comprador y filtrado/recomendaciones. Las afirmaciones documentales completas conservan su texto cualificado. Los datos sintéticos positivos de pruebas ahora incluyen condiciones explícitas, no se rebajó el requisito para hacerlos pasar.

## Verificación

48 pruebas dirigidas aprobadas (39 de evidencia/comparación/documentación/cuestionario y nueve generales del cuestionario). Primera suite completa: dos fallos en fixtures antiguos sin condiciones; corregidos y repetida con éxito: 870 pruebas. Lint, diff-check y build de 88 páginas aprobados. Tipos: 332 archivos, cero errores/advertencias, 18 hints. Verificado el 7 de septiembre de 2026 a las 02:07 UTC.

El detector Impeccable no encontró incidencias mecánicas en los dos módulos. No cambió la estructura visual, CSS, rutas ni activación. No se hizo una nueva ronda visual móvil/escritorio del candidato; el ensayo de navegador FH20AH sigue siendo antecedente, no prueba de todas las superficies modificadas.

El auditor editorial no admite TS y omitió esos archivos; se ejecutó luego sobre HTML construido de la ficha Tapo C120 y el cuestionario. Sus cuatro avisos missing-alt corresponden a dos avatares de cabecera por página con alt vacío explícito y hidden. Se inspeccionaron las etiquetas reales; no se cambiaron descripciones de imágenes informativas para silenciar el detector. Este resultado no equivale a una auditoría editorial integral ni autorización de publicación.

## Juzgado y continuación

Evaluación propia 1–5: producto 4 (misma exigencia al mostrar y recomendar), técnica 4 (criterio centralizado y regresiones), datos/editorial 3 (faltan aprobación y variantes), operación 2 (sin activación). Las guías Impeccable y Publication Copy Auditor orientaron conservar el diseño, revisar estados incompletos y comprobar avisos antes de modificar copy. No se usaron revisores independientes.

Siguiente: presentación transitoria reutilizable con retirada completa de indicadores, y verificación visual conjunta; ocultación/suspensión reales, CDN y cuentas pendientes. No se desplegó ni habilitó el grafo. FH-20 parcial; ocho hechas/24 restantes.
