# FH20AO — Prioridad de alternativas corregida

Hallazgo confirmado en product-taxonomy.ts: selectVerifiedDirectAlternatives eliminaba de la lista prioritaria cualquier sustituto que ya apareciera en la selección editorial. Así, un objetivo acreditado dentro del mismo catálogo podía seguir detrás de otro candidato sin esa acreditación. El comentario prometía una prioridad que la implementación no cumplía.

Corrección: selectCurrentDirectAlternatives reúne primero los sustitutos actuales, después las alternativas editoriales; deduplica por slug y aplica el límite al final. El selector del servidor utiliza la misma función. Conserva orden de catálogo dentro de los acreditados y orden editorial dentro del resto; no se inventa una puntuación ni se modifica el catálogo. Se excluyen objetivos ausentes, inactivos y el propio producto. Con una lista vigente vacía vuelve al comportamiento editorial, sin convertir la ausencia en incompatibilidad.

El nuevo selector de estado no autentica entradas: su consumidor debe suministrar exclusivamente los identificadores de una respuesta vigente validada para alternatives. No sirve como aprobación de fuentes. La prueba usa productos y grafo sintéticos, no cambia categorías de productos reales.

## Verificación

Cuatro pruebas nuevas:
1. Promoción de un sustituto ya presente antes de aplicar límite uno, sin mutar catálogo; permisos product o quiz no otorgan prioridad en alternatives.
2. Deduplicación y descarte de objetivo propio, ausente e inactivo.
3. Caducidad o disputa de evidencia elimina la promoción.
4. Contrato servidor y cliente temporal reales: respuesta alternatives válida promueve; a los 60 segundos la lectura caducada vuelve al orden editorial.

13 pruebas dirigidas y 885 completas aprobadas. Lint, tipos (341 archivos, cero errores/advertencias, 18 hints), build normal de 88 páginas y diff-check aprobados. No hay nueva prueba de navegador ni cambio de diseño: se corrigió selección y se verificó su consumidor temporal. Los controles de pantalla de FH20AM/AN son antecedentes, no validación del futuro DOM de relaciones.

## Siguiente requisito descubierto

request-delivery.ts entrega substitutes/complements como listas de identificadores. delivery-envelope.ts valida dichas listas, pero no recibe condición, fuente o nivel de evidencia de cada vínculo. getVerifiedConstraints entrega avisos de restricciones y conflictos; no sustituye la explicación de un vínculo substitutes/complements. Por eso no basta con dibujar enlaces y llamarlos acreditados.

Siguiente trabajo ejecutable: diseñar y probar un contrato público versionado que conserve condición, fuente, nivel/confianza y objetivo de cada relación sin exponer el grafo ni identificadores internos. Derivarlo del mismo conjunto de relaciones vigentes por superficie y conservar la retirada ante conflicto, disputa y caducidad. Luego enlazar la pantalla separando alternativas editoriales de relaciones acreditadas y probar ambos estados. No heredar autorización product hacia alternatives.

## Juzgado

Evaluación propia 1–5, sin revisores independientes: producto 3 (orden corregido, presentación de relaciones pendiente); técnica 4 (causa raíz y límites temporales/contextuales probados); datos/editorial 3 (falta contrato explicativo por vínculo, fuentes simuladas); operación 2 (sin autorización real ni servicio público). Mejora inmediata: resolver el contrato faltante antes de la presentación.

FH-20 sigue parcial; ocho hechas/24 restantes. No se modificaron cuentas ni se publicó, desplegó, confirmó o envió código. El objetivo sigue activo y el heartbeat permanece pausado.
