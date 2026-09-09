# FH-07F — planes por función, no una promesa «sí/no»

**APROBADO LOCAL, 3/5 para este lote.** Cuatro cámaras y un timbre ya no muestran «Subscription required: Yes/No» desde un booleano. En su lugar explican que los requisitos por función siguen sin verificarse, y distinguen las notas documentadas de instalación de una revisión completa de planes. FH-07 integral continúa parcial, 2/5.

## Evidencia y alcance

- [Contrato](FH07_SERVICIOS_CONTRATO_2026-09-05.md), [evidencia y hashes](FH07F_EVIDENCIA_2026-09-05.json), [77 controles de navegador](FH07F_NAVEGADOR_2026-09-05.json).
- Retirada de dos filas de la matriz compartida; aviso explícito en Arlo Essential, Blink Outdoor 4, Eufy Indoor C120, Ring Wired y Tapo C120. La introducción de especificaciones aclara que un registro no es verificación independiente.
- Los valores true, false, ausente y malformado no producen afirmaciones de suscripción ni highlights. Dos pruebas en rojo antes; 36 dirigidas y 664 completas aprobadas después, cero fallos/omitidas.
- Lint y tipos aprobados: 242 archivos, cero errores/advertencias, 18 hints existentes. Build 88 páginas, SEO cero errores/advertencias y diferencias sin errores con avisos LF/CRLF existentes.
- Navegador: cinco fichas en 1440/390 px y control negativo Wyze, 77 comprobaciones aprobadas. Se corrigieron dos errores del guion de prueba: selector de artículo ambiguo y navegación repetida al mismo ancla; no se modificó el producto para ocultarlos.
- Cuatro capturas inspeccionadas, una ronda visual sin defectos nuevos. Analizador de texto: diez candidatos, correspondientes a dos avatares anónimos ocultos por cada página; el estado autenticado sigue pendiente.
- Los 28 archivos de catálogo conservan exactamente sus hashes FH07E. No se cambiaron identidades, datos comerciales, perfiles de instalación, algoritmo de quiz, grafo o cuentas.

## Juzgado

Cuatro perspectivas del mismo revisor, sin afirmar revisión independiente.

| Perspectiva | Dictamen |
|---|---|
| Producto | Aprobado local: evita que «sin suscripción» se interprete como todas las funciones gratuitas. |
| Técnica | Aprobado local: la matriz compartida retira el origen de la afirmación en chips, lista y highlights; regresión de categorías conservada. |
| Datos/editorial | Aprobado local: desconocimiento explícito, sin inventar precios ni prestaciones de planes. Las fuentes específicas existentes no se extrapolan. |
| Operación | Aprobado local: cambio local recuperable y sin acción externa. No acredita servicios conectados. |

## Pendiente

**NO LISTO PARA PUBLICAR el conjunto.** Falta documentar derechos de uso por función y seguir identidad, compatibilidad, roles, firmware y 14 instalaciones. Continúan cinco tareas hechas y 27 restantes. El heartbeat horario está pausado por pedido del usuario; no reactivarlo. Se continúa con trabajo local disponible, mientras el objetivo persistente conserva el bloqueo que requiere `/goal resume` del usuario.

La habilidad de auditoría editorial guió la separación entre dato registrado, incertidumbre y afirmación publicable. Este lote no autoriza extrapolar el dictamen a las demás especificaciones.
