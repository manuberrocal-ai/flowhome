---
target: FlowHome homepage before competitive adoption
total_score: 20
max_score: 32
na_heuristics: 7,9
p0_count: 0
p1_count: 0
timestamp: 2026-09-12T11-06-45Z
slug: src-pages-index-astro
---
Method: dual-agent (A: competencia_tecnologia · B: competencia_comercio)

# Evaluación visual de FlowHome — 12 de septiembre de 2026

La identidad azul, turquesa y naranja es coherente, pero la portada todavía funciona más como escaparate que como ayuda especializada para decidir. La mayor oportunidad es mostrar requisitos y diferencias útiles antes del enlace de compra.

| Criterio | Nota / 4 | Hallazgo |
|---|---:|---|
| Estado visible | 3 | Controles del carrusel visibles |
| Lenguaje familiar | 3 | Promesa clara; faltan explicaciones contextuales |
| Control del usuario | 3 | Existe pausa y navegación manual |
| Consistencia | 3 | Identidad y acciones coherentes |
| Prevención de errores | 2 | Requisitos de compra todavía poco concretos |
| Reconocer sin memorizar | 2 | Rotación y categorías exigen comparar mentalmente |
| Eficiencia avanzada | No aplica | Portada, no herramienta de trabajo |
| Claridad visual | 2 | Demasiado espacio comercial para la información ofrecida |
| Recuperación de errores | No evaluado | No se ejecutaron estados de error |
| Ayuda contextual | 2 | Orientación insuficiente junto a la decisión |
| **Total** | **20/32** | **Aceptable; necesita mejoras relevantes** |

Lo que funciona: marca consistente, acciones principales claras y transparencia sobre afiliación y límites de la evidencia.

## Prioridades

1. **P2 · Imagen y texto del carrusel:** una revisión observó una discrepancia transitoria; al pausarlo, coincidían. Puede confundir qué producto se recomienda. Verificar con carga lenta y actualizar imagen, título y enlace como una unidad. Acción posterior: `impeccable harden`.
2. **P2 · Poco valor de decisión en el bloque principal:** sustituir parte del espacio promocional por «para quién», «qué necesita» y «cuándo no comprar». Acción: `impeccable clarify`.
3. **P2 · Primera pantalla móvil ocupada:** cabecera, divulgación y privacidad consumen unos 300 píxeles. Compactar su presentación conservando información y opciones. Acción: `impeccable adapt`.
4. **P2 · Rotación y repetición editorial:** seis posiciones y siete categorías añaden decisiones; repetir destacados no prueba que haya registros duplicados. Probar selección manual y entradas por necesidad. Acción: `impeccable distill`.
5. **P2 · Promesas editoriales ambiguas:** aclarar qué procede de documentos y qué de pruebas propias; no insinuar estudios de lectores inexistentes. Acción: `impeccable clarify`.

## Personas y recorrido

Para quien llega por primera vez (Jordan), falta orientación sobre requisitos; para quien navega desde el móvil (Casey), sobra recorrido antes de decidir; para quien compara metódicamente (Riley), faltan diferencias estables a la vista. El recorrido empieza con una promesa fuerte y pierde precisión al llegar al producto.

## Detector y límites

El detector emitió una advertencia `gray-on-color` en `src/pages/index.astro:61`, `text-slate-950` sobre `bg-blue-50`. La inspección la descartó como falso positivo: texto oscuro sobre fondo claro del botón secundario. No corresponde cambiar ese texto a blanco. No se certifica accesibilidad completa ni rendimiento. La discrepancia del carrusel es una observación transitoria pendiente de reproducción controlada, no un error permanente de asignación demostrado.

## Pregunta de diseño

¿Debe la portada priorizar exhibir productos o resolver una primera decisión de compatibilidad? Recomendación: lo segundo.

## Evidencias

- [Evaluación A independiente](C:/AGENTES/Informes/flowhome/competencia-20260912/juez-diseno-a.md).
- [Evaluación B independiente](C:/AGENTES/Informes/flowhome/competencia-20260912/juez-diseno-b.md).
- [Portada de escritorio](C:/AGENTES/Informes/flowhome/competencia-20260912/flowhome-juez-a-desktop.png).
- [Portada móvil](C:/AGENTES/Informes/flowhome/competencia-20260912/flowhome-juez-a-mobile.png).
