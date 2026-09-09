# Cobertura temática y cola editorial V3

Plan basado en rutas existentes, no en un volumen de búsqueda inventado. No crea nuevas páginas ni autoriza publicación. El alcance de esta revisión es inglés/US; cualquier ampliación regional necesita evidencia propia.

| Grupo / intención | Pilar existente | Comparación y soporte existentes | Mejora que requiere evidencia |
|---|---|---|---|
| Robots: navegación, mantenimiento y requisitos de dock | `/best/best-robot-vacuums-for-smart-homes/` | Q5+ vs j7+, ambos reviews y categoría robot-vacuum | Verificar generación/bundle, repuestos y soporte; no afirmar eficacia de limpieza sin prueba |
| Hubs: bridge, controller y dispositivos compatibles | `/best/best-smart-hubs-for-matter-zigbee/` | M2 vs Hub 2 vs Aeotec, tres reviews y categoría smart-hub | Matriz de firmware, rol y acciones por plataforma; no convertir protocolo en interoperabilidad universal |
| Iluminación: habitación, controles y conectividad | `/best/best-smart-lighting-for-room-control/` | Hue vs Govee vs Wyze y categoría smart-lighting | Resolver SKU Govee y composición/generación Hue; expansión sujeta a demanda real |
| Seguridad: grabación, almacenamiento y condiciones de uso | `/best/best-smart-security-basics/` | Eufy vs Tapo; Blink vs Arlo; Ring review; categorías correspondientes | Región, modelo, funciones gratis/de pago, política actual; revisión humana de seguridad/privacidad |
| Primer setup: necesidades y restricciones domésticas | `/best/best-smart-home-starter-kit/` | Guías Alexa, Google Home, renters, quiz y lista local | No prometer presupuesto mientras los precios estén sin verificar; condiciones de instalación y cuenta |
| Termostatos: sistema HVAC y modo de control | `/category/smart-thermostat/` | Amazon vs ecobee, dos reviews, calculadora ilustrativa | Compatibilidad exacta y tarifas aportadas por el usuario; sin ahorro garantizado |

## Criterios de selección y rechazo

1. Trabajar primero sobre una necesidad ya cubierta y una brecha documental concreta. No generar cada permutación de productos o palabras clave.
2. Exigir modelo/ASIN/mercado, fuentes primarias consultadas y límites explícitos. Las listas de producto no bastan como review.
3. Asignar una intención distinguible; rechazar duplicación con guía/comparación existente. Revisar enlaces internos en ambas direcciones y canonical.
4. Sólo priorizar por demanda, CTR, conversión o retorno con exportaciones actuales de la fuente correspondiente y ventanas comparables. No sumar métricas de GSC, Bing, GA4 y Amazon como si fueran la misma medida.
5. Revisión humana, pruebas y autorización de publicación antes de mover un borrador a `src/content`.

## Estado de medición

`data/organic-growth-scorecard.csv` sí contiene observaciones históricas de julio. No se alteraron ni se presentaron como septiembre, cero observaciones o crecimiento causado por V3. Hace falta volver a comprobar la fuente y obtener una ventana actual comparable; también separar país, dispositivo, consentimiento y atribución. El runbook histórico `../ORGANIC_GROWTH_RUNBOOK.md` conserva el protocolo; sus instrucciones de publicar/activar son un plan sujeto a nueva autorización, no acciones realizadas en esta tarea.

Las guías cuentan con fuentes documentales y enlaces útiles. No se ha probado presencia en respuestas de asistentes, citas de IA ni incremento de tráfico. Para GEO se aplica la base de contenido accesible, procedencia y consistencia descrita por [Google Search Central](https://developers.google.com/search/docs/appearance/ai-features); no se agrega un marcado mágico ni una garantía de inclusión.
