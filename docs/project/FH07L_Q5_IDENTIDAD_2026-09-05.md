# FH07L — destino de compra del Q5+

Contrato del 2026-09-05. La revisión de robots detectó un bloqueo material de publicación: el catálogo y la oferta histórica de Q5+ apuntaban a otro modelo. Corregir esta causa tiene prioridad sobre completar instalación.

## Fuentes consultadas

- [ASIN anterior B09NM549V7](https://www.amazon.com/dp/B09NM549V7): título identifica S7 MaxV Ultra, no Q5+.
- [ASIN B09NM56KJM](https://www.amazon.com/dp/B09NM56KJM): título identifica Q5+ con base de autovaciado, coherente con la [familia Q5 del fabricante US](https://us.roborock.com/pages/roborock-q5).
- [Roomba B094NYHTMF](https://www.amazon.com/dp/B094NYHTMF): título identifica j7+ (7550). No requiere cambio de ASIN en este bloque.

Lectura pública recuperada por buscador, no llamada autenticada ni prueba de stock/oferta. No importar precios, ratings, imágenes ni garantías de esos resultados. Hardware, firmware, condición de venta y contenido exacto deben confirmarse al comprar.

## Cambio mínimo y validación prevista

Corregir ASIN/URL Q5+ en producto y oferta histórica, sin cambiar slug ni renovar sus fechas. La oferta conserva vencimiento y deja de estar destacada. Añadir fuentes de identidad al producto. No presentar sus números manuales antiguos como observaciones del ASIN corregido.

Consumidor adicional: listas guardadas antiguas contienen el ASIN erróneo. Normalizar exclusivamente el par slug `roborock-q5-plus` + ASIN anterior al nuevo identificador, conservando campos, relojes y tombstones. Un S7 guardado sin ese slug no debe modificarse. Probar transferencia, deduplicación y combinación de estados para que el enlace antiguo no sobreviva en una lista Q5+.

Aceptación: enlaces públicos Q5+ y transferencia guardada al ASIN correcto; ninguna aparición del ASIN anterior en destinos del build; datos manuales no visibles; rutas intactas. Pruebas dirigidas, controles generales y navegador local con lista antigua simulada. No realizar transferencia real ni publicación.

Juzgado inicial, mismo agente: producto/técnica/datos-editorial/operación 2/5. REQUIERE VALIDACIÓN LOCAL. Instalación continúa 15 documentadas/13 unknown; los manuales de robots se completarán después del destino de compra.

## Resultado

APROBADO LOCAL para destino Q5+ y recuperación de listas. 694/694 pruebas, sin omitidas; 16 dirigidas iniciales. Tipos: 247 archivos, 0 errores/advertencias, 18 hints. Lint/diff-check aprobados; build de 88 páginas y SEO sin errores/advertencias. Inspección de los 89 HTML (incluye 404): cero destinos `/dp/` o `/gp/product/` al ASIN anterior. El identificador anterior permanece intencionadamente en la migración y en las pruebas, no como enlace de compra.

Navegador: diez escenarios (ficha, reseña, comparación, quiz, lista × 1440/390), todos aprobados. Enlaces Q5+ correctos con `flowhome-20`; lista antigua simulada corrige destino, muestra un producto sin precio manual y mantiene eliminación tras recargar. Foco de teclado y ausencia de desbordamiento comprobados en lista. Dos capturas inspeccionadas; no se activó el enlace de transferencia. La prueba remota autenticada queda fuera de este bloque.

Auditor editorial sobre ficha generada: dos candidatos de alt vacío en los avatares del header; son la misma plantilla oculta ya verificada, no nuevas imágenes introducidas. Foto remota y derechos continúan pendientes FH-09.

Juzgado final, mismo agente: producto 3/5 (destino corresponde a la recomendación), técnica 3/5 (incluye estados viejos, deduplicación y tombstones), datos/editorial 3/5 (identidad observada separada de oferta), operación 3/5 (local y reversible, sin checkout/publicación). FH-07 integral 2/5, parcial; cinco tareas hechas y 27 restantes.

Límite: solo el par slug/ASIN erróneo conocido se corrige. Un ASIN antiguo sin slug no se reasigna porque podría ser un S7 legítimo. Esta corrección no valida todos los enlaces del catálogo. Los datos comerciales históricos no se renuevan ni se acreditan para el ASIN nuevo.

Próximo: completar instalación Q5+ y j7+ con sus manuales US ya localizados. Conservar el objetivo activo; heartbeat horario pausado. No repetir búsquedas de cuenta ni validar compra real sin aprobación.
