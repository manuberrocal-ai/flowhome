# FH07I — selección del quiz y evidencia de compatibilidad

**APROBADO LOCAL, 5 septiembre 2026.** El quiz ya no filtra por booleanos crudos ni deduce SmartThings desde Matter/Zigbee. Con evidencia insuficiente, omite sólo ese filtro, explica el límite y mantiene presupuesto e instalación cuando puede. FH-07 sigue parcial, 2/5 integral; nada publicado.

## Cambio y alcance

El filtro de Alexa/Google/Apple exige señales respaldadas en el producto preparado. Se necesitan al menos dos candidatos respaldados para usarlo como filtro, conforme al mínimo existente de la lista. Con cero o uno, las otras preferencias se resuelven por separado; una señal respaldada se prioriza entre candidatos con el mismo ajuste de instalación. Una señal no es garantía de integración doméstica completa.

Las cinco preguntas y sus URLs se conservan. SmartThings explica que no hay evidencia directa utilizable; Matter y Zigbee no la sustituyen. Las cinco señales de cada tarjeta muestran su estado, incluidos negativos no verificados y datos ausentes. Razones, aviso y enlaces a las condiciones de las fichas usan el mismo criterio. El wrapper alternativo también aplica la superficie exacta del quiz.

La inspección completa corrigió la sospecha inicial: la proyección no perdía metadatos, porque el adaptador se aplica después. Se modificaron los consumidores; no se instaló otro grafo ni se alteró ningún YAML.

## Verificación

[Contrato](FH07_QUIZ_COMPATIBILIDAD_CONTRATO_2026-09-05.md), [evidencia y hashes](FH07I_EVIDENCIA_2026-09-05.json), [navegador](FH07I_NAVEGADOR_2026-09-05.json).

- **688/688 pruebas**, cero omitidas; once regresiones nuevas, incluida una matriz de 180 combinaciones reales. Las 675 comparaciones de prioridades previas también pasan.
- Tipos: 245 archivos, cero errores/advertencias y 18 sugerencias. Lint, diff-check y build aprobados. SEO: 88 páginas, cero errores/advertencias.
- **175 controles de navegador** en veinte estados a 1440/390 px, recorrido completo por teclado, guardado anónimo, recarga, eliminación, edición, reinicio y un caso de reflujo con zoom CSS al 200 %. Red externa bloqueada explícitamente.
- Dos rondas visuales. Se detectó contraste insuficiente en dos botones naranjas existentes: 3,6:1. Se corrigieron dentro de la paleta y alcanzan **5,22:1**; textos de compatibilidad 9,90:1 y aviso 14,47:1. La tarjeta alta de escritorio se recapturó con 1800 px de alto para evitar que el encabezado fijo contaminara el recorte.
- Los tres candidatos del analizador de texto fueron revisados: dos avatares anónimos ocultos y el encabezado común de dos tarjetas distintas. Los tres candidatos del detector de diseño mezclaban estilos de controles diferentes o estados hover; los colores efectivos se comprobaron en navegador.
- **28/28 YAML conservados en bytes** frente a FH07E. Las credenciales, cuentas y producción no se tocaron.

Los primeros intentos del harness se corrigieron por un constructor no disponible y por asumir que seguridad tenía dos candidatos sin montaje; son límites de la prueba, no fallos del producto. El registro final contiene los resultados completos.

## Juzgado

Un mismo revisor desde cuatro perspectivas; notas de este bloque local, no del proyecto completo.

| Perspectiva | Nota | Evaluación |
|---|---:|---|
| Producto | 3/5 | Preferencias conservadas y limitaciones visibles; no se promete compatibilidad doméstica. |
| Técnica | 3/5 | Selector, wrapper, razones y tarjetas coherentes; pruebas negativas, matriz e interacción aprobadas. |
| Datos/editorial | 3/5 | No se convierten protocolos en plataformas ni flags en hechos. No se acreditan nuevos modelos o funciones reales. |
| Operación | 3/5 | Evidencia rastreable y cambio local reversible; ninguna integración externa activada. |

Recuperación: revertir únicamente los cinco archivos de código/pruebas identificados por los hashes de este bloque, preservando FH07H y el resto del trabajo sin confirmar. No restaurar el árbol desde HEAD. Preparar el rollback del artefacto con FH-02 antes de cualquier publicación.

## Qué sigue

Cinco tareas hechas, 27 restantes; instalación 14 documentadas/14 unknown. Continuar identidad, variantes, roles, firmware, hechos del catálogo y consumidores restantes. Antes de activar un proveedor real, FH-20 debe resolver también la vigencia del grafo en páginas ya abiertas; este bloque no agregó un mecanismo nuevo de caducidad cliente.

Objetivo persistente activo; heartbeat horario pausado. A sigue **NO LISTA PARA PUBLICAR**. Los accesos Amazon/Supabase sólo condicionan sus tareas dependientes.
