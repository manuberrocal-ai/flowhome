# FH20AP — Relaciones explicadas en contrato v2

Resultado: getVerifiedRelations deriva explicaciones desde las mismas relaciones vigentes y exactamente respaldadas por la sección solicitada. Cada registro incluye relación, targetSlug, tipo de destino product/hardware, condición textual exacta, etiqueta de fuente, nivel de evidencia, su etiqueta y confianza efectiva. No inventa pruebas físicas ni promociona confianza original cuando la antigüedad la rebaja.

La respuesta HTTP ahora es schemaVersion 2. Conserva las listas de identificadores para selección, pero ambas se derivan de los registros explicativos. El cliente exige correspondencia completa en ambos sentidos: no admite objetivos sin explicación ni explicaciones ajenas a las listas. Rechaza versión 1, claves internas, confianza desconocida, condiciones/fuentes vacías o excesivas, duplicados y objetivos malformados/propios. Límite de 200 explicaciones y 100 objetivos por clase, además del límite de lectura HTTP existente. Se permite conservar varias condiciones distintas para un mismo objetivo.

Un sustituto debe apuntar a producto; un complemento puede identificar hardware, sin convertirlo en producto de catálogo. La colección devuelve las explicaciones bajo la misma lectura y vigencia de las listas, sin persistirlas ni heredar evidencia después de caducar. El selector previo continúa usando el conjunto deduplicado actual.

## Validación

Seis pruebas nuevas:
- Contrato real preserva condición y procedencia exactas sin datos de revisión internos.
- Matriz de 16 alteraciones rechaza desajustes, versión antigua, campos privados, límites y explicaciones inválidas.
- Caducidad, disputa, conflicto y otra sección eliminan las relaciones; un conflicto conserva su aviso.
- Evidencia envejecida expone confianza efectiva baja, no la alta original.
- Complementos de hardware mantienen dos condiciones distintas para el mismo objetivo.
- La colección devuelve copias aisladas y retira explicaciones/objetivos juntos al vencer.

891 pruebas completas aprobadas. Lint, tipos (342 archivos, cero errores/advertencias, 18 hints), build 88 páginas y diff-check aprobados. Las 112 combinaciones de 28 productos por cuatro superficies siguen aceptadas por el contrato servidor/cliente.

Cuatro controles de navegador Edge headless contra HTTP loopback: campo relations y versión 2, aceptación/renderizado de condición y fuente, retirada real tras 1,5 segundos y destrucción del cliente. No prueban una lista no vacía de relaciones en DOM: esa presentación sigue pendiente. No hubo cambio visual ni ronda de pulido. Sesión flowhome-v2-ap y proceso servidor 45623 cerrados.

## Migración y límites

Este contrato no está desplegado ni tiene proveedor autorizado instalado. El cliente v2 rechaza deliberadamente respuestas v1: no añade un modo de compatibilidad que acepte identificadores sin explicación. Una futura entrega debe coordinar servidor y cliente, manteniendo no-store y fallando como desconocido ante mezcla de versiones. Las referencias históricas a schemaVersion 1 no describen el estado actual.

La condición transportada es el texto exacto del vínculo, no una nueva validación de variante, firmware, instalación o unidad física. No se expone el objeto scope con identificadores internos. Antes de publicación debe resolverse y presentarse el contexto material que corresponda; los ensayos son sintéticos y no constituyen aprobación editorial ni del propietario. La etiqueta de fuente no es un enlace público añadido ni autorización de datos.

## Juzgado y continuidad

Evaluación propia 1–5, sin revisores independientes: producto 3 (explicación disponible, pantalla pendiente); técnica 4 (contrato cerrado y vigencia coherente); datos/editorial 3 (procedencia y confianza preservadas, contexto/aprobación reales pendientes); operación 2 (sin servicio autorizado, CDN ni activación).

Siguiente: presentar relaciones vigentes y sus condiciones en las fichas, separadas de alternativas editoriales. No reutilizar permisos de product para alternatives; no convertir hardware sin ficha en un enlace de producto inventado. Probar la retirada completa de vínculos, fuentes y razones. FH-20 parcial; ocho hechas/24 restantes. Objetivo activo, heartbeat pausado. Sin publicación, despliegue, cuentas modificadas ni envío de código.
