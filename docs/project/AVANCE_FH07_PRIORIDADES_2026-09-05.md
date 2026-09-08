# FlowHome — prioridades del quiz sin inferencias indebidas

Estado: 5 de septiembre de 2026. Confirmación de navegador: 17:25 UTC. [Contrato](FH07_PRIORIDADES_CONTRATO_2026-09-05.md) · [Evidencia y huellas](FH07C_EVIDENCIA_2026-09-05.json) · [Navegador](FH07C_NAVEGADOR_2026-09-05.json).

## Resultado

APROBADO LOCAL para este corte. El quiz ya no premia privacidad por no tener suscripción, control local por Matter/Zigbee ni facilidad por app/Wi-Fi. Esos campos no prueban los beneficios. Las tres opciones y sus URLs se conservan; ahora explican antes de elegir y en resultados que no modifican el orden porque no están evaluadas.

No se modificaron los 28 archivos del catálogo, identidades, precios, fechas, dependencias ni estilos. Permanecen nueve instalaciones documentadas y 19 unknown. FH-07 sigue parcial, 2/5 integral; cinco tareas cerradas y 27 restantes. No se publicó, confirmó en Git ni modificó ninguna cuenta.

## Causa y alcance

El ranking aplicaba bonificaciones de tres, tres y dos puntos respectivamente a flags sin evidencia específica. Además, comprobar presencia después de los valores por defecto del esquema no demostraba procedencia. Se quitaron esas bonificaciones y las tres afirmaciones asociadas de las tarjetas, así como los cuatro campos ya innecesarios del payload del quiz.

Se conservan objetivo, ecosistema, presupuesto, instalación, relajación explícita de filtros y la lógica de mejor valor condicionada a datos comerciales autorizados y vigentes. Un aviso único informa el límite de prioridad, incluso sin relajación; no se repite por tarjeta. Las condiciones documentadas de instalación, módulos y servicios de pago permanecen visibles. Esto no acredita los booleanos de compatibilidad todavía usados por otros filtros o chips.

## Verificación

- Antes del cambio: siete pruebas específicas, una aprobada y seis fallidas; detectaron orden injustificado, copia y payload.
- Después: 25/25 dirigidas y 660/660 completas, cero fallos u omitidas. La prueba del catálogo cubre 675 comparaciones de prioridades frente a no elegir prioridad, sin alterar orden ni relajación.
- Lint aprobado. Tipos: 242 archivos, cero errores/advertencias y 18 indicaciones existentes. Build a las 16:15 UTC: 88 páginas. SEO: 88 páginas sin errores ni advertencias.
- 64/64 controles de navegador: escritorio 1440 y móvil 390 px, teclado, movimiento reducido, URLs anteriores, edición, reinicio, guardado anónimo y enlaces directos de afiliación; avisos con/sin relajación y sin excepción de cliente o desbordamiento.
- Se inspeccionaron seis capturas. Texto y aviso legibles, selección conservada, condiciones materiales sin recorte. Contraste del aviso 14,47:1. Al entrar, título a 96 px y cabecera fija hasta 69 px en ambos tamaños.
- Primera ronda interrumpida: el test medía posición del título después de enfocar «Guardar», cuando el navegador había bajado a la tarjeta. Se comprobó scrollY=926 y título=-563 px en escritorio. Se corrigió únicamente el momento de la medición, no el sitio, y una ronda de confirmación pasó. El registro conserva ambas posiciones.
- Analizador editorial: dos candidatos de alt vacío, verificados como avatares anónimos ocultos con atributo explícito. No se comprobó el estado autenticado.
- Diff-check sin errores; 148 avisos existentes LF/CRLF. SHA-256 de 28/28 productos idéntico al corte de cámaras; siete huellas de fuente/build guardadas.

Las pruebas completas, tipos y build se reutilizaron para la confirmación de navegador porque el código permaneció sin cambios desde su ejecución. No se repitieron Lighthouse ni el QA completo de release. Reflujo a 720 CSS px no equivale a zoom nativo. Red externa bloqueada: no verifica imágenes online, cuenta real, lectores de pantalla, dispositivos físicos ni comportamiento offline de productos.

## Juzgado del corte

Un único revisor desde cuatro perspectivas, no revisión independiente.

| Perspectiva | Valoración | Dictamen y mejora pendiente |
|---|---:|---|
| Producto | 3/5 local | APROBADO LOCAL: expectativa explícita y flujo conservado. Futuro: evaluar funciones reales antes de volver a dar peso a estas prioridades. |
| Técnica | 3/5 local | APROBADO LOCAL: regressiones y catálogo real cubiertos, payload reducido. Extender distinción entre desconocido y falso a consumidores restantes. |
| Datos/editorial | 3/5 del corte; 2/5 integral | Inferencias retiradas y limitación visible. Faltan identidad exacta, evidencia por función/mercado/firmware y 19 instalaciones. |
| Operación | 2/5 integral | Activaciones del heartbeat recibidas a las 16:07 y 17:08 UTC. Esto prueba continuación de desarrollo, no scheduler comercial, publicación o ingresos. |

La guía editorial e Impeccable limitaron la intervención a aclarar expectativas conservando el diseño y a una revisión visual acotada. Entrega integral: **NO LISTA PARA PUBLICAR**.

## Continuación

Retomar FH-07 con identidad y hechos: seleccionar modelos con documentación inequívoca para completar instalación y registrar variantes desconocidas sin migrar ASIN por inferencia. Revisar chips/filtros de compatibilidad por separado. No repetir esta corrección, búsqueda de credenciales agotada ni login Supabase sin nueva evidencia. Mantener el único heartbeat de desarrollo y reservar cualquier publicación para la aprobación de un paquete concreto.
