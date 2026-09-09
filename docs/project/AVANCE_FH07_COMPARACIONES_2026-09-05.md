# FH-07G — comparaciones sin certeza inventada

**APROBADO LOCAL, 3/5 para el lote.** Las ocho comparaciones distinguen registros sin verificar, datos desconocidos y señales con procedencia por campo del adaptador existente. Ya no generan líderes de ecosistema desde flags crudos ni afirman exclusividad de compatibilidad. FH-07 integral sigue parcial, 2/5; cinco tareas hechas y 27 restantes.

## Cambios y pruebas

- [Contrato](FH07_COMPARACIONES_CONTRATO_2026-09-05.md), [evidencia y hashes](FH07G_EVIDENCIA_2026-09-05.json) y [navegador](FH07G_NAVEGADOR_2026-09-05.json).
- Tabla y tarjetas usan el mismo formato. Ausente/malformado = no verificado; booleano crudo = registro explícitamente no verificado. La fuente de Matter no acredita Alexa ni energía. Una señal positiva del adaptador sigue limitada a función y condiciones, no prueba física universal.
- Prosa y sección «Compatibility evidence» dejan de convertir una señal única del catálogo en mejor opción o único modelo compatible. La ausencia de evidencia no implica incompatibilidad.
- Dos regresiones fallaron antes; 23 dirigidas aprobadas antes del ajuste de caption. Suite final: 667 aprobadas, cero fallos/omitidas. Dos contratos de texto se actualizaron porque esperaban el título y caption retirados; no se eliminaron controles semánticos.
- Lint y tipos aprobados: 242 archivos, cero errores/advertencias y 18 hints existentes. Build final 88 páginas; SEO cero errores/advertencias. Diferencias sin errores, avisos LF/CRLF existentes.
- Navegador final: 154 controles, ocho rutas en 1440/390 px, cero excepciones. Grafo positivo y ubicación exacta se verificaron con fixtures aislados en pruebas, sin instalarlos en el runtime público.
- La primera inspección encontró el aviso recortado dentro del scroll móvil: se trasladó fuera y se añadió región con foco y desplazamiento por teclado. Confirmación aprobada. Una captura posterior se reposicionó bajo la cabecera fija para mostrar todo el aviso; tres rondas de inspección, cuatro capturas finales.
- Analizador editorial: 16 candidatos de alt vacío, correspondientes a dos avatares anónimos ocultos por página. Los 28 YAML conservan exactamente sus bytes FH07E. Instalación permanece en 14 documentadas/14 desconocidas.

## Juzgado

Cuatro perspectivas del mismo revisor, no revisión independiente.

| Perspectiva | Dictamen y límite |
|---|---|
| Producto | Aprobado local: permite comparar registros sin presentarlos como garantía de funcionamiento. |
| Técnica | Aprobado local: formato compartido, pruebas de campo y adaptador; no se altera el proveedor ni el quiz. |
| Datos/editorial | Aprobado local: no hay líderes derivados de datos crudos; negativos y faltantes no prueban incompatibilidad. |
| Operación/accesibilidad | Aprobado local: aviso visible en móvil, tabla desplazable con teclado y sin desbordamiento global. Ninguna publicación o cuenta modificada. |

**NO LISTO PARA PUBLICAR el proyecto integral.** Siguiente trabajo: otros consumidores de compatibilidad, afirmaciones particulares de las piezas, identidad exacta, roles, firmware, servicios e instalación restante. El contrato y la auditoría editorial guiaron el límite de las afirmaciones y la corrección del aviso móvil. Los dictámenes locales no certifican el catálogo completo ni una operación conectada.

El heartbeat horario sigue PAUSADO por pedido explícito del usuario. No crear otro horario ni consumir resets. El objetivo persistente conserva el bloqueo anterior y requiere `/goal resume` del usuario para encadenar turnos; no equivale a completar ni abandonar el proyecto.
