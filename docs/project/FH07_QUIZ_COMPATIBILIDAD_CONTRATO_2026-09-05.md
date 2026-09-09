# FH07I — compatibilidad del recomendador: contrato inicial

Estado: contrato de implementación, 5 septiembre 2026. Continúa FH07H; no reabrir sus pruebas sin cambios.

## Hallazgo comprobado

`src/lib/quiz-recommend.ts:matchesEcosystem` acepta booleanos crudos de Alexa/Google/Apple y equipara Matter o Zigbee a candidato SmartThings. Las razones dicen “Marked as ... compatible”. `src/pages/quiz.astro` convierte datos a Boolean y muestra insignias de plataformas a partir de flags. La lectura completa corrige la sospecha inicial sobre la serialización: `prepareQuizCatalog` se aplica DESPUÉS de la proyección y sí incorpora procedencia si existe un grafo. El defecto está en los consumidores, no en una pérdida demostrada de metadatos.

## Resultado necesario

Las preferencias no deben convertirse en compatibilidad comprobada. Conservar cinco preguntas, URLs y guardado anónimo; no usar una radio/protocolo como prueba de integración con SmartThings. Presentar registros sin evidencia y faltantes explícitamente. Si no hay evidencia utilizable para un filtro, explicar esa limitación sin relajar innecesariamente presupuesto o instalación para compensarla. Las alternativas fuera del filtro deben reconocerse como tales, no como resultados verificados.

Decisión reversible: el mínimo existente de dos candidatos requiere al menos dos señales respaldadas del ecosistema para aplicar ese filtro. Con cero o una, omitir sólo ese filtro y explicarlo; conservar presupuesto/instalación mientras permitan al menos dos resultados, y priorizar la señal respaldada dentro del mismo ajuste de instalación. SmartThings permanece sin filtro hasta disponer de evidencia directa, no una deducción de protocolos. Diferenciar filtro no evaluable de filtro ampliado por escasez. No cambiar los criterios de precio/instalación ni la vigencia del grafo en este bloque.

## Verificación prevista

Primero completar lectura de la proyección y las pruebas asociadas. Probar entradas crudas, proveedor ausente, evidencia exacta, otra superficie, caducidad, SmartThings sin evidencia directa, selección determinista y preservación de presupuesto/instalación cuando sea posible. Comprobar razones e insignias además del orden. Usar el formato compartido FH07H cuando corresponda; ninguna fixture entra al catálogo real. Después controles generales y matriz de navegador acotada al quiz.

No hay publicación ni bloqueo de cuenta para estas mejoras locales. FH-07 y el objetivo siguen activos; la aprobación de FH07H no cierra el recomendador.
